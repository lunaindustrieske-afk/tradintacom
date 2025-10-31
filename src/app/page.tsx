

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Truck,
  BarChart,
  Coins,
  Building,
  Loader2,
  Book,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { getHomepageBanners, getAllBlogPosts } from '@/app/lib/data';
import type { Product, Manufacturer } from '@/lib/definitions';
import { getRankedProducts } from '@/services/DiscoveryEngine';
import { categories as allCategories } from '@/app/lib/categories';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ProductCard } from '@/components/product-card';


type HomepageBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
};

type BlogPost = {
  id:string;
  title: string;
  slug: string;
};

type ProductWithShopId = Product & { shopId: string; slug: string; variants: { price: number }[], isSponsored?: boolean, manufacturerName?: string; };

const valueHighlights = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-primary" />,
    title: 'Verified Manufacturers',
    description: 'Connect with trusted, vetted partners.',
  },
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: 'Secure Payments via TradPay',
    description: 'Transact with confidence using our escrow system.',
  },
  {
    icon: <Truck className="h-10 w-10 text-primary" />,
    title: 'Reliable Logistics',
    description: 'Seamless delivery across the continent.',
  },
  {
    icon: <BarChart className="h-10 w-10 text-primary" />,
    title: 'Marketing Tools for Growth',
    description: 'Amplify your reach and boost your sales.',
  },
  {
    icon: <Coins className="h-10 w-10 text-primary" />,
    title: 'Powered by TradCoin',
    description: 'Earn rewards and incentives on every transaction.',
  },
];

const trustMetrics = [
    { value: '1,200+', label: 'Verified Businesses' },
    { value: '10,000+', label: 'B2B Transactions' },
    { value: 'KES 80M+', label: 'Processed via TradPay' },
    { value: '4.8/5', label: 'Manufacturer Satisfaction' },
];

const HeroContent = () => (
  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4">
    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-headline">
      Powering Africa’s Manufacturers — Buy Direct. Sell Smart.
    </h1>
    <p className="text-lg md:text-xl text-primary-foreground max-w-3xl mb-8">
      Tradinta connects verified manufacturers, distributors, and buyers across Africa with secure payments and marketing tools.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
      <Button size="lg" asChild>
        <Link href="/signup">Open a Manufacturer Shop</Link>
      </Button>
      <Button size="lg" variant="secondary" asChild>
        <Link href="/products">Explore Verified Products</Link>
      </Button>
    </div>
  </div>
);


const HeroCarousel = async () => {
    const banners = await getHomepageBanners();

    if (!banners || banners.length === 0) {
      // Fallback static banner
       return (
          <div className="relative w-full h-full">
            <Image
              src="https://i.postimg.cc/xCdXsyMj/tradinta-marketting.jpg"
              alt="Tradinta Commerce"
              fill
              className="object-cover"
              data-ai-hint="industrial warehouse"
            />
             <div className="absolute inset-0 bg-blue-900/30 dark:bg-blue-900/50" />
             <HeroContent />
          </div>
      );
    }
    return (
      <Carousel className="w-full h-full" opts={{ loop: true }} >
        <CarouselContent className="h-full">
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative w-full h-full">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
                 <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-headline">
                    {banner.title}
                  </h1>
                  {banner.subtitle && <p className="text-lg md:text-xl text-primary-foreground max-w-3xl mb-8">
                    {banner.subtitle}
                  </p>}
                  {banner.link && <Button size="lg" asChild>
                    <Link href={banner.link}>Learn More</Link>
                  </Button>}
                </div>
              </div>
            </CarouselItem>
          ))}
           {/* Add the main static content as the last slide */}
           <CarouselItem>
                <div className="relative w-full h-full">
                    <Image
                        src="https://i.postimg.cc/xCdXsyMj/tradinta-marketting.jpg"
                        alt="Tradinta Commerce"
                        fill
                        className="object-cover"
                        data-ai-hint="digital trade network"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-orange-500/20" />
                    <HeroContent />
                </div>
            </CarouselItem>
        </CarouselContent>
        {banners.length > 0 && (
            <>
                <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 text-white border-white hover:bg-white/20 hover:text-white" />
                <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 text-white border-white hover:bg-white/20 hover:text-white" />
            </>
        )}
      </Carousel>
    );
  };


