import type { Attributes, Banner, Category, Collection, Coupon, Customer, Occasion, Order, OrderStatus, Product } from "./types";
import { addBusinessDays } from "../lib/format";

const DAY = 86_400_000;
const daysAgo = (d: number, h = 11) => new Date(Date.now() - d * DAY - h * 3_600_000).toISOString();

export const categories: Category[] = [
  { id: "c1", slug: "half-sarees", name: "Half sarees", type: "saree", image: "halfsaree-lavender-peacock", blurb: "Pattu pavadai and dhavani sets, ready for festivals and functions." },
  { id: "c2", slug: "banarasi", name: "Banarasi", type: "saree", image: "saree-banarasi-violet-detail", blurb: "Katan silk with jaal and butta brocade." },
  { id: "c3", slug: "soft-silk", name: "Soft silk", type: "saree", image: "saree-soft-silk-mustard", blurb: "Light drapes for long days and festive lunches." },
  { id: "c4", slug: "tissue", name: "Tissue silk", type: "saree", image: "saree-ivory-tissue", blurb: "Metallic sheen for receptions and evenings." },
  { id: "c5", slug: "handloom", name: "Handloom silks", type: "saree", image: "saree-sambalpuri-red", blurb: "Ikat and regional weaves from small looms." },
  { id: "c6", slug: "temple", name: "Temple jewellery", type: "jewellery", image: "jewel-temple-necklace", blurb: "Antique gold finish, deity and lotus motifs." },
  { id: "c7", slug: "necklaces", name: "Necklaces & harams", type: "jewellery", image: "jewel-kemp-necklace", blurb: "Kemp, pearl and bead pieces to sit on the blouse line." },
  { id: "c8", slug: "earrings", name: "Jimikki & earrings", type: "jewellery", image: "jewel-gold-earrings", blurb: "Bell drops, studs and ear chains." },
  { id: "c9", slug: "bangles", name: "Bangles & kadas", type: "jewellery", image: "jewel-enamel-bangle", blurb: "Meenakari, kemp and plain gold-finish kadas." },
  { id: "c10", slug: "bridal-sets", name: "Bridal sets", type: "jewellery", image: "jewel-bridal-set", blurb: "Necklace and earrings matched as one set." },
];

export const occasions: Occasion[] = [
  { slug: "bridal", name: "Bridal", image: "jewel-bridal-set", blurb: "Bridal jewellery sets and temple pieces" },
  { slug: "wedding-guest", name: "Wedding guest", image: "halfsaree-kalamkari-rani", blurb: "Rich colour without upstaging the bride" },
  { slug: "reception", name: "Reception", image: "saree-banarasi-violet", blurb: "Tissue and Banarasi that catch evening light" },
  { slug: "festive", name: "Festive", image: "halfsaree-rust-maroon", blurb: "Deepavali, Pongal, Navaratri golu visits" },
  { slug: "everyday", name: "Office & everyday", image: "saree-soft-silk-mustard", blurb: "Soft silks that hold pleats through the day" },
];

type Seed = Omit<Product, "id" | "slug" | "published" | "createdAt" | "care" | "details"> & {
  details?: Product["details"];
  care?: string;
  age: number;
};

const SAREE_CARE = "Dry clean only. Store folded in a muslin cloth and refold every few months so the zari doesn't crease.";
const JEWEL_CARE = "Keep away from perfume and water. Wipe with a dry cloth after wearing and store in the pouch provided.";
const HALF_SAREE_SIZES = ["Semi-stitched", "Ready to wear S", "Ready to wear M", "Ready to wear L", "Ready to wear XL"];
const SAREE_SIZES = ["Unstitched blouse", "Stitched blouse 34", "Stitched blouse 36", "Stitched blouse 38", "Stitched blouse 40"];

