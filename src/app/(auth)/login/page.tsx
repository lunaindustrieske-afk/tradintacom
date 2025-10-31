
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/logo";
import Image from "next/image";
import { useState } from "react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, LogOut, LayoutDashboard, Loader2 } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a10 10 0 0 0-3.91 19.85" />
        <path d="M22 12a10 10 0 0 0-19.85-3.91" />
        <path d="M12 22a10 10 0 0 0 19.85-3.91" />
        <path d="M2 12a10 10 0 0 0 3.91 9.85" />
      </svg>
    );
  }
  
  function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
        <path d="M10 2c1 .5 2 2 2 5" />
      </svg>
    );
  }

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        toast({ title: "Authentication service not available.", variant: "destructive"});
        return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        setShowVerificationAlert(true);
        // Do not proceed with login
        await auth.signOut(); 
        return;
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push('/dashboards/seller-centre');
    } catch (error: any) {
       let description = error.message;
        if (error.code === 'auth/invalid-credential') {
            description = 'Incorrect email or password. Please try again.';
        }
      toast({
        title: "Login Failed",
        description: description,
        variant: "destructive",
      });
    }
  };
  
  const handleResendVerification = () => {
    // This is a placeholder. A server action would be needed to implement resending.
    toast({
      title: "Verification Email Sent",
      description: "A new verification link has been sent to your email address.",
    });
    setShowVerificationAlert(false);
  };
  
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
  };

  const LoginFormComponent = () => (
    <>
        <div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 font-headline">
            Welcome Back to Tradinta.
        </h2>
        </div>
        {showVerificationAlert && (
            <Alert variant="destructive">
            <Mail className="h-4 w-4" />
            <AlertTitle>Email Not Verified</AlertTitle>
            <AlertDescription>
                You must verify your email address before you can log in. Check your inbox for a verification link.
                <Button variant="link" className="p-0 h-auto ml-1" onClick={handleResendVerification}>Resend link</Button>
            </AlertDescription>
            </Alert>
        )}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4 rounded-md shadow-sm">
            <div>
            <Label htmlFor="email-phone">Email or Phone number</Label>
            <Input
                id="email-phone"
                name="email-phone"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            </div>
            <div>
            <Label htmlFor="password">Password</Label>
            <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            </div>
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center">
            <Checkbox id="remember-me" name="remember-me" />
            <Label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
            </Label>
            </div>

            <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-500 dark:hover:text-blue-400">
                Forgot Password?
            </Link>
            </div>
        </div>

        <div>
            <Button type="submit" className="w-full">
            Login
            </Button>
        </div>
        </form>

        <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
        </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
        <Button variant="outline">
            <GoogleIcon className="mr-2 h-4 w-4" />
            Google
        </Button>
        <Button variant="outline">
            <AppleIcon className="mr-2 h-4 w-4" />
            Apple
        </Button>
        </div>

        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
        New to Tradinta?{' '}
        <Link href="/signup" className="font-medium text-orange-600 hover:text-orange-500 dark:text-orange-500 dark:hover:text-orange-400">
            Sign up here
        </Link>
        </p>
    </>
  );

  const AlreadyLoggedInComponent = () => (
    <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50">You are already logged in</h2>
        <p className="mt-2 text-muted-foreground">
            You are signed in as <strong className="text-foreground">{user?.email}</strong>.
        </p>
        <div className="mt-6 space-y-3">
             <Button className="w-full" asChild>
                <Link href="/dashboards/seller-centre">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Go to Dashboard
                </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Log out to switch accounts
            </Button>
        </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-blue-700 to-orange-500 lg:block">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-8">
            <Logo className="w-40" />
            <div className="text-white">
                <h1 className="text-4xl font-bold font-headline">Powering Africa’s Manufacturers.</h1>
                <p className="mt-2 text-lg text-blue-100">Your gateway to a continental market.</p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1/2">
             <Image
                src="https://picsum.photos/seed/login-bg/1200/800"
                alt="Abstract digital warehouse"
                fill
                className="object-cover opacity-20"
                data-ai-hint="digital warehouse"
                />
            </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
           {isUserLoading ? (
            <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
           ) : user ? (
            <AlreadyLoggedInComponent />
           ) : (
            <LoginFormComponent />
           )}
        </div>
      </div>
    </div>
  );
}
