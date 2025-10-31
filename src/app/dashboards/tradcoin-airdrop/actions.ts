
'use server';

import { getFirestore, FieldValue, DocumentReference } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';
import { nanoid } from 'nanoid';

customInitApp();
const db = getFirestore();

interface GenerateCodesParams {
  count: number;
  points: number;
  expiresAt?: Date;
}

export async function generateClaimCodes({
  count,
  points,
  expiresAt,
}: GenerateCodesParams): Promise<{ success: boolean; message: string; codes?: string[] }> {
  try {
    if (count > 1000) {
        throw new Error("Cannot generate more than 1000 codes at a time.");
    }
    const batch = db.batch();
    const newCodes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = nanoid(8).toUpperCase();
        newCodes.push(code);
        const codeRef = db.collection('claimCodes').doc(code);
        batch.set(codeRef, {
            code,
            points,
            status: 'active',
            expiresAt: expiresAt || null,
            createdAt: FieldValue.serverTimestamp(),
            claimedBy: null,
            claimedAt: null,
        });
    }
    await batch.commit();
    return { success: true, message: 'Codes generated successfully.', codes: newCodes };
  } catch (error: any) {
    console.error("Error generating claim codes:", error);
    return { success: false, message: error.message };
  }
}

export async function voidClaimCode(codeId: string): Promise<{ success: boolean; message: string }> {
    try {
        const codeRef = db.collection('claimCodes').doc(codeId);
        await codeRef.update({ status: 'voided' });
        return { success: true, message: 'Code voided successfully.' };
    } catch(error: any) {
        console.error("Error voiding claim code:", error);
        return { success: false, message: error.message };
    }
}

export async function findUserAndTheirPoints(identifier: string): Promise<{ success: boolean; message?: string; user?: any }> {
    try {
        let userDocRef: DocumentReference;

        if (identifier.includes('@')) {
             const emailDoc = await db.collection('emails').doc(identifier).get();
             if (!emailDoc.exists) throw new Error('User with this email not found.');
             const userId = emailDoc.data()!.userId;
             userDocRef = db.collection('users').doc(userId);
        } else {
            const usersRef = db.collection('users');
            const q = usersRef.where('tradintaId', '==', identifier).limit(1);
            const snapshot = await q.get();
            if (snapshot.empty) throw new Error('User with this Tradinta ID not found.');
            userDocRef = snapshot.docs[0].ref;
        }
        
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) throw new Error('User profile not found.');

        const userData = userDoc.data();
        
        const ledgerQuery = db.collection('pointsLedgerEvents').where('user_id', '==', userDoc.id).orderBy('created_at', 'desc');
        const ledgerSnapshot = await ledgerQuery.get();
        
        const ledger = ledgerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalPoints = ledger.reduce((sum, event) => sum + event.points, 0);

        return {
            success: true,
            user: {
                id: userDoc.id,
                fullName: userData?.fullName,
                tradintaId: userData?.tradintaId,
                tradPointsStatus: userData?.tradPointsStatus || { isBanned: false },
                totalPoints,
                ledger
            }
        };

    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function banUserFromTradPoints({ userId, tradintaId, reason, ban }: { userId: string, tradintaId?: string, reason: string, ban: boolean }): Promise<{ success: boolean, message: string }> {
    try {
        const userRef = db.collection('users').doc(userId);
        
        // Update user's ban status
        await userRef.update({
            'tradPointsStatus.isBanned': ban,
            'tradPointsStatus.banReason': reason,
        });

        // If banning, void their referral code if it exists
        if (ban && tradintaId) {
            // Placeholder: Logic to void referral codes would go here.
            // For now, we assume referral codes are tied to tradintaId.
        }
        
        return { success: true, message: `User has been successfully ${ban ? 'banned from' : 'reinstated to'} the TradPoints program.` };

    } catch (error: any) {
        console.error('Error updating TradPoints ban status:', error);
        return { success: false, message: error.message };
    }
}
