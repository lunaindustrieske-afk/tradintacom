
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Check, X, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { logActivity } from '@/lib/activity-log';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


type Manufacturer = {
  id: string;
  shopName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  certifications?: string[];
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
  rejectionReason?: string;
};

const statusMap: Record<NonNullable<Manufacturer['verificationStatus']>, {
    text: string;
    variant: 'secondary' | 'default' | 'destructive' | 'outline';
}> = {
    'Unsubmitted': { text: 'Unsubmitted', variant: 'outline' },
    'Pending Legal': { text: 'Pending Legal Review', variant: 'default' },
    'Pending Admin': { text: 'Pending Admin Approval', variant: 'default' },
    'Action Required': { text: 'Action Required', variant: 'destructive' },
    'Verified': { text: 'Verified', variant: 'secondary' }
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold">{value || 'Not provided'}</p>
    </div>
);

export default function VerificationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const manufacturerId = params.id as string;
    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = React.useState(false);
    const [rejectionReason, setRejectionReason] = React.useState('');

    const manufRef = useMemoFirebase(() => {
        if (!firestore || !manufacturerId) return null;
        return doc(firestore, 'manufacturers', manufacturerId);
    }, [firestore, manufacturerId]);

    const { data: manufacturer, isLoading } = useDoc<Manufacturer>(manufRef);

    const handleUpdateStatus = (
        status: NonNullable<Manufacturer['verificationStatus']>,
        reason?: string
    ) => {
        if (!manufRef || !auth || !manufacturer) return;

        if (status === 'Action Required' && !reason?.trim()) {
            toast({
                title: "Rejection Reason Required",
                description: "Please provide a reason for rejecting the application.",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        const dataToUpdate: Partial<Manufacturer> = { verificationStatus: status };
        let action = '';
        let details = '';

        if (status === 'Verified') {
            dataToUpdate.rejectionReason = ''; // Clear reason on approval
            action = 'VERIFICATION_APPROVED';
            details = `Approved manufacturer: ${manufacturer.shopName} (ID: ${manufacturer.id})`;
        } else if (status === 'Action Required' && reason) {
            dataToUpdate.rejectionReason = reason;
            action = 'VERIFICATION_REJECTED';
            details = `Rejected manufacturer ${manufacturer.shopName} (ID: ${manufacturer.id}). Reason: ${reason}`;
        } else {
             // Handle other status changes if needed
            action = 'VERIFICATION_STATUS_CHANGED';
            details = `Changed status of ${manufacturer.shopName} (ID: ${manufacturer.id}) to ${status}`;
        }
        
        updateDocumentNonBlocking(manufRef, dataToUpdate);
        logActivity(firestore, auth, action, details);


        toast({
            title: "Status Updated",
            description: `Manufacturer has been set to "${statusMap[status].text}".`
        });

        // Redirect after a short delay to allow toast to be seen
        setTimeout(() => {
            router.push('/dashboards/admin');
            setIsUpdating(false);
        }, 1000);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                    <div className="md:col-span-1 space-y-6">
                        <Card><CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                    </div>
                </div>
            </div>
        );
    }

    if (!manufacturer) {
        return (
            <div>
                <h1 className="text-xl font-semibold">Manufacturer not found.</h1>
                <p className="text-muted-foreground">The requested manufacturer profile could not be loaded.</p>
            </div>
        )
    }

    const currentStatus = statusMap[manufacturer.verificationStatus || 'Unsubmitted'];

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboards/admin">Admin Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Verification</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">{manufacturer.shopName || 'Unnamed Shop'}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Application Review</span>
                            <Badge variant={currentStatus.variant}>{currentStatus.text}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" disabled={isUpdating} onClick={() => handleUpdateStatus('Action Required', rejectionReason)}>
                        {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <X className="mr-2 h-4 w-4" />}
                        Reject
                    </Button>
                    <Button disabled={isUpdating} onClick={() => handleUpdateStatus('Verified')}>
                         {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                        Approve
                    </Button>
                </div>
            </div>

            <Separator />

             <div className="grid md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid sm:grid-cols-2 gap-4">
                            <DetailItem label="Legal Company Name" value={manufacturer.shopName} />
                            <DetailItem label="Owner Name" value={manufacturer.ownerName} />
                            <DetailItem label="Business Phone" value={manufacturer.phone} />
                            <DetailItem label="Business Email" value={manufacturer.email} />
                            <DetailItem label="KRA PIN" value={manufacturer.kraPin} />
                            <DetailItem label="Business Registration No." value={manufacturer.businessLicenseNumber} />
                            <div className="sm:col-span-2">
                                <DetailItem label="Physical Address" value={manufacturer.address} />
                            </div>
                            <div className="sm:col-span-2">
                                <DetailItem label="Shop Description" value={manufacturer.description} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Review & Communication</CardTitle></CardHeader>
                        <CardContent>
                             <Label htmlFor="rejection-reason">Rejection Reason (if applicable)</Label>
                             <Textarea 
                                id="rejection-reason"
                                placeholder="If rejecting, provide a clear reason for the applicant..."
                                className="mt-1"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                             />
                             <p className="text-xs text-muted-foreground mt-2">This reason will be stored and can be shown to the applicant.</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="secondary">
                                <MessageSquare className="mr-2 h-4 w-4" /> Send Message to Applicant
                            </Button>
                        </CardFooter>
                     </Card>
                </div>
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Submitted Documents</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {manufacturer.certifications && manufacturer.certifications.length > 0 && manufacturer.certifications.some(c => c) ? (
                                manufacturer.certifications.map((certUrl, index) => certUrl && (
                                    <Button key={index} variant="outline" asChild className="w-full justify-between">
                                        <a href={certUrl} target="_blank" rel="noopener noreferrer">
                                            {certUrl.includes('cert') ? 'Cert. of Incorporation' : certUrl.includes('pin') ? 'KRA PIN Cert.' : 'Document'}
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    </Button>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No documents submitted.</p>
                            )}
                        </CardContent>
                    </Card>
                    {manufacturer.logoUrl &&
                        <Card>
                            <CardHeader><CardTitle>Shop Logo</CardTitle></CardHeader>
                            <CardContent>
                                <Image src={manufacturer.logoUrl} alt="Shop Logo" width={128} height={128} className="rounded-md mx-auto" />
                            </CardContent>
                        </Card>
                    }
                </div>
             </div>

        </div>
    );
}

    