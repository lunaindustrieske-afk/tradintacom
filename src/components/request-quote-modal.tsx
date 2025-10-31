
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/definitions';
import { Calendar as CalendarIcon, Send, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './logo';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

interface RequestQuoteModalProps {
  product: Product;
  children: React.ReactNode;
}

export function RequestQuoteModal({
  product,
  children,
}: RequestQuoteModalProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const [date, setDate] = React.useState<Date | undefined>();
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || !firestore) {
        toast({
            title: 'Please log in',
            description: 'You must be logged in to request a quotation.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const quantity = formData.get('quantity') as string;
    const message = formData.get('message') as string;

    try {
        const quotationData = {
            buyerId: user.uid,
            buyerName: user.displayName || 'Anonymous Buyer',
            sellerId: product.manufacturerId,
            productId: product.id,
            productName: product.name,
            quantity: Number(quantity),
            message: message,
            deliveryDate: date ? format(date, 'yyyy-MM-dd') : null,
            status: 'New',
            createdAt: serverTimestamp(),
        };

        const quotationsRef = collection(firestore, 'manufacturers', product.manufacturerId, 'quotations');
        await addDocumentNonBlocking(quotationsRef, quotationData);
        
        toast({
            title: "Quotation Request Sent!",
            description: `Your request for ${product.name} has been sent successfully.`,
        });

        setOpen(false); // Close the modal on success
    } catch (error: any) {
        toast({
            title: 'Submission Failed',
            description: error.message || 'An unexpected error occurred.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <Logo className="w-24 mb-2" />
          <DialogTitle>Request for Quotation (RFQ)</DialogTitle>
          <DialogDescription>
            Submit your requirements for <span className="font-semibold text-primary">{product.name}</span>. The seller will respond directly to your Tradinta Inbox.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                placeholder="e.g., 500"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="delivery-date" className="text-right">
                Delivery By
              </Label>
               <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
            </div>
             <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder="Include any specific requirements, questions, or customization needs here..."
                className="col-span-3 min-h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} 
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    