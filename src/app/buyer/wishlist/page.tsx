
'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, ArrowRight, Wallet, Loader2, Tag } from "lucide-react";
import Link from "next/link";
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, writeBatch, setDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { usePaystackPayment } from 'react-paystack';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

type WishlistItem = {
  id: string; // This is the productId
  addedAt: any;
};

type CartProduct = Product & { 
    shopId: string; 
    slug: string; 
    variants: { price: number, retailPrice?: number }[], 
    manufacturerName?: string, 
    isVerified?: boolean,
    listOnTradintaDirect?: boolean;
};

export default function CartPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const [isCheckingOut, setIsCheckingOut] = React.useState(false);
    const [promoCode, setPromoCode] = React.useState('');
    const [discount, setDiscount] = React.useState(0);

    // The wishlist collection is now acting as our B2C cart
    const cartQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return collection(firestore, 'users', user.uid, 'wishlist');
    }, [user, firestore]);

    const { data: cartItems, isLoading, forceRefetch } = useCollection<CartProduct>(cartQuery);
    
    // We only want to show products that are opted into Tradinta Direct in the cart
    const directProducts = cartItems?.filter((item: any) => item.listOnTradintaDirect) || [];

    const subtotal = React.useMemo(() => {
        if (!directProducts) return 0;
        return directProducts.reduce((sum, item: any) => {
             const price = item.variants?.[0]?.retailPrice || 0;
             return sum + price;
        }, 0);
    }, [directProducts]);

    const total = React.useMemo(() => {
        return subtotal - discount;
    }, [subtotal, discount]);

    const handleApplyPromoCode = async () => {
        // In a real app, you'd make an API call to a serverless function
        // to validate the code and get the discount amount securely.
        // For this demo, we'll simulate a simple code.
        if (promoCode.toUpperCase() === 'SAVE10') {
            const discountAmount = subtotal * 0.10;
            setDiscount(discountAmount);
            toast({ title: "Promo Code Applied!", description: `You saved KES ${discountAmount.toLocaleString()}`});
        } else {
            toast({ title: 'Invalid Promo Code', variant: 'destructive' });
            setDiscount(0);
        }
    };


    const handleRemove = async (productId: string) => {
        if (!user || !firestore) return;
        const cartItemRef = doc(firestore, 'users', user.uid, 'wishlist', productId);
        try {
            await deleteDoc(cartItemRef);
            toast({ title: 'Item removed from cart' });
            forceRefetch(); 
        } catch (error: any) {
            toast({ title: 'Error', description: `Could not remove item: ${error.message}`, variant: 'destructive'});
        }
    };

    // --- Paystack Integration ---
    const config = {
        reference: new Date().getTime().toString(),
        email: user?.email || '',
        amount: total * 100, // Amount in kobo/cents
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            userId: user?.uid,
            item_count: directProducts.length,
            promo_code_used: promoCode,
            discount_amount: discount
        }
    };
    
    const initializePayment = usePaystackPayment(config);

    const onSuccess = async (transaction: any) => {
        if (!firestore || !user) return;
        setIsCheckingOut(true);

        const orderRef = doc(collection(firestore, 'orders'));
        const orderData = {
            id: orderRef.id,
            buyerId: user.uid,
            buyerName: user.displayName || 'Tradinta Buyer',
            orderDate: new Date(),
            totalAmount: total,
            subtotal: subtotal,
            discountAmount: discount,
            promoCode: promoCode || null,
            status: 'Pending Payment', // This status will be updated by the webhook
            items: directProducts.map((item: any) => ({
                productId: item.id,
                productName: item.name,
                shopId: item.shopId,
                quantity: 1,
                unitPrice: item.variants?.[0]?.retailPrice || 0,
            })),
            isTradintaDirect: true,
            shippingAddress: "123 Tradinta Lane, Nairobi, Kenya", // Placeholder address
        };
        await setDoc(orderRef, orderData);

        try {
            const response = await fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference: transaction.reference, orderId: orderRef.id }),
            });
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.details || 'Payment verification failed on the server.');
            }

            const batch = writeBatch(firestore);
            directProducts.forEach(item => {
                const itemRef = doc(firestore, 'users', user.uid, 'wishlist', item.id);
                batch.delete(itemRef);
            });
            await batch.commit();

            toast({ title: "Payment Successful!", description: "Your order is being processed."});
            router.push(`/orders/${orderRef.id}`);

        } catch (error: any) {
             toast({
                title: "Order Processing Failed",
                description: `Your payment was successful, but we couldn't finalize your order. Please contact support with reference: ${transaction.reference}. Error: ${error.message}`,
                variant: 'destructive',
                duration: 10000,
            });
            setIsCheckingOut(false);
        }
    };

    const onClose = () => {
        setIsCheckingOut(false);
        toast({ title: 'Payment window closed.', description: 'Your order was not placed.' });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
                    <CardContent><Skeleton className="h-40 w-full" /></CardContent>
                </Card>
            </div>
        )
    }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            My Shopping Cart
          </CardTitle>
          <CardDescription>
            Review the items you've added for direct purchase. These items are fulfilled by Tradinta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directProducts.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-4">
                     {directProducts.map((product, index) => (
                        <React.Fragment key={product.id}>
                          <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="relative aspect-square w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-grow text-center md:text-left">
                              <Link href={`/products/${product.shopId}/${product.slug}`} className="font-semibold hover:text-primary transition-colors">{product.name}</Link>
                              <p className="text-sm text-muted-foreground">{product.manufacturerName}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-lg font-bold">KES {(product.variants?.[0]?.retailPrice || 0).toLocaleString()}</p>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemove(product.id)}>
                                    <Trash2 className="w-5 h-5" />
                                    <span className="sr-only">Remove item</span>
                                </Button>
                            </div>
                          </div>
                          {index < directProducts.length - 1 && <Separator />}
                        </React.Fragment>
                      ))}
                </div>
                <div className="lg:col-span-1">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Input placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                                <Button onClick={handleApplyPromoCode} variant="outline">Apply</Button>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>KES {subtotal.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="flex items-center gap-1"><Tag className="w-4 h-4"/> Promo "{promoCode}"</span>
                                        <span>- KES {discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>Calculated at next step</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4 border-t pt-4">
                            <div className="flex justify-between w-full font-bold text-lg">
                                <span>Total</span>
                                <span>KES {total.toLocaleString()}</span>
                            </div>
                            <Button className="w-full" size="lg" disabled={isCheckingOut || total <= 0} onClick={() => {
                                setIsCheckingOut(true);
                                initializePayment({onSuccess, onClose});
                            }}>
                               {isCheckingOut ? (
                                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                               ) : (
                                   <Wallet className="mr-2 h-5 w-5" />
                               )}
                                Proceed to Checkout
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Your cart is empty</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse products available for direct purchase to get started.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/products?tab=direct">
                  Shop Tradinta Direct
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
