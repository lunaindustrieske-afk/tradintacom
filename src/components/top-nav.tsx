
"use client";

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown, Heart, Mail, UserPlus, Sparkles, Wallet } from 'lucide-react';
import { Logo } from './logo';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { ModeToggle } from './mode-toggle';
import { collection, query, where } from 'firebase/firestore';
import { getBrandingLogos } from '@/app/lib/data';
import Image from 'next/image';
import { Separator } from './ui/separator';

function UserMenu() {
    const { user, isUserLoading, role } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
      if (!auth) return;
      await signOut(auth);
      router.push('/');
    };

    const conversationsCollectionPath = React.useMemo(() => {
        if (!user) return null;
        return role === 'manufacturer' ? `manufacturers/${user.uid}/conversations` : `users/${user.uid}/conversations`;
    }, [user, role]);

    const unreadConversationsQuery = useMemoFirebase(() => {
        if (!firestore || !conversationsCollectionPath) return null;
        return query(collection(firestore, conversationsCollectionPath), where('isUnread', '==', true));
    }, [firestore, conversationsCollectionPath]);

    const { data: unreadConversations } = useCollection(unreadConversationsQuery);
    const hasUnreadMessages = unreadConversations && unreadConversations.length > 0;

    if (isUserLoading) {
      return null; // Or a loading spinner
    }

    if (user) {
        return (
          <div className="flex items-center gap-2">
              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                           <Button asChild variant="ghost" size="icon">
                              <Link href="/buyer/wishlist">
                                <Heart className="h-5 w-5" />
                                <span className="sr-only">Wishlist</span>
                              </Link>
                          </Button>
                      </TooltipTrigger>
                       <TooltipContent><p>My Wishlist</p></TooltipContent>
                  </Tooltip>
                   <Tooltip>
                      <TooltipTrigger asChild>
                          <Button asChild variant="ghost" size="icon" className="relative">
                              <Link href={role === 'manufacturer' ? "/dashboards/seller-centre/messages" : "/dashboards/buyer/messages"}>
                                <Mail className="h-5 w-5" />
                                <span className="sr-only">Messages</span>
                                {hasUnreadMessages && (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                    </span>
                                )}
                              </Link>
                          </Button>
                      </TooltipTrigger>
                       <TooltipContent><p>Messages</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL || "https://picsum.photos/seed/user-avatar/32/32"} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/dashboards/seller-centre">My Tradinta</Link></DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
    }

    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                 <Button asChild>
                    <Link href="/signup">
                      <UserPlus className="mr-2" />
                      Sign Up
                    </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create an account</p>
              </TooltipContent>
            </Tooltip>
        </div>
      </TooltipProvider>
    )
  }

export function TopNav() {

  const [logos, setLogos] = React.useState({
    theFoundryLogoUrl: "https://i.postimg.cc/VkfCYdsM/image.png"
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-auto flex items-center gap-4">
            <Logo />
             <nav className="hidden items-center gap-4 text-sm md:flex">
                <Link href="/products" className='font-medium text-muted-foreground transition-colors hover:text-primary'>
                    Products
                </Link>
                <Separator orientation="vertical" className="h-4" />
                <Link href="/foundry" className='font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1'>
                    <Image src={logos.theFoundryLogoUrl} alt="The Foundry" width={32} height={32} className="w-8 h-8" />
                    The Foundry
                </Link>
                <Separator orientation="vertical" className="h-4" />
                <Link href="/blog" className='font-medium text-muted-foreground transition-colors hover:text-primary'>
                    Insights
                </Link>
                <Separator orientation="vertical" className="h-4" />
                 <Link href="/marketing-plans" className='font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1'>
                    <Image src="https://i.postimg.cc/SNyRBRG5/image.png" alt="Tradinta Marketing" width={24} height={24} />
                    Marketing
                </Link>
                 <Separator orientation="vertical" className="h-4" />
                <Link href="/tradpay/about" className='font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1'>
                    <Image src="https://i.postimg.cc/pTmCFzGc/image-Photoroom.png" alt="TradPay" width={136} height={41} className="h-10 w-auto" data-ai-hint="tradpay logo" />
                </Link>
                <Separator orientation="vertical" className="h-4" />
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-primary">
                        Dashboards <ChevronDown className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild><Link href="/dashboards/seller-centre">Seller Centre</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboards/buyer">Buyer Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboards/distributor">Distributor Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Admin Roles</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                               <DropdownMenuItem asChild><Link href="/dashboards/admin">Admin</Link></DropdownMenuItem>
                               <DropdownMenuItem asChild><Link href="/dashboards/operations-manager">Operations Manager</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/marketing-manager">Marketing Manager</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/support">Support</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/finance">Finance</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/legal-compliance">Legal & Compliance</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/content-management">Content Management</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/user-management">User Management</Link></DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                         <DropdownMenuSub>
                          <DropdownMenuSubTrigger>TradPay Roles</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                               <DropdownMenuItem asChild><Link href="/dashboards/tradpay-admin">TradPay Admin</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/dashboards/tradcoin-airdrop">TradCoin Airdrop</Link></DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                         <DropdownMenuItem asChild><Link href="/dashboards/logistics">Logistics Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboards/analytics">Analytics Dashboard</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboards/growth-partner">Growth Partner</Link></DropdownMenuItem>
                        <DropdownMenuItem asChild><Link href="/dashboards/super-admin">Super Admin</Link></DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </nav>
        </div>
        
        <div className="flex items-center justify-end space-x-2">
            <UserMenu />
            <ModeToggle />
        </div>
      </div>
    </header>
  );
}
