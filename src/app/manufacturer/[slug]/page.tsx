
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Truck,
  MessageSquare,
  Globe,
  Banknote,
  FileText,
  AlertTriangle,
  Facebook,
  Instagram,
  Twitter,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { RequestQuoteModal } from '@/components/request-quote-modal';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { type Product, type Manufacturer } from '@/app/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FollowButton } from '@/components/follow-button';
import { cn } from '@/lib/utils';

export default function ManufacturerPage() {
  const slug = useParams().slug as string;
  const firestore = useFirestore();

  const [manufacturer, setManufacturer] = React.useState<Manufacturer | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!firestore || !slug) return;
    const fetchManufacturer = async () => {
      setIsLoading(true);
      const manufQuery = query(collection(firestore, 'manufacturers'), where('slug', '==', slug), limit(1));
      const querySnapshot = await getDocs(manufQuery);
      if (querySnapshot.empty) {
        setManufacturer(null);
      } else {
        const doc = querySnapshot.docs[0];
        setManufacturer({ id: doc.id, ...doc.data() } as Manufacturer);
      }
      setIsLoading(false);
    };
    fetchManufacturer();
  }, [firestore, slug]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !manufacturer) return null;
    return query(collection(firestore, 'manufacturers', manufacturer.id, 'products'), where('status', '==', 'published'));
  }, [firestore, manufacturer]);

  const { data: manufacturerProducts, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

   const reviewsQuery = useMemoFirebase(() => {
    if (!firestore || !manufacturer) return null;
    return query(collection(firestore, 'reviews'), where('manufacturerId', '==', manufacturer.id), where('status', '==', 'approved'));
  }, [firestore, manufacturer]);
  const { data: reviews, isLoading: isLoadingReviews } = useCollection(reviewsQuery);


  if (isLoading) {
    return (
        <div className="bg-background">
            <div className="container mx-auto px-4 py-12">
                <Skeleton className="h-6 w-1/3 mb-12" />
                <div className="grid md:grid-cols-3 items-center gap-8 mb-12">
                    <div className="md:col-span-2 space-y-4">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                    <div className="flex justify-center md:justify-end">
                        <Skeleton className="h-32 w-32 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    )
  }

  if (!manufacturer) {
    notFound();
  }
  
  const isSuspended = manufacturer.suspensionDetails?.isSuspended;
  const suspensionReason = manufacturer.suspensionDetails?.reason;
  const showDisclaimer = manufacturer.suspensionDetails?.publicDisclaimer;

  return (
    <div className={cn('bg-background', manufacturer.theme)}>
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{manufacturer.shopName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {isSuspended && showDisclaimer && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Shop Suspended</AlertTitle>
            <AlertDescription>
              This shop is currently suspended. Reason: {suspensionReason || 'Violation of platform policies.'}
            </AlertDescription>
          </Alert>
        )}

        {/* --- Header Section --- */}
        <header className="grid md:grid-cols-3 gap-8 items-center mb-12">
          <div className="md:col-span-2">
            <h1 className="text-4xl lg:text-5xl font-bold font-headline mb-3">{manufacturer.shopName}</h1>
            <p className="text-lg text-muted-foreground mb-4">{manufacturer.tagline}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {manufacturer.isVerified && (
                <div className="flex items-center gap-2 font-semibold text-green-600">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Tradinta Verified</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span><span className="font-bold text-foreground">{manufacturer.rating || 'N/A'}</span> / 5 Rating</span>
              </div>
               <FollowButton targetId={manufacturer.id} targetType="manufacturer" />
               <div className="flex items-center gap-2">
                  {manufacturer.website && <a href={manufacturer.website} target="_blank" rel="noopener noreferrer"><Globe className="w-5 h-5"/></a>}
                  {manufacturer.facebook && <a href={manufacturer.facebook} target="_blank" rel="noopener noreferrer"><Facebook className="w-5 h-5"/></a>}
                  {manufacturer.instagram && <a href={manufacturer.instagram} target="_blank" rel="noopener noreferrer"><Instagram className="w-5 h-5"/></a>}
                  {manufacturer.x && <a href={manufacturer.x} target="_blank" rel="noopener noreferrer"><Twitter className="w-5 h-5"/></a>}
               </div>
            </div>
          </div>
          <div className="hidden md:flex justify-end">
            {manufacturer.logoUrl ? (
                <Image
                    src={manufacturer.logoUrl}
                    alt={`${manufacturer.shopName} logo`}
                    width={128}
                    height={128}
                    className="rounded-full border-4 border-background shadow-lg"
                />
            ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                    <Image
                        src="https://i.postimg.cc/j283ydft/image.png"
                        alt="Tradinta Fallback Logo"
                        width={128}
                        height={128}
                        className="rounded-full object-cover"
                    />
                </div>
            )}
          </div>
        </header>

        {/* --- About Section --- */}
        <section id="about" className="mb-16">
          <Card className="bg-muted/30">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold font-headline mb-4">About {manufacturer.shopName}</h2>
              <p className="text-muted-foreground max-w-3xl">{manufacturer.overview}</p>
            </CardContent>
          </Card>
        </section>

        {/* --- Product Catalog --- */}
        <section id="products" className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-headline">Product Catalog</h2>
            <Button variant="outline" asChild>
              <Link href="/products">View All Products</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoadingProducts ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
            ) : manufacturerProducts && manufacturerProducts.length > 0 ? (
              manufacturerProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden group flex flex-col hover:shadow-xl transition-shadow duration-300">
                  <Link href={`/products/${manufacturer.slug}/${product.slug}`} className="flex-grow flex flex-col">
                    <CardContent className="p-0 flex-grow">
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          data-ai-hint={product.imageHint || 'product photo'}
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="font-semibold leading-tight h-10 truncate">{product.name}</h3>
                        <div className="flex items-center justify-between">
                            <p className="text-primary font-bold text-lg">KES {product.price.toLocaleString()}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span>{product.rating || 'N/A'}</span>
                            </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                  <div className="p-4 pt-0">
                    <RequestQuoteModal product={product}>
                      <Button className="w-full">Request Quotation</Button>
                    </RequestQuoteModal>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>This manufacturer has not published any products yet.</p>
              </div>
            )}
          </div>
        </section>

        <Separator className="my-16" />

        {/* --- Trade & Logistics --- */}
        <section id="trade" className="mb-16">
          <h2 className="text-3xl font-bold font-headline mb-8 text-center">Trade & Logistics Information</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-full"><Banknote className="h-6 w-6 text-primary" /></div>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>{manufacturer.paymentMethods?.join(', ') || 'Not specified'}</CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-full"><Truck className="h-6 w-6 text-primary" /></div>
                <CardTitle className="text-lg">Delivery & Lead Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{manufacturer.deliveryTerms?.join(', ') || 'Not specified'}</p>
                <p className="text-sm text-muted-foreground">Lead time: {manufacturer.leadTime || 'Not specified'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <div className="p-3 bg-primary/10 rounded-full"><FileText className="h-6 w-6 text-primary" /></div>
                <CardTitle className="text-lg">Minimum Order</CardTitle>
              </CardHeader>
              <CardContent>{manufacturer.moq || 'Not specified'} units</CardContent>
            </Card>
          </div>
        </section>

        <Separator className="my-16" />

        {/* --- Reviews Section --- */}
        <section id="reviews" className="mb-16">
          <h2 className="text-3xl font-bold font-headline mb-8 text-center">What Buyers Are Saying</h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoadingReviews ? (
              Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review: any) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.buyerAvatar || ''} />
                      <AvatarFallback>{review.buyerName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{review.buyerName}</p>
                          <p className="text-xs text-muted-foreground">{review.createdAt ? formatDistanceToNow(review.createdAt.toDate()) : ''} ago</p>
                        </div>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm italic">"{review.comment}"</p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No reviews yet for this manufacturer.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
