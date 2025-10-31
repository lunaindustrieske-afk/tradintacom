
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { PhotoUpload } from '@/components/ui/photo-upload';

type ManufacturerData = {
  ownerName?: string;
  email?: string;
  phone?: string;
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  certifications?: string[];
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
};

export default function VerificationPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [ownerName, setOwnerName] = useState('');
    const [bizPhone, setBizPhone] = useState('');
    const [bizRegNo, setBizRegNo] = useState('');
    const [kraPin, setKraPin] = useState('');
    const [bizAddress, setBizAddress] = useState('');
    const [certUrl, setCertUrl] = useState('');
    const [kraPinUrl, setKraPinUrl] = useState('');

    const manufDocRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'manufacturers', user.uid);
    }, [firestore, user]);

    const { data: manufacturerData, isLoading: isLoadingData } = useDoc<ManufacturerData>(manufDocRef);
    
    useEffect(() => {
        if (manufacturerData) {
            setOwnerName(manufacturerData.ownerName || user?.displayName || '');
            setBizPhone(manufacturerData.phone || '');
            setBizRegNo(manufacturerData.businessLicenseNumber || '');
            setKraPin(manufacturerData.kraPin || '');
            setBizAddress(manufacturerData.address || '');
            if(manufacturerData.certifications) {
                setCertUrl(manufacturerData.certifications.find(c => c.includes('cert')) || '');
                setKraPinUrl(manufacturerData.certifications.find(c => c.includes('pin')) || '');
            }
        }
    }, [manufacturerData, user]);

    const handleSubmitForVerification = async () => {
        if (!user || !firestore) return;
        
        setIsLoading(true);
        const dataToSave: Partial<ManufacturerData> = {
            ownerName,
            phone: bizPhone,
            businessLicenseNumber: bizRegNo,
            kraPin,
            address: bizAddress,
            certifications: [certUrl, kraPinUrl].filter(Boolean),
            verificationStatus: 'Pending Legal', // Update status
        };

        try {
            await setDoc(manufDocRef, dataToSave, { merge: true });
            toast({
                title: 'Submission Successful!',
                description: 'Your verification documents have been submitted for review.',
            });
        } catch (error: any) {
             toast({
                title: 'Submission Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const isVerified = manufacturerData?.verificationStatus === 'Verified';

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild><Link href="/dashboards/seller-centre">Dashboard</Link></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Business Verification</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/seller-centre">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Business Verification
                </h1>
                {!isVerified && (
                     <div className="hidden items-center gap-2 md:ml-auto md:flex">
                        <Button size="sm" onClick={handleSubmitForVerification} disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Submit for Verification
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Provide your official business details. This information is confidential and used for verification only.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-3">
                        <Label htmlFor="owner-name">Owner/Representative Name</Label>
                        <Input id="owner-name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} disabled={isVerified} />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="biz-phone">Business Phone</Label>
                        <Input id="biz-phone" type="tel" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} disabled={isVerified} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="biz-reg-no">Business Registration No.</Label>
                        <Input id="biz-reg-no" value={bizRegNo} onChange={(e) => setBizRegNo(e.target.value)} disabled={isVerified} />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="kra-pin">KRA PIN</Label>
                        <Input id="kra-pin" value={kraPin} onChange={(e) => setKraPin(e.target.value)} disabled={isVerified} />
                    </div>
                    <div className="grid gap-3 md:col-span-2">
                        <Label htmlFor="biz-address">Physical Address</Label>
                        <Input id="biz-address" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} disabled={isVerified} />
                    </div>
                    {isVerified && <p className="text-xs text-muted-foreground md:col-span-2">Core business information cannot be changed after verification. Please contact support for assistance.</p>}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Verification Documents</CardTitle>
                    <CardDescription>Upload clear copies of your required business documents to get the "Verified" badge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <PhotoUpload
                      label="Certificate of Incorporation"
                      onUpload={setCertUrl}
                      initialUrl={certUrl}
                      disabled={isVerified}
                    />
                    <PhotoUpload
                      label="KRA PIN Certificate"
                      onUpload={setKraPinUrl}
                      initialUrl={kraPinUrl}
                      disabled={isVerified}
                    />
                     {isVerified && <p className="text-xs text-muted-foreground">Verification documents cannot be changed. Please contact support for assistance.</p>}
                </CardContent>
            </Card>

             {!isVerified && (
                     <div className="flex items-center justify-center gap-2 md:hidden mt-6">
                        <Button size="sm" onClick={handleSubmitForVerification} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Submit for Verification
                        </Button>
                    </div>
                )}
        </div>
    );
}


    