

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Building, MapPin, Clock, Package, Hammer, ShoppingCart } from 'lucide-react';
import { RequestQuoteModal } from '@/components/request-quote-modal';
import type { Product } from '@/lib/definitions';

type ProductWithShopId = Product & {
  shopId: string;
  slug: string;
  manufacturerName?: string;
  manufacturerLocation?: string;
  leadTime?: string;
  moq?: number;
  variants: { price: number, retailPrice?: number }[];
  isVerified?: boolean;
  isSponsored?: boolean;
  isForging?: boolean;
  listOnTradintaDirect?: boolean;
  imageHint?: string;
};

interface ProductCardProps {
    product: ProductWithShopId;
}

export function ProductCard({ product }: ProductCardProps) {
    const isDirect = product.listOnTradintaDirect;
    const price = isDirect ? (product.variants?.[0]?.retailPrice ?? 0) : (product.variants?.[0]?.price ?? 0);

    return (
         <Card key={product.id} className="overflow-hidden group flex flex-col hover:shadow-lg transition-all duration-300">
            <Link href={`/products/${product.shopId}/${product.slug}`} className="block relative w-full aspect-square">
                 <Image
                    src={product.imageUrl || 'https://i.postimg.cc/j283ydft/image.png'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    data-ai-hint={product.imageHint}
                  />
                  <div className='absolute top-2 left-2 flex flex-col gap-1'>
                    {product.isSponsored && <Badge variant="secondary" className="bg-yellow-200 text-yellow-800 border-yellow-300">Sponsored</Badge>}
                    {product.isForging && <Badge className="bg-orange-500 text-white"><Hammer className="w-3 h-3 mr-1"/> Forging Deal</Badge>}
                    {isDirect && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3"/> Direct
                        </Badge>
                    )}
                  </div>
            </Link>
            <div className="p-3 flex-grow flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3" />
                        <span className="font-medium truncate">{product.manufacturerName || 'Tradinta Seller'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{product.manufacturerLocation || 'Kenya'}</span>
                    </div>
                </div>
                 <h3 className="font-semibold leading-tight h-10 line-clamp-2 text-sm">
                    {product.name}
                  </h3>
                   <div className="flex items-baseline justify-between">
                    <p className="text-base font-bold text-foreground">
                      {price > 0 ? `KES ${price.toLocaleString()}`: 'Inquire for Price'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold">{product.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  {!isDirect && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                        <Package className="w-3 h-3" />
                        <span>MOQ: {product.moq || 1} units</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Lead: {product.leadTime || '3-5d'}</span>
                        </div>
                    </div>
                  )}
              </div>
              {isDirect ? (
                  <Button size="sm" className="w-full mt-2"><ShoppingCart className="mr-2 h-4 w-4"/>Add to Cart</Button>
              ) : (
                <RequestQuoteModal product={product}>
                  <Button size="sm" className="w-full mt-2">Request Quote</Button>
                </RequestQuoteModal>
              )}
            </div>
        </Card>
    );
}
