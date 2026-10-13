import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Copy, CreditCard, Money, Quotes, SealCheck, ShieldCheck, Truck, ArrowsClockwise, VideoCamera } from "@phosphor-icons/react";
import { img, srcSet } from "../../lib/cloudinary";
import { money } from "../../lib/format";
import { priceOf, useStore } from "../../store/useStore";
import { testimonials } from "../../data/reviews";
import { ProductCard } from "../site/ProductCard";
import { ButtonLink, Container, SectionHead, Stars, ViewAll } from "../site/ui";

/* Compact studio intro shown under the hero frames on mobile (inside the pinned hero). Text only. */
export function StudioIntro() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const live = products.filter((p) => p.published);
  const rating = live.length ? live.reduce((s, p) => s + p.rating, 0) / live.length : 0;
  const reasons = [
    { Icon: Truck, title: "Free insured shipping", body: "On orders above ₹2,999, across India" },
    { Icon: ArrowsClockwise, title: "7-day easy exchange", body: "On every saree, unworn with tags" },
    { Icon: VideoCamera, title: "Free video styling call", body: "See the drape on a model before you buy" },
    { Icon: ShieldCheck, title: "Secure payment or cash on delivery", body: "UPI, cards and net banking accepted", tall: true },
  ];
  const stats = [
    { n: String(live.length), label: "pieces in the studio" },
    { n: String(categories.length), label: "weaves and categories" },
    { n: rating.toFixed(1), label: "average rating" },
  ];
  return (
    <div className="flex h-full flex-col bg-page px-4 pb-4 pt-5 sm:px-6 sm:pt-7">
      <h2 className="font-display text-[1.6rem] leading-[1.12] text-fg sm:text-[2.1rem]">Silk sarees and jewellery, chosen by hand.</h2>
      <ul className="my-4 flex min-h-0 flex-1 flex-col justify-evenly gap-2.5 overflow-hidden">
        {reasons.map(({ Icon, title, body, tall }) => (
          <li key={title} className={`flex items-center gap-3.5 rounded-lg border border-hair px-3.5 py-3 ${tall ? "[@media(max-height:760px)]:hidden" : ""}`}>
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-brand">
              <Icon size={21} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.92rem] font-semibold text-fg">{title}</span>
              <span className="block text-[0.8rem] leading-snug text-fg-2">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-3 border-t border-hair pt-3.5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-[1.5rem] leading-none text-brand tabular sm:text-[1.9rem]">{s.n}</dd>
            <dd className="mt-1 text-[0.72rem] leading-snug text-fg-2">{s.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Trust strip right after the hero. */
export function TrustStrip() {
  const items = [
    { Icon: Truck, title: "Free shipping", body: "On orders above ₹2,999" },
    { Icon: ArrowsClockwise, title: "Easy exchange", body: "7 days on all sarees" },
    { Icon: ShieldCheck, title: "Secure payments", body: "UPI, cards, net banking" },
    { Icon: Money, title: "Cash on delivery", body: "On orders up to ₹25,000" },
  ];
  return (
    <section aria-label="Why shop with Gruham" className="border-b border-hair bg-paper">
      <Container className="grid grid-cols-2 gap-x-4 gap-y-5 py-6 lg:grid-cols-4 lg:py-7">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-page text-brand shadow-[0_1px_3px_rgba(36,22,25,0.08)]">
              <Icon size={21} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.88rem] font-semibold text-fg sm:text-[0.95rem]">{title}</span>
              <span className="block text-[0.76rem] text-fg-2 sm:text-[0.82rem]">{body}</span>
            </span>
          </div>
        ))}
      </Container>
    </section>
  );
}

