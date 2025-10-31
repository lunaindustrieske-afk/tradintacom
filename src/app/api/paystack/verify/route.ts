
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import crypto from 'crypto';
import { nanoid } from 'nanoid';
import { awardPoints } from '@/lib/points';

// Initialize Firebase Admin SDK
customInitApp();
const db = getFirestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Helper to find partner campaign and calculate commission
async function getCommissionDetails(partnerId: string, sellerId: string): Promise<{ commissionRate: number; campaignId: string | null }> {
    // For now, using a default commission.
    // In a real scenario, this would query a 'growthPartnerCampaigns' collection
    // to find an active campaign between the partner and seller.
    const defaultCommissionRate = 5; // 5%
    return { commissionRate: defaultCommissionRate, campaignId: 'default-campaign' };
}

export async function POST(request: NextRequest) {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('Paystack secret key is not configured.');
    return NextResponse.json({ error: 'Internal server error: Payment gateway not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { reference, orderId, planId, durationInMonths = 1 } = body;

    // --- Subscription Logic ---
    if (planId && reference) {
      const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      });
      const data = await paystackResponse.json();

      if (!paystackResponse.ok || !data.status || data.data.status !== 'success') {
          return NextResponse.json({ error: 'Payment verification failed.', details: data.message }, { status: 400 });
      }

      const userId = data.data.metadata.userId;
      if (!userId) {
          return NextResponse.json({ error: 'User ID missing from payment metadata.' }, { status: 400 });
      }

      const sellerRef = db.collection('manufacturers').doc(userId);
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationInMonths);

      await sellerRef.update({
          marketingPlanId: planId,
          planExpiresAt: Timestamp.fromDate(expiresAt)
      });
      
      return NextResponse.json({ success: true, message: 'Subscription activated successfully.' });
    }

    // --- Order Payment Logic ---
    if (!reference || !orderId) {
      return NextResponse.json({ error: 'Missing required payment information.' }, { status: 400 });
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await paystackResponse.json();

    if (!paystackResponse.ok || !data.status || data.data.status !== 'success') {
      console.error('Paystack verification failed:', data);
      return NextResponse.json({ error: 'Payment verification failed.', details: data.message }, { status: 400 });
    }

    // Transaction is successful, now update Firestore within a transaction
    const orderRef = db.collection('orders').doc(orderId);
    const paymentRef = db.collection('payments').doc();

    const { buyerId, orderAmount, orderItems } = await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);
      if (!orderDoc.exists) {
        throw new Error('Order not found.');
      }
      const orderData = orderDoc.data()!;
      
      // Ensure this payment hasn't already been processed
      if (orderData.status !== 'Pending Payment') {
        console.log(`Order ${orderId} already processed. Current status: ${orderData.status}`);
        return { buyerId: null, orderAmount: 0, orderItems: [] };
      }

      // 1. Create Payment Record
      transaction.set(paymentRef, {
        orderId: orderId,
        buyerId: orderData.buyerId,
        paymentDate: Timestamp.now(),
        amount: data.data.amount / 100, // Paystack returns amount in kobo
        paymentMethod: `Paystack - ${data.data.channel}`,
        transactionId: data.data.id,
        reference: reference,
        status: 'Completed',
      });

      // 2. Update Order Status
      transaction.update(orderRef, { status: 'Processing' });
      
      return { 
          buyerId: orderData.buyerId, 
          orderAmount: orderData.totalAmount, 
          orderItems: orderData.items 
      };
    });

    // If transaction was already processed, stop here.
    if (!buyerId) {
        return NextResponse.json({ success: true, message: 'Payment previously verified.' });
    }

    // 3. Award TradPoints (outside the main transaction)
    const pointsConfigSnap = await db.collection('platformSettings').doc('pointsConfig').get();
    const pointsConfig = pointsConfigSnap.data() || {};
    
    const buyerPointsPer10Kes = pointsConfig.buyerPurchasePointsPer10 || 1;
    const buyerPoints = Math.floor((orderAmount / 10) * buyerPointsPer10Kes);
    if (buyerPoints > 0) {
        await awardPoints(db, buyerId, buyerPoints, 'PURCHASE_COMPLETE', { orderId });
    }
    
    // For Tradinta Direct, points go to Tradinta's "house" account, or we can skip seller points
    // For B2B orders, find the seller and award them points.
    if (orderItems && orderItems.length > 0 && !orderItems[0].isTradintaDirect) {
        // This is a B2B order, so find seller and award points
        const sellerId = orderItems[0].shopId;
        const sellerDoc = await db.collection('manufacturers').doc(sellerId).get();
        const sellerData = sellerDoc.data();
        const isSellerVerified = sellerData?.verificationStatus === 'Verified';

        const sellerPointsPer10Kes = pointsConfig.sellerSalePointsPer10 || 1;
        let sellerPoints = Math.floor((orderAmount / 10) * sellerPointsPer10Kes);
        
        if (isSellerVerified && pointsConfig.globalSellerPointMultiplier && pointsConfig.globalSellerPointMultiplier > 1) {
            sellerPoints *= pointsConfig.globalSellerPointMultiplier;
        }
        
        if (sellerPoints > 0) {
            await awardPoints(db, sellerId, sellerPoints, 'SALE_COMPLETE', { orderId, buyerId });
        }
    }
    
    // ---- START: Sales Attribution Logic ----
    // This part remains unchanged as it works for both B2C and B2B
    const referralCode = request.cookies.get('referralCode')?.value;
    if (referralCode && orderItems && orderItems.length > 0) {
        const partnerQuery = await db.collection('users').where('tradintaId', '==', referralCode).limit(1).get();
        if(!partnerQuery.empty) {
            const partnerId = partnerQuery.docs[0].id;
            const sellerId = orderItems[0].shopId; // Get seller from the first item
            const { commissionRate, campaignId } = await getCommissionDetails(partnerId, sellerId);
            const commissionEarned = (orderAmount * commissionRate) / 100;
            
            const saleRef = db.collection('attributedSales').doc();
            await saleRef.set({
                id: saleRef.id,
                orderId,
                partnerId,
                campaignId,
                saleAmount: orderAmount,
                commissionEarned,
                date: FieldValue.serverTimestamp(),
                payoutStatus: 'Unpaid',
            });

            const earningsRef = db.collection('partnerEarnings').doc(partnerId);
            await earningsRef.set({
                partnerId,
                totalEarnings: FieldValue.increment(commissionEarned),
                unpaidEarnings: FieldValue.increment(commissionEarned),
                paidEarnings: FieldValue.increment(0),
            }, { merge: true });
        }
    }
    // ---- END: Sales Attribution Logic ----

    return NextResponse.json({ success: true, message: 'Payment verified and order updated.' });

  } catch (error: any) {
    console.error('Error in Paystack verification webhook:', error);
    return NextResponse.json({ error: 'Internal server error.', details: error.message }, { status: 500 });
  }
}
