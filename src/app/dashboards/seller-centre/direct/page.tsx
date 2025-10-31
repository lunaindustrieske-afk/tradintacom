'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ShoppingBag, ListFilter, Search, Loader2, DollarSign, Package, Handshake } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import { Combobox } from '@/components/ui/combobox';
import { useLocalStorageState } from '@/hooks/use-local-storage-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  tradintaDirectStatus: 'pending_setup' | 'live' | 'paused';
  variants: { retailPrice?: number; price: number; stock: number; b2cStock?: number; }[];
};

type OrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
};

type B2COrder = {
    id: string;
    totalAmount: number;
    status: string;
    items: OrderItem[];
    orderDate: any;
};

type Partner = {
  id: string;
  fullName: string;
};

const MetricCard = ({ title, value, description, icon, isLoading }: { title: string, value: string | number, description: string, icon: React.ReactNode, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </CardHeader>
        <CardContent>
             {isLoading ? <Skeleton className="h-7 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const CreatePromoDialog = ({ onPromoCreated }: { onPromoCreated: () => void }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [assignedPartner, setAssignedPartner] = React.useState('');
    const [myNetwork] = useLocalStorageState<Partner[]>('my-partner-network', []);
    
    const partnerOptions = myNetwork.map(p => ({ value: p.id, label: p.fullName }));

    const handleCreatePromo = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!user || !firestore) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const promoCode = formData.get('promoCode') as string;
        const discountType = formData.get('discountType') as string;
        const discountValue = Number(formData.get('discountValue'));
        const expiresAt = formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : null;

        if (!name || !promoCode || !discountType || isNaN(discountValue)) {
            toast({ title: "Please fill all required fields.", variant: "destructive"});
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'manufacturers', user.uid, 'marketingCampaigns'), {
                id: nanoid(),
                name,
                type: 'B2C_DIRECT',
                promoCode,
                discountType,
                discountValue,
                status: 'active',
                expiresAt,
                assignedPartnerId: assignedPartner || null,
                usageCount: 0,
            });
            toast({ title: "Promotion created!", description: `The promo code ${promoCode} is now active.` });
            onPromoCreated();
            setOpen(false);
        } catch (error: any) {
            toast({ title: "Error creating promotion", description: error.message, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> New Promotion</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New B2C Promotion</DialogTitle>
                    <DialogDescription>Create a discount code for your Tradinta Direct products.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePromo}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label htmlFor="name">Campaign Name</Label><Input id="name" name="name" placeholder="e.g., Holiday Sale 2024" required /></div>
                        <div className="grid gap-2"><Label htmlFor="promoCode">Promo Code</Label><Input id="promoCode" name="promoCode" placeholder="e.g., SAVE15" required /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="discountType">Discount Type</Label>
                                <Select name="discountType" defaultValue="percentage"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (KES)</SelectItem></SelectContent></Select>
                            </div>
                             <div className="grid gap-2"><Label htmlFor="discountValue">Value</Label><Input id="discountValue" name="discountValue" type="number" placeholder="e.g., 15" required /></div>
                        </div>
                        <div className="grid gap-2"><Label htmlFor="expiresAt">Expires On (Optional)</Label><Input id="expiresAt" name="expiresAt" type="date" /></div>
                        <div className="grid gap-2">
                            <Label>Assign to Growth Partner (Optional)</Label>
                            <Combobox options={partnerOptions} value={assignedPartner} onValueChange={setAssignedPartner} placeholder="Select a partner from your network..." emptyMessage="No partners in your network." />
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                            Create Promotion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default function TradintaDirectDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();

  // --- Product Data ---
  const productsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(firestore, 'manufacturers', user.uid, 'products'),
      where('listOnTradintaDirect', '==', true)
    );
  }, [firestore, user]);
  const { data: products, isLoading: isLoadingProducts } = useCollection<Product>(productsQuery);

  // --- Promotions Data ---
  const promosQuery = useMemoFirebase(() => {
      if (!user?.uid) return null;
      return query(collection(firestore, 'manufacturers', user.uid, 'marketingCampaigns'), where('type', '==', 'B2C_DIRECT'));
  }, [firestore, user]);
  const { data: promotions, isLoading: isLoadingPromos, forceRefetch: refetchPromos } = useCollection(promosQuery);
  
  // --- B2C Order Data ---
  const b2cOrdersQuery = useMemoFirebase(() => {
      if (!user?.uid) return null;
      return query(collection(firestore, 'orders'), where('isTradintaDirect', '==', true), where('items', 'array-contains', { shopId: user.uid }));
  }, [firestore, user]);
  // NOTE: The above query is a placeholder. Firestore can't query inside an array of objects like this efficiently.
  // A real implementation would require denormalizing sellerId to the top level of the order document,
  // or using a backend/cloud function to aggregate this data.
  // For now, we will fetch all B2C orders and filter on the client.
   const allB2cOrdersQuery = useMemoFirebase(() => {
    if(!firestore) return null;
    return query(collection(firestore, 'orders'), where('isTradintaDirect', '==', true))
   }, [firestore]);
   const { data: allB2cOrders, isLoading: isLoadingOrders } = useCollection<B2COrder>(allB2cOrdersQuery);

   const myB2cOrders = React.useMemo(() => {
        if (!allB2cOrders || !user) return [];
        return allB2cOrders.filter(order => order.items.some(item => item.shopId === user.uid));
   }, [allB2cOrders, user]);


  // --- Memoized Calculations ---
  const { pendingProducts, liveProducts } = React.useMemo(() => ({
    pendingProducts: products?.filter(p => p.tradintaDirectStatus === 'pending_setup') || [],
    liveProducts: products?.filter(p => p.tradintaDirectStatus === 'live') || [],
  }), [products]);
  
  const analytics = React.useMemo(() => {
      const totalSales = myB2cOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const unitsSold = myB2cOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
      
      const productSales: Record<string, number> = {};
      myB2cOrders.forEach(order => {
          order.items.forEach(item => {
              productSales[item.productName] = (productSales[item.productName] || 0) + item.quantity;
          });
      });
      
      const topProduct = Object.entries(productSales).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return { totalSales, unitsSold, topProduct };
  }, [myB2cOrders]);

  const isLoading = isLoadingProducts || isLoadingPromos || isLoadingOrders;

  const renderTableRows = (productData: Product[], isPending: boolean) => {
    if (isLoadingProducts) {
      return Array.from({ length: 2 }).map((_, i) => (
        <TableRow key={`skl-${i}`}>
          <TableCell className="hidden sm:table-cell"><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-6 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
          <TableCell><Skeleton className="h-9 w-28" /></TableCell>
        </TableRow>
      ));
    }

    if (productData.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={5} className="h-24 text-center">
            No products in this category.
          </TableCell>
        </TableRow>
      );
    }

    return productData.map((product) => (
      <TableRow key={product.id}>
        <TableCell className="hidden sm:table-cell">
          <Image
            alt={product.name}
            className="aspect-square rounded-md object-cover"
            height="64"
            src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
            width="64"
          />
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>
            {isPending 
                ? `B2B: KES ${product.variants?.[0]?.price?.toLocaleString() || 'N/A'}`
                : `KES ${product.variants?.[0]?.retailPrice?.toLocaleString() || 'N/A'}`
            }
        </TableCell>
        <TableCell>
            {isPending
                ? product.variants?.[0]?.stock || 0
                : product.variants?.[0]?.b2cStock || 0
            }
        </TableCell>
        <TableCell>
          <Button asChild variant={isPending ? 'default' : 'outline'}>
            <Link href={`/dashboards/seller-centre/direct/setup/${product.id}`}>
              {isPending ? 'Complete Setup' : 'Manage'}
            </Link>
          </Button>
        </TableCell>
      </TableRow>
    ));
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" /> Tradinta Direct
            Management
          </CardTitle>
          <CardDescription>
            Manage your direct-to-consumer product listings, pricing, and
            inventory.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pending">Pending Setup ({pendingProducts.length})</TabsTrigger>
            <TabsTrigger value="live">Live Products ({liveProducts.length})</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>
         <TabsContent value="overview">
            <Card>
                <CardHeader>
                    <CardTitle>B2C Performance</CardTitle>
                    <CardDescription>A snapshot of your sales on Tradinta Direct.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <MetricCard title="Direct Sales (All Time)" value={`KES ${analytics.totalSales.toLocaleString()}`} description="Total revenue from B2C sales" icon={<DollarSign />} isLoading={isLoading}/>
                    <MetricCard title="Units Sold (All Time)" value={analytics.unitsSold} description="Total items sold directly to consumers" icon={<Package />} isLoading={isLoading}/>
                    <MetricCard title="Top B2C Product" value={analytics.topProduct} description="Your best-selling item" icon={<Handshake />} isLoading={isLoading}/>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="pending">
            <Card>
                <CardHeader>
                    <CardTitle>Pending B2C Setup</CardTitle>
                    <CardDescription>These products are marked for Tradinta Direct but require B2C pricing and inventory setup before they go live.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Base B2B Price</TableHead>
                                <TableHead>Total Stock</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderTableRows(pendingProducts, true)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="live">
             <Card>
                <CardHeader>
                    <CardTitle>Live B2C Products</CardTitle>
                    <CardDescription>These products are currently active on the Tradinta Direct storefront.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Retail Price</TableHead>
                                <TableHead>B2C Stock</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {renderTableRows(liveProducts, false)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="marketing">
             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Promotions & Campaigns</CardTitle>
                            <CardDescription>Create discount codes and track their performance.</CardDescription>
                        </div>
                        <CreatePromoDialog onPromoCreated={refetchPromos} />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign Name</TableHead>
                                <TableHead>Promo Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Partner</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingPromos ? <TableRow><TableCell colSpan={6}><Loader2 className="animate-spin mx-auto"/></TableCell></TableRow> 
                            : promotions && promotions.length > 0 ? promotions.map((p: any) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell><Badge variant="outline">{p.promoCode}</Badge></TableCell>
                                    <TableCell>{p.discountType === 'percentage' ? `${p.discountValue}%` : `KES ${p.discountValue}`}</TableCell>
                                    <TableCell><Badge>{p.status}</Badge></TableCell>
                                    <TableCell>{p.usageCount || 0}</TableCell>
                                    <TableCell>{p.assignedPartnerId ? <Handshake className="w-4 h-4"/> : 'N/A'}</TableCell>
                                </TableRow>
                            ))
                            : <TableRow><TableCell colSpan={6} className="h-24 text-center">No promotions created yet.</TableCell></TableRow>
                            }
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
