import Image from 'next/image';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type LogoProps = {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("relative h-10 w-32", className)}>
      <Image
        src="https://i.postimg.cc/NGkTK7Jc/Gemini-Generated-Image-e6p14ne6p14ne6p1-removebg-preview.png"
        alt="Tradinta Logo"
        fill
        className="object-contain"
        priority
      />
    </Link>
  );
}
