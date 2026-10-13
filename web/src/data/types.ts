export type ProductType = "saree" | "jewellery";

export interface Product {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  category: string; // category slug
  occasions: string[]; // occasion slugs
  fabric: string;
  color: string;
  images: string[];
  mrp: number;
  salePrice?: number;
  stock: number;
  sizes: string[];
  description: string;
  details: { label: string; value: string }[];
  care: string;
  published: boolean;
  featured: boolean;
  bestseller: boolean;
  isNew: boolean;
  rating: number;
  reviews: number;
  sold: number;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  image: string;
  blurb: string;
}

export interface Occasion {
  slug: string;
  name: string;
  image: string;
  blurb: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  city: string;
  joinedAt: string;
  addresses: Address[];
}

export type OrderStatus = "placed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  size?: string;
}

export interface Order {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  address: Address;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "UPI" | "Card" | "Cash on delivery" | "Net banking";
  createdAt: string;
  estimatedDelivery: string;
  timeline: { status: OrderStatus; at: string; note?: string }[];
}

export interface Coupon {
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  appliesTo: "all" | "saree" | "jewellery";
  active: boolean;
  expiresAt: string;
  used: number;
}

export interface Banner {
  id: string;
  title: string;
  body: string;
  image: string;
  cta: string;
  link: string;
  active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  blurb: string;
  image: string;
  productIds: string[];
  featured: boolean;
}

export interface Attributes {
  colors: { name: string; hex: string }[];
  fabrics: string[];
  sizes: string[];
}

export interface CartLine {
  productId: string;
  qty: number;
  size?: string;
}
