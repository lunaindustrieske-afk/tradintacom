
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Repeat, Package, Star } from "lucide-react";

const bulkOrders = [
    { id: 'BULK-001', products: 'Industrial Cement, Steel Beams', supplier: 'Constructa Ltd', total: 1250000, status: 'Delivered', date: '2023-10-20' },
    { id: 'BULK-002', products: 'Baking Flour, Cooking Oil', supplier: 'Savanna Foods', total: 780000, status: 'Awaiting Payment', date: '2023-11-10' },
];

const reorderItems = [
    { id: 'PROD-001', name: 'Industrial Grade Cement', lastOrder: '2023-10-20', frequency: 'Monthly', stock: 'Low' },
    { id: 'PROD-002', name: 'Commercial Baking Flour', lastOrder: '2023-09-15', frequency: 'Monthly', stock: 'Medium' },
];

export default function DistributorDashboard() {
    return (
        <Tabs defaultValue="bulk-orders">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bulk-orders">Bulk Orders</TabsTrigger>
                <TabsTrigger value="reorder">Quick Re-order</TabsTrigger>
                <TabsTrigger value="shop">My Mini-Shop</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bulk-orders">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>My Bulk Orders</CardTitle>
                                <CardDescription>Manage your large volume and wholesale purchases.</CardDescription>
                            </div>
                            <Button><ShoppingCart className="mr-2 h-4 w-4" /> Place New Bulk Order</Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Total (KES)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bulkOrders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.products}</TableCell>
                                        <TableCell>{order.supplier}</TableCell>
                                        <TableCell>{order.total.toLocaleString()}</TableCell>
                                        <TableCell><Badge variant={order.status === 'Delivered' ? 'secondary' : 'default'}>{order.status}</Badge></TableCell>
                                        <TableCell className="space-x-2">
                                            <Button variant="outline" size="sm">Track</Button>
                                            {order.status === 'Awaiting Payment' && <Button size="sm">Pay Now</Button>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="reorder">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Re-order</CardTitle>
                        <CardDescription>Easily re-order frequently purchased items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Last Order Date</TableHead>
                                    <TableHead>Purchase Frequency</TableHead>
                                    <TableHead>Est. Stock Level</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reorderItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.lastOrder}</TableCell>
                                        <TableCell>{item.frequency}</TableCell>
                                        <TableCell><Badge variant={item.stock === 'Low' ? 'destructive' : 'outline'}>{item.stock}</Badge></TableCell>
                                        <TableCell>
                                            <Button size="sm"><Repeat className="mr-2 h-4 w-4" /> Re-order Now</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="shop">
                 <Card>
                    <CardHeader>
                        <CardTitle>My Mini-Shop</CardTitle>
                        <CardDescription>Manage your limited shop for reselling products.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
                            <div>
                                <Star className="mx-auto h-12 w-12 text-yellow-400" />
                                <h3 className="mt-4 text-lg font-medium">Shop Privileges Not Yet Unlocked</h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Meet the minimum bulk order threshold to unlock your distributor shop.
                                </p>
                                <Button className="mt-4">Learn More</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
