import type { Product } from "./types";

/* Demo reviews. Static (not in the persisted store) so they never go stale in saved browser data. */

export interface Review {
  name: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  product?: string; // product slug
}

export const testimonials: Review[] = [
  {
    name: "Harini Subramaniam",
    city: "Chennai",
    rating: 5,
    title: "Exactly as shown on the video call",
    body: "The stylist draped the lavender half saree on a video call before I ordered. The colour and the zari border were exactly what I saw. My daughter wore it for her first Navaratri golu.",
    date: "2026-09-28",
    verified: true,
    product: "lavender-silk-half-saree-with-peacock-blue-dhavani",
  },
  {
    name: "Divya Narayanan",
    city: "Bengaluru",
    rating: 5,
    title: "Temple necklace looks like real gold",
    body: "I was unsure about artificial jewellery for a wedding, but the Lakshmi necklace has a proper antique finish. Packed in a lovely box and arrived in three days.",
    date: "2026-09-14",
    verified: true,
    product: "lakshmi-temple-necklace",
  },
  {
    name: "Kavya Sundaram",
    city: "Coimbatore",
    rating: 4,
    title: "Beautiful Banarasi, quick exchange",
    body: "The first saree I ordered was a shade darker than I wanted. They exchanged it within the week, no questions. The violet jaal is stunning in person.",
    date: "2026-08-30",
    verified: true,
    product: "indigo-violet-banarasi-jaal",
  },
  {
    name: "Anjali Menon",
    city: "Kochi",
    rating: 5,
    title: "Blouse stitching was spot on",
    body: "Sent my measurements at checkout and the stitched blouse fit perfectly. The Kalamkari half saree got so many compliments at the family function.",
    date: "2026-08-19",
    verified: true,
    product: "rani-pink-kalamkari-half-saree",
  },
];

const pool: Record<Product["type"], Omit<Review, "product">[]> = {
  saree: [
    { name: "Lakshmi Venkatesh", city: "Madurai", rating: 5, title: "Rich colour, soft drape", body: "The silk is soft enough to pleat easily and the border sits beautifully. Colour is true to the photos.", date: "2026-09-21", verified: true },
    { name: "Priyanka Iyer", city: "Chennai", rating: 5, title: "Worth every rupee", body: "Wore it for my cousin's wedding. Held the pleats all day and the zari did not scratch at all.", date: "2026-09-02", verified: true },
    { name: "Swetha Murali", city: "Hyderabad", rating: 4, title: "Lovely, slightly heavier than expected", body: "Gorgeous piece. It is a little heavier than my usual soft silks, so plan to pin it well.", date: "2026-08-11", verified: true },
    { name: "Ramya Shankar", city: "Pune", rating: 5, title: "Packaging was beautiful", body: "Came folded in muslin inside a box, with care instructions. Felt like a gift.", date: "2026-07-27", verified: false },
  ],
  jewellery: [
    { name: "Sowmya Chandrasekar", city: "Tiruchirappalli", rating: 5, title: "Looks like real gold", body: "The antique finish is very convincing and the stones are set neatly. Lightweight enough for a long day.", date: "2026-09-25", verified: true },
    { name: "Gayathri Kannan", city: "Mysuru", rating: 4, title: "Pretty, thread could be longer", body: "Beautiful detailing. I would have liked a little more length on the thread, but it is adjustable.", date: "2026-09-06", verified: true },
    { name: "Malini Ashok", city: "Mumbai", rating: 5, title: "Perfect with my Kanjivaram", body: "Matched my red silk perfectly. No skin irritation after wearing it the whole evening.", date: "2026-08-22", verified: true },
    { name: "Deepa Mohan", city: "Bengaluru", rating: 5, title: "Fast delivery", body: "Ordered on Monday, wore it on Thursday. Came in a velvet pouch inside a sturdy box.", date: "2026-08-03", verified: false },
  ],
};

/** Three reviews for a product page, chosen deterministically so they don't change between visits. */
export function reviewsFor(p: Product): Review[] {
  const list = pool[p.type];
  const seed = [...p.id].reduce((n, c) => n + c.charCodeAt(0), 0);
  return [0, 1, 2].map((k) => ({ ...list[(seed + k) % list.length], product: p.slug }));
}

/** Star breakdown (5 to 1) that adds up to the product's review count and roughly matches its rating. */
export function ratingBreakdown(p: Product): number[] {
  const total = p.reviews;
  const fiveShare = Math.min(0.92, Math.max(0.4, (p.rating - 3.6) / 1.4));
  const five = Math.round(total * fiveShare);
  const four = Math.round((total - five) * 0.7);
  const three = Math.round((total - five - four) * 0.6);
  const two = Math.round((total - five - four - three) * 0.5);
  return [five, four, three, two, Math.max(0, total - five - four - three - two)];
}
