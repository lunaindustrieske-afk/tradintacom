
'use client';

import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Ticket, LifeBuoy, AlertTriangle, Loader2 } from "lucide-react";

const supportTickets = [
    { id: 'TKT-001', subject: 'Payment Failed', user: 'BuyerCo', priority: 'High', status: 'Open', lastUpdate: '5m ago' },
    { id: 'TKT-002', subject: 'Cannot upload product images', user: 'SellerShop1', priority: 'Medium', status: 'Open', lastUpdate: '1hr ago' },
    { id: 'TKT-003', subject: 'Question about fees', user: 'NewSeller Inc.', priority: 'Low', status: 'Pending', lastUpdate: '3hr ago' },
];

const disputes = [
    { id: 'DSP-001', orderId: 'ORD-003', parties: 'PlastiCo vs BuyerX', reason: 'Late delivery', status: 'Under Review' },
    { id: 'DSP-002', orderId: 'ORD-005', parties: 'PrintPack vs BuyerY', reason: 'Damaged goods', status: 'Awaiting User Response' },
];

function SupportDashboardContent() {
    return (
        <Tabs defaultValue="tickets">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                <TabsTrigger value="disputes">Dispute Resolution</TabsTrigger>
                <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Support Tickets</CardTitle>
                        <CardDescription>Manage and respond to user queries and technical issues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Update</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {supportTickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">{ticket.id}</TableCell>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell>{ticket.user}</TableCell>
                                        <TableCell><Badge variant={ticket.priority === 'High' ? 'destructive' : 'default'}>{ticket.priority}</Badge></TableCell>
                                        <TableCell><Badge variant="outline">{ticket.status}</Badge></TableCell>
                                        <TableCell>{ticket.lastUpdate}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm">View & Respond</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="disputes">
                <Card>
                    <CardHeader>
                        <CardTitle>Active Disputes</CardTitle>
                        <CardDescription>Mediate and resolve formal disputes between buyers and sellers.</CardDescription>
                    </CardHeader>                    
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Dispute ID</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Involved Parties</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {disputes.map((dispute) => (
                                    <TableRow key={dispute.id}>
                                        <TableCell className="font-medium">{dispute.id}</TableCell>
                                        <TableCell>{dispute.orderId}</TableCell>
                                        <TableCell>{dispute.parties}</TableCell>
                                        <TableCell>{dispute.reason}</TableCell>
                                        <TableCell><Badge variant="destructive">{dispute.status}</Badge></TableCell>
                                        <TableCell>
                                            <Button size="sm"><AlertTriangle className="mr-2 h-4 w-4"/>Mediate</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="knowledge-base">
                 <Card>
                    <CardHeader>
                        <CardTitle>Knowledge Base Management</CardTitle>
                        <CardDescription>Create and edit help articles for the support center.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
                           <LifeBuoy className="h-16 w-16 text-muted-foreground" />
                           <p className="ml-4 text-muted-foreground">Knowledge Base Editor Here</p>
                       </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}


export default function SupportDashboard() {
    return (
        <React.Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SupportDashboardContent />
        </React.Suspense>
    )
}
