
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  Save,
  Globe,
  Link as LinkIcon,
  Loader2,
  Eye,
  UploadCloud,
  ShieldCheck,
  MapPin,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Palette,
  Sparkles,
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
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Switch } from '@/components/ui/switch';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { nanoid } from 'nanoid';
import Image from 'next/image';
import { cn, generateSlug } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { africanCountries, kenyanCounties } from '@/lib/countries';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PERMISSIONS } from '@/lib/permissions';


type PolicyData = {
    paymentPolicy?: string;
    shippingPolicy?: string;
    returnPolicy?: string;
}

type MarketingPlan = {
  features?: string[];
}

type ManufacturerData = {
  shopId?: string;
  slug?: string;
  shopName?: string;
  shopNameHistory?: string[];
  tagline?: string;
  description?: string;
  logoUrl?: string;
  logoHistory?: string[];
  businessLicenseNumber?: string;
  kraPin?: string;
  address?: string;
  phone?: string;
  country?: string;
  county?: string;
  paymentPolicy?: string;
  shippingPolicy?: string;
  returnPolicy?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  contactEmail?: string;
  acceptsTradPay?: boolean;
  issuesTradPoints?: boolean;
  certifications?: string[];
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified';
  overview?: string;
  pendingPolicies?: PolicyData;
  policyChangesStatus?: 'pending' | 'approved' | 'rejected';
  theme?: string;
  marketingPlanId?: string;
};

const THEMES = [
  { id: 'tradinta-blue', name: 'Tradinta Blue', colors: ['bg-blue-500', 'bg-blue-700', 'bg-gray-200'] },
  { id: 'forest-green', name: 'Forest Green', colors: ['bg-green-600', 'bg-green-800', 'bg-emerald-100'] },
  { id: 'royal-crimson', name: 'Royal Crimson', colors: ['bg-red-600', 'bg-red-800', 'bg-rose-100'] },
  { id: 'midnight-gold', name: 'Midnight Gold', colors: ['bg-gray-800', 'bg-black', 'bg-yellow-400'] },
];

