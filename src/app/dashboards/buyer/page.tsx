
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  FileText,
  Star,
  DollarSign,
  ArrowRight,
  Lock,
  Banknote,
  MessageSquare,
  Info,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Wallet,
  BookCopy,
  Factory,
  Send,
  Megaphone,
  Sparkles,
  Users,
  Percent,
  Copy,
  Gift,
  Coins,
  User,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useDoc,
  useUser,
  useFirestore,
  useMemoFirebase,
  useCollection,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import type { Review } from '@/app/lib/definitions';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logFeatureUsage } from '@/lib/analytics';
import { ReportModal } from '@/components/report-modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { ApplyToBecomeManufacturer } from '@/components/apply-to-become-manufacturer';

const orders = [
  {
    id: 'ORD-006',
    customer: 'BuildRight Const.',
    total: 450000,
    status: 'Pending Fulfillment',
  },
  { id: 'ORD-008', customer: 'Yum Foods', total: 66000, status: 'Shipped' },
];

type VerificationStatus =
  | 'Unsubmitted'
  | 'Pending Legal'
  | 'Pending Admin'
  | 'Action Required'
  | 'Verified';
  
type ManufacturerData = {
  shopName?: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  phone?: string;
  email?: string;
  paymentPolicy?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  verificationStatus?: VerificationStatus;
  suspensionDetails?: {
    isSuspended: boolean;
    reason: string;
    prohibitions: string[];
    publicDisclaimer: boolean;
  };
};

type Product = {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'archived';
  price: number; // Assuming a base price exists on the product
};

const quickActions = [
  { title: "My Orders & RFQs", icon: <Package className="w-6 h-6 text-primary" />, href: "/dashboards/buyer/orders" },
  { title: "Messages", icon: <MessageSquare className="w-6 h-6 text-primary" />, href: "/dashboards/buyer/messages" },
  { title: "TradPoints", icon: <Coins className="w-6 h-6 text-primary" />, href: "/dashboards/buyer/tradpoints" },
  { title: "The Foundry", icon: <Sparkles className="w-6 h-6 text-primary" />, href: "/foundry" },
];

type UserProfile = {
    tradintaId?: string;
    email: string;
    fullName: string;
};

type Pledge = {
    id: string;
    forgingEventId: string;
}

type ForgingEvent = {
    id: string;
    productId: string;
    productName: string;
    productImageUrl: string;
    sellerName: string;
    sellerId: string;
    status: 'active' | 'finished';
    endTime: any;
    tiers: { buyerCount: number; discountPercentage: number }[];
    currentBuyerCount: number;
    finalDiscountTier?: number;
};


