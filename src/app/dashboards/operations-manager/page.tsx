
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileWarning, CheckCircle, Clock, Users, Package, BarChart, AlertCircle, Handshake, Loader2, BookUser } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { collection, collectionGroup, query, where, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import React from 'react';

// Define types for our Firestore documents
type VerificationEntity = {
    id: string;
    shopName?: string; // For manufacturers
    companyName?: string; // For buyers
    verificationStatus?: string;
    registrationDate: any; // Firestore timestamp
};
type Order = {
    id: string;
    productName?: string;
    items?: {productName: string}[];
    status: string;
    totalAmount: number;
    buyerId: string; // To look up customer name
};
type Dispute = {
    id: string;
    orderId: string;
    buyerId: string;
    manufacturerId: string;
    reason: string;
    status: string;
};
type ActivityLog = {
    id: string;
    timestamp: any;
    userEmail: string;
    action: string;
    details: string;
}


export default function OperationsManagerDashboard() {
    const firestore = useFirestore();
    const auth = useAuth();

    // --- Data Fetching Hooks ---
    const pendingVerificationsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'manufacturers'), where('verificationStatus', '==', 'Pending Admin'));
    }, [firestore]);
    const { data: pendingVerifications, isLoading: isLoadingVerifications } = useCollection<VerificationEntity>(pendingVerificationsQuery);
    
    const recentOrdersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'), limit(10));
    }, [firestore]);
    const { data: recentOrders, isLoading: isLoadingOrders } = useCollection<Order>(recentOrdersQuery);


    const openDisputesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'disputes'), where('status', 'in', ['Open', 'Under Review']));
    }, [firestore]);
    const { data: openDisputes, isLoading: isLoadingDisputes } = useCollection<Dispute>(openDisputesQuery);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);
    const { data: users, isLoading: isLoadingUsers } = useCollection(usersQuery);
    
    const activityLogsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
    }, [firestore]);
    const { data: activityLogs, isLoading: isLoadingLogs } = useCollection<ActivityLog>(activityLogsQuery);

    // --- Render Helper Functions ---
    const renderSkeletonRows = (count: number, columns: number) => Array.from({length: count}).map((_, i) => (
        <TableRow key={`skel-${i}`}>
            {Array.from({length: columns}).map((_, j) => (
                 <TableCell key={`skel-cell-${j}`}><Skeleton className="h-5 w-full" /></TableCell>
            ))}
        </TableRow>
    ));

    const getOrderDescription = (order: Order) => {
        if (order.productName) return order.productName;
        if (order.items && order.items.length > 0) {
            const firstItem = order.items[0].productName;
            return order.items.length > 1 ? `${firstItem} + ${order.items.length - 1} more` : firstItem;
        }
        return 'Order Details';
    }


    return (
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="approvals">Approvals & Verification</TabsTrigger>
                <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
                <TabsTrigger value="activity">Activity Log</TabsTrigger>
                <TabsTrigger value="platform-health">Platform Health</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
                <Card>
                    <CardHeader>
                        <CardTitle>Operations Manager Dashboard</CardTitle>
                        <CardDescription>Manage the daily functioning of the marketplace and ensure smooth business processes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    {isLoadingUsers ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{users?.length || 0}</div>}
                                    <p className="text-xs text-muted-foreground">Across all roles</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    {isLoadingOrders ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{recentOrders?.filter(o => o.status === 'Pending Fulfillment').length || 0}</div>}
                                    <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    {isLoadingDisputes ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold text-destructive">{openDisputes?.length || 0}</div>}
                                    <p className="text-xs text-muted-foreground">Requiring mediation</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Platform Revenue (Today)</CardTitle>
                                    <BarChart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">KES 45,231</div>
                                    <p className="text-xs text-muted-foreground">from transaction fees</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                            <CardContent>
                               <Table>
                                 <TableHeader><TableRow><TableHead>Order ID</TableHead><TableHead>Description</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                                 <TableBody>
                                    {isLoadingOrders ? renderSkeletonRows(3, 5) : 
                                     !recentOrders || recentOrders.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No recent orders.</TableCell></TableRow>
                                     : recentOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.id.substring(0, 8)}...</TableCell>
                                            <TableCell>{getOrderDescription(order)}</TableCell>
                                            <TableCell>KES {order.totalAmount.toLocaleString()}</TableCell>
                                            <TableCell><Badge>{order.status}</Badge></TableCell>
                                            <TableCell><Button variant="outline" size="sm">View</Button></TableCell>
                                        </TableRow>
                                     ))}
                                 </TableBody>
                               </Table>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Approvals Tab */}
            <TabsContent value="approvals">
                <Card>
                    <CardHeader><CardTitle>Pending Verifications</CardTitle><CardDescription>Approve or reject new sellers and buyers waiting for platform access.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Entity Name</TableHead><TableHead>Type</TableHead><TableHead>Submission Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoadingVerifications ? renderSkeletonRows(2, 4) :
                                 !pendingVerifications || pendingVerifications.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No pending verifications.</TableCell></TableRow>
                                 : pendingVerifications.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.shopName || item.companyName}</TableCell>
                                        <TableCell>Manufacturer</TableCell>
                                        <TableCell>{new Date(item.registrationDate?.seconds * 1000).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Button asChild variant="outline" size="sm"><Link href={`/dashboards/admin/verifications/${item.id}`}>Review Documents</Link></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes">
                <Card>
                    <CardHeader><CardTitle>Open Disputes</CardTitle><CardDescription>Mediate and resolve conflicts between buyers and sellers.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Dispute ID</TableHead><TableHead>Order ID</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isLoadingDisputes ? renderSkeletonRows(1, 5) : 
                                 !openDisputes || openDisputes.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center">No open disputes.</TableCell></TableRow>
                                 : openDisputes.map((dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell>{dispute.id.substring(0, 10)}...</TableCell>
                                        <TableCell>{dispute.orderId}</TableCell>
                                        <TableCell>{dispute.reason}</TableCell>
                                        <TableCell><Badge variant="outline">{dispute.status}</Badge></TableCell>
                                        <TableCell><Button size="sm">Review Case</Button></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
             {/* Activity Log Tab */}
            <TabsContent value="activity">
                <Card>
                    <CardHeader><CardTitle>Admin Activity Log</CardTitle><CardDescription>A log of all significant administrative actions for auditing purposes.</CardDescription></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Admin User</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead className="w-[40%]">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingLogs ? renderSkeletonRows(5, 4) :
                                 !activityLogs || activityLogs.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center">No activity recorded yet.</TableCell></TableRow>
                                 : activityLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground">{new Date(log.timestamp?.seconds * 1000).toLocaleString()}</TableCell>
                                        <TableCell>{log.userEmail}</TableCell>
                                        <TableCell><Badge variant="secondary">{log.action}</Badge></TableCell>
                                        <TableCell>{log.details}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

             {/* Platform Health Tab */}
            <TabsContent value="platform-health">
                <Card>
                    <CardHeader><CardTitle>Platform Health & Monitoring</CardTitle><CardDescription>Overview of system status and performance metrics.</CardDescription></CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <Card className="flex items-center p-4"><CheckCircle className="h-8 w-8 text-green-500 mr-4"/><div><p className="font-bold">API Status</p><p className="text-sm text-green-500">All Systems Operational</p></div></Card>
                        <Card className="flex items-center p-4"><Clock className="h-8 w-8 text-muted-foreground mr-4"/><div><p className="font-bold">Average Response Time</p><p className="text-sm">120ms</p></div></Card>
                        <Card className="flex items-center p-4"><FileWarning className="h-8 w-8 text-yellow-500 mr-4"/><div><p className="font-bold">Error Rate</p><p className="text-sm">0.05%</p></div></Card>
                        <Card className="flex items-center p-4"><Handshake className="h-8 w-8 text-blue-500 mr-4"/><div><p className="font-bold">Payment Gateway</p><p className="text-sm text-green-500">Connected</p></div></Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
