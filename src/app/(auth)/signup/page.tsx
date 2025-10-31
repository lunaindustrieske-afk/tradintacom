
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, KeyRound, Building, Loader2, Info } from "lucide-react";
import { nanoid } from "nanoid";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { sendVerificationEmail, setUserRoleClaim } from "@/app/(auth)/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


function FactoryIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M17 18h1" />
        <path d="M12 18h1" />
        <path d="M7 18h1" />
      </svg>
    );
}

function ShoppingCartIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    );
}

function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m11 17 2 2a1 1 0 1 0 3-3" />
        <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.07-.12 5.79 5.79 0 0 1 .12 7.07" />
        <path d="m12 5 2 2" />
        <path d="m7 12 2 2" />
        <path d="m10 8 5 5" />
        <path d="m3 21 3-3" />
      </svg>
    );
}

const africanCountries = ["Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo, Democratic Republic of the", "Congo, Republic of the", "Cote d'Ivoire", "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"];
const kenyanCounties = ["Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"];


export default function SignUpPage() {
  const [role, setRole] = useState("manufacturer");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [country, setCountry] = useState('');
  
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) {
      toast({ title: "Services not available", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please check your passwords and try again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Set user's display name in Auth profile
      await updateProfile(user, { displayName: fullName });

      // 2. Set custom claim for the role
      const roleResult = await setUserRoleClaim(user.uid, role);
      if (!roleResult.success) {
        throw new Error(roleResult.message);
      }

      // 3. Prepare user profile data (without role)
      const userProfileData: {
        tradintaId: string;
        email: string;
        fullName: string;
        businessName?: string;
        referredBy?: string;
        registrationDate: any;
        emailVerified: boolean;
      } = {
        tradintaId: nanoid(8),
        email: user.email!,
        fullName: fullName,
        registrationDate: serverTimestamp(),
        emailVerified: false,
      };
      
      const referralCode = localStorage.getItem('referralCode');
      if (referralCode) {
        userProfileData.referredBy = referralCode;
      }

      // 4. Create user profile document in 'users' collection
      await setDoc(doc(firestore, 'users', user.uid), userProfileData);

      // 5. Create email lookup document
      await setDoc(doc(firestore, 'emails', user.email!), {
        userId: user.uid
      });

      // 6. If manufacturer, also create a document in 'manufacturers' collection
      if (role === 'manufacturer') {
        userProfileData.businessName = businessName;
        await setDoc(doc(firestore, 'manufacturers', user.uid), {
          ownerName: fullName,
          shopName: businessName,
          email: user.email,
          registrationDate: serverTimestamp(),
          verificationStatus: 'Unsubmitted',
        });
      }
      
      // 7. Send custom verification email
      await sendVerificationEmail(user.uid, user.email!, fullName);
      
      if (referralCode) {
        localStorage.removeItem('referralCode');
      }

      setIsSuccess(true);


    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md space-y-8 text-center p-8">
            <Alert>
              <Mail className="h-5 w-5" />
              <AlertTitle className="font-bold text-xl">Check Your Inbox!</AlertTitle>
              <AlertDescription>
                We've sent a verification link to <strong>{email}</strong>. Please click the link in the email to activate your Tradinta account.
              </AlertDescription>
            </Alert>
            <Button asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-lg space-y-6">
          <div>
            <Logo className="w-40 mb-4" />
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
              Create your Tradinta Account
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Connect with verified manufacturers, distributors, and buyers.
            </p>
          </div>
          
          <RadioGroup defaultValue="manufacturer" className="grid grid-cols-3 gap-4" onValueChange={setRole}>
            <Label htmlFor="manufacturer" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              <RadioGroupItem value="manufacturer" id="manufacturer" className="sr-only" />
              <FactoryIcon className="mb-3 h-6 w-6" />
              Manufacturer
            </Label>
            <Label htmlFor="buyer" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              <RadioGroupItem value="buyer" id="buyer" className="sr-only" />
              <ShoppingCartIcon className="mb-3 h-6 w-6" />
              Buyer
            </Label>
             <Label htmlFor="partner" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
              <RadioGroupItem value="partner" id="partner" className="sr-only" />
              <HandshakeIcon className="mb-3 h-6 w-6" />
              Influencer
            </Label>
          </RadioGroup>

          <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`relative ${role === 'manufacturer' ? '' : 'md:col-span-2'}`}>
                    <Label htmlFor="full-name">Full Name</Label>
                    <User className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                    <Input id="full-name" name="full-name" type="text" required className="mt-1 pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                {role === 'manufacturer' && (
                    <div className="relative">
                        <Label htmlFor="business-name">Business Name</Label>
                        <Building className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                        <Input id="business-name" name="business-name" type="text" required className="mt-1 pl-10" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                    </div>
                )}
            </div>
            <div className="relative">
                <Label htmlFor="email">Email</Label>
                <Mail className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                <Input id="email" name="email" type="email" required className="mt-1 pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Label htmlFor="password">Password</Label>
                    <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} required className="mt-1 pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[2.4rem] text-muted-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <div className="relative">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <KeyRound className="absolute left-3 top-[2.4rem] h-5 w-5 text-muted-foreground" />
                    <Input id="confirm-password" name="confirm-password" type={showConfirmPassword ? "text" : "password"} required className="mt-1 pl-10 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-[2.4rem] text-muted-foreground">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
            </div>
             {role === 'manufacturer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="country">Country</Label>
                         <Select onValueChange={setCountry} value={country}>
                            <SelectTrigger id="country" className="mt-1">
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {africanCountries.map(c => (
                                  <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {country === 'kenya' && (
                         <div>
                            <Label htmlFor="county">County</Label>
                            <Select>
                                <SelectTrigger id="county" className="mt-1">
                                    <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kenyanCounties.map(county => (
                                        <SelectItem key={county} value={county.toLowerCase()}>{county}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                     <div className="md:col-span-2">
                        <Label htmlFor="category">Business Category</Label>
                        <Select>
                            <SelectTrigger id="category" className="mt-1">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="packaging">Packaging</SelectItem>
                                <SelectItem value="chemicals">Chemicals</SelectItem>
                                <SelectItem value="construction">Construction</SelectItem>
                                <SelectItem value="food">Food & Beverage</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
             {country && country !== 'kenya' && (
                <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle>Expanding Soon!</AlertTitle>
                    <AlertDescription>
                        Tradinta's full seller services are currently optimized for Kenya. You can still create an account, and we'll notify you as soon as we launch full support in your country.
                    </AlertDescription>
                </Alert>
             )}
             <div className="flex items-center">
                <Checkbox id="terms" name="terms" required/>
                <Label htmlFor="terms" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    I agree to the <Link href="#" className="text-blue-600">Terms and Conditions</Link>
                </Label>
              </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Login here
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
            src="https://picsum.photos/seed/signup-new/1200/1800"
            alt="Silhouettes of factories and trade routes"
            fill
            className="object-cover"
            data-ai-hint="digital trade web"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-orange-500/20"></div>
      </div>
    </div>
  );
}
