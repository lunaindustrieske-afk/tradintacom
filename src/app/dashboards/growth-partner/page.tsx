
'use client';

import * as React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Link as LinkIcon,
  Users,
  DollarSign,
  Loader2,
  Wallet,
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Sparkles,
  UserPlus,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, where, doc, updateDoc, serverTimestamp, orderBy, getCountFromServer } from 'firebase/firestore';
import { logFeatureUsage } from '@/lib/analytics';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type UserProfile = {
  id: string;
  tradintaId?: string;
  fullName: string;
  photoURL?: string;
  bio?: string;
};

type PartnerEarning = {
    totalEarnings: number;
    unpaidEarnings: number;
    paidEarnings: number;
}

type AttributedSale = {
    id: string;
    campaignId: string;
    productName: string; 
    saleAmount: number;
    commissionEarned: number;
    date: any;
    payoutStatus: 'Unpaid' | 'Paid';
}

type ForgingEvent = {
  id: string;
  productName: string;
  sellerName: string;
  sellerId: string;
  commissionRate: number;
  status: 'proposed' | 'active' | 'finished' | 'declined';
  tiers: { buyers: number; discount: number }[];
};

type Payout = {
    id: string;
    date: any;
    amount: number;
    transactionId: string;
};

export default function GrowthPartnerDashboard() {
  const { user, isUserLoading, role } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedCampaignLink, setCopiedCampaignLink] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user && role) {
      logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/growth-partner' } });
    }
  }, [user, role]);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  // --- Data Fetching ---
  const earningsDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'partnerEarnings', user.uid);
  }, [user, firestore]);
  const { data: earnings, isLoading: isLoadingEarnings } = useDoc<PartnerEarning>(earningsDocRef);

  const clicksQuery = useMemoFirebase(() => {
      if(!firestore || !userProfile?.tradintaId) return null;
      return query(collection(firestore, 'linkClicks'), where('referrerId', '==', userProfile.tradintaId))
  }, [firestore, userProfile]);
  const { data: linkClicks, isLoading: isLoadingClicks } = useCollection(clicksQuery);
  
  const signupsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.tradintaId) return null;
    return query(collection(firestore, 'users'), where('referredBy', '==', userProfile.tradintaId));
  }, [firestore, userProfile]);
  const { data: signups, isLoading: isLoadingSignups } = useCollection(signupsQuery);
  
  const [followerCount, setFollowerCount] = React.useState(0);
  const [isLoadingFollowers, setIsLoadingFollowers] = React.useState(true);
  
  React.useEffect(() => {
      if (user && firestore) {
          const countFollowers = async () => {
              setIsLoadingFollowers(true);
              const followersCol = collection(firestore, `users/${user.uid}/followers`);
              const snapshot = await getCountFromServer(followersCol);
              setFollowerCount(snapshot.data().count);
              setIsLoadingFollowers(false);
          }
          countFollowers();
      }
  }, [user, firestore]);
  
  const forgingEventsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'forgingEvents'), where('partnerId', '==', user.uid), orderBy('status', 'asc'));
  }, [user, firestore]);
  const { data: forgingEvents, isLoading: isLoadingEvents } = useCollection<ForgingEvent>(forgingEventsQuery);

  const salesQuery = useMemoFirebase(() => {
      if(!user?.uid || !firestore) return null;
      return query(collection(firestore, 'attributedSales'), where('partnerId', '==', user.uid), orderBy('date', 'desc'));
  }, [user, firestore]);
  const { data: sales, isLoading: isLoadingSales } = useCollection<AttributedSale>(salesQuery);
  
  const payoutsQuery = useMemoFirebase(() => {
    if (!user?.uid || !firestore) return null;
    return query(collection(firestore, 'payouts'), where('partnerId', '==', user.uid), orderBy('date', 'desc'));
  }, [user, firestore]);
  const { data: payouts, isLoading: isLoadingPayouts } = useCollection<Payout>(payoutsQuery);

  // --- Handlers ---
  const handleProposal = (eventId: string, status: 'active' | 'declined') => {
      if(!firestore) return;
      const eventRef = doc(firestore, 'forgingEvents', eventId);
      updateDocumentNonBlocking(eventRef, { status: status, respondedAt: serverTimestamp() });
      toast({
          title: `Proposal ${status === 'active' ? 'Accepted' : 'Declined'}!`,
          description: `The seller has been notified.`
      });
  };

  const referralLink = React.useMemo(() => {
    if (typeof window === 'undefined' || !userProfile?.tradintaId) return '';
    const baseUrl = window.location.origin;
    const targetUrl = encodeURIComponent('/signup');
    return `${baseUrl}/api/track?url=${targetUrl}&ref=${userProfile?.tradintaId}`;
  }, [userProfile]);

  const copyToClipboard = (link: string, type: 'general' | 'campaign', id?: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied to Clipboard!',
      description: 'Your referral link has been copied.',
    });
    if (type === 'general') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    } else {
        setCopiedCampaignLink(id || null);
        setTimeout(() => setCopiedCampaignLink(null), 2000);
    }
  };
  
  const MetricCard = ({ title, value, icon, loading, children }: {title: string, value: string, icon: React.ReactNode, loading: boolean, children?: React.ReactNode}) => (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
            {loading ? <Skeleton className="h-7 w-24"/> : <div className="text-2xl font-bold">{value}</div>}
            {children}
        </CardContent>
    </Card>
  );

  const isLoading = isUserLoading || isProfileLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Growth Partner Dashboard</CardTitle>
          <CardDescription>Track your impact, manage campaigns, and view your earnings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="referral-link" className="font-semibold">Your Sign-up Referral Link</Label>
          <div className="flex gap-2 mt-1">
            <Input id="referral-link" value={referralLink} readOnly />
            <Button size="icon" onClick={() => copyToClipboard(referralLink, 'general')} aria-label="Copy referral link" disabled={!referralLink}>
              {copiedLink ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this link to get credit for new user sign-ups.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Link Clicks" value={(linkClicks?.length || 0).toLocaleString()} icon={<LinkIcon />} loading={isLoadingClicks}>
           <p className="text-xs text-muted-foreground">Total clicks on your links</p>
        </MetricCard>
        <MetricCard title="Sign-ups" value={(signups?.length || 0).toLocaleString()} icon={<Users />} loading={isLoadingSignups}>
             <Button asChild variant="link" className="p-0 h-auto text-xs">
                <Link href="/dashboards/buyer/tradpoints" className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary" /> View points earned <ArrowRight className="w-3 h-3" />
                </Link>
            </Button>
        </MetricCard>
        <MetricCard title="Total Attributed Sales" value={`KES ${(sales?.reduce((sum, s) => sum + s.saleAmount, 0) || 0).toLocaleString()}`} icon={<DollarSign />} loading={isLoadingSales}>
             <p className="text-xs text-muted-foreground">Value of orders you've influenced</p>
        </MetricCard>
        <Card className="bg-primary/10 border-primary/20">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unpaid Earnings</CardTitle>
                <Wallet className="h-4 w-4 text-primary" />
             </CardHeader>
             <CardContent>
                 {isLoadingEarnings ? <Skeleton className="h-7 w-24"/> : <div className="text-2xl font-bold text-primary">KES {(earnings?.unpaidEarnings || 0).toLocaleString()}</div>}
                 <p className="text-xs text-muted-foreground">Awaiting next payout cycle</p>
            </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deal-hub" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="deal-hub">Deal Hub</TabsTrigger>
          <TabsTrigger value="sales">Attributed Sales</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
          <TabsTrigger value="my-network">My Network</TabsTrigger>
        </TabsList>

        <TabsContent value="deal-hub">
          <Card>
            <CardHeader><CardTitle className='flex items-center gap-2'><Sparkles className="w-5 h-5 text-primary"/>Deal Hub</CardTitle><CardDescription>Review proposals from sellers and manage your active Forging Events.</CardDescription></CardHeader>
            <CardContent>
                {isLoadingEvents ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                : !forgingEvents || forgingEvents.length === 0 ? <p className="text-center text-muted-foreground py-8">No deal proposals yet.</p>
                : <div className="space-y-4">
                    {forgingEvents.map((event) => {
                         const campaignLink = typeof window !== 'undefined' ? `${window.location.origin}/foundry/${event.id}` : '';
                        return(
                            <Card key={event.id} className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-grow space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={event.status === 'active' ? 'default' : 'outline'}>{event.status}</Badge>
                                            <p className="font-semibold text-sm">{event.productName}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            From <Link href={`/manufacturer/${event.sellerId}`} className="hover:underline font-medium text-foreground">{event.sellerName}</Link> | Commission: <span className="font-bold">{event.commissionRate}%</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                         {event.status === 'proposed' && (
                                            <>
                                                <Button size="sm" variant="secondary" onClick={() => handleProposal(event.id, 'active')}><CheckCircle className="mr-2 h-4 w-4"/> Accept</Button>
                                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleProposal(event.id, 'declined')}><XCircle className="mr-2 h-4 w-4"/> Decline</Button>
                                            </>
                                        )}
                                        {event.status === 'active' && (
                                             <Button size="sm" variant="outline" onClick={() => copyToClipboard(campaignLink, 'campaign', event.id)} disabled={!userProfile?.tradintaId}>
                                                {copiedCampaignLink === event.id ? <ClipboardCheck className="mr-2 h-4 w-4 text-green-500"/> : <LinkIcon className="mr-2 h-4 w-4" />}
                                                {copiedCampaignLink === event.id ? 'Copied!' : 'Copy Link'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                  </div>
                }
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sales">
            <Card>
                <CardHeader><CardTitle>Attributed Sales</CardTitle><CardDescription>Sales from users who used your links.</CardDescription></CardHeader>
                <CardContent>
                    {isLoadingSales ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    : !sales || sales.length === 0 ? <p className="text-center text-muted-foreground py-8">No attributed sales yet.</p>
                    : <div className="space-y-3">
                        {sales.map(sale => (
                            <Card key={sale.id} className="p-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
                                    <div className="md:col-span-2">
                                        <p className="font-semibold text-sm truncate">{sale.productName || 'Product from Order'}</p>
                                        <p className="text-xs text-muted-foreground">Sale: KES {sale.saleAmount.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-primary font-bold text-sm">KES {sale.commissionEarned.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Your Commission</p>
                                    </div>
                                    <div className="flex justify-end">
                                        <Badge variant={sale.payoutStatus === 'Paid' ? 'secondary' : 'default'}>{sale.payoutStatus}</Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    }
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="payouts">
            <Card>
                 <CardHeader><CardTitle>Payout History</CardTitle><CardDescription>Record of commissions paid out to you.</CardDescription></CardHeader>
                 <CardContent>
                    {isLoadingPayouts ? <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    : !payouts || payouts.length === 0 ? <p className="text-center text-sm text-muted-foreground py-12">No payout history yet.</p>
                    : <div className="space-y-3">
                         {payouts.map(payout => (
                            <Card key={payout.id} className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-600">KES {payout.amount.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Paid on {new Date(payout.date?.seconds * 1000).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs font-mono text-muted-foreground">Txn: {payout.transactionId}</p>
                                </div>
                            </Card>
                         ))}
                    </div>
                    }
                 </CardContent>
            </Card>
        </TabsContent>

         <TabsContent value="my-network">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>My Network</CardTitle>
                            <CardDescription>Your influence and public profile on Tradinta.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboards/growth-partner/profile"><Settings className="h-5 w-5" /></Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <MetricCard title="Total Followers" value={followerCount.toLocaleString()} icon={<Users />} loading={isLoadingFollowers} >
                         <p className="text-xs text-muted-foreground">Sellers and buyers following you</p>
                     </MetricCard>
                     {userProfile?.tradintaId && (
                        <Button asChild className="w-full">
                            <Link href={`/partner/${userProfile.tradintaId}`}>View My Public Profile</Link>
                        </Button>
                     )}
                </CardContent>
            </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
