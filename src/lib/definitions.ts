

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  imageHint: string;
  rating: number;
  reviewCount: number;
  manufacturerId: string; // Firebase UID of the manufacturer
  isVerified?: boolean;
  status?: 'published' | 'draft' | 'archived'; // Add status to Product
  isSponsored?: boolean; // Added for marketing features
};

export type Order = {
  id: string;
  productName: string;
  customerName: string;
  date: string;
  quantity: number;
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
};

export type Campaign = {
  id: string;
  name: string;
  status: 'Active' | 'Draft' | 'Expired';
  startDate: string;
  endDate: string;
  budget: number;
  impressions: number;
  clicks: number;
};

export type Manufacturer = {
  id: string; // Firebase UID
  shopId: string; // Short, unique, URL-friendly ID
  shopName?: string;
  tagline?: string;
  slug: string;
  name: string;
  logoUrl?: string;
  logoHistory?: string[]; // Array of previously used logo URLs
  overview: string;
  industry: string;
  location: string;
  country?: string;
  county?: string;
  memberSince: number;
  rating: number;
  isVerified: boolean; // This is a computed field in the final product data
  verificationStatus?: 'Unsubmitted' | 'Pending Legal' | 'Pending Admin' | 'Action Required' | 'Verified'; // The source of truth
  acceptsTradPay: boolean;
  certifications: string[];
  businessType: string;
  workforceSize: string;
  exportMarkets: string[];
  productionCapacity: string;
  paymentMethods: string[];
  deliveryTerms: string[];
  leadTime: string;
  moq: number;
  reviews: {
    id: string;
    author: string;
    rating: number;
    comment: string;
  }[];
  suspensionDetails?: {
    isSuspended: boolean;
    reason: string;
    prohibitions: string[];
    publicDisclaimer: boolean;
  };
  contactEmail?: string;
  website?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
  theme?: string;
};

export type Review = {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore timestamp
  status: 'pending' | 'approved' | 'rejected';
};

    