const ProfileCard = () => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    React.useEffect(() => {
        // If user data is loaded and there is no tradintaId, generate one.
        if (userDocRef && userProfile && !userProfile.tradintaId) {
            const newId = nanoid(8);
            updateDocumentNonBlocking(userDocRef, { tradintaId: newId });
            toast({
                title: "Tradinta ID Generated",
                description: "Your unique ID has been created.",
            });
        }
    }, [userProfile, userDocRef, toast]);


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: 'Copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    };

    const isLoading = isUserLoading || isProfileLoading;

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                </CardContent>
            </Card>
        );
    }

    if (!userProfile) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User className="w-6 h-6" /> My Profile</CardTitle>
                <CardDescription>Your personal information on Tradinta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{userProfile.fullName}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-semibold">{userProfile.email}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Tradinta ID</p>
                     {userProfile.tradintaId ? (
                        <div className="flex items-center gap-2">
                            <p className="font-semibold font-mono">{userProfile.tradintaId}</p>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(userProfile.tradintaId!)}>
                                {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    ) : (
                        <Skeleton className="h-5 w-24" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MyPledges = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const pledgesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'pledges'), where('buyerId', '==', user.uid));
    }, [user, firestore]);

    const { data: pledges, isLoading: isLoadingPledges } = useCollection<Pledge>(pledgesQuery);
    
    const [events, setEvents] = React.useState<Record<string, ForgingEvent>>({});
    const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
    const [isCompletingPurchase, setIsCompletingPurchase] = React.useState<string | null>(null);


    React.useEffect(() => {
        if (pledges && pledges.length > 0 && firestore) {
            setIsLoadingEvents(true);
            const eventIds = [...new Set(pledges.map(p => p.forgingEventId))];
            
            const fetchEvents = async () => {
                const eventPromises = eventIds.map(id => getDoc(doc(firestore, 'forgingEvents', id)));
                const eventSnaps = await Promise.all(eventPromises);
                const fetchedEvents: Record<string, ForgingEvent> = {};
                eventSnaps.forEach(snap => {
                    if (snap.exists()) {
                        fetchedEvents[snap.id] = snap.data() as ForgingEvent;
                    }
                });
                setEvents(fetchedEvents);
                setIsLoadingEvents(false);
            };
            fetchEvents();
        }
    }, [pledges, firestore]);
    
    const handleCompletePurchase = async (event: ForgingEvent) => {
        if (!user || !firestore) return;
        setIsCompletingPurchase(event.id);
        
        try {
            // Get original product price
            const productRef = doc(firestore, 'manufacturers', event.sellerId, 'products', event.productId);
            const productSnap = await getDoc(productRef);
            if (!productSnap.exists()) throw new Error("Original product not found.");
            
            const productData = productSnap.data() as Product;
            const basePrice = productData.price || 0;
            const discount = (event.finalDiscountTier || 0) / 100;
            const finalPrice = basePrice * (1 - discount);

            const orderData = {
                buyerId: user.uid,
                sellerId: event.sellerId,
                sellerName: event.sellerName,
                productName: event.productName,
                productId: event.productId,
                quantity: 1, // Assuming quantity of 1 for now
                totalAmount: finalPrice,
                orderDate: serverTimestamp(),
                status: 'Pending Payment',
                relatedForgingEventId: event.id,
            };
            const newOrderRef = await addDocumentNonBlocking(collection(firestore, 'orders'), orderData);
            
            toast({
                title: 'Order Created!',
                description: 'Your discounted order has been created. Proceed to payment.'
            });

            router.push(`/orders/${newOrderRef.id}`);

        } catch (error: any) {
            toast({ title: 'Error Creating Order', description: error.message, variant: 'destructive' });
            setIsCompletingPurchase(null);
        }
    };


    const isLoading = isLoadingPledges || isLoadingEvents;
    
    const PledgeItem = ({ pledge }: { pledge: Pledge }) => {
        const event = events[pledge.forgingEventId];
        if (!event) return <Skeleton className="h-24 w-full" />;

        if (event.status === 'active') {
            const { nextTier, progress } = React.useMemo(() => {
                const sortedTiers = [...event.tiers].sort((a, b) => a.buyerCount - b.buyerCount);
                const nextTier = sortedTiers.find(t => t.buyerCount > event.currentBuyerCount);
                const progress = nextTier ? (event.currentBuyerCount / nextTier.buyerCount) * 100 : 100;
                return { nextTier, progress };
            }, [event.tiers, event.currentBuyerCount]);

            return (
                <div className="border p-3 rounded-md space-y-2">
                    <div className="flex gap-3">
                         <Image src={event.productImageUrl || ''} width={64} height={64} alt={event.productName} className="rounded-md aspect-square object-cover" />
                        <div>
                            <p className="font-semibold text-sm">{event.productName}</p>
                            <p className="text-xs text-muted-foreground">by {event.sellerName}</p>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                        {nextTier ? `${nextTier.buyerCount - event.currentBuyerCount} more pledges to unlock ${nextTier.discountPercentage}% OFF!` : "Highest discount unlocked!"}
                    </p>
                </div>
            );
        }
        
        if (event.status === 'finished') {
             return (
                <div className="border p-3 rounded-md space-y-2 bg-green-50 dark:bg-green-900/20">
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                         <Image src={event.productImageUrl || ''} width={64} height={64} alt={event.productName} className="rounded-md aspect-square object-cover" />
                        <div className="flex-grow text-center sm:text-left">
                            <p className="font-semibold text-sm">{event.productName}</p>
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <Badge className="bg-green-100 text-green-800 text-lg"><Percent className="w-4 h-4 mr-1"/>{event.finalDiscountTier}% OFF</Badge>
                                <p className="text-xs text-muted-foreground">Deal Ended!</p>
                            </div>
                        </div>
                        <Button size="sm" onClick={() => handleCompletePurchase(event)} disabled={isCompletingPurchase === event.id}>
                           {isCompletingPurchase === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                           Complete Purchase
                        </Button>
                    </div>
                </div>
             );
        }
        
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Pledges</CardTitle>
                <CardDescription>Track your active and completed Forging Events.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     </div>
                ) : !pledges || pledges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        You have not pledged to any Forging Events yet.
                        <Button variant="link" asChild><Link href="/foundry">Explore active deals</Link></Button>
                    </p>
                ) : (
                    <div className="space-y-3">
                        {pledges.map(pledge => <PledgeItem key={pledge.id} pledge={pledge} />)}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function BuyerDashboardContent() {
    const { user, role } = useUser();
    const { toast } = useToast();
    const [copied, setCopied] = React.useState(false);
    
    React.useEffect(() => {
        if (user && role) {
          logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/buyer' } });
        }
    }, [user, role]);

    const firestore = useFirestore();
    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const referralLink = React.useMemo(() => {
        if (typeof window === 'undefined' || !userProfile?.tradintaId) return '';
        return `${window.location.origin}/signup?ref=${userProfile.tradintaId}`;
    }, [userProfile]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        toast({ title: 'Copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
    };
    
    // Only show the application if the user role is 'buyer'
    if (user && role !== 'buyer') {
      return null;
    }

    if (user && role === 'buyer') {
        return <ApplyToBecomeManufacturer />;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Tradinta Dashboard</CardTitle>
                    <CardDescription>Your central hub for trading, rewards, and insights.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Center Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Balances & Rewards Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">TradPay Balance</CardTitle>
                                <Wallet className="w-5 h-5 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">KES 12,450.00</div>
                                <p className="text-xs text-muted-foreground">Available for payments</p>
                            </CardContent>
                            <CardFooter>
                                <Button size="sm" variant="outline">Add Funds</Button>
                            </CardFooter>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">TradPoints</CardTitle>
                                <Sparkles className="w-5 h-5 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,850 Points</div>
                                <Progress value={85} className="mt-2 h-2" />
                            </CardContent>
                             <CardFooter>
                                <Button size="sm" variant="link" asChild className="p-0 h-auto">
                                    <Link href="/dashboards/buyer/tradpoints">View Details</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                        <Card className="bg-muted/50 border-dashed">
                            <CardHeader className="flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">$TRAD Balance</CardTitle>
                                <Coins className="w-5 h-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-muted-foreground">Coming Soon</div>
                                <p className="text-xs text-muted-foreground">TradPoints will be convertible to $TRAD</p>
                            </CardContent>
                        </Card>
                    </div>
                    {/* Quick Actions Panel */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <Link href={action.href} key={action.title}>
                                <Card className="text-center hover:bg-accent hover:shadow-md transition-all h-full flex flex-col justify-center items-center p-4">
                                    <div className="mb-2">{action.icon}</div>
                                    <p className="font-semibold text-sm">{action.title}</p>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    <MyPledges />

                </div>
                 {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    <ProfileCard />

                     {/* TradPoints Engagement Panel */}
                    <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Gift className="w-6 h-6"/> Earn More TradPoints!</CardTitle>
                            <CardDescription>Complete tasks and refer others to earn rewards that will convert to $TRAD tokens.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-background/50 rounded-lg p-4 mb-4">
                                <label htmlFor="referral-link" className="text-sm font-medium">Your Unique Referral Link</label>
                                {isProfileLoading ? <Skeleton className="h-9 w-full mt-1"/> : (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input id="referral-link" type="text" value={referralLink} readOnly className="flex-grow bg-muted border border-border rounded-md px-3 py-1.5 text-sm" />
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleCopy} disabled={!referralLink}>
                                            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">Share your link via WhatsApp, Email, or Social Media to earn 50 points for every verified signup!</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild>
                               <Link href="/dashboards/buyer/tradpoints">View All Tasks & Rewards <ArrowRight className="ml-2 w-4 h-4" /></Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function BuyerDashboard() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <BuyerDashboardContent />
        </React.Suspense>
    )
}
