
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Eye, ShoppingCart, Truck, CheckCircle, Clock, ListFilter, MoreHorizontal, Package } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, limit, getDocs, collectionGroup } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import Image from 'next/image';

type Order = {
    id: string;
    buyerName: string;
    totalAmount: number;
    status: string;
    orderDate: any; // Firestore timestamp
};

type Product = {
  id: string;
  name: string;
  imageUrl?: string;
  variants: { retailPrice?: number; b2cStock?: number; }[];
  manufacturerId: string;
  manufacturerName?: string;
  slug: string;
};

// --- Orders Tab Component ---
const OrdersTab = () => {
    const firestore = useFirestore();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchedOrder, setSearchedOrder] = React.useState<Order | null>(null);
    const [isSearching, setIsSearching] = React.useState(false);

    const recentOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'orders'),
            where('isTradintaDirect', '==', true),
            orderBy('orderDate', 'desc'),
            limit(20)
        );
    }, [firestore]);

    const { data: recentOrders, isLoading: isLoadingRecent } = useCollection<Order>(recentOrdersQuery);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !searchQuery.trim()) {
            setSearchedOrder(null);
            return;
        }
        setIsSearching(true);
        setSearchedOrder(null);
        try {
            const orderRef = doc(firestore, 'orders', searchQuery.trim());
            const docSnap = await getDoc(orderRef);

            if (!docSnap.exists() || !docSnap.data().isTradintaDirect) {
                setSearchedOrder(null);
            } else {
                setSearchedOrder({ id: docSnap.id, ...docSnap.data() } as Order);
            }
        } catch (error) {
            console.error('Error searching order: ', error);
        } finally {
            setIsSearching(false);
        }
    };
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Delivered': return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>{status}</Badge>;
            case 'Processing':
            case 'Shipped': return <Badge><Truck className="mr-1 h-3 w-3"/>{status}</Badge>;
            case 'Pending Payment': return <Badge variant="outline"><Clock className="mr-1 h-3 w-3"/>{status}</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const renderTableRows = (orders: Order[] | null, isLoading: boolean) => {
        if (isLoading) {
            return Array.from({length: 5}).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-28" /></TableCell>
                </TableRow>
            ));
        }
        if (!orders || orders.length === 0) {
            return <TableRow><TableCell colSpan={5} className="h-24 text-center">No orders found.</TableCell></TableRow>;
        }
        return orders.map(order => (
            <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id}</TableCell>
                <TableCell>{order.buyerName}</TableCell>
                <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboards/tradinta-direct-admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4"/> View Order</Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    };
    
    return (
         <Card>
            <CardHeader>
                <CardTitle>Order Fulfillment Queue</CardTitle>
                <CardDescription>
                    {searchedOrder ? 'Showing search result. Clear search to see all recent orders.' : 'Showing the 20 most recent B2C orders.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4 max-w-md">
                    <Input placeholder="Search by Order ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    <Button type="submit" disabled={isSearching}>
                        {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Buyer Name</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {renderTableRows(searchedOrder ? [searchedOrder] : recentOrders, isLoadingRecent)}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

// --- Products Tab Component ---
const ProductsTab = () => {
    const firestore = useFirestore();
    const [productSearch, setProductSearch] = React.useState('');
    const [stockFilter, setStockFilter] = React.useState<'all'|'inStock'|'outOfStock'>('all');

    const productsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collectionGroup(firestore, 'products'),
            where('tradintaDirectStatus', '==', 'live')
        );
    }, [firestore]);

    const { data: allProducts, isLoading } = useCollection<Product>(productsQuery);

    const filteredProducts = React.useMemo(() => {
        if (!allProducts) return [];
        return allProducts.filter(p => {
            const matchesSearch = productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) : true;
            
            const totalB2cStock = p.variants?.reduce((sum, v) => sum + (v.b2cStock || 0), 0);
            let matchesStock = true;
            if (stockFilter === 'inStock') matchesStock = totalB2cStock > 0;
            if (stockFilter === 'outOfStock') matchesStock = totalB2cStock === 0;

            return matchesSearch && matchesStock;
        });
    }, [allProducts, productSearch, stockFilter]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>B2C Product Catalog</CardTitle>
                <CardDescription>View and manage all products currently live on Tradinta Direct.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by product name..." 
                            className="pl-8"
                            value={productSearch}
                            onChange={e => setProductSearch(e.target.value)}
                        />
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-1">
                            <ListFilter className="h-3.5 w-3.5" />
                            <span>Filter Stock</span>
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Filter by stock</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             <DropdownMenuCheckboxItem checked={stockFilter === 'all'} onCheckedChange={() => setStockFilter('all')}>All</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={stockFilter === 'inStock'} onCheckedChange={() => setStockFilter('inStock')}>In Stock</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem checked={stockFilter === 'outOfStock'} onCheckedChange={() => setStockFilter('outOfStock')}>Out of Stock</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px] hidden sm:table-cell"></TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Seller</TableHead>
                            <TableHead>Retail Price</TableHead>
                            <TableHead>B2C Stock</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? Array.from({length: 4}).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-12 w-12" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                            </TableRow>
                        )) : filteredProducts.map(p => {
                            const variant = p.variants?.[0];
                            return (
                                <TableRow key={p.id}>
                                    <TableCell className="hidden sm:table-cell">
                                         <Image
                                            alt={p.name}
                                            className="aspect-square rounded-md object-cover"
                                            height="64"
                                            src={p.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                                            width="64"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{p.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{p.manufacturerName || p.manufacturerId}</TableCell>
                                    <TableCell>KES {variant?.retailPrice?.toLocaleString() || 'N/A'}</TableCell>
                                    <TableCell>{variant?.b2cStock || 0}</TableCell>
                                    <TableCell>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/products/${p.manufacturerId}/${p.slug}`} target="_blank">View on Storefront</Link>
                                                </DropdownMenuItem>
                                                {/* Add Pause/Delist actions here in the future */}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function TradintaDirectAdminDashboard() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-primary" />
                        Tradinta Direct Admin
                    </CardTitle>
                    <CardDescription>
                        Manage and track all direct-to-consumer orders and products fulfilled by Tradinta.
                    </CardDescription>
                </CardHeader>
            </Card>
            <Tabs defaultValue="orders">
                 <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="products">Products & Inventory</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="mt-4">
                    <OrdersTab />
                </TabsContent>
                 <TabsContent value="products" className="mt-4">
                    <ProductsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
