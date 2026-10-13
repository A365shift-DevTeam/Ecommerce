import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowsClockwise, ArrowsOut, Heart, MapPin, MinusCircle, PlusCircle, SealCheck, ShieldCheck, ShoppingBag, Tag, Truck, X } from "@phosphor-icons/react";
import { ratingBreakdown, reviewsFor } from "../data/reviews";
import { useProduct, useStore } from "../store/useStore";
import { img, srcSet } from "../lib/cloudinary";
import { addBusinessDays, discountPct, money } from "../lib/format";
import { lockScroll } from "../lib/smoothScroll";
import { Breadcrumbs, Button, Container, EmptyState, ButtonLink, Price, QtyStepper, Stars } from "../components/site/ui";
import { ProductCard } from "../components/site/ProductCard";

export default function ProductPage() {
  const { slug } = useParams();
  const product = useProduct(slug);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const markViewed = useStore((s) => s.markViewed);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const wished = useStore((s) => (product ? s.wishlist.includes(product.id) : false));
  const coupons = useStore((s) => s.coupons);
  const recent = useStore((s) => s.recentlyViewed);
  const navigate = useNavigate();

  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (product) {
      markViewed(product.id);
      setActive(0);
      setSize(product.sizes[0]);
      setQty(1);
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = useMemo(() => {
    if (!product) return [];
    const same = products.filter((p) => p.published && p.id !== product.id && p.category === product.category);
    const pairing = products.filter((p) => p.published && p.id !== product.id && p.type !== product.type && p.occasions.some((o) => product.occasions.includes(o)));
    const rest = products.filter((p) => p.published && p.id !== product.id && p.type === product.type && p.category !== product.category);
    return [...same, ...pairing.slice(0, 2), ...rest].filter((p, i, a) => a.indexOf(p) === i).slice(0, 4);
  }, [product, products]);

  if (!product || !product.published) {
    return (
      <Container className="pt-[calc(var(--nav-height)+2rem)]">
        <EmptyState title="This piece isn't available" body="It may have sold out or been taken down. The shop has similar weaves." action={<ButtonLink to="/shop">Browse the shop</ButtonLink>} />
      </Container>
    );
  }

  const cat = categories.find((c) => c.slug === product.category);
  const out = product.stock === 0;
  const off = discountPct(product.mrp, product.salePrice);

  const offers = coupons.filter((c) => c.active && new Date(c.expiresAt) > new Date() && (c.appliesTo === "all" || c.appliesTo === product.type));
  const reviews = reviewsFor(product);
  const breakdown = ratingBreakdown(product);
  const recentList = recent.map((id) => products.find((p) => p.id === id && p.published && p.id !== product.id)).filter(Boolean).slice(0, 4) as typeof products;
  const sku = `GRH-${product.id.toUpperCase()}`;

  return (
    <div className="pb-28 pt-[calc(var(--nav-height)+1.25rem)] lg:pb-20">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: product.type === "saree" ? "Sarees" : "Jewellery", to: `/shop?type=${product.type}` },
            ...(cat ? [{ label: cat.name, to: `/shop?category=${cat.slug}` }] : []),
            { label: product.name },
          ]}
        />

        <div className="mt-5 grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse gap-3 md:flex-row">
              {product.images.length > 1 && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col" role="tablist" aria-label="Product images">
                  {product.images.map((im, i) => (
                    <button
                      key={im + i}
                      role="tab"
                      aria-selected={active === i}
                      aria-label={`Image ${i + 1}`}
                      onClick={() => setActive(i)}
                      className={`aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-md ring-2 transition md:w-full ${active === i ? "ring-fg" : "ring-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img src={img(im, 160)} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <ZoomImage id={product.images[active]} alt={product.name} onExpand={() => setZoomOpen(true)} />
            </div>
          </div>

          {/* Buy box */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-[calc(var(--nav-height)+1.25rem)]">
              <p className="text-[0.82rem] font-semibold text-brand">{cat?.name}</p>
              <h1 className="mt-1.5 font-display text-[1.8rem] leading-[1.15] sm:text-[2.2rem]">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <a href="#reviews" className="hover:underline">
                  <Stars rating={product.rating} reviews={product.reviews} size={15} />
                </a>
                <span className="text-[0.8rem] text-fg-3">SKU {sku}</span>
              </div>

              <div className="mt-5 border-t border-hair pt-5">
                <Price mrp={product.mrp} sale={product.salePrice} size="lg" />
                <p className="mt-1 text-[0.8rem] text-fg-3">
                  {off > 0 ? `MRP ${money(product.mrp)}. You save ${money(product.mrp - (product.salePrice ?? product.mrp))}. ` : ""}Inclusive of all taxes.
                </p>
                <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.8rem] font-semibold ${out ? "bg-error/10 text-error" : product.stock <= 3 ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                  {out ? "Sold out" : product.stock <= 3 ? `Hurry, only ${product.stock} left` : "In stock, ready to ship"}
                </p>
              </div>

              {offers.length > 0 && (
                <div className="mt-5 rounded-lg border border-dashed border-brand/40 bg-brand/[0.03] p-4">
                  <p className="flex items-center gap-2 text-[0.88rem] font-bold text-fg">
                    <Tag size={17} className="text-brand" /> Available offers
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {offers.slice(0, 3).map((c) => (
                      <li key={c.code} className="text-[0.84rem] text-fg-2">
                        <span className="mr-1.5 font-bold tracking-wide text-brand">{c.code}</span>
                        {c.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {product.sizes.length > 1 && (
                <fieldset className="mt-6">
                  <legend className="mb-2.5 flex w-full items-center justify-between text-[0.88rem] font-semibold">
                    {product.type === "saree" ? (product.category === "half-sarees" ? "Size" : "Blouse") : "Size"}: <span className="ml-1 font-normal text-fg-2">{size}</span>
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        aria-pressed={size === s}
                        className={`min-h-11 rounded-lg border px-4 text-[0.85rem] font-medium transition-colors ${size === s ? "border-fg bg-fg text-white" : "border-hair-2 text-fg hover:border-fg"}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!out && <QtyStepper value={qty} onChange={(n) => setQty(Math.max(1, Math.min(n, product.stock)))} max={product.stock} label="Quantity" />}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-pressed={wished}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-hair-2 px-4 text-[0.88rem] font-semibold hover:border-fg"
                >
                  <Heart size={18} weight={wished ? "fill" : "regular"} className={wished ? "text-brand" : ""} /> {wished ? "Saved" : "Wishlist"}
                </button>
              </div>
              <div className="mt-3 hidden grid-cols-2 gap-3 lg:grid">
                <Button disabled={out} onClick={() => addToCart(product.id, qty, size)} variant="secondary" className="min-h-12">
                  <ShoppingBag size={18} /> Add to bag
                </Button>
                <Button
                  disabled={out}
                  className="min-h-12"
                  onClick={() => {
                    addToCart(product.id, qty, size);
                    navigate("/checkout");
                  }}
                >
                  Buy now
                </Button>
              </div>

              <ul className="mt-6 grid grid-cols-3 gap-2 border-y border-hair py-4 text-center text-[0.75rem] text-fg-2">
                <li className="flex flex-col items-center gap-1.5">
                  <SealCheck size={22} className="text-brand" /> Quality checked
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <ArrowsClockwise size={22} className="text-brand" /> {product.type === "saree" ? "7-day exchange" : "Secure packaging"}
                </li>
                <li className="flex flex-col items-center gap-1.5">
                  <ShieldCheck size={22} className="text-brand" /> Secure payment
                </li>
              </ul>

              <DeliveryCheck />

              <div className="mt-6 border-t border-hair">
                <Accordion title="Product description" defaultOpen>
                  <p className="leading-relaxed text-fg-2">{product.description}</p>
                </Accordion>
                <Accordion title={product.type === "saree" ? "Fabric & design" : "Material & finish"}>
                  <dl className="grid grid-cols-[8rem_1fr] gap-y-2.5 text-sm">
                    <dt className="text-fg-3">{product.type === "saree" ? "Fabric" : "Material"}</dt>
                    <dd className="text-fg">{product.fabric}</dd>
                    <dt className="text-fg-3">Colour</dt>
                    <dd className="text-fg">{product.color}</dd>
                    {product.details.map((d) => (
                      <div key={d.label} className="contents">
                        <dt className="text-fg-3">{d.label}</dt>
                        <dd className="text-fg">{d.value}</dd>
                      </div>
                    ))}
                    <dt className="text-fg-3">SKU</dt>
                    <dd className="text-fg">{sku}</dd>
                  </dl>
                </Accordion>
                <Accordion title="Care instructions">
                  <p className="text-sm leading-relaxed text-fg-2">{product.care}</p>
                </Accordion>
                <Accordion title="Shipping & exchange">
                  <p className="text-sm leading-relaxed text-fg-2">
                    Free insured shipping on orders over ₹2,999. Sarees can be exchanged within 7 days if unworn with the tag attached. Jewellery is final sale for hygiene reasons.
                  </p>
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings & reviews */}
        <section id="reviews" className="mt-16 scroll-mt-[calc(var(--nav-height)+1rem)] border-t border-hair pt-10 lg:mt-20">
          <h2 className="font-display text-[1.7rem] sm:text-[2.1rem]">Ratings & reviews</h2>
          <div className="mt-6 grid gap-10 lg:grid-cols-[18rem_1fr]">
            <div>
              <div className="flex items-end gap-3">
                <span className="font-display text-[3.2rem] leading-none tabular">{product.rating.toFixed(1)}</span>
                <span className="pb-1 text-sm text-fg-2">out of 5</span>
              </div>
              <div className="mt-2">
                <Stars rating={product.rating} size={16} />
              </div>
              <p className="mt-1 text-sm text-fg-3 tabular">Based on {product.reviews} reviews</p>
              <ul className="mt-5 space-y-2">
                {breakdown.map((n, i) => (
                  <li key={i} className="flex items-center gap-3 text-[0.82rem] tabular">
                    <span className="w-8 text-fg-2">{5 - i} ★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${product.reviews ? (n / product.reviews) * 100 : 0}%` }} />
                    </span>
                    <span className="w-8 text-right text-fg-3">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="divide-y divide-hair">
              {reviews.map((r) => (
                <li key={r.name} className="py-5 first:pt-0">
                  <Stars rating={r.rating} size={13} />
                  <p className="mt-1.5 font-semibold">{r.title}</p>
                  <p className="mt-1 max-w-[70ch] text-[0.92rem] leading-relaxed text-fg-2">{r.body}</p>
                  <p className="mt-2 flex items-center gap-2 text-[0.8rem] text-fg-3">
                    {r.name}, {r.city}
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 font-semibold text-success">
                        <SealCheck size={14} weight="fill" /> Verified buyer
                      </span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16 lg:mt-20">
            <h2 className="mb-6 font-display text-[1.7rem] sm:text-[2.1rem]">You may also like</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {recentList.length > 0 && (
          <section className="mt-16 lg:mt-20">
            <h2 className="mb-6 font-display text-[1.7rem] sm:text-[2.1rem]">Recently viewed</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
              {recentList.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Mobile: sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2 border-t border-hair bg-page p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <Button disabled={out} variant="secondary" onClick={() => addToCart(product.id, qty, size)}>
          <ShoppingBag size={17} /> Add to bag
        </Button>
        <Button
          disabled={out}
          onClick={() => {
            addToCart(product.id, qty, size);
            navigate("/checkout");
          }}
        >
          {out ? "Sold out" : "Buy now"}
        </Button>
      </div>

      <AnimatePresence>{zoomOpen && <ZoomViewer images={product.images} start={active} onClose={() => setZoomOpen(false)} />}</AnimatePresence>
    </div>
  );
}

/* Hover-to-magnify on pointer devices; tap opens the full-screen viewer. */
function ZoomImage({ id, alt, onExpand }: { id: string; alt: string; onExpand: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="relative flex-1">
      <div
        ref={ref}
        className="relative aspect-[3/4] cursor-zoom-in overflow-hidden rounded-lg bg-paper"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = ref.current!.getBoundingClientRect();
          setLens({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setLens(null)}
        onClick={onExpand}
      >
        <img src={img(id, 1200)} srcSet={srcSet(id)} sizes="(min-width: 768px) 50vw, 100vw" alt={alt} className="size-full object-cover object-[center_35%]" />
        {lens && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-no-repeat"
            style={{ backgroundImage: `url(${img(id, 1200)})`, backgroundSize: "250%", backgroundPosition: `${lens.x}% ${lens.y}%` }}
          />
        )}
      </div>
      <button onClick={onExpand} aria-label="Open full-screen zoom" className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-page text-fg backdrop-blur-sm hover:bg-page">
        <ArrowsOut size={18} />
      </button>
    </div>
  );
}

function ZoomViewer({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((v) => (v + 1) % images.length);
      if (e.key === "ArrowLeft") setI((v) => (v - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [images.length, onClose]);
  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Image zoom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex flex-col bg-page">
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-fg-2 tabular">
          {i + 1} of {images.length}. {zoomed ? "Move to look around, tap to zoom out." : "Tap the image to zoom in."}
        </span>
        <button onClick={onClose} aria-label="Close zoom" className="grid size-11 place-items-center rounded-full hover:bg-paper">
          <X size={22} />
        </button>
      </div>
      <div
        className={`relative flex-1 overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
          setZoomed((z) => !z);
        }}
        onPointerMove={(e) => {
          if (!zoomed) return;
          const r = e.currentTarget.getBoundingClientRect();
          setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <img
          src={img(images[i], 1200)}
          alt=""
          className="absolute inset-0 size-full object-contain transition-transform duration-500 ease-[var(--ease-silk)]"
          style={{ transform: zoomed ? "scale(2.4)" : "scale(1)", transformOrigin: origin }}
        />
      </div>
      {images.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {images.map((im, k) => (
            <button key={im + k} onClick={() => { setI(k); setZoomed(false); }} aria-label={`Image ${k + 1}`} className={`h-14 w-11 overflow-hidden rounded-[4px] ring-1 ${k === i ? "ring-brand" : "ring-transparent opacity-60"}`}>
              <img src={img(im, 120)} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      className="mt-6 rounded-lg bg-paper p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[1-9]\d{5}$/.test(pin)) {
          setResult({ ok: false, text: "Enter a 6-digit Indian pincode, like 600017." });
          return;
        }
        // Demo rule: south India pincodes (5xx, 6xx) arrive faster.
        const days = /^[56]/.test(pin) ? 3 : /^[1-4]/.test(pin) ? 5 : 6;
        const by = addBusinessDays(new Date(), days).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
        setResult({ ok: true, text: `Arrives by ${by}. Free insured shipping over ₹2,999.` });
      }}
    >
      <label htmlFor="pincode" className="flex items-center gap-2 text-sm font-semibold">
        <Truck size={18} className="text-brand" /> Check delivery date
      </label>
      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ""));
              setResult(null);
            }}
            placeholder="Pincode"
            className="min-h-11 w-full rounded-lg border border-hair-2 bg-page pl-10 pr-4 text-fg tabular placeholder:text-fg-3 focus:border-fg focus:outline-none"
          />
        </div>
        <button className="min-h-11 rounded-lg bg-fg px-5 text-sm font-semibold text-white hover:bg-brand">Check</button>
      </div>
      {result && <p className={`mt-3 text-sm ${result.ok ? "text-success" : "text-error"}`}>{result.text}</p>}
    </form>
  );
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hair">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left font-semibold">
        {title}
        {open ? <MinusCircle size={20} className="text-brand" /> : <PlusCircle size={20} className="text-fg-2" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }} className="overflow-hidden">
            <div className="pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

