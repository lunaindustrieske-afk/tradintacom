

'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Truck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import type { Product } from '@/lib/definitions';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';

type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

type Order = {
    id: string;
    totalAmount: number;
    status: string;
    orderDate: any;
    items: OrderItem[];
    isTradintaDirect?: boolean;
};

type ProductWithShopId = Product & { shopId: string; slug: string; variants: { price: number }[], isSponsored?: boolean, imageHint?: string };


const OrderConfirmationPageSkeleton = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] container mx-auto py-12">
        <Skeleton className="h-16 w-16 rounded-full mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80 mb-8" />
        <Skeleton className="h-64 w-full max-w-xl" />
        <div className="w-full mt-16">
          <Skeleton className="h-8 w-1/3 mx-auto mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
    </div>
)

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const firestore = useFirestore();

    const [sponsoredProducts, setSponsoredProducts] = React.useState<ProductWithShopId[]>([]);
    const [isLoadingSponsored, setIsLoadingSponsored] = React.useState(true);

    const orderDocRef = useMemoFirebase(() => {
        if (!firestore || !orderId) return null;
        return doc(firestore, 'orders', orderId);
    }, [firestore, orderId]);

    const { data: order, isLoading } = useDoc<Order>(orderDocRef);

    React.useEffect(() => {
        const fetchSponsored = async () => {
            setIsLoadingSponsored(true);
            try {
                const allProducts = await getRankedProducts(null);
                const sponsored = allProducts.filter((p: any) => p.isSponsored).slice(0, 4);
                setSponsoredProducts(sponsored);
            } catch (e) {
                console.error("Failed to fetch sponsored products", e);
            } finally {
                setIsLoadingSponsored(false);
            }
        }
        fetchSponsored();
    }, []);

    if (isLoading) {
        return <OrderConfirmationPageSkeleton />;
    }

    if (!order) {
        return (
            <div className="container mx-auto py-12 text-center">
                <h1 className="text-xl font-semibold">Order not found</h1>
                <p>The order you are looking for could not be found.</p>
                <Button asChild className="mt-4"><Link href="/dashboards/buyer/orders">View Your Orders</Link></Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-12">
            <div className="flex flex-col items-center text-center">
                 <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                 <h1 className="text-3xl font-bold font-headline">Thank You For Your Order!</h1>
                 <p className="text-muted-foreground mt-2">Your order has been confirmed and is now being processed.</p>
            </div>

            <Card className="max-w-xl mx-auto my-8">
                <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                    <CardDescription>Order ID: {order.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p>KES {(item.quantity * item.unitPrice).toLocaleString()}</p>
                        </div>
                    ))}
                    <Separator />
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-semibold">{new Date(order.orderDate?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-4">
                        <span className="text-lg font-bold">Total Paid</span>
                        <span className="text-lg font-bold">KES {order.totalAmount.toLocaleString()}</span>
                    </div>
                     <div className="flex items-center justify-center gap-2 pt-4">
                        <Truck className="w-5 h-5 text-primary"/>
                        <p className="font-semibold">Status: {order.status}</p>
                     </div>
                </CardContent>
            </Card>

             <div className="text-center">
                <Button asChild>
                    <Link href="/dashboards/buyer/orders">Track Order Status</Link>
                </Button>
            </div>

             <div className="mt-16">
                <h2 className="text-2xl font-bold text-center font-headline mb-6">While You Wait, Check Out These Top Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoadingSponsored ? (
                        Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-80" />)
                    ) : sponsoredProducts.length > 0 ? (
                        sponsoredProducts.map(product => (
                             <ProductCard key={product.id} product={product} />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-muted-foreground">No sponsored products to show right now.</p>
                    )}
                </div>
             </div>
        </div>
    )
}
