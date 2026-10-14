import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Copy, CreditCard, Flower, Money, Quotes, SealCheck, ShieldCheck, Truck, ArrowsClockwise, VideoCamera } from "@phosphor-icons/react";
import { img, srcSet } from "../../lib/cloudinary";
import { money } from "../../lib/format";
import { priceOf, useStore } from "../../store/useStore";
import { testimonials } from "../../data/reviews";
import { ProductCard } from "../site/ProductCard";
import { ButtonLink, Container, DiamondRule, LongArrow, SectionHead, Stars, ViewAll } from "../site/ui";

/* Shared bits ------------------------------------------------------------------------------------ */

/** Vertical stack of tracked words with a gold hairline, set in the side margins on wide screens. */
function SideRail({ words, side = "left", className = "" }: { words: string[]; side?: "left" | "right"; className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute hidden flex-col gap-3 2xl:flex ${side === "left" ? "left-8 items-start" : "right-8 items-end text-right"} ${className}`}>
      {side === "left" && <Flower size={22} weight="light" className="mb-1 text-brand" />}
      {words.map((w) => (
        <span key={w} className="text-[0.6rem] font-medium uppercase tracking-[0.34em] text-fg-2">
          {w}
        </span>
      ))}
      <span className="mt-2 h-20 w-px bg-gradient-to-b from-brand/70 to-transparent" />
    </div>
  );
}

/** Tracked tab row with a gold underline on the active tab. */
function Tabs<T extends string>({ items, value, onChange, label }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 mb-10 flex justify-start gap-1 overflow-x-auto px-4 sm:mx-0 sm:justify-center sm:px-0">
      {items.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={t.id === value}
          onClick={() => onChange(t.id)}
          className={`relative min-h-11 shrink-0 px-4 text-[0.68rem] font-medium uppercase tracking-[0.22em] transition-colors after:absolute after:inset-x-4 after:bottom-1.5 after:h-px after:bg-brand after:transition-transform after:duration-300 ${
            t.id === value ? "text-brand after:scale-x-100" : "text-fg-2 after:scale-x-0 hover:text-fg"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Outline "Explore" button shown inside image cards (the whole card is the link). */
function CardCta({ children = "Explore" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-3 border border-brand/80 px-5 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-fg transition-colors duration-300 group-hover:bg-brand group-hover:text-on-brand">
      {children} <LongArrow />
    </span>
  );
}

/* Sections -------------------------------------------------------------------------------------- */

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
    <div className="surface-glow flex h-full flex-col px-4 pb-4 pt-5 sm:px-6 sm:pt-7">
      <p className="eyebrow">Gruham studio</p>
      <h2 className="mt-2 font-display text-[1.55rem] leading-[1.12] text-fg sm:text-[2.1rem]">
        Silk sarees and jewellery, <span className="font-accent text-gold-light">chosen by hand.</span>
      </h2>
      <ul className="my-4 flex min-h-0 flex-1 flex-col justify-evenly gap-2.5 overflow-hidden">
        {reasons.map(({ Icon, title, body, tall }) => (
          <li key={title} className={`flex items-center gap-3.5 border border-hair px-3.5 py-3 ${tall ? "[@media(max-height:760px)]:hidden" : ""}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-hair-2 text-brand">
              <Icon size={19} weight="light" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.86rem] font-medium text-fg">{title}</span>
              <span className="block text-[0.76rem] leading-snug text-fg-2">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <dl className="grid grid-cols-3 gap-3 border-t border-hair pt-3.5">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="sr-only">{s.label}</dt>
            <dd className="font-display text-[1.5rem] leading-none text-gold-light tabular sm:text-[1.9rem]">{s.n}</dd>
            <dd className="mt-1 text-[0.66rem] uppercase leading-snug tracking-[0.12em] text-fg-2">{s.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* Trust strip right after the hero: gold line icons between hairline dividers. */
export function TrustStrip() {
  const items = [
    { Icon: Truck, title: "Free shipping", body: "On orders above ₹2,999" },
    { Icon: ArrowsClockwise, title: "Easy exchange", body: "7 days on all sarees" },
    { Icon: ShieldCheck, title: "Secure payments", body: "UPI, cards, net banking" },
    { Icon: Money, title: "Cash on delivery", body: "On orders up to ₹25,000" },
  ];
  return (
    <section aria-label="Why shop with Gruham" className="surface-deep border-b border-hair">
      <Container className="pb-10 pt-12">
        <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4">
          {items.map(({ Icon, title, body }, i) => (
            <div key={title} className={`flex flex-col items-center px-3 text-center ${i % 2 === 1 ? "border-l border-hair" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
              <Icon size={34} weight="thin" className="text-brand" />
              <span className="mt-4 block text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-fg">{title}</span>
              <span className="mt-1.5 block text-[0.8rem] text-fg-2">{body}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 flex items-center gap-3 text-brand" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand/60" />
          <span className="size-2 rotate-45 border border-brand" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand/60" />
        </div>
      </Container>
    </section>
  );
}

/* Shop by category: arched cards on a rail with arrow controls and a counter. */
export function CategoryCircles() {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const railRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const count = (slug: string) => products.filter((p) => p.published && p.category === slug).length;

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      const card = rail.firstElementChild as HTMLElement | null;
      if (!card) return;
      setAt(Math.round(rail.scrollLeft / (card.offsetWidth + 24)));
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => rail.removeEventListener("scroll", onScroll);
  }, []);

  const step = (dir: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.firstElementChild as HTMLElement | null;
    if (rail && card) rail.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: "smooth" });
  };
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="surface-glow relative overflow-hidden py-20 lg:py-28">
      <SideRail words={["Woven", "On small", "Looms"]} className="top-28" />
      <SideRail side="right" words={["Every drape", "Tells", "A story"]} className="top-40" />
      <Container>
        <SectionHead center eyebrow="Shop by category" title="Silks & jewellery for every occasion">
          Kanjivaram to Kalamkari. Temple gold to kemp.
        </SectionHead>
      </Container>
      <div ref={railRef} className="no-scrollbar mx-auto flex max-w-[1400px] snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/shop?category=${c.slug}`}
            className="arch group relative isolate flex aspect-[3/4.3] w-[72vw] shrink-0 snap-start flex-col items-center justify-end overflow-hidden border border-hair-2 text-center transition-colors duration-500 hover:border-brand sm:w-[44vw] lg:w-[calc((min(100vw,1400px)-5rem-3rem)/3)]"
          >
            <img
              src={img(c.image, 700)}
              srcSet={srcSet(c.image, [480, 720, 960])}
              sizes="(min-width: 1024px) 30vw, 70vw"
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 size-full object-cover object-[center_25%] transition-transform duration-[1.2s] ease-[var(--ease-out-soft)] group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-page via-page/45 to-transparent" />
            <div className="flex flex-col items-center px-5 pb-8">
              <p className="eyebrow !text-[0.58rem]">
                {count(c.slug)} {count(c.slug) === 1 ? "piece" : "pieces"}
              </p>
              <h3 className="mt-3 font-display text-[1.6rem] uppercase leading-tight tracking-[0.03em] text-fg sm:text-[1.9rem]">{c.name}</h3>
              <p className="mt-2 line-clamp-2 max-w-[30ch] font-display text-[0.92rem] leading-snug text-fg-2">{c.blurb}</p>
              <span className="mt-5">
                <CardCta />
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-10 flex items-center justify-center gap-5">
        <button onClick={() => step(-1)} aria-label="Previous categories" className="grid size-12 place-items-center rounded-full border border-fg/40 text-fg transition-colors hover:border-brand hover:text-brand">
          <ArrowLeft size={18} weight="light" />
        </button>
        <span className="text-[0.75rem] tracking-[0.2em] text-fg tabular">{pad(Math.min(at + 1, categories.length))}</span>
        <span className="h-px w-12 bg-fg/30" aria-hidden="true" />
        <span className="text-[0.75rem] tracking-[0.2em] text-fg-3 tabular">{pad(categories.length)}</span>
        <button onClick={() => step(1)} aria-label="Next categories" className="grid size-12 place-items-center rounded-full border border-fg/40 text-fg transition-colors hover:border-brand hover:text-brand">
          <ArrowRight size={18} weight="light" />
        </button>
      </div>
    </section>
  );
}

/* Explore the collection: two framed tiles, words on the left over a dark wash, picture on the right. */
export function PromoTiles() {
  const products = useStore((s) => s.products);
  const from = (pred: (p: (typeof products)[number]) => boolean) => {
    const prices = products.filter((p) => p.published && pred(p)).map(priceOf);
    return prices.length ? Math.min(...prices) : 0;
  };
  const tiles = [
    {
      title: "Half sarees",
      body: (
        <>
          Pattu pavadai and Kalamkari, <span className="font-accent text-[1.15em] text-gold-light">for every festival.</span>
        </>
      ),
      price: `From ${money(from((p) => p.category === "half-sarees"))}`,
      to: "/shop?category=half-sarees",
      image: "halfsaree-rust-maroon",
    },
    {
      title: "Temple jewellery",
      body: (
        <>
          Antique gold, <span className="font-accent text-[1.15em] text-gold-light">lotus and coin.</span>
        </>
      ),
      price: `From ${money(from((p) => p.category === "temple"))}`,
      to: "/shop?category=temple",
      image: "jewel-temple-necklace",
    },
  ];
  return (
    <section className="relative bg-paper py-20 lg:py-28">
      <Container>
        <SectionHead center eyebrow="The studio" title="Explore the collection">
          Silk for the occasion. Gold for the finish.
        </SectionHead>
        <div className="grid gap-6 md:grid-cols-2">
          {tiles.map((t) => (
            <Link key={t.title} to={t.to} className="group relative isolate flex min-h-[26rem] items-center overflow-hidden rounded-[2px] border border-hair-2 transition-colors duration-500 hover:border-brand sm:min-h-[30rem]">
              <img src={img(t.image, 1200)} srcSet={srcSet(t.image)} sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover object-[70%_30%] transition-transform duration-[1.2s] ease-[var(--ease-out-soft)] group-hover:scale-[1.04]" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-page via-page/75 to-transparent" />
              <div className="max-w-[20rem] p-7 sm:p-10">
                <h3 className="font-display text-[2.2rem] uppercase leading-[1.05] tracking-[0.03em] text-fg sm:text-[2.8rem]">{t.title}</h3>
                <span className="mt-5 block h-px w-10 bg-brand" aria-hidden="true" />
                <p className="mt-5 font-display text-[1.15rem] leading-snug text-fg sm:text-[1.3rem]">{t.body}</p>
                <p className="mt-3 text-[0.66rem] font-medium uppercase tracking-[0.24em] text-fg-2">{t.price}</p>
                <span className="mt-7 inline-block">
                  <CardCta />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
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
    <section className="surface-glow relative overflow-hidden py-20 lg:py-28">
      <SideRail words={["Curated", "In our", "Studio"]} className="top-32" />
      <Container>
        <SectionHead center eyebrow="Curated edits" title="Trending collections">
          {col.blurb}
        </SectionHead>
        {featured.length > 1 && <Tabs label="Collections" items={featured.map((c, i) => ({ id: String(i), label: c.name }))} value={String(featured.indexOf(col))} onChange={(v) => setIdx(Number(v))} />}
        <AnimatePresence mode="wait">
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 lg:grid-cols-4"
          >
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </motion.div>
        </AnimatePresence>
        <div className="mt-12 flex justify-center">
          <ButtonLink to={`/shop?collection=${col.id}`} variant="secondary" className="group">
            Shop {col.name} <LongArrow />
          </ButtonLink>
        </div>
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
    <section className="relative bg-paper py-20 lg:py-28">
      <Container>
        <SectionHead center eyebrow="Most loved" title="Best sellers">
          The pieces our customers reach for most.
        </SectionHead>
        <Tabs
          label="Filter bestsellers"
          items={[
            { id: "all", label: "All" },
            { id: "saree", label: "Sarees" },
            { id: "jewellery", label: "Jewellery" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}

/* Shop by price: numbered bento tiles, each pictured with a piece from that band. */
export function ShopByPrice() {
  const products = useStore((s) => s.products);
  const bands = [
    { label: "Under ₹5,000", line: "Everyday gold, easy gifts.", q: "max=5000", test: (n: number) => n < 5000 },
    { label: "₹5,000 to ₹10,000", line: "Soft silks for long days.", q: "min=5000&max=10000", test: (n: number) => n >= 5000 && n <= 10000 },
    { label: "₹10,000 to ₹20,000", line: "Brocade for the big day.", q: "min=10000&max=20000", test: (n: number) => n > 10000 && n <= 20000 },
    { label: "Above ₹20,000", line: "Heirloom weaves and bridal sets.", q: "min=20000", test: (n: number) => n > 20000 },
  ];
  const layout = ["lg:row-span-2", "", "", "lg:col-start-3 lg:row-span-2 lg:row-start-1"];
  return (
    <section className="surface-glow relative overflow-hidden py-20 lg:py-28">
      <SideRail words={["Timeless", "In every", "Thread"]} className="top-24" />
      <SideRail side="right" words={["Tradition", "For", "Today"]} className="top-24" />
      <Container>
        <SectionHead center eyebrow="Shop by price" title="Something for every occasion">
          From a first silk to an heirloom.
        </SectionHead>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.15fr_1fr] lg:grid-rows-[17rem_17rem]">
          {bands.map((b, i) => {
            const inBand = products.filter((p) => p.published && b.test(priceOf(p)));
            const pic = inBand.sort((x, y) => y.sold - x.sold)[0]?.images[0] ?? "saree-banarasi-violet";
            const tall = i === 0 || i === 3;
            return (
              <Link
                key={b.q}
                to={`/shop?${b.q}`}
                className={`group relative isolate flex min-h-[17rem] flex-col justify-between overflow-hidden rounded-[2px] border border-hair-2 p-6 transition-colors duration-500 hover:border-brand sm:p-7 ${layout[i]}`}
              >
                <img src={img(pic, 900)} srcSet={srcSet(pic, [480, 720, 960])} sizes="(min-width: 1024px) 33vw, 100vw" alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover object-[center_30%] transition-transform duration-[1.2s] ease-[var(--ease-out-soft)] group-hover:scale-[1.05]" />
                <div className={`absolute inset-0 -z-10 ${tall ? "bg-gradient-to-b from-page/85 via-page/30 to-page/70" : "bg-gradient-to-r from-page/90 via-page/55 to-transparent"}`} />
                <div>
                  <p className="flex items-center gap-3 text-[0.72rem] tracking-[0.2em] text-fg-2 tabular">
                    {String(i + 1).padStart(2, "0")} <span className="h-px w-8 bg-fg/40" aria-hidden="true" />
                  </p>
                  <h3 className="mt-4 max-w-[12ch] font-display text-[1.7rem] leading-[1.1] text-fg sm:text-[1.95rem]">{b.label}</h3>
                  <p className="mt-3 max-w-[18ch] font-display text-[0.98rem] leading-snug text-fg-2">{b.line}</p>
                </div>
                <span className="mt-6 flex items-center gap-3 text-[0.64rem] font-medium uppercase tracking-[0.26em] text-fg">
                  <span className="grid size-10 place-items-center rounded-full border border-fg/50 transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-on-brand">
                    <ArrowRight size={16} weight="light" />
                  </span>
                  {inBand.length} {inBand.length === 1 ? "piece" : "pieces"}
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* Our studio: picture in an offset gold frame beside a short note. */
export function StorySection() {
  return (
    <section className="surface-deep relative overflow-hidden py-20 lg:py-32">
      <Container className="grid items-center gap-14 md:grid-cols-[1fr_1.05fr] lg:gap-24">
        <div className="relative mx-auto w-full max-w-[34rem] pb-6 pr-6">
          <span aria-hidden="true" className="absolute inset-0 left-6 top-8 border border-brand/60" />
          <img src={img("saree-banarasi-red-pallu", 1000)} srcSet={srcSet("saree-banarasi-red-pallu", [480, 720, 960, 1200])} sizes="(min-width: 768px) 40vw, 90vw" alt="A sindoor Banarasi pallu, draped" loading="lazy" className="relative aspect-[4/5] w-full object-cover object-[center_30%]" />
        </div>
        <div className="max-w-[32rem]">
          <p className="eyebrow">Our studio</p>
          <h2 className="mt-5 font-display text-[2.6rem] leading-[1.02] text-fg sm:text-[3.4rem] lg:text-[4rem]">
            Silk, chosen
            <br />
            <span className="font-accent text-[1.12em] text-gold-light">by hand.</span>
          </h2>
          <span className="mt-8 block h-px w-14 bg-brand" aria-hidden="true" />
          <p className="mt-8 text-[0.98rem] leading-[1.85] text-fg-2">
            Every saree in the studio is picked from weavers we visit, then draped on a model and photographed before it is listed, so the colour and fall you see are the ones that arrive.
          </p>
          <p className="mt-5 font-accent text-[1.3rem] text-gold-light">From the loom to your occasion.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink to="/shop" className="group">
              Shop the studio <LongArrow />
            </ButtonLink>
            <ButtonLink to="/shop?sort=new" variant="ghost" className="group">
              New in <LongArrow />
            </ButtonLink>
          </div>
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
    <section className="surface-glow py-20 lg:py-28">
      <Container>
        <SectionHead eyebrow="Just arrived" title="New arrivals" action={<ViewAll to="/shop?sort=new">View all</ViewAll>}>
          Fresh off the loom this month.
        </SectionHead>
      </Container>
      <div className="no-scrollbar mx-auto flex max-w-[1400px] snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:gap-6 sm:px-6 lg:scroll-px-10 lg:px-10">
        {list.map((p) => (
          <div key={p.id} className="w-[46vw] shrink-0 snap-start sm:w-[31vw] lg:w-[calc((1400px-5rem-3*1.5rem)/4)] lg:max-w-[23%]">
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
    <section className="bg-paper py-20 lg:py-28">
      <Container>
        <SectionHead center eyebrow="Kind words" title="Loved by our customers" />
        <div className="-mt-6 mb-12 flex items-center justify-center gap-3">
          <Stars rating={avg} size={16} />
          <span className="text-[0.85rem] text-fg-2 tabular">from {total.toLocaleString("en-IN")} verified reviews</span>
        </div>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {testimonials.map((t) => {
            const p = products.find((x) => x.slug === t.product);
            return (
              <figure key={t.name} className="flex w-[82vw] max-w-sm shrink-0 snap-start flex-col rounded-[2px] border border-hair bg-page/60 p-6 transition-colors hover:border-hair-2 sm:w-auto sm:max-w-none">
                <Quotes size={28} weight="fill" className="text-brand/80" />
                <div className="mt-3">
                  <Stars rating={t.rating} size={13} />
                </div>
                <blockquote className="mt-3 flex-1">
                  <p className="font-display text-[1.12rem] leading-snug text-fg">{t.title}</p>
                  <p className="mt-2 text-[0.86rem] leading-relaxed text-fg-2">{t.body}</p>
                </blockquote>
                <figcaption className="mt-5 border-t border-hair pt-4 text-[0.82rem]">
                  <span className="flex items-center gap-1.5 font-medium text-fg">
                    {t.name} {t.verified && <SealCheck size={15} weight="fill" className="text-brand" aria-label="Verified buyer" />}
                  </span>
                  <span className="text-[0.68rem] uppercase tracking-[0.18em] text-fg-3">{t.city}</span>
                  {p && (
                    <Link to={`/product/${p.slug}`} className="mt-4 flex items-center gap-3 border border-hair p-2 transition-colors hover:border-brand">
                      <img src={img(p.images[0], 100)} alt="" className="h-12 w-9 object-cover" />
                      <span className="line-clamp-2 font-display text-[0.86rem] text-fg-2">{p.name}</span>
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
    <section className="surface-glow py-20 lg:py-28">
      <Container>
        <div className="grid overflow-hidden rounded-[2px] border border-hair-2 bg-paper md:grid-cols-2">
          <div className="relative aspect-[4/3] md:order-2 md:aspect-auto md:min-h-[30rem]">
            <img src={img(banner.image, 1400)} srcSet={srcSet(banner.image)} sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy" className="absolute inset-0 size-full object-cover object-[center_25%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-paper/80 to-transparent md:bg-gradient-to-r" />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
            <p className="eyebrow">Limited-time offer</p>
            <h2 className="mt-4 font-display text-[2.1rem] leading-[1.06] text-fg md:text-[3rem]">{banner.title}</h2>
            <DiamondRule className="mt-6 justify-start [&::before]:hidden" />
            <p className="mt-6 max-w-[46ch] text-[0.98rem] leading-relaxed text-fg-2">{banner.body}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink to={banner.link} className="group">
                {banner.cta} <LongArrow />
              </ButtonLink>
              {code && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(code).catch(() => undefined);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-[2px] border border-dashed border-brand/70 px-5 text-[0.75rem] font-semibold tracking-[0.2em] text-gold-light transition-colors hover:bg-brand/10"
                >
                  <Copy size={16} />
                  {copied ? "CODE COPIED" : code}
                </button>
              )}
            </div>
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
    <section className="surface-deep border-t border-hair py-16 lg:py-20">
      <Container className="grid gap-10 md:grid-cols-3 md:gap-0">
        {items.map(({ Icon, title, body }, i) => (
          <div key={title} className={`flex flex-col items-center px-6 text-center ${i > 0 ? "md:border-l md:border-hair" : ""}`}>
            <span className="grid size-16 place-items-center rounded-full border border-hair-2 text-brand">
              <Icon size={28} weight="thin" />
            </span>
            <h3 className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-fg">{title}</h3>
            <p className="mt-3 max-w-[32ch] text-[0.86rem] leading-relaxed text-fg-2">{body}</p>
          </div>
        ))}
      </Container>
    </section>
  );
}
