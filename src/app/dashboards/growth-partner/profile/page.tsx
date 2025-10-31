
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { ChevronLeft, Loader2, Save, Upload, Edit } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

type PartnerProfile = {
  fullName: string;
  bio?: string;
  photoURL?: string;
  isPublic?: boolean;
  isAcceptingPartnerships?: boolean;
  notificationSettings?: {
    newProposal?: boolean;
    newFollower?: boolean;
  }
};

export default function GrowthPartnerProfilePage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();

    const userDocRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: profile, isLoading } = useDoc<PartnerProfile>(userDocRef);
    
    const [fullName, setFullName] = React.useState('');
    const [bio, setBio] = React.useState('');
    const [photoURL, setPhotoURL] = React.useState('');
    const [isPublic, setIsPublic] = React.useState(true);
    const [isAccepting, setIsAccepting] = React.useState(true);
    const [notifications, setNotifications] = React.useState({ newProposal: true, newFollower: true });

    const [isSaving, setIsSaving] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);

    React.useEffect(() => {
        if (profile) {
            setFullName(profile.fullName || '');
            setBio(profile.bio || '');
            setPhotoURL(profile.photoURL || '');
            setIsPublic(profile.isPublic !== false); // Default to true if not set
            setIsAccepting(profile.isAcceptingPartnerships !== false); // Default to true
            setNotifications(profile.notificationSettings || { newProposal: true, newFollower: true });
        }
    }, [profile]);

    const handleSaveChanges = async () => {
        if (!userDocRef) return;
        setIsSaving(true);

        try {
            await updateDoc(userDocRef, {
                fullName,
                bio,
                photoURL,
                isPublic,
                isAcceptingPartnerships: isAccepting,
                notificationSettings: notifications,
            });
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            router.push('/dashboards/growth-partner');
        } catch (error: any) {
            toast({ title: "Error", description: `Could not save profile: ${error.message}`, variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const handleNotificationChange = (key: 'newProposal' | 'newFollower', value: boolean) => {
        setNotifications(prev => ({ ...prev, [key]: value }));
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                     <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            <Link href="/dashboards/growth-partner">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Edit Profile</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                    <Link href="/dashboards/growth-partner">
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    Edit Your Public Profile
                </h1>
                <div className="hidden items-center gap-2 md:ml-auto md:flex">
                    <Button size="sm" onClick={handleSaveChanges} disabled={isSaving || isUploading}>
                        {(isSaving || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-start">
                <div className="md:col-span-2 grid gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Profile Details</CardTitle>
                            <CardDescription>This information will be visible on your public partner page.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex items-start gap-6">
                                <div className="flex-grow space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fullName">Display Name</Label>
                                        <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="bio">Bio / About Me</Label>
                                        <Textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} className="min-h-24" placeholder="Tell sellers about your audience and expertise..." />
                                    </div>
                                </div>
                                 <div className="flex-shrink-0">
                                    <Label>Profile Picture</Label>
                                    <PhotoUpload onUpload={setPhotoURL} onLoadingChange={setIsUploading}>
                                        <div className="relative group w-24 h-24 mt-1">
                                            <Avatar className="w-full h-full border">
                                                <AvatarImage src={photoURL} />
                                                <AvatarFallback>{fullName?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Upload className="h-6 w-6 text-white" />}
                                            </div>
                                        </div>
                                    </PhotoUpload>
                                 </div>
                             </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 grid gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Control your profile's visibility and notifications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="is-public" className="flex flex-col gap-1">
                                    <span>Public Profile</span>
                                    <span className="font-normal text-xs text-muted-foreground">Visible to all users and sellers.</span>
                                </Label>
                                <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="is-accepting" className="flex flex-col gap-1">
                                    <span>Accepting Partnerships</span>
                                     <span className="font-normal text-xs text-muted-foreground">Lets sellers know you are open to new deals.</span>
                                </Label>
                                <Switch id="is-accepting" checked={isAccepting} onCheckedChange={setIsAccepting} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex items-center justify-between">
                                <Label htmlFor="notify-proposals" className="text-sm font-normal">Email me for new proposals</Label>
                                <Switch id="notify-proposals" checked={notifications.newProposal} onCheckedChange={v => handleNotificationChange('newProposal', v)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="notify-followers" className="text-sm font-normal">Email me for new followers</Label>
                                <Switch id="notify-followers" checked={notifications.newFollower} onCheckedChange={v => handleNotificationChange('newFollower', v)} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
             <div className="flex items-center justify-end gap-2 md:hidden mt-6">
                <Button size="sm" onClick={handleSaveChanges} disabled={isSaving || isUploading}>
                    {(isSaving || isUploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
