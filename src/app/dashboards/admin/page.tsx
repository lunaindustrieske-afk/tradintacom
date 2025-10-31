
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Star, BarChart, LifeBuoy, Loader2, AlertTriangle, Package, Search, ListFilter, MoreHorizontal, Edit, Trash2, BarChart2, BookUser } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, doc, collectionGroup, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type Manufacturer = {
    id: string;
    shopName: string;
    email: string;
    industry?: string;
    registrationDate: any; // Firestore timestamp
    verificationStatus: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified' | 'Restricted' | 'Suspended';
    suspensionDetails?: {
        isSuspended: boolean;
    };
    rating?: number;
    sales?: number; // This would need to be calculated/stored
};


export default function AdminDashboard() {
    const firestore = useFirestore();
    const auth = useAuth();
    
    // --- State for Shop Management ---
    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
    
    const manufacturersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'manufacturers'));

        // Note: Firestore does not support inequality checks on different fields.
        // This means we can't easily filter by search term AND a status array here.
        // Filtering will be done client-side. A more scalable solution might use a search service like Algolia.
        return q;
    }, [firestore]);

    const { data: allManufacturers, isLoading: isLoadingManufacturers } = useCollection<Manufacturer>(manufacturersQuery);

    const filteredManufacturers = React.useMemo(() => {
        if (!allManufacturers) return [];
        return allManufacturers.filter(m => {
            const matchesSearch = searchTerm ? 
                m.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.email?.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            
            const matchesStatus = statusFilter.length > 0 ? 
                statusFilter.includes(m.verificationStatus) || (m.suspensionDetails?.isSuspended && statusFilter.includes('Suspended'))
                : true;

            return matchesSearch && matchesStatus;
        });
    }, [allManufacturers, searchTerm, statusFilter]);

    const pendingVerifications = React.useMemo(() => {
        if (!allManufacturers) return null;
        return allManufacturers.filter(m => ['Pending Legal', 'Pending Admin'].includes(m.verificationStatus));
    }, [allManufacturers]);

    const getStatusVariant = (status: Manufacturer['verificationStatus']) => {
        switch (status) {
            case 'Verified': return 'secondary';
            case 'Pending Admin':
            case 'Pending Legal': return 'default';
            case 'Suspended':
            case 'Restricted':
            case 'Action Required': return 'destructive';
            default: return 'outline';
        }
    };
    
    const toggleStatusFilter = (status: string) => {
        setStatusFilter(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
        );
    }
    
    const renderVerificationRows = () => {
        if (isLoadingManufacturers) {
            return Array.from({length: 2}).map((_, i) => (
                <TableRow key={`skel-ver-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-40" /></TableCell>
                </TableRow>
            ))
        }
        if (!pendingVerifications || pendingVerifications.length === 0) {
            return <TableRow><TableCell colSpan={4} className="text-center h-24">No pending verifications.</TableCell></TableRow>
        }
        return pendingVerifications.map((seller) => (
            <TableRow key={seller.id}>
                <TableCell className="font-medium">{seller.shopName}</TableCell>
                <TableCell>{seller.industry || 'N/A'}</TableCell>
                <TableCell>{new Date(seller.registrationDate?.seconds * 1000).toLocaleDateString()}</TableCell>
                <TableCell>
                    <Button size="sm" asChild>
                        <Link href={`/dashboards/admin/verifications/${seller.id}`}>
                            <UserCheck className="mr-2 h-4 w-4"/> Review Application
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ));
    }
    
    const renderShopManagementRows = () => {
        if (isLoadingManufacturers) {
            return Array.from({length: 5}).map((_, i) => (
                 <TableRow key={`skel-shop-${i}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                </TableRow>
            ))
        }
        if (!filteredManufacturers || filteredManufacturers.length === 0) {
            return <TableRow><TableCell colSpan={5} className="text-center h-24">No shops found with the current filters.</TableCell></TableRow>
        }
        return filteredManufacturers.map((seller) => (
            <TableRow key={seller.id}>
                <TableCell className="font-medium">{seller.shopName}</TableCell>
                <TableCell>{seller.email}</TableCell>
                <TableCell>
                    <Badge variant={getStatusVariant(seller.suspensionDetails?.isSuspended ? 'Suspended' : seller.verificationStatus)}>
                        {seller.suspensionDetails?.isSuspended ? 'Suspended' : seller.verificationStatus}
                    </Badge>
                </TableCell>
                <TableCell>{new Date(seller.registrationDate?.seconds * 1000).toLocaleDateString()}</TableCell>
                <TableCell>
                     <Button size="sm" asChild>
                        <Link href={`/dashboards/admin/shops/${seller.id}`}>
                            <BookUser className="mr-2 h-4 w-4"/> Manage Shop
                        </Link>
                    </Button>
                </TableCell>
            </TableRow>
        ))
    }

    return (
        <Tabs defaultValue="onboarding">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="onboarding">Onboarding Queue</TabsTrigger>
                <TabsTrigger value="shop-management">Shop Management</TabsTrigger>
                <TabsTrigger value="support-resources">Support Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="onboarding">
                <Card>
                    <CardHeader>
                        <CardTitle>Seller Onboarding Queue</CardTitle>
                        <CardDescription>Review and approve new manufacturers waiting to join Tradinta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Company Name</TableHead>
                                    <TableHead>Industry</TableHead>
                                    <TableHead>Application Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {renderVerificationRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="shop-management">
                 <Card>
                    <CardHeader>
                        <CardTitle>Shop Management</CardTitle>
                        <CardDescription>Search, filter, and manage all seller shops on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search by Shop Name, Email, or ID..." 
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span>Filter Status</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {['Verified', 'Suspended', 'Restricted', 'Pending Admin', 'Unsubmitted'].map(status => (
                                        <DropdownMenuCheckboxItem
                                            key={status}
                                            checked={statusFilter.includes(status)}
                                            onCheckedChange={() => toggleStatusFilter(status)}
                                        >
                                            {status}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Shop Name</TableHead>
                                    <TableHead>Contact Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Registration Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {renderShopManagementRows()}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="support-resources">
                <Card>
                    <CardHeader>
                        <CardTitle>Support Resources & Training</CardTitle>
                        <CardDescription>Manage help articles and training materials for sellers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Seller Handbook</p>
                                   <p className="text-sm text-muted-foreground">The complete guide to selling on Tradinta.</p>
                               </div>
                               <Button variant="outline" asChild><Link href="/dashboards/content-management">Manage Content</Link></Button>
                           </CardContent>
                        </Card>
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Video Tutorials</p>
                                   <p className="text-sm text-muted-foreground">Training videos for product uploads, marketing, and more.</p>
                               </div>
                                <Button variant="outline" asChild><Link href="/dashboards/content-management">Upload/Edit Videos</Link></Button>
                           </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

    