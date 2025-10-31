
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Scale } from "lucide-react";

const kycStandards = [
    { id: 'STD01', title: 'Seller KYC Requirements', version: 'v2.1', lastUpdated: '2023-09-01', status: 'Active' },
    { id: 'STD02', title: 'Buyer KYC Requirements', version: 'v1.5', lastUpdated: '2023-09-01', status: 'Active' },
    { id: 'STD03', title: 'AML Policy', version: 'v1.2', lastUpdated: '2023-07-15', status: 'Active' },
];

const businessVerifications = [
    { id: 'BV001', business: 'Constructa Ltd', status: 'Verified', documents: 'Cert. of Inc, KRA PIN', date: '2023-01-15' },
    { id: 'BV002', business: 'MegaPlastics Ltd', status: 'Pending Review', documents: 'Cert. of Inc, KRA PIN', date: '2023-11-15' },
];

export default function LegalComplianceDashboard() {
    return (
        <Tabs defaultValue="kyc-standards">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="kyc-standards">KYC Standards</TabsTrigger>
                <TabsTrigger value="business-verification">Business Legitimacy</TabsTrigger>
                <TabsTrigger value="policy-management">Policy Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="kyc-standards">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>KYC & AML Standards</CardTitle>
                                <CardDescription>Review and manage the Know Your Customer and Anti-Money Laundering policies.</CardDescription>
                            </div>
                            <Button><ShieldCheck className="mr-2 h-4 w-4" /> Update Policy</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Policy Title</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {kycStandards.map((standard) => (
                                    <TableRow key={standard.id}>
                                        <TableCell className="font-medium">{standard.title}</TableCell>
                                        <TableCell>{standard.version}</TableCell>
                                        <TableCell>{standard.lastUpdated}</TableCell>
                                        <TableCell><Badge>{standard.status}</Badge></TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm">View/Edit</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="business-verification">
                <Card>
                    <CardHeader>
                        <CardTitle>Business Legitimacy Verification</CardTitle>
                        <CardDescription>Queue for verifying the legal standing of registered businesses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Business Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Documents Submitted</TableHead>
                                    <TableHead>Verification Date</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {businessVerifications.map((bv) => (
                                    <TableRow key={bv.id}>
                                        <TableCell className="font-medium">{bv.business}</TableCell>
                                        <TableCell><Badge variant={bv.status === 'Verified' ? 'secondary' : 'default'}>{bv.status}</Badge></TableCell>
                                        <TableCell>{bv.documents}</TableCell>
                                        <TableCell>{bv.date}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" disabled={bv.status === 'Verified'}>Review Documents</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="policy-management">
                 <Card>
                    <CardHeader>
                        <CardTitle>Dispute Resolution Policies</CardTitle>
                        <CardDescription>Manage terms of service, privacy policies, and dispute resolution frameworks.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Terms of Service</p>
                                   <p className="text-sm text-muted-foreground">Version 3.2 - Last updated: 2023-10-01</p>
                               </div>
                               <Button variant="outline"><FileText className="mr-2 h-4 w-4"/> Edit</Button>
                           </CardContent>
                        </Card>
                        <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Privacy Policy</p>
                                   <p className="text-sm text-muted-foreground">Version 2.5 - Last updated: 2023-10-01</p>
                               </div>
                               <Button variant="outline"><FileText className="mr-2 h-4 w-4"/> Edit</Button>
                           </CardContent>
                        </Card>
                         <Card>
                           <CardContent className="p-6 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">Dispute Resolution Framework</p>
                                   <p className="text-sm text-muted-foreground">Version 1.8 - Last updated: 2023-08-20</p>
                               </div>
                               <Button variant="outline"><Scale className="mr-2 h-4 w-4"/> Edit</Button>
                           </CardContent>
                        </Card>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
