
'use client';

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { categories } from '@/app/lib/categories';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function CategoryScroller() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const selectedCategory = searchParams.get('category') || 'all';

    const handleSelect = (category: string) => {
        const newCategory = category === 'all' ? undefined : category;
        const currentParams = new URLSearchParams(searchParams.toString());
        if (newCategory) {
            currentParams.set('category', newCategory);
        } else {
            currentParams.delete('category');
        }
        router.push(`${pathname}?${currentParams.toString()}`);
    };
    
    return (
      <div className="md:grid md:grid-cols-5 lg:grid-cols-6 md:gap-4">
        <div className="md:hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-4 pb-4">
              <Card
                className={cn(
                  "w-40 flex-shrink-0 cursor-pointer hover:border-primary transition-all",
                  selectedCategory === 'all' ? 'border-primary border-2' : ''
                )}
                onClick={() => handleSelect('all')}
              >
                <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                  <div className="relative aspect-video w-full">
                    <Image src="https://picsum.photos/seed/all-cats/400/300" alt="All Categories" fill className="object-cover rounded-t-lg" />
                  </div>
                  <div className="p-2 text-center flex-grow flex items-center justify-center h-16">
                    <p className="font-semibold text-sm leading-tight whitespace-normal">All Categories</p>
                  </div>
                </CardContent>
              </Card>
              {categories.map(category => {
                const image = PlaceHolderImages.find(img => img.id === category.imageId);
                return (
                  <Card
                    key={category.id}
                    className={cn(
                      "w-40 flex-shrink-0 cursor-pointer hover:border-primary transition-all",
                      selectedCategory === category.name ? 'border-primary border-2' : ''
                    )}
                    onClick={() => handleSelect(category.name)}
                  >
                    <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                      <div className="relative aspect-video w-full">
                        <Image src={image?.imageUrl || `https://picsum.photos/seed/${category.id}/400/300`} alt={category.name} fill className="object-cover rounded-t-lg" data-ai-hint={image?.imageHint}/>
                      </div>
                      <div className="p-2 text-center flex-grow flex items-center justify-center h-16">
                        <p className="font-semibold text-sm leading-tight whitespace-normal">{category.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
        <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 md:gap-4 md:col-span-full">
           <Card 
                className={cn(
                    "cursor-pointer hover:border-primary transition-all",
                    selectedCategory === 'all' ? 'border-primary border-2' : ''
                )}
                onClick={() => handleSelect('all')}
            >
                <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                    <div className="relative aspect-video w-full">
                        <Image src="https://picsum.photos/seed/all-cats/400/300" alt="All Categories" fill className="object-cover rounded-t-lg" />
                    </div>
                    <div className="p-2 text-center flex-grow flex items-center justify-center h-16">
                        <p className="font-semibold text-sm leading-tight whitespace-normal">All Categories</p>
                    </div>
                </CardContent>
            </Card>
            {categories.map(category => {
                const image = PlaceHolderImages.find(img => img.id === category.imageId);
                return (
                    <Card 
                        key={category.id} 
                        className={cn(
                            "cursor-pointer hover:border-primary transition-all",
                            selectedCategory === category.name ? 'border-primary border-2' : ''
                        )}
                        onClick={() => handleSelect(category.name)}
                    >
                        <CardContent className="p-0 flex flex-col items-center justify-center h-full">
                            <div className="relative aspect-video w-full">
                                <Image src={image?.imageUrl || `https://picsum.photos/seed/${category.id}/400/300`} alt={category.name} fill className="object-cover rounded-t-lg" data-ai-hint={image?.imageHint}/>
                            </div>
                            <div className="p-2 text-center flex-grow flex items-center justify-center h-16">
                                <p className="font-semibold text-sm leading-tight whitespace-normal">{category.name}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    </div>
    );
};
