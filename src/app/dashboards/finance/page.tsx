
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, ShieldCheck, FileWarning, Landmark, Banknote, Users, Activity, TrendingUp } from "lucide-react";
import { Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, ComposedChart } from 'recharts';

const transactions = [
    { id: 'TXN001', type: 'Payout', amount: 50000, user: 'SellerShop1', status: 'Completed', date: '2023-11-15' },
    { id: 'TXN002', type: 'Payment', amount: 110000, user: 'BuyerCo', status: 'In Escrow', date: '2023-11-14' },
    { id: 'TXN003', type: 'Withdrawal', amount: 250000, user: 'DistributorX', status: 'Pending Approval', date: '2023-11-14' },
    { id: 'TXN004', type: 'Ad Payment', amount: 15000, user: 'Constructa Ltd', status: 'Completed', date: '2023-11-13' },
    { id: 'TXN005', type: 'Commission', amount: 5200, user: 'John Doe (Amb.)', status: 'Paid', date: '2023-11-12' },

];

const kycVerifications = [
    { id: 'KYC004', user: 'NewSeller Inc.', status: 'Pending', submitted: '2023-11-13' },
    { id: 'KYC005', user: 'BulkBuyer Ltd.', status: 'Action Required', submitted: '2023-11-12' },
];

const revenueData = [
  { name: 'Jan', revenue: 240000 },
  { name: 'Feb', revenue: 310000 },
  { name: 'Mar', revenue: 450000 },
  { name: 'Apr', revenue: 420000 },
  { name: 'May', revenue: 580000 },
  { name: 'Jun', revenue: 620000 },
];

export default function FinanceDashboard() {
    return (
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="transactions">Transaction Monitoring</TabsTrigger>
                <TabsTrigger value="kyc">KYC & Compliance</TabsTrigger>
                <TabsTrigger value="reporting">Reporting</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
                <Card>
                    <CardHeader>
                        <CardTitle>TradPay Control & Ledger</CardTitle>
                        <CardDescription>Manage all financial operations within the Tradinta ecosystem.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Wallet Balances</CardTitle>
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">KES 13.8M</div>
                                    <p className="text-xs text-muted-foreground">+5% from last week</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Platform Revenue (30d)</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">KES 1.27M</div>
                                    <p className="text-xs text-muted-foreground">+12.1% from last month</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Payouts Pending</CardTitle>
                                    <Landmark className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-destructive">42</div>
                                    <p className="text-xs text-muted-foreground">Totaling KES 890,000</p>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Transactions (30d)</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">21,406</div>
                                    <p className="text-xs text-muted-foreground">Avg. KES 4,120 per txn</p>
                                </CardContent>
                            </Card>
                        </div>
                        <Card>
                           <CardHeader>
                               <CardTitle>Revenue Trend</CardTitle>
                               <CardDescription>Monthly platform revenue from all sources.</CardDescription>
                           </CardHeader>
                           <CardContent>
                               <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (KES)" />
                                    </LineChart>
                               </ResponsiveContainer>
                           </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="transactions">
                <Card>
                    <CardHeader>
                        <CardTitle>Transaction Monitoring</CardTitle>
                        <CardDescription>Oversee all financial movements within the TradPay system.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount (KES)</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="font-medium">{txn.id}</TableCell>
                                        <TableCell>{txn.type}</TableCell>
                                        <TableCell>{txn.amount.toLocaleString()}</TableCell>
                                        <TableCell>{txn.user}</TableCell>
                                        <TableCell><Badge variant={
                                            txn.status === 'Completed' || txn.status === 'Paid' ? 'secondary' :
                                            txn.status === 'In Escrow' ? 'default' : 'destructive'
                                        }>{txn.status}</Badge></TableCell>
                                        <TableCell>{txn.date}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm">
                                                {txn.status === 'Pending Approval' ? 'Review' : 'View Details'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="kyc">
                <Card>
                    <CardHeader>
                        <CardTitle>KYC & Compliance Management</CardTitle>
                        <CardDescription>Manage and verify user KYC documents to ensure regulatory compliance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Verification ID</TableHead>
                                    <TableHead>User / Business</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date Submitted</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kycVerifications.map((kyc) => (
                                    <TableRow key={kyc.id}>
                                        <TableCell className="font-medium">{kyc.id}</TableCell>
                                        <TableCell>{kyc.user}</TableCell>
                                        <TableCell><Badge variant={kyc.status === 'Pending' ? 'default' : 'destructive'}>{kyc.status}</Badge></TableCell>
                                        <TableCell>{kyc.submitted}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm"><ShieldCheck className="mr-2 h-4 w-4" /> Review Documents</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reporting">
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Reporting</CardTitle>
                        <CardDescription>Generate and download financial reports for auditing and analysis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Monthly Revenue Report</p>
                                   <p className="text-sm text-muted-foreground">Summary of all transaction fees and platform revenues.</p>
                               </div>
                               <Button><FileWarning className="mr-2 h-4 w-4"/> Generate Report</Button>
                           </CardContent>
                        </Card>
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Payouts & Withdrawals Report</p>
                                   <p className="text-sm text-muted-foreground">Complete log of all funds moved out of the platform.</p>
                               </div>
                               <Button><Landmark className="mr-2 h-4 w-4"/> Generate Report</Button>
                           </CardContent>
                        </Card>
                         <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Full Transaction Ledger</p>
                                   <p className="text-sm text-muted-foreground">Export all transactions for a given period for accounting.</p>
                               </div>
                               <Button variant="outline">Export Ledger</Button>
                           </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