const seeds: Seed[] = [
  {
    name: "Rust pattu pavadai with maroon dhavani",
    type: "saree", category: "half-sarees", occasions: ["festive", "wedding-guest"], fabric: "Pure silk", color: "Rust",
    images: ["halfsaree-rust-maroon"],
    mrp: 14800, salePrice: 13200, stock: 9, sizes: HALF_SAREE_SIZES,
    description: "Rust silk pavadai with a broad gold zari border, paired with a deep maroon dhavani and a matching blouse. Made for temple visits and Pongal mornings.",
    details: [{ label: "Set includes", value: "Pavadai, dhavani, blouse fabric" }, { label: "Zari", value: "Gold-tone zari border" }, { label: "Skirt length", value: "40 in, adjustable" }],
    featured: true, bestseller: true, isNew: false, rating: 4.8, reviews: 52, sold: 176, age: 70,
  },
  {
    name: "Rani pink Kalamkari half saree",
    type: "saree", category: "half-sarees", occasions: ["wedding-guest", "festive"], fabric: "Silk with Kalamkari border", color: "Pink",
    images: ["halfsaree-kalamkari-rani"],
    mrp: 12600, stock: 12, sizes: HALF_SAREE_SIZES,
    description: "Rani pink silk skirt with a hand-painted Kalamkari border and a gold band at the hem, worn with a marigold dhavani and a printed blouse.",
    details: [{ label: "Set includes", value: "Pavadai, dhavani, stitched blouse" }, { label: "Border", value: "Kalamkari print with zari band" }],
    featured: true, bestseller: false, isNew: true, rating: 4.7, reviews: 18, sold: 46, age: 8,
  },
  {
    name: "Lavender silk half saree with peacock blue dhavani",
    type: "saree", category: "half-sarees", occasions: ["festive", "wedding-guest", "reception"], fabric: "Pure silk", color: "Lavender",
    images: ["halfsaree-lavender-peacock"],
    mrp: 16400, salePrice: 14900, stock: 6, sizes: HALF_SAREE_SIZES,
    description: "Pleated lavender silk pavadai with an antique gold border, finished with a peacock blue dhavani edged in zari. A quieter colour that photographs beautifully.",
    details: [{ label: "Set includes", value: "Pavadai, dhavani, blouse fabric" }, { label: "Zari", value: "Antique gold border" }],
    featured: true, bestseller: true, isNew: false, rating: 4.9, reviews: 37, sold: 129, age: 45,
  },
  {
    name: "Navy Kalamkari half saree with magenta dhavani",
    type: "saree", category: "half-sarees", occasions: ["festive", "everyday"], fabric: "Silk with Kalamkari border", color: "Navy",
    images: ["halfsaree-kalamkari-navy"],
    mrp: 13200, stock: 10, sizes: HALF_SAREE_SIZES,
    description: "Navy silk skirt with a turquoise Kalamkari border and pink zari hem, paired with a bright magenta dhavani and a printed blouse.",
    details: [{ label: "Set includes", value: "Pavadai, dhavani, stitched blouse" }, { label: "Border", value: "Kalamkari print with zari band" }],
    featured: false, bestseller: false, isNew: true, rating: 4.7, reviews: 11, sold: 29, age: 5,
  },
  {
    name: "Ivory tissue Banarasi",
    type: "saree", category: "tissue", occasions: ["reception", "festive"], fabric: "Tissue silk", color: "Ivory",
    images: ["saree-ivory-tissue"],
    mrp: 18900, stock: 8, sizes: SAREE_SIZES,
    description: "Ivory and gold tissue woven in Varanasi, with a quiet satin border. Pairs well with emerald or kemp jewellery.",
    featured: false, bestseller: false, isNew: true, rating: 4.6, reviews: 7, sold: 15, age: 14,
  },
  {
    name: "Sindoor Banarasi with paisley pallu",
    type: "saree", category: "banarasi", occasions: ["wedding-guest", "festive"], fabric: "Banarasi katan silk", color: "Red",
    images: ["saree-banarasi-red-pallu"],
    mrp: 22400, stock: 10, sizes: SAREE_SIZES,
    description: "Sindoor red katan silk with small silver buttas and a deep paisley pallu in silver zari.",
    details: [{ label: "Zari", value: "Silver zari" }, { label: "Length", value: "6.3 m with blouse" }],
    featured: false, bestseller: true, isNew: false, rating: 4.7, reviews: 33, sold: 118, age: 100,
  },
  {
    name: "Indigo violet Banarasi jaal",
    type: "saree", category: "banarasi", occasions: ["reception", "wedding-guest"], fabric: "Banarasi katan silk", color: "Purple",
    images: ["saree-banarasi-violet", "saree-banarasi-violet-detail"],
    mrp: 26900, salePrice: 23900, stock: 5, sizes: SAREE_SIZES,
    description: "Violet katan silk covered in a gold jaal of sunburst medallions. The weave is dense enough that the drape stands slightly away from the body.",
    featured: true, bestseller: false, isNew: true, rating: 4.8, reviews: 15, sold: 41, age: 20,
  },
  {
    name: "Mustard and plum soft silk",
    type: "saree", category: "soft-silk", occasions: ["everyday", "festive"], fabric: "Soft silk", color: "Mustard",
    images: ["saree-soft-silk-mustard"],
    mrp: 9800, salePrice: 8600, stock: 22, sizes: SAREE_SIZES,
    description: "Mustard pleats with a plum pallu and border. Our most re-ordered everyday silk.",
    featured: false, bestseller: true, isNew: false, rating: 4.7, reviews: 88, sold: 304, age: 150,
  },
  {
    name: "Maroon Sambalpuri ikat silk",
    type: "saree", category: "handloom", occasions: ["everyday", "festive"], fabric: "Ikat silk", color: "Maroon",
    images: ["saree-sambalpuri-red"],
    mrp: 15800, stock: 4, sizes: SAREE_SIZES,
    description: "Hand-tied ikat from Odisha with a maroon body, conch and wheel motifs on the pallu, and a fine gold stripe border.",
    featured: false, bestseller: false, isNew: false, rating: 4.6, reviews: 11, sold: 29, age: 110,
  },
  // Jewellery
  {
    name: "Lakshmi temple necklace",
    type: "jewellery", category: "temple", occasions: ["bridal", "festive"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-temple-necklace"],
    mrp: 6400, salePrice: 5600, stock: 18, sizes: ["Adjustable thread"],
    description: "Antique gold finish necklace with lotus spacers and a Lakshmi centre drop, strung on black silk thread with an adjustable tie.",
    details: [{ label: "Plating", value: "Micro gold plating, antique finish" }, { label: "Length", value: "Adjustable, 16 to 20 in" }, { label: "Weight", value: "86 g" }],
    featured: true, bestseller: true, isNew: false, rating: 4.8, reviews: 97, sold: 388, age: 130,
  },
  {
    name: "Kemp stone haram with peacock drop",
    type: "jewellery", category: "necklaces", occasions: ["bridal", "wedding-guest"], fabric: "Kemp & CZ stones", color: "Gold",
    images: ["jewel-kemp-necklace"],
    mrp: 8900, stock: 9, sizes: ["Free size"],
    description: "Long haram set with red and green kemp stones, finishing in a peacock pendant with small pearl drops.",
    details: [{ label: "Stones", value: "Kemp, CZ, shell pearl" }, { label: "Length", value: "24 in" }],
    featured: true, bestseller: true, isNew: false, rating: 4.9, reviews: 56, sold: 201, age: 95,
  },
  {
    name: "Mullai mottu spike necklace",
    type: "jewellery", category: "temple", occasions: ["festive", "bridal"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-spike-necklace"],
    mrp: 5200, stock: 12, sizes: ["Adjustable thread"],
    description: "Jasmine-bud spikes in a full circle, a traditional Kerala and Tamil Nadu pattern. Sits close at the collarbone.",
    featured: false, bestseller: false, isNew: true, rating: 4.7, reviews: 14, sold: 38, age: 11,
  },
  {
    name: "Five-line kasu haar",
    type: "jewellery", category: "necklaces", occasions: ["wedding-guest", "festive"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-layered-haar"],
    mrp: 7600, stock: 7, sizes: ["Free size"],
    description: "Five graded strands of tiny gold-finish beads gathered into a single filigree drop.",
    featured: false, bestseller: false, isNew: false, rating: 4.6, reviews: 21, sold: 66, age: 70,
  },
  {
    name: "Coin mala with silk tassel",
    type: "jewellery", category: "temple", occasions: ["festive", "everyday"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-coin-mala"],
    mrp: 4800, stock: 3, sizes: ["Adjustable thread"],
    description: "Strands of small coin-shaped beads with a red silk tassel at the back.",
    featured: false, bestseller: false, isNew: false, rating: 4.4, reviews: 10, sold: 31, age: 85,
  },
  {
    name: "Ruby drop chain pendant",
    type: "jewellery", category: "necklaces", occasions: ["everyday", "reception"], fabric: "Kemp & CZ stones", color: "Gold",
    images: ["jewel-chain-pendant"],
    mrp: 3200, stock: 25, sizes: ["Free size"],
    description: "Fine chain-link necklace with a single ruby-red stone pendant. Light enough for office wear.",
    featured: false, bestseller: false, isNew: false, rating: 4.5, reviews: 37, sold: 142, age: 65,
  },
  {
    name: "Lotus pendant thread necklace",
    type: "jewellery", category: "temple", occasions: ["festive"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-lotus-pendant"],
    mrp: 3900, stock: 10, sizes: ["Adjustable thread"],
    description: "A carved lotus pendant hung from long gold-finish bead strands with maroon thread ties.",
    featured: false, bestseller: false, isNew: false, rating: 4.5, reviews: 8, sold: 25, age: 50,
  },
  {
    name: "Emerald bead layered mala",
    type: "jewellery", category: "necklaces", occasions: ["reception", "wedding-guest"], fabric: "Glass beads & pearls", color: "Green",
    images: ["jewel-emerald-beads"],
    mrp: 5600, salePrice: 4900, stock: 6, sizes: ["Free size"],
    description: "Three layers of emerald-green glass beads with shell pearls and a ruby-tone tassel clasp. Made to go with ivory and gold sarees.",
    featured: false, bestseller: false, isNew: true, rating: 4.7, reviews: 9, sold: 27, age: 16,
  },
  {
    name: "Gold-finish jimikki earrings",
    type: "jewellery", category: "earrings", occasions: ["festive", "bridal", "everyday"], fabric: "Antique gold-plated brass", color: "Gold",
    images: ["jewel-gold-earrings"],
    mrp: 2400, stock: 30, sizes: ["Free size"],
    description: "Carved bell jimikki with fine granulation work. Push-back screw, lightweight for all-day wear.",
    featured: false, bestseller: true, isNew: false, rating: 4.8, reviews: 142, sold: 512, age: 160,
  },
  {
    name: "Meenakari enamel kada",
    type: "jewellery", category: "bangles", occasions: ["festive", "wedding-guest"], fabric: "Enamel on brass", color: "Green",
    images: ["jewel-enamel-bangle"],
    mrp: 3600, stock: 2, sizes: ["2.4", "2.6", "2.8"],
    description: "Green and red meenakari kada with makara head openings. Sold singly.",
    featured: false, bestseller: false, isNew: false, rating: 4.6, reviews: 18, sold: 54, age: 40,
  },
  {
    name: "Bridal necklace and earring set",
    type: "jewellery", category: "bridal-sets", occasions: ["bridal"], fabric: "Kemp & CZ stones", color: "Gold",
    images: ["jewel-bridal-set", "jewel-gold-earrings"],
    mrp: 9800, salePrice: 8700, stock: 5, sizes: ["Free size"],
    description: "A gold-finish necklace with matching drop earrings, made to be worn together on the wedding day.",
    details: [{ label: "Includes", value: "Necklace and a pair of drop earrings" }, { label: "Plating", value: "Micro gold plating" }],
    featured: true, bestseller: true, isNew: false, rating: 4.9, reviews: 47, sold: 133, age: 35,
  },
];

export const products: Product[] = seeds.map((s, i) => {
  const slug = s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { age, ...rest } = s;
  return {
    ...rest,
    id: `p${String(i + 1).padStart(3, "0")}`,
    slug,
    published: true,
    createdAt: daysAgo(age),
    care: s.care ?? (s.type === "saree" ? SAREE_CARE : JEWEL_CARE),
    details: s.details ?? (s.type === "saree" ? [{ label: "Length", value: "6.2 m with 0.8 m blouse" }] : [{ label: "Plating", value: "Micro gold plating" }]),
  };
});

export const attributes: Attributes = {
  colors: [
    { name: "Red", hex: "#a51f2d" },
    { name: "Maroon", hex: "#5b1424" },
    { name: "Orange", hex: "#d3701f" },
    { name: "Rust", hex: "#9e4a2a" },
    { name: "Copper", hex: "#b26b3c" },
    { name: "Mustard", hex: "#c9a227" },
    { name: "Gold", hex: "#cfae5a" },
    { name: "Ivory", hex: "#ece2cb" },
    { name: "Green", hex: "#1f6b4a" },
    { name: "Purple", hex: "#5a3e8c" },
    { name: "Bronze", hex: "#8a6a45" },
    { name: "Pink", hex: "#c2246e" },
    { name: "Lavender", hex: "#9a86b8" },
    { name: "Navy", hex: "#1f2d6b" },
  ],
  fabrics: [
    "Pure silk",
    "Silk with Kalamkari border",
    "Pure Kanjivaram silk",
    "Banarasi katan silk",
    "Soft silk",
    "Tissue silk",
    "Ikat silk",
    "Antique gold-plated brass",
    "Kemp & CZ stones",
    "Glass beads & pearls",
    "Enamel on brass",
    "Carved brass",
  ],
  sizes: ["Semi-stitched", "Ready to wear S", "Ready to wear M", "Ready to wear L", "Ready to wear XL", "Unstitched blouse", "Stitched blouse 34", "Stitched blouse 36", "Stitched blouse 38", "Stitched blouse 40", "Free size", "Adjustable thread", "Adjustable chain", "2.4", "2.6", "2.8", "One size"],
};

export const coupons: Coupon[] = [
  { code: "DEEPAM12", description: "12% off silk sarees above ₹15,000, up to ₹5,000", type: "percent", value: 12, minOrder: 15000, maxDiscount: 5000, appliesTo: "saree", active: true, expiresAt: daysAgo(-24), used: 143 },
  { code: "FIRSTDRAPE", description: "₹750 off your first order above ₹5,000", type: "flat", value: 750, minOrder: 5000, appliesTo: "all", active: true, expiresAt: daysAgo(-90), used: 311 },
  { code: "TEMPLE10", description: "10% off temple and necklace pieces", type: "percent", value: 10, minOrder: 2500, maxDiscount: 1500, appliesTo: "jewellery", active: true, expiresAt: daysAgo(-40), used: 87 },
  { code: "AADI20", description: "Aadi sale, 20% off everything", type: "percent", value: 20, minOrder: 0, maxDiscount: 6000, appliesTo: "all", active: false, expiresAt: daysAgo(60), used: 402 },
];

export const banners: Banner[] = [
  {
    id: "b1",
    title: "Deepavali silks are in",
    body: "12% off silk sarees above ₹15,000 with DEEPAM12. Free blouse stitching on every silk saree until the festival.",
    image: "halfsaree-kalamkari-rani",
    cta: "Shop festive",
    link: "/shop?occasion=festive",
    active: true,
  },
  {
    id: "b2",
    title: "Book a video drape",
    body: "Our stylists drape any saree on a model over a video call, so you see the pallu fall before you buy.",
    image: "halfsaree-lavender-peacock",
    cta: "Book a call",
    link: "/account",
    active: false,
  },
];

const idOf = (name: string) => products.find((p) => p.name === name)?.id ?? "";
export const collections: Collection[] = [
  { id: "col1", name: "Festive half sarees", blurb: "Pattu pavadai and Kalamkari sets for Pongal, Navaratri and family functions.", image: "halfsaree-kalamkari-rani", productIds: ["Rust pattu pavadai with maroon dhavani", "Rani pink Kalamkari half saree", "Lavender silk half saree with peacock blue dhavani", "Navy Kalamkari half saree with magenta dhavani"].map(idOf), featured: true },
  { id: "col2", name: "The temple jewellery edit", blurb: "Antique gold-finish pieces with lotus, jasmine-bud and coin motifs.", image: "jewel-temple-necklace", productIds: ["Lakshmi temple necklace", "Mullai mottu spike necklace", "Coin mala with silk tassel", "Lotus pendant thread necklace"].map(idOf), featured: true },
  { id: "col3", name: "Banarasi & tissue", blurb: "Brocade and metallic weaves that catch evening light.", image: "saree-banarasi-violet", productIds: ["Indigo violet Banarasi jaal", "Sindoor Banarasi with paisley pallu", "Ivory tissue Banarasi", "Emerald bead layered mala"].map(idOf), featured: true },
];

const firstNames = ["Meenakshi", "Harini", "Divya", "Lakshmi", "Priyanka", "Anjali", "Kavya", "Nithya", "Shruthi", "Revathi", "Aishwarya", "Sowmya", "Deepa", "Pavithra", "Janani", "Gayathri", "Swetha", "Bhavana", "Keerthana", "Malini", "Sangeetha", "Vaishnavi", "Ramya", "Uma"];
const lastNames = ["Raghavan", "Subramaniam", "Narayanan", "Venkatesh", "Iyer", "Menon", "Sundaram", "Ramesh", "Balaji", "Krishnan", "Prakash", "Chandrasekar", "Mohan", "Selvam", "Arvind", "Kannan", "Murali", "Reddy", "Gopal", "Ashok", "Rajan", "Hari", "Shankar", "Srinivasan"];
const cities: [string, string, string][] = [
  ["Chennai", "Tamil Nadu", "600017"],
  ["Coimbatore", "Tamil Nadu", "641002"],
  ["Bengaluru", "Karnataka", "560034"],
  ["Hyderabad", "Telangana", "500033"],
  ["Madurai", "Tamil Nadu", "625001"],
  ["Kochi", "Kerala", "682016"],
  ["Mumbai", "Maharashtra", "400050"],
  ["Pune", "Maharashtra", "411004"],
  ["Tiruchirappalli", "Tamil Nadu", "620017"],
  ["Mysuru", "Karnataka", "570009"],
];
const streets = ["Venkatnarayana Road", "Race Course Road", "100 Feet Road", "Jubilee Hills Road No. 36", "Anna Nagar 2nd Street", "Panampilly Avenue", "Hill Road", "Prabhat Road", "Thillai Nagar Main Road", "Kalidasa Road"];

// Deterministic PRNG so the demo data is identical on every first load.
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildCustomers(): Customer[] {
  return firstNames.map((fn, i) => {
    const [city, state, pin] = cities[i % cities.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const phone = `+91 9${String(8412_03917 + i * 731_337).slice(0, 4)} ${String(40_000 + i * 2_317).slice(0, 5)}`;
    return {
      id: `u${String(i + 1).padStart(3, "0")}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@${["gmail.com", "outlook.com", "yahoo.co.in"][i % 3]}`,
      phone,
      city,
      joinedAt: daysAgo(30 + ((i * 37) % 400)),
      addresses: [
        {
          id: `a${i + 1}`,
          label: "Home",
          name: `${fn} ${ln}`,
          phone,
          line1: `${12 + ((i * 13) % 180)}, ${streets[i % streets.length]}`,
          city,
          state,
          pincode: pin,
          isDefault: true,
        },
      ],
    };
  });
}

const flow: OrderStatus[] = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];

export function buildOrders(customers: Customer[]): Order[] {
  const rand = mulberry32(2611);
  const orders: Order[] = [];
  const pool = products;
  for (let i = 0; i < 96; i++) {
    const age = Math.floor(Math.pow(rand(), 1.25) * 120); // weighted towards recent days
    const created = new Date(Date.now() - age * DAY - Math.floor(rand() * 10) * 3_600_000);
    const c = customers[Math.floor(rand() * customers.length)];
    const nItems = rand() < 0.55 ? 1 : rand() < 0.75 ? 2 : 3;
    const items = Array.from({ length: nItems }, () => {
      // Bestsellers are picked more often
      const p = rand() < 0.5 ? pool.filter((x) => x.bestseller)[Math.floor(rand() * 7) % 7] ?? pool[0] : pool[Math.floor(rand() * pool.length)];
      return { productId: p.id, name: p.name, image: p.images[0], price: p.salePrice ?? p.mrp, qty: p.type === "jewellery" && rand() < 0.2 ? 2 : 1, size: p.sizes[0] };
    });
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    const useCoupon = rand() < 0.3;
    const discount = useCoupon ? Math.min(Math.round(subtotal * 0.1), 4000) : 0;
    const shipping = subtotal >= 2999 ? 0 : 149;
    let status: OrderStatus;
    if (age > 9) status = rand() < 0.06 ? "cancelled" : "delivered";
    else status = flow[Math.min(4, Math.floor(age / 2) + (age > 0 && rand() < 0.3 ? 1 : 0))];
    const stepIndex = status === "cancelled" ? 0 : flow.indexOf(status);
    const step = stepIndex ? Math.min(1.4 * DAY, (Date.now() - created.getTime()) / stepIndex) : 0;
    const timeline = flow.slice(0, stepIndex + 1).map((s, k) => ({ status: s, at: new Date(created.getTime() + k * step).toISOString() }));
    if (status === "cancelled") timeline.push({ status: "cancelled", at: new Date(created.getTime() + 0.5 * DAY).toISOString() });
    const method = (["UPI", "UPI", "Card", "Net banking", "Cash on delivery"] as const)[Math.floor(rand() * 5)];
    orders.push({
      id: `o${i + 1}`,
      number: `GRH-${24180 + i * 7}`,
      customerId: c.id,
      customerName: c.name,
      email: c.email,
      phone: c.phone,
      address: c.addresses[0],
      items,
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      coupon: useCoupon ? "FIRSTDRAPE" : undefined,
      status,
      paymentStatus: status === "cancelled" ? "refunded" : method === "Cash on delivery" && status !== "delivered" ? "pending" : "paid",
      paymentMethod: method,
      createdAt: created.toISOString(),
      estimatedDelivery: addBusinessDays(created, 5).toISOString(),
      timeline,
    });
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The demo shopper, already signed in-able with these credentials. */
export const demoShopper = { email: "meenakshi.raghavan@gmail.com", password: "gruham123" };
