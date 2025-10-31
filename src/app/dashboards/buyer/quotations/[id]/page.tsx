
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useUser,
  useFirestore,
  useDoc,
  useMemoFirebase,
  useCollection,
  setDocumentNonBlocking,
} from '@/firebase';
import { doc, serverTimestamp, addDoc, collection, setDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  MessageSquare,
  DollarSign,
  Send,
  Loader2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { nanoid } from 'nanoid';
import { ContactManufacturerModal } from '@/components/contact-manufacturer-modal';
import type { Product, Manufacturer } from '@/lib/definitions';


type Quotation = {
  id: string;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  productName: string;
  productId: string;
  quantity: number;
  message: string;
  deliveryDate?: string;
  createdAt: any;
  status: 'New' | 'Responded' | 'Accepted' | 'Archived';
  response?: {
    unitPrice: number;
    totalPrice: number;
    message: string;
    respondedAt: any;
  }
};

const DetailItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className="font-semibold">{value || 'Not provided'}</p>
  </div>
);

export default function BuyerQuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);

  const quotationDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !quotationId) return null;
    return doc(firestore, 'users', user.uid, 'quotations', quotationId);
  }, [user, firestore, quotationId]);

  const { data: quotation, isLoading, forceRefetch } = useDoc<Quotation>(quotationDocRef);

  const [product, setProduct] = React.useState<Product | null>(null);
  const [manufacturer, setManufacturer] = React.useState<Manufacturer | null>(null);

  React.useEffect(() => {
    if (quotation && firestore) {
      const fetchRelatedData = async () => {
        // Fetch Manufacturer
        const manufRef = doc(firestore, 'manufacturers', quotation.sellerId);
        const manufSnap = await getDoc(manufRef);
        if (manufSnap.exists()) {
          setManufacturer({ id: manufSnap.id, ...manufSnap.data() } as Manufacturer);
        }

        // Fetch Product
        const productRef = doc(firestore, 'manufacturers', quotation.sellerId, 'products', quotation.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
        }
      }
      fetchRelatedData();
    }
  }, [quotation, firestore]);
  

  const handleAcceptQuote = async () => {
    if (!user || !firestore || !quotation || !quotation.response) return;
    setIsProcessing(true);

    try {
        const orderId = nanoid();
        // 1. Create the order document
        const orderRef = doc(firestore, 'orders', orderId);
        const orderData = {
            id: orderId,
            buyerId: user.uid,
            buyerName: user.displayName,
            sellerId: quotation.sellerId,
            sellerName: quotation.sellerName,
            orderDate: serverTimestamp(),
            totalAmount: quotation.response.totalPrice,
            status: 'Pending Payment',
            relatedQuotationId: quotation.id,
            items: [{
                productId: quotation.productId,
                productName: quotation.productName,
                quantity: quotation.quantity,
                unitPrice: quotation.response.unitPrice,
            }],
        };
        await setDoc(orderRef, orderData);
        
        // 2. Update status of quotation for buyer
        await updateDocumentNonBlocking(quotationDocRef, { status: 'Accepted' });

        // 3. Update status of quotation for seller
        const sellerQuotationRef = doc(firestore, 'manufacturers', quotation.sellerId, 'quotations', quotationId);
        await updateDocumentNonBlocking(sellerQuotationRef, { status: 'Accepted' });

        forceRefetch(); // Refetch the quotation data to update the UI
        
        toast({
            title: 'Quotation Accepted!',
            description: 'A new order has been created. Please proceed with payment.'
        });
        
        // Redirect to orders page after a delay
        setTimeout(() => router.push('/dashboards/buyer/orders'), 1500);

    } catch (error: any) {
        toast({
            title: 'Error Accepting Quote',
            description: error.message,
            variant: 'destructive'
        });
        setIsProcessing(false);
    }
  }


  if (isLoading || (quotation && (!manufacturer || !product))) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!quotation) {
    return <div>Quotation not found.</div>;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/buyer">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/buyer/orders">Orders & RFQs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>RFQ Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboards/buyer/orders?tab=quotations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Request for: {quotation.productName}
        </h1>
      </div>

       <Card>
          <CardHeader>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>
                  Your inquiry sent to <span className="font-semibold">{quotation.sellerName}</span> on {format(quotation.createdAt.toDate(), 'PPP')}
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <DetailItem label="Product" value={quotation.productName} />
              <DetailItem label="Required Quantity" value={quotation.quantity} />
              {quotation.deliveryDate && <DetailItem label="Required By" value={format(new Date(quotation.deliveryDate), 'PPP')} />}
              <div>
                    <p className="text-sm font-medium text-muted-foreground">Your Message</p>
                    <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                      {quotation.message || "No additional message provided."}
                    </blockquote>
              </div>
          </CardContent>
       </Card>

      {quotation.status === 'New' && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 text-center">
            <CardContent className="p-6">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                <h3 className="font-semibold">Awaiting Response</h3>
                <p className="text-sm text-muted-foreground">The seller has been notified and will respond shortly.</p>
            </CardContent>
        </Card>
      )}

      {quotation.status === 'Responded' && quotation.response && product && manufacturer && (
           <Card>
              <CardHeader>
                  <CardTitle className="text-green-600">Seller's Quotation</CardTitle>
                  <CardDescription>
                      Response from {quotation.sellerName} received on {format(quotation.response.respondedAt.toDate(), 'PPP')}
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Quoted Unit Price" value={`KES ${quotation.response.unitPrice.toLocaleString()}`} />
                      <DetailItem label="Total Price" value={`KES ${quotation.response.totalPrice.toLocaleString()}`} />
                  </div>
                  <div>
                        <p className="text-sm font-medium text-muted-foreground">Seller's Message</p>
                        <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                          {quotation.response.message}
                        </blockquote>
                  </div>
              </CardContent>
               <CardFooter className="flex-col md:flex-row gap-2 justify-end">
                    <ContactManufacturerModal product={product} manufacturer={manufacturer}>
                      <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4"/> Negotiate Further</Button>
                    </ContactManufacturerModal>
                    <Button onClick={handleAcceptQuote} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Accept Quote & Create Order
                    </Button>
                </CardFooter>
           </Card>
      )}
      
       {quotation.status === 'Accepted' && (
        <Card className="bg-green-50 dark:bg-green-900/20 text-center">
            <CardContent className="p-6">
                <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold">Quotation Accepted</h3>
                <p className="text-sm text-muted-foreground mb-4">An order has been created. Please proceed to your orders to make a payment.</p>
                <Button asChild>
                  <Link href="/dashboards/buyer/orders"><FileText className="mr-2 h-4 w-4"/> View Order</Link>
                </Button>
            </CardContent>
        </Card>
      )}


    </div>
  );
}