const LogoManager = ({
    initialLogoUrl,
    initialHistory = [],
    onLogoChange,
    onHistoryChange
}: {
    initialLogoUrl?: string;
    initialHistory?: string[];
    onLogoChange: (url: string) => void;
    onHistoryChange: (url: string) => void;
}) => {
    const [activeLogo, setActiveLogo] = useState(initialLogoUrl);
    const [logoHistory, setLogoHistory] = useState(initialHistory);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setActiveLogo(initialLogoUrl);
    }, [initialLogoUrl]);
    
    useEffect(() => {
        setLogoHistory(initialHistory);
    }, [initialHistory]);

    const handleNewUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const paramsToSign = { timestamp: Math.round(new Date().getTime() / 1000) };
            const signatureResponse = await fetch('/api/sign-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paramsToSign }),
            });
            const { signature } = await signatureResponse.json();
            if (!signature) throw new Error('Failed to get upload signature.');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
            formData.append('signature', signature);
            formData.append('timestamp', paramsToSign.timestamp.toString());

            const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.error?.message || 'Upload failed.');
            
            const newUrl = data.secure_url;
            onHistoryChange(newUrl);
            onLogoChange(newUrl);
            setActiveLogo(newUrl);
            setLogoHistory(prev => [newUrl, ...prev]);

            toast({ title: 'Upload Successful' });
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: acceptedFiles => {
            if (acceptedFiles.length > 0) {
                handleNewUpload(acceptedFiles[0]);
            }
        },
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg'] },
        multiple: false,
    });
    
    const handleSelectLogo = (url: string) => {
        setActiveLogo(url);
        onLogoChange(url);
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Active Logo</Label>
                <div className="mt-1 w-32 h-32 relative rounded-md border flex items-center justify-center bg-muted/50 overflow-hidden">
                    {activeLogo ? <Image src={activeLogo} alt="Active Logo" fill className="object-contain p-2" /> : <span className="text-xs text-muted-foreground">No logo</span>}
                </div>
            </div>
            <div>
                <Label>Logo History</Label>
                <p className="text-xs text-muted-foreground">Click a logo to make it active.</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                    {logoHistory.map((url, index) => (
                        <div key={index} className={cn("relative w-full aspect-square rounded-md border-2 cursor-pointer overflow-hidden", activeLogo === url ? 'border-primary' : 'border-transparent')} onClick={() => handleSelectLogo(url)}>
                            <Image src={url} alt={`Previous logo ${index + 1}`} fill className="object-cover" />
                        </div>
                    ))}
                    <div {...getRootProps()} className={cn("flex aspect-square w-full cursor-pointer items-center justify-center rounded-md border-2 border-dashed text-center text-muted-foreground", isDragActive ? 'border-primary' : 'hover:border-primary/50')}>
                        <input {...getInputProps()} />
                        {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function EditShopProfilePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // DB state
  const [dbData, setDbData] = useState<ManufacturerData | null>(null);

  // Form state
  const [slug, setSlug] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopTagline, setShopTagline] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoHistory, setLogoHistory] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [county, setCounty] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentPolicy, setPaymentPolicy] = useState('');
  const [shippingPolicy, setShippingPolicy] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [x, setX] = useState('');
  const [issuesTradPoints, setIssuesTradPoints] = useState(false);
  const [theme, setTheme] = useState('tradinta-blue');
  
  const [isLoading, setIsLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<ManufacturerData['verificationStatus']>('Unsubmitted');
  const [marketingPlan, setMarketingPlan] = React.useState<MarketingPlan | null>(null);


  // Fetch existing data
  useEffect(() => {
    if (user && firestore) {
      const fetchManufacturerData = async () => {
        const manufRef = doc(firestore, 'manufacturers', user.uid);
        const docSnap = await getDoc(manufRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ManufacturerData;
          setDbData(data);
          setSlug(data.slug || '');
          setShopName(data.shopName || '');
          setShopTagline(data.tagline || '');
          setShopDescription(data.overview || '');
          setLogoUrl(data.logoUrl || '');
          setLogoHistory(data.logoHistory || []);
          setCountry(data.country || '');
          setCounty(data.county || '');
          setContactEmail(data.contactEmail || '');
          setPaymentPolicy(data.paymentPolicy || '');
          setShippingPolicy(data.shippingPolicy || '');
          setReturnPolicy(data.returnPolicy || '');
          setWebsite(data.website || '');
          setLinkedin(data.linkedin || '');
          setFacebook(data.facebook || '');
          setInstagram(data.instagram || '');
          setX(data.x || '');
          setIssuesTradPoints(data.issuesTradPoints === true);
          setVerificationStatus(data.verificationStatus || 'Unsubmitted');
          setTheme(data.theme || 'tradinta-blue');

           if (data.marketingPlanId) {
            const planRef = doc(firestore, 'marketingPlans', data.marketingPlanId);
            const planSnap = await getDoc(planRef);
            if (planSnap.exists()) {
              setMarketingPlan(planSnap.data() as MarketingPlan);
            }
          }
        }
        setIsLoading(false);
      };
      fetchManufacturerData();
    }
  }, [user, firestore]);

  const isVerified = verificationStatus === 'Verified';
  const hasThemePermission = marketingPlan?.features?.includes(PERMISSIONS.SHOP.CUSTOM_THEME) === true;


  const handleSaveChanges = async () => {
    if (!user || !firestore) {
      toast({ title: "Not authenticated", description: "You must be logged in to save changes.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);

    const manufacturerData: Partial<ManufacturerData> & { logoHistory?: any; shopNameHistory?: any } = {
        tagline: shopTagline,
        overview: shopDescription,
        logoUrl,
        website,
        linkedin,
        facebook,
        instagram,
        x,
        contactEmail,
        acceptsTradPay: false,
        issuesTradPoints,
        country,
        county: country === 'Kenya' ? county : '',
        location: country === 'Kenya' ? `${county}, ${country}` : country,
        theme: hasThemePermission ? theme : dbData?.theme || 'tradinta-blue',
    };

    if (isVerified) {
        const pendingPolicyChanges: PolicyData = {};
        if (paymentPolicy !== dbData?.paymentPolicy) {
            pendingPolicyChanges.paymentPolicy = paymentPolicy;
        }
        if (shippingPolicy !== dbData?.shippingPolicy) {
            pendingPolicyChanges.shippingPolicy = shippingPolicy;
        }
        if (returnPolicy !== dbData?.returnPolicy) {
            pendingPolicyChanges.returnPolicy = returnPolicy;
        }

        if (Object.keys(pendingPolicyChanges).length > 0) {
            manufacturerData.pendingPolicies = pendingPolicyChanges;
            manufacturerData.policyChangesStatus = 'pending';
        }
    } else {
        manufacturerData.shopName = shopName;
        manufacturerData.paymentPolicy = paymentPolicy;
        manufacturerData.shippingPolicy = shippingPolicy;
        manufacturerData.returnPolicy = returnPolicy;

        if (dbData?.shopName && shopName !== dbData.shopName) {
            manufacturerData.shopNameHistory = arrayUnion(dbData.shopName);
        }

        let finalSlug = slug;
        if (!slug || (dbData?.shopName !== shopName)) {
            finalSlug = generateSlug(shopName);
            const slugQuery = query(collection(firestore, "manufacturers"), where("slug", "==", finalSlug));
            const querySnapshot = await getDocs(slugQuery);
            let isSlugTaken = false;
            querySnapshot.forEach((doc) => { if (doc.id !== user.uid) { isSlugTaken = true; } });
            if (isSlugTaken) {
                finalSlug = `${finalSlug}-${user.uid.substring(0, 4)}`;
                toast({ title: "Shop Name Taken", description: `A unique ID has been added to your shop URL: ${finalSlug}` });
            }
        }
        manufacturerData.slug = finalSlug;
        setSlug(finalSlug);
    }
    
    const newLogoForHistory = logoHistory.includes(logoUrl) ? null : logoUrl;
    if (newLogoForHistory) {
        manufacturerData.logoHistory = arrayUnion(newLogoForHistory);
    }
    
    try {
      const manufRef = doc(firestore, 'manufacturers', user.uid);
      await setDoc(manufRef, manufacturerData, { merge: true });
      
      toast({ title: "Profile Saved!", description: "Your changes have been successfully saved." });

      if (manufacturerData.policyChangesStatus === 'pending') {
        toast({ title: "Policies Awaiting Approval", description: "Your policy changes have been submitted for review." });
      }

    } catch (error: any) {
      toast({ title: "Save Failed", description: error.message || "An error occurred while saving.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }


  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboards/seller-centre">Dashboard</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Shop Profile</BreadcrumbPage>
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
          Edit Shop Profile
        </h1>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm" asChild disabled={!slug}>
              <Link href={`/manufacturer/${slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  View Public Shop
              </Link>
          </Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
       {dbData?.policyChangesStatus === 'pending' && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Policies Pending Approval</AlertTitle>
          <AlertDescription>
            Your recent policy changes are under review by our compliance team. They are not yet live on your shop profile.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Shop Branding</CardTitle>
              <CardDescription>
                Manage your shop's identity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid gap-3">
                  <Label htmlFor="shop-name">Shop Name</Label>
                  <Input id="shop-name" value={shopName} onChange={(e) => setShopName(e.target.value)} disabled={isVerified} />
                  {isVerified && <p className="text-xs text-muted-foreground">Shop name cannot be changed after verification.</p>}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="shop-tagline">Shop Tagline</Label>
                  <Input id="shop-tagline" placeholder="e.g., Quality Building Materials for East Africa" value={shopTagline} onChange={(e) => setShopTagline(e.target.value)}/>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="shop-description">Shop Description</Label>
                  <Textarea id="shop-description" className="min-h-32" placeholder="Tell buyers about your business..." value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} />
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5"/> Location</CardTitle>
                <CardDescription>Set your primary business location. This will be displayed on your product listings.</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                         <Select onValueChange={(value) => { setCountry(value); if (value !== 'Kenya') setCounty(''); }} value={country}>
                            <SelectTrigger id="country">
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {africanCountries.map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {country === 'Kenya' && (
                         <div className="grid gap-2">
                            <Label htmlFor="county">County (Kenya)</Label>
                            <Select onValueChange={setCounty} value={county}>
                                <SelectTrigger id="county">
                                    <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kenyanCounties.map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
           </Card>
           <Card>
            <CardHeader>
              <CardTitle>Policies</CardTitle>
              <CardDescription>Define your payment, shipping, and return policies. {isVerified && "Changes require admin approval."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3">
                  <Label htmlFor="payment-policy">Payment Policy</Label>
                  <Textarea id="payment-policy" placeholder="e.g., We accept TradPay, Bank Transfer, and LPO for approved clients. Payment is due upon order confirmation." value={paymentPolicy} onChange={(e) => setPaymentPolicy(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="shipping-policy">Shipping Policy</Label>
                  <Textarea id="shipping-policy" placeholder="e.g., We ship within 3-5 business days. Delivery fees vary by location." value={shippingPolicy} onChange={(e) => setShippingPolicy(e.target.value)} />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="return-policy">Return Policy</Label>
                  <Textarea id="return-policy" placeholder="e.g., Returns accepted within 7 days for defective products only. Buyer is responsible for return shipping." value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} />
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-8">
            <Card>
                <CardHeader><CardTitle>Shop Logo</CardTitle></CardHeader>
                <CardContent>
                     <LogoManager 
                        initialLogoUrl={logoUrl} 
                        initialHistory={logoHistory}
                        onLogoChange={setLogoUrl}
                        onHistoryChange={(newUrl) => {
                            if (!logoHistory.includes(newUrl)) {
                                setLogoHistory(prev => [newUrl, ...prev]);
                            }
                        }}
                    />
                </CardContent>
            </Card>

            <Card className="relative">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette/> Shop Theme</CardTitle>
                    <CardDescription>Choose a color scheme for your public shop page.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!hasThemePermission && (
                        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 rounded-lg">
                           <Sparkles className="w-8 h-8 text-primary mb-2" />
                            <p className="font-semibold mb-2">Unlock Custom Themes</p>
                            <p className="text-xs text-muted-foreground mb-4">Subscribe to a Growth Tier to customize your shop's appearance.</p>
                            <Button size="sm" asChild><Link href="/marketing-plans">Upgrade Plan</Link></Button>
                        </div>
                    )}
                    <RadioGroup value={theme} onValueChange={(val) => setTheme(val)} className="grid grid-cols-2 gap-4">
                        {THEMES.map((themeOption) => (
                            <Label key={themeOption.id} htmlFor={themeOption.id} className="block cursor-pointer rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                <RadioGroupItem value={themeOption.id} id={themeOption.id} className="sr-only" />
                                <span className="text-sm font-semibold">{themeOption.name}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    {themeOption.colors.map((color, i) => (
                                        <div key={i} className={cn("h-6 w-full rounded", color)}></div>
                                    ))}
                                </div>
                            </Label>
                        ))}
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact & Social</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3">
                        <Label htmlFor="contact-email">Public Contact Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="contact-email" type="email" className="pl-8" placeholder="sales@mycompany.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                            <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="website" className="pl-8" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="facebook">Facebook URL</Label>
                         <div className="relative">
                            <Facebook className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="facebook" className="pl-8" placeholder="facebook.com/..." value={facebook} onChange={(e) => setFacebook(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="instagram">Instagram URL</Label>
                         <div className="relative">
                            <Instagram className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="instagram" className="pl-8" placeholder="instagram.com/..." value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="x">X (Twitter) URL</Label>
                         <div className="relative">
                            <Twitter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="x" className="pl-8" placeholder="x.com/..." value={x} onChange={(e) => setX(e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Shop Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="tradpay-switch" className="flex flex-col gap-1 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-70" data-disabled="true">
                            <span>Accept TradPay</span>
                            <span className="font-normal text-xs text-muted-foreground">TradPay is currently disabled platform-wide.</span>
                        </Label>
                        <Switch id="tradpay-switch" disabled={true} checked={false} />
                    </div>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="tradpoints-switch" className="flex flex-col gap-1 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-70" data-disabled={!isVerified}>
                            <span>Issue TradPoints</span>
                            <span className="font-normal text-xs text-muted-foreground">Reward buyers for purchases. Requires verification.</span>
                        </Label>
                        <Switch id="tradpoints-switch" checked={issuesTradPoints} onCheckedChange={setIssuesTradPoints} disabled={!isVerified} />
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
       <div className="flex items-center justify-end gap-2 md:hidden mt-6">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveChanges} disabled={isLoading}>
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
    </div>
  );
}
