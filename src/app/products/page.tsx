

import { ProductsPageClient } from './products-page-client';
import { type Product } from '@/lib/definitions';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { getAuth } from "firebase-admin/auth";
import { cookies } from 'next/headers';


type ProductWithShopId = Product & { shopId: string; slug: string; };

export default async function ProductsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const cookieStore = cookies();
  const session = cookieStore.get('session')?.value;
  let userId = null;
  if(session) {
      try {
        const decodedClaims = await getAuth().verifySessionCookie(session, true);
        userId = decodedClaims.uid;
      } catch (error) {
        console.log("Could not verify session cookie: ", error);
      }
  }
  
  // Fetch initial products on the server using the new Discovery Engine.
  const initialProducts = await getRankedProducts(userId);
  const initialCategory = searchParams?.category as string || 'all';

  return <ProductsPageClient initialProducts={initialProducts} initialCategory={initialCategory} />;
}
