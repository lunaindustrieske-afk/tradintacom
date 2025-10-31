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
} from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  MessageSquare,
  DollarSign,
  Send,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { sendTransactionalEmail } from '@/app/(auth)/actions';


type Quotation = {
  id: string;
  buyerName: string;
  buyerId: string;
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

export default function QuotationDetailPage() {
  const params = useParams();
  const quotationId = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [unitPrice, setUnitPrice] = useState<string>('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quotationDocRef = useMemoFirebase(() => {
    if (!user || !firestore || !quotationId) return null;
    return doc(firestore, 'manufacturers', user.uid, 'quotations', quotationId);
  }, [user, firestore, quotationId]);

  const { data: quotation, isLoading } = useDoc<Quotation>(quotationDocRef);
  
  const totalPrice = useMemo(() => {
    const price = parseFloat(unitPrice);
    if (!isNaN(price) && quotation?.quantity) {
        return (price * quotation.quantity).toFixed(2);
    }
    return '0.00';
  }, [unitPrice, quotation?.quantity]);

  const handleSubmitResponse = async () => {
    if (!unitPrice || !responseMessage || !quotationDocRef || !quotation) return;
    setIsSubmitting(true);
    
    const responseData = {
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice),
        message: responseMessage,
        respondedAt: serverTimestamp(),
    };

    try {
        await updateDocumentNonBlocking(quotationDocRef, {
            status: 'Responded',
            response: responseData,
        });

        // Also update the buyer's copy of the quotation
        const buyerQuotationRef = doc(firestore, 'users', quotation.buyerId, 'quotations', quotationId);
        await updateDocumentNonBlocking(buyerQuotationRef, {
            status: 'Responded',
            response: responseData,
        });

        // TODO: Get buyer's email to send notification
        // For now, we'll skip the email part

        toast({
            title: 'Response Sent!',
            description: 'Your quotation has been sent to the buyer.'
        })
    } catch (error: any) {
        toast({
            title: 'Error Sending Response',
            description: error.message,
            variant: 'destructive',
        })
    } finally {
        setIsSubmitting(false);
    }

  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!quotation) {
    return <div>Quotation not found.</div>;
  }

  const hasResponded = quotation.status === 'Responded' || quotation.status === 'Accepted';

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre">Seller Centre</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboards/seller-centre/quotations">Quotations</Link>
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
          <Link href="/dashboards/seller-centre/quotations">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Quotation Request: {quotation.productName}
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Buyer's Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar>
                            <AvatarImage />
                            <AvatarFallback>{quotation.buyerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{quotation.buyerName}</p>
                            <p className="text-xs text-muted-foreground">
                                Requested on {format(quotation.createdAt.toDate(), 'PPP')}
                            </p>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <DetailItem label="Product" value={quotation.productName} />
                        <DetailItem label="Required Quantity" value={quotation.quantity} />
                        {quotation.deliveryDate && <DetailItem label="Required By" value={format(new Date(quotation.deliveryDate), 'PPP')} />}
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Buyer's Message</p>
                             <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                                {quotation.message || "No additional message provided."}
                             </blockquote>
                        </div>
                     </div>
                </CardContent>
            </Card>

            {hasResponded && quotation.response && (
                 <Card className="bg-green-50 dark:bg-green-900/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-600"/>Your Response</CardTitle>
                         <CardDescription>Sent on {format(quotation.response.respondedAt.toDate(), 'PPP')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="Quoted Unit Price" value={`KES ${quotation.response.unitPrice.toLocaleString()}`} />
                            <DetailItem label="Total Price" value={`KES ${quotation.response.totalPrice.toLocaleString()}`} />
                        </div>
                        <div>
                             <p className="text-sm font-medium text-muted-foreground">Your Message</p>
                             <blockquote className="mt-2 border-l-2 pl-6 italic text-sm">
                                {quotation.response.message}
                             </blockquote>
                        </div>
                    </CardContent>
                    {quotation.status === 'Accepted' && (
                        <CardFooter>
                            <p className="text-sm font-semibold text-green-700">The buyer has accepted this quote and an order has been created.</p>
                        </CardFooter>
                    )}
                 </Card>
            )}
            
        </div>
        <div className="md:col-span-1">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare /> Respond to Buyer
                    </CardTitle>
                    <CardDescription>
                        Provide your pricing and terms for this request.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="unit-price">Unit Price (KES)</Label>
                        <Input id="unit-price" type="number" placeholder="e.g. 5000" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} disabled={hasResponded} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="total-price">Total Price (KES)</Label>
                        <Input id="total-price" type="text" value={totalPrice} readOnly disabled className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                         <Label htmlFor="response-message">Your Message</Label>
                         <Textarea id="response-message" placeholder="Include payment terms, delivery details, and validity of this quote." value={responseMessage} onChange={e => setResponseMessage(e.target.value)} disabled={hasResponded} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleSubmitResponse} disabled={isSubmitting || hasResponded}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Send className="mr-2 h-4 w-4" />}
                        {hasResponded ? 'Response Sent' : 'Send Quotation'}
                    </Button>
                </CardFooter>
             </Card>
        </div>
      </div>

    </div>
  );
}