/* Shop by category: circular thumbnails. Scrolls sideways on phones, one row on desktop. */
export function CategoryCircles() {
  const categories = useStore((s) => s.categories);
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <SectionHead title="Shop by category" action={<ViewAll to="/shop">View all</ViewAll>} />
      </Container>
      <div className="no-scrollbar mx-auto flex max-w-[1400px] snap-x gap-4 overflow-x-auto px-4 sm:gap-6 sm:px-6 lg:grid lg:grid-cols-10 lg:gap-4 lg:overflow-visible lg:px-10">
        {categories.map((c) => (
          <Link key={c.id} to={`/shop?category=${c.slug}`} className="group flex w-24 shrink-0 snap-start flex-col items-center gap-2.5 text-center sm:w-28 lg:w-auto">
            <span className="block aspect-square w-full overflow-hidden rounded-full bg-paper ring-1 ring-hair transition-shadow group-hover:ring-2 group-hover:ring-brand">
              <img src={img(c.image, 300)} srcSet={srcSet(c.image, [200, 300, 450])} sizes="120px" alt="" loading="lazy" className="size-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105" />
            </span>
            <span className="text-[0.82rem] font-medium leading-tight text-fg group-hover:text-brand">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* Featured collections, managed from admin (Promotions > Collections). */
export function FeaturedCollections() {
  const collections = useStore((s) => s.collections);
  const products = useStore((s) => s.products);
  const featured = collections.filter((c) => c.featured);
  const [idx, setIdx] = useState(0);
  if (featured.length === 0) return null;
  const col = featured[Math.min(idx, featured.length - 1)];
  const items = col.productIds.map((id) => products.find((p) => p.id === id && p.published)).filter(Boolean).slice(0, 4) as typeof products;

  return (
    <section className="py-12 lg:py-16">
      <Container>
        <SectionHead title="Trending collections" action={<ViewAll to={`/shop?collection=${col.id}`}>Shop {col.name}</ViewAll>}>
          {col.blurb}
        </SectionHead>
        {featured.length > 1 && (
          <div role="tablist" aria-label="Collections" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {featured.map((c, i) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={c.id === col.id}
                onClick={() => setIdx(i)}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-[0.85rem] font-medium transition-colors ${c.id === col.id ? "border-fg bg-fg text-white" : "border-hair-2 text-fg hover:border-fg"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={col.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4"
          >
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </motion.div>
        </AnimatePresence>
      </Container>
    </section>
  );
}

/* Two promo tiles. */
export function PromoTiles() {
  const products = useStore((s) => s.products);
  const from = (pred: (p: (typeof products)[number]) => boolean) => {
    const prices = products.filter((p) => p.published && pred(p)).map(priceOf);
    return prices.length ? Math.min(...prices) : 0;
  };
  const tiles = [
    {
      title: "Festive half sarees",
      body: `Pattu pavadai and Kalamkari sets from ${money(from((p) => p.category === "half-sarees"))}`,
      cta: "Shop half sarees",
      to: "/shop?category=half-sarees",
      image: "halfsaree-rust-maroon",
    },
    {
      title: "Temple jewellery",
      body: `Antique gold-finish pieces from ${money(from((p) => p.category === "temple"))}`,
      cta: "Shop temple jewellery",
      to: "/shop?category=temple",
      image: "jewel-temple-necklace",
    },
  ];
  return (
    <section className="pb-12 lg:pb-16">
      <Container className="grid gap-3 sm:gap-5 md:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.title} to={t.to} className="group relative isolate flex aspect-[4/3] items-end overflow-hidden rounded-lg sm:aspect-[16/10]">
            <img src={img(t.image, 1200)} srcSet={srcSet(t.image)} sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.03]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="p-5 text-white sm:p-7">
              <h3 className="font-display text-[1.7rem] leading-tight sm:text-[2.1rem]">{t.title}</h3>
              <p className="mt-1 text-[0.92rem] text-white/85">{t.body}</p>
              <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-[0.88rem] font-semibold text-fg transition-colors group-hover:bg-brand group-hover:text-white">
                {t.cta} <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        ))}
      </Container>
    </section>
  );
}

/* Bestsellers grid with a sarees / jewellery filter. */
export function Bestsellers() {
  const products = useStore((s) => s.products);
  const [tab, setTab] = useState<"all" | "saree" | "jewellery">("all");
  const list = useMemo(
    () =>
      products
        .filter((p) => p.published && p.bestseller && (tab === "all" || p.type === tab))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 8),
    [products, tab],
  );
  return (
    <section className="bg-paper py-12 lg:py-16">
      <Container>
        <SectionHead
          title="Bestsellers"
          action={
            <div role="tablist" aria-label="Filter bestsellers" className="flex gap-1 self-start rounded-lg border border-hair-2 bg-page p-1">
              {(["all", "saree", "jewellery"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`min-h-9 rounded-md px-4 text-[0.85rem] font-medium transition-colors ${tab === t ? "bg-fg text-white" : "text-fg hover:bg-paper"}`}
                >
                  {t === "all" ? "All" : t === "saree" ? "Sarees" : "Jewellery"}
                </button>
              ))}
            </div>
          }
        >
          What our customers keep coming back for.
        </SectionHead>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* Shop by price. */
export function ShopByPrice() {
  const products = useStore((s) => s.products);
  const bands = [
    { label: "Under", value: "₹5,000", q: "max=5000", test: (n: number) => n < 5000 },
    { label: "From", value: "₹5,000 to ₹10,000", q: "min=5000&max=10000", test: (n: number) => n >= 5000 && n <= 10000 },
    { label: "From", value: "₹10,000 to ₹20,000", q: "min=10000&max=20000", test: (n: number) => n > 10000 && n <= 20000 },
    { label: "Above", value: "₹20,000", q: "min=20000", test: (n: number) => n > 20000 },
  ];
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <SectionHead title="Shop by price" />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {bands.map((b) => {
            const n = products.filter((p) => p.published && b.test(priceOf(p))).length;
            return (
              <Link key={b.q} to={`/shop?${b.q}`} className="group flex min-h-32 flex-col justify-between rounded-lg border border-hair bg-page p-4 transition-colors hover:border-brand sm:p-6">
                <span>
                  <span className="block text-[0.8rem] text-fg-3">{b.label}</span>
                  <span className="mt-1 block font-display text-[1.25rem] leading-tight text-fg sm:text-[1.6rem]">{b.value}</span>
                </span>
                <span className="mt-4 flex items-center justify-between text-[0.82rem] font-semibold text-brand">
                  {n} {n === 1 ? "piece" : "pieces"} <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* New arrivals: horizontal snap rail. */
export function NewArrivals() {
  const products = useStore((s) => s.products);
  const list = useMemo(() => products.filter((p) => p.published && p.isNew).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [products]);
  if (!list.length) return null;
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <SectionHead title="New arrivals" action={<ViewAll to="/shop?sort=new">View all</ViewAll>} />
      </Container>
      <div className="no-scrollbar mx-auto flex max-w-[1400px] snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-5 sm:px-6 lg:px-10">
        {list.map((p) => (
          <div key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-[31vw] lg:w-[calc((1400px-5rem-3*1.25rem)/4)] lg:max-w-[23%]">
            <ProductCard product={p} sizes="(min-width: 1024px) 25vw, 46vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* Customer reviews. */
export function CustomerReviews() {
  const products = useStore((s) => s.products);
  const live = products.filter((p) => p.published);
  const total = live.reduce((n, p) => n + p.reviews, 0);
  const avg = total ? live.reduce((n, p) => n + p.rating * p.reviews, 0) / total : 0;
  return (
    <section className="bg-paper py-12 lg:py-16">
      <Container>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-[1.75rem] leading-[1.12] sm:text-[2.1rem] lg:text-[2.4rem]">Loved by our customers</h2>
            <div className="mt-2 flex items-center gap-3">
              <Stars rating={avg} size={16} />
              <span className="text-[0.9rem] text-fg-2 tabular">from {total.toLocaleString("en-IN")} verified reviews</span>
            </div>
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {testimonials.map((t) => {
            const p = products.find((x) => x.slug === t.product);
            return (
              <figure key={t.name} className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-lg border border-hair bg-page p-5 sm:w-auto sm:max-w-none">
                <Quotes size={26} weight="fill" className="text-gold" />
                <Stars rating={t.rating} size={14} />
                <blockquote className="mt-2 flex-1">
                  <p className="font-semibold text-fg">{t.title}</p>
                  <p className="mt-1.5 text-[0.88rem] leading-relaxed text-fg-2">{t.body}</p>
                </blockquote>
                <figcaption className="mt-4 border-t border-hair pt-3 text-[0.82rem]">
                  <span className="flex items-center gap-1.5 font-semibold text-fg">
                    {t.name} {t.verified && <SealCheck size={15} weight="fill" className="text-success" aria-label="Verified buyer" />}
                  </span>
                  <span className="text-fg-3">{t.city}</span>
                  {p && (
                    <Link to={`/product/${p.slug}`} className="mt-3 flex items-center gap-2.5 rounded-md bg-paper p-2 hover:bg-paper-2">
                      <img src={img(p.images[0], 100)} alt="" className="h-12 w-9 rounded object-cover" />
                      <span className="line-clamp-2 text-[0.78rem] text-fg-2">{p.name}</span>
                    </Link>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* Offer banner, managed from admin (Promotions > Banners). */
export function OfferBand() {
  const banner = useStore((s) => s.banners.find((b) => b.active));
  const coupons = useStore((s) => s.coupons);
  const [copied, setCopied] = useState(false);
  if (!banner) return null;
  const code = coupons.find((c) => c.active && banner.body.includes(c.code))?.code;
  return (
    <section className="py-12 lg:py-16">
      <Container>
        <div className="grid overflow-hidden rounded-lg bg-brand text-white md:grid-cols-2">
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="text-[0.78rem] font-bold tracking-wide text-white/70">LIMITED-TIME OFFER</p>
            <h2 className="mt-2 font-display text-[2rem] leading-[1.08] md:text-[2.8rem]">{banner.title}</h2>
            <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-white/85">{banner.body}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ButtonLink to={banner.link} className="!bg-white !text-brand hover:!bg-paper">
                {banner.cta}
              </ButtonLink>
              {code && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(code).catch(() => undefined);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-white/60 px-5 font-semibold tracking-[0.08em] hover:bg-white/10"
                >
                  <Copy size={16} />
                  {copied ? "Code copied" : code}
                </button>
              )}
            </div>
          </div>
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
            <img src={img(banner.image, 1400)} srcSet={srcSet(banner.image)} sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-[center_25%]" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/* Payment and service reassurance above the footer. */
export function ServiceBand() {
  const items = [
    { Icon: VideoCamera, title: "Video styling calls", body: "A stylist drapes any saree live so you see the fall and colour on a person." },
    { Icon: CreditCard, title: "Pay your way", body: "UPI, all major cards, net banking, or cash on delivery up to ₹25,000." },
    { Icon: SealCheck, title: "Quality checked", body: "Every piece is inspected and photographed in our studio before it ships." },
  ];
  return (
    <section className="border-t border-hair py-10 lg:py-12">
      <Container className="grid gap-6 md:grid-cols-3">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <Icon size={28} weight="light" className="mt-0.5 shrink-0 text-brand" />
            <div>
              <h3 className="font-semibold text-fg">{title}</h3>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-fg-2">{body}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}
