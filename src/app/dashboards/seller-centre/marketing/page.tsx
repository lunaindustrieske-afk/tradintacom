
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, BarChart, DollarSign, Wallet, Megaphone } from 'lucide-react';
import { useUser } from '@/firebase';
import { logFeatureUsage } from '@/lib/analytics';
import Link from 'next/link';

// Mock data for now
const mockCampaigns = [
  { id: 'CAMP-001', name: 'Q4 Cement Promotion', status: 'Active', spend: 12000, clicks: 450, conversions: 15 },
  { id: 'CAMP-002', name: 'Homepage Product Boost', status: 'Finished', spend: 5000, clicks: 1200, conversions: 35 },
];

export default function SellerMarketingPage() {
  const { user, role } = useUser();

  React.useEffect(() => {
    if (user && role) {
      logFeatureUsage({ feature: 'page:view', userId: user.uid, userRole: role, metadata: { page: '/dashboards/seller-centre/marketing' } });
    }
  }, [user, role]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Marketing Centre</CardTitle>
          <CardDescription>
            Boost your products, run ad campaigns, and track your performance.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ad Spend (30d)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 17,000</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions (30d)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+50</div>
            <p className="text-xs text-muted-foreground">Inquiries & Leads</p>
          </CardContent>
        </Card>
         <Card className="col-span-1 md:col-span-2 bg-primary/10 border-primary/20 text-center flex flex-col justify-center">
            <CardContent className="p-6">
                <Megaphone className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="text-lg font-semibold">Ready to Scale?</h3>
                <p className="text-sm text-muted-foreground mb-4">Explore our managed marketing plans to reach thousands of new buyers.</p>
                <Button asChild>
                    <Link href="/marketing-plans">View Marketing Plans</Link>
                </Button>
            </CardContent>
         </Card>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
             <Card>
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>A summary of your marketing efforts.</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Analytics charts will be displayed here.</p>
                </CardContent>
             </Card>
        </TabsContent>
        
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>My Campaigns</CardTitle>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Spend (KES)</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell><Badge variant={campaign.status === 'Active' ? 'default' : 'secondary'}>{campaign.status}</Badge></TableCell>
                      <TableCell>{campaign.spend.toLocaleString()}</TableCell>
                      <TableCell>{campaign.clicks}</TableCell>
                      <TableCell>{campaign.conversions}</TableCell>
                       <TableCell>
                          <Button variant="outline" size="sm">
                              <BarChart className="mr-2 h-4 w-4" /> View Report
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
             <Card>
                <CardHeader>
                    <CardTitle>Detailed Analytics</CardTitle>
                    <CardDescription>Dive deep into your campaign performance.</CardDescription>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Interactive charts for campaign analytics will be here.</p>
                </CardContent>
             </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