export default async function HomePage() {
  const blogPosts = await getAllBlogPosts();
  const recentBlogPosts = blogPosts.slice(0, 3);
  const allProducts = (await getRankedProducts(null)) as ProductWithShopId[];
  const featuredProducts = allProducts.filter(p => p.isSponsored).slice(0, 4);
  const organicProducts = allProducts.filter(p => !p.isSponsored).slice(0, 4 - featuredProducts.length);
  const finalFeaturedProducts = [...featuredProducts, ...organicProducts];

  const featuredManufacturers = finalFeaturedProducts.reduce((acc, product) => {
    if (product.manufacturerId && !acc.find(m => m.id === product.manufacturerId)) {
      acc.push({
        id: product.manufacturerId,
        slug: product.manufacturerSlug || '',
        name: product.manufacturerName || 'Tradinta Seller',
        industry: product.category,
        logo: 'https://picsum.photos/seed/mfg-placeholder/48/48',
      });
    }
    return acc;
  }, [] as { id: string; slug: string; name: string; industry: string; logo: string; }[]).slice(0, 4);


  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-12 md:gap-20">
          {/* 1. Hero Section */}
          <section className="relative h-[500px] md:h-[600px] rounded-lg overflow-hidden -mt-8 -mx-4">
            <HeroCarousel />
          </section>

          {/* 2. Key Value Highlights */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
            {valueHighlights.map((highlight) => (
              <div key={highlight.title} className="flex flex-col items-center gap-2">
                {highlight.icon}
                <h3 className="font-semibold">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </div>
            ))}
          </section>

          {/* 3. Featured Categories / Products */}
          <section>
            <h2 className="text-3xl font-bold mb-6 text-center font-headline">
              Featured Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                {allCategories.slice(0, 8).map((category) => {
                    const image = PlaceHolderImages.find(img => img.id === category.imageId);
                    const href = `/products?category=${encodeURIComponent(category.name)}`;
                    return (
                        <Link href={href} key={category.id}>
                        <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden group">
                            <CardContent className="p-0 flex flex-col items-center justify-center text-center h-full">
                                <div className="relative aspect-video w-full">
                                    <Image 
                                        src={image?.imageUrl || 'https://placehold.co/400x300'} 
                                        alt={category.name} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform" 
                                        data-ai-hint={image?.imageHint}
                                    />
                                </div>
                                <div className="p-2 text-center flex-grow flex items-center justify-center h-16">
                                    <p className="font-semibold text-sm leading-tight whitespace-normal">{category.name}</p>
                                </div>
                            </CardContent>
                        </Card>
                        </Link>
                    )
                })}
            </div>
          </section>
          
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold font-headline">Featured Products</h2>
              <Button variant="outline" asChild>
                <Link href="/products">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {finalFeaturedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>

          {/* 4. Manufacturer Spotlight */}
          <section className="bg-muted py-12 rounded-lg -mx-4 px-4">
            <div className="container mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center font-headline">Featured Manufacturers</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {featuredManufacturers.map(mfg => (
                        <div key={mfg.name} className="flex flex-col items-center text-center gap-4">
                            <Image src={mfg.logo} alt={mfg.name} width={64} height={64} className="rounded-full" />
                            <div>
                                <h4 className="font-semibold">{mfg.name}</h4>
                                <p className="text-sm text-muted-foreground">{mfg.industry}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild><Link href={`/manufacturer/${mfg.slug}`}>View Shop</Link></Button>
                        </div>
                    ))}
                </div>
            </div>
          </section>

          {/* 5. About Tradinta */}
          <section className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 font-headline">About Tradinta</h2>
            <p className="text-muted-foreground mb-4">
                Tradinta is Kenya’s first B2B marketplace built exclusively for manufacturers. We help factories, wholesalers, and retailers connect, transact, and grow using digital tools built for Africa’s supply chain.
            </p>
            <Button variant="link" asChild>
                <Link href="/pages/about-us">Learn More <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </section>

          {/* News & Insights */}
           <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold font-headline">News & Insights</h2>
              <Button variant="outline" asChild>
                <Link href="/blog">
                  Read All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentBlogPosts && recentBlogPosts.length > 0 ? (
                recentBlogPosts.map(post => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                      <Button variant="link" asChild className="p-0"><Link href={`/blog/${post.slug}`}>Read More</Link></Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="md:col-span-3 text-center text-muted-foreground py-8">
                  <Book className="mx-auto h-12 w-12 mb-4" />
                  <p>No news articles published yet. Check back soon!</p>
                </div>
              )}
            </div>
          </section>


          {/* 6. TradPay & TradCoin Promo */}
          <section className="grid md:grid-cols-2 gap-8 items-center">
            <Card className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2 font-headline">TradPay</h3>
                <p className="text-muted-foreground mb-4">Secure, instant payments with escrow protection.</p>
                <Button asChild><Link href="/tradpay/coming-soon">Try TradPay</Link></Button>
            </Card>
            <Card className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2 font-headline">TradCoin</h3>
                <p className="text-muted-foreground mb-4">Earn, trade, and save with Africa’s first manufacturing token.</p>
                <Button variant="secondary">Learn About TradCoin</Button>
            </Card>
          </section>

          {/* 7. Marketing & Ambassador Highlight */}
          <section className="bg-primary text-primary-foreground rounded-lg p-8 grid md:grid-cols-2 gap-8 items-center">
            <div>
                <h2 className="text-3xl font-bold mb-4 font-headline">Reach 10x More Buyers</h2>
                <p className="mb-4">Our Ambassadors and marketing packages help your factory reach thousands of new buyers across the continent.</p>
                <Button variant="secondary" asChild><Link href="/marketing-plans">Explore Marketing</Link></Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/50 p-4 rounded">
                    <p className="text-2xl font-bold">250+</p>
                    <p>Manufacturers Promoted</p>
                </div>
                <div className="bg-primary/50 p-4 rounded">
                    <p className="text-2xl font-bold">4,000+</p>
                    <p>Leads Generated Monthly</p>
                </div>
            </div>
          </section>

          {/* 8. Metrics / Trust Builders */}
          <section>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                  {trustMetrics.map(metric => (
                      <div key={metric.label}>
                          <p className="text-4xl font-bold text-primary">{metric.value}</p>
                          <p className="text-muted-foreground">{metric.label}</p>
                      </div>
                  ))}
              </div>
          </section>

          {/* 10. Call-to-Action Strip */}
          <section className="bg-muted rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Join hundreds of manufacturers growing with Tradinta.</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/signup">Register as Manufacturer</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/products">Browse Wholesale Offers</Link>
                </Button>
              </div>
          </section>
        </div>
      </div>
      
    </>
  );
}
