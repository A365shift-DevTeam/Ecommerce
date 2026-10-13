import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, CaretRight, Heart, List, MagnifyingGlass, ShoppingBag, User, X } from "@phosphor-icons/react";
import { brandMark, img } from "../../lib/cloudinary";
import { useCartSummary, useCurrentUser, useStore } from "../../store/useStore";
import { occasions } from "../../data/seed";
import { money } from "../../lib/format";
import { lockScroll } from "../../lib/smoothScroll";

const announcements = [
  "Free insured shipping on orders above ₹2,999",
  "Festive offer: 12% off silk sarees with code DEEPAM12",
  "Book a free video styling call before you buy",
];

const priceBands = [
  { label: "Under ₹5,000", q: "max=5000" },
  { label: "₹5,000 to ₹10,000", q: "min=5000&max=10000" },
  { label: "₹10,000 to ₹20,000", q: "min=10000&max=20000" },
  { label: "Above ₹20,000", q: "min=20000" },
];

type MenuKey = "saree" | "jewellery";

export function Wordmark() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Gruham home">
      <img src={brandMark(44)} alt="" width={44} height={44} className="size-9 rounded-full md:size-11" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.2rem] tracking-[0.2em] text-fg md:text-[1.4rem]">GRUHAM</span>
        <span className="mt-1 hidden text-[0.6rem] tracking-[0.18em] text-fg-3 sm:block">SAREES & JEWELLERY</span>
      </span>
    </Link>
  );
}

function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex h-[var(--announce-height)] items-center justify-center overflow-hidden bg-brand px-4 text-white">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="truncate text-center text-[0.76rem] font-medium tracking-wide"
          aria-live="polite"
        >
          {announcements[i]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const { pathname, search } = useLocation();
  const { count } = useCartSummary();
  const wishCount = useStore((s) => s.wishlist.length);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const user = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mega, setMega] = useState<MenuKey | null>(null);
  const closeTimer = useRef(0);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setMega(null);
  }, [pathname, search]);

  useEffect(() => {
    lockScroll(menuOpen || searchOpen);
  }, [menuOpen, searchOpen]);

  const openMega = (k: MenuKey) => {
    clearTimeout(closeTimer.current);
    setMega(k);
  };
  const closeMega = () => {
    closeTimer.current = window.setTimeout(() => setMega(null), 120);
  };

  const links: { label: string; to: string; menu?: MenuKey }[] = [
    { label: "Sarees", to: "/shop?type=saree", menu: "saree" },
    { label: "Half sarees", to: "/shop?category=half-sarees" },
    { label: "Jewellery", to: "/shop?type=jewellery", menu: "jewellery" },
    { label: "Bridal", to: "/shop?occasion=bridal" },
    { label: "New in", to: "/shop?sort=new" },
    { label: "Offers", to: "/shop?offer=1" },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-[var(--nav-height)] bg-page" onMouseLeave={closeMega}>
        <AnnouncementBar />
        <div className="h-[var(--main-nav-height)] border-b border-hair">
          <div className="mx-auto flex h-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:gap-6 lg:px-10">
            <button className="-ml-2 grid size-11 place-items-center rounded-full hover:bg-paper lg:hidden" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <List size={22} />
            </button>
            <Wordmark />

            <nav aria-label="Main" className="ml-4 hidden h-full items-stretch lg:flex">
              {links.map((l) => (
                <div key={l.label} className="flex items-stretch" onMouseEnter={() => (l.menu ? openMega(l.menu) : closeMega())}>
                  <Link
                    to={l.to}
                    aria-haspopup={l.menu ? "true" : undefined}
                    aria-expanded={l.menu ? mega === l.menu : undefined}
                    onFocus={() => l.menu && openMega(l.menu)}
                    className={`flex items-center gap-1 border-b-2 px-3 text-[0.9rem] font-medium transition-colors ${mega && l.menu === mega ? "border-brand text-brand" : "border-transparent text-fg hover:text-brand"} ${l.label === "Offers" ? "text-brand" : ""}`}
                  >
                    {l.label}
                    {l.menu && <CaretDown size={12} weight="bold" className="opacity-60" />}
                  </Link>
                </div>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden h-11 w-64 items-center gap-2 rounded-lg border border-hair-2 bg-paper px-3.5 text-left text-[0.85rem] text-fg-3 hover:border-fg-3 xl:flex"
              >
                <MagnifyingGlass size={17} className="text-fg-2" /> Search sarees, jewellery…
              </button>
              <button onClick={() => setSearchOpen(true)} aria-label="Search" className="grid size-11 place-items-center rounded-full hover:bg-paper xl:hidden">
                <MagnifyingGlass size={21} />
              </button>
              <HeaderIcon to="/account" label={user ? user.name.split(" ")[0] : "Account"} className="hidden md:flex">
                <User size={21} />
              </HeaderIcon>
              <HeaderIcon to="/account/wishlist" label="Wishlist" count={wishCount} className="hidden sm:flex">
                <Heart size={21} />
              </HeaderIcon>
              <button onClick={() => setCartOpen(true)} aria-label={`Bag, ${count} items`} className="relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 hover:bg-paper">
                <ShoppingBag size={21} />
                <span className="hidden text-[0.68rem] font-medium md:block">Bag</span>
                {count > 0 && <CountBadge n={count} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => openMega(mega)}
              className="absolute inset-x-0 top-full hidden border-b border-hair bg-page shadow-[0_24px_40px_-24px_rgba(36,22,25,0.35)] lg:block"
            >
              <MegaMenu kind={mega} />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>{menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}</AnimatePresence>
    </>
  );
}

function HeaderIcon({ to, label, count, children, className = "" }: { to: string; label: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <Link to={to} aria-label={count ? `${label}, ${count} items` : label} className={`relative min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 hover:bg-paper ${className}`}>
      {children}
      <span className="hidden max-w-16 truncate text-[0.68rem] font-medium md:block">{label}</span>
      {!!count && <CountBadge n={count} />}
    </Link>
  );
}

function CountBadge({ n }: { n: number }) {
  return <span className="absolute right-0 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[0.66rem] font-bold leading-none text-white tabular">{n}</span>;
}

function MegaMenu({ kind }: { kind: MenuKey }) {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const cats = categories.filter((c) => c.type === kind);
  const featured = kind === "saree" ? { image: "halfsaree-lavender-peacock", title: "Festive half sarees", to: "/shop?category=half-sarees" } : { image: "jewel-temple-necklace", title: "The temple jewellery edit", to: "/shop?collection=col2" };
  const count = (slug: string) => products.filter((p) => p.published && p.category === slug).length;
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_1fr_1fr_18rem] gap-10 px-10 py-8">
      <div>
        <p className="mb-3 text-[0.78rem] font-bold tracking-wide text-fg-3">SHOP BY CATEGORY</p>
        <ul className="space-y-1">
          <li>
            <Link to={`/shop?type=${kind}`} className="block py-1.5 text-[0.92rem] font-semibold text-fg hover:text-brand">
              All {kind === "saree" ? "sarees" : "jewellery"}
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link to={`/shop?category=${c.slug}`} className="flex items-center justify-between py-1.5 text-[0.92rem] text-fg-2 hover:text-brand">
                {c.name} <span className="text-[0.78rem] text-fg-3 tabular">{count(c.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 text-[0.78rem] font-bold tracking-wide text-fg-3">SHOP BY OCCASION</p>
        <ul className="space-y-1">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link to={`/shop?type=${kind}&occasion=${o.slug}`} className="block py-1.5 text-[0.92rem] text-fg-2 hover:text-brand">
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-3 text-[0.78rem] font-bold tracking-wide text-fg-3">SHOP BY PRICE</p>
        <ul className="space-y-1">
          {priceBands.map((b) => (
            <li key={b.label}>
              <Link to={`/shop?type=${kind}&${b.q}`} className="block py-1.5 text-[0.92rem] text-fg-2 hover:text-brand">
                {b.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link to={featured.to} className="group relative block aspect-[4/5] overflow-hidden rounded-lg">
        <img src={img(featured.image, 600)} alt="" className="absolute inset-0 size-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <p className="absolute inset-x-4 bottom-4 font-display text-xl text-white">{featured.title}</p>
      </Link>
    </div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const categories = useStore((s) => s.categories);
  const user = useCurrentUser();
  const [open, setOpen] = useState<MenuKey | null>("saree");
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-black/40" onClick={onClose} />
      <motion.nav
        aria-label="Mobile"
        data-lenis-prevent
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-sm flex-col overflow-y-auto bg-page"
      >
        <div className="flex items-center justify-between border-b border-hair px-4 py-3">
          <Wordmark />
          <button onClick={onClose} aria-label="Close menu" className="grid size-11 place-items-center rounded-full hover:bg-paper">
            <X size={22} />
          </button>
        </div>
        <Link to="/account" onClick={onClose} className="flex min-h-14 items-center gap-3 border-b border-hair bg-paper px-4 text-[0.92rem] font-semibold">
          <User size={20} /> {user ? `Hello, ${user.name.split(" ")[0]}` : "Sign in or create an account"}
        </Link>
        {(["saree", "jewellery"] as const).map((k) => (
          <div key={k} className="border-b border-hair">
            <button onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} className="flex min-h-14 w-full items-center justify-between px-4 text-left text-[1rem] font-semibold">
              {k === "saree" ? "Sarees" : "Jewellery"}
              <CaretDown size={16} className={`transition-transform ${open === k ? "rotate-180" : ""}`} />
            </button>
            {open === k && (
              <ul className="pb-3">
                <li>
                  <Link to={`/shop?type=${k}`} onClick={onClose} className="flex min-h-11 items-center px-6 text-[0.92rem] font-semibold text-brand">
                    View all
                  </Link>
                </li>
                {categories
                  .filter((c) => c.type === k)
                  .map((c) => (
                    <li key={c.id}>
                      <Link to={`/shop?category=${c.slug}`} onClick={onClose} className="flex min-h-11 items-center px-6 text-[0.92rem] text-fg-2">
                        {c.name}
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}
        {[
          { to: "/shop?occasion=bridal", label: "Bridal" },
          { to: "/shop?sort=new", label: "New in" },
          { to: "/shop?offer=1", label: "Offers" },
          { to: "/account/wishlist", label: "Wishlist" },
          { to: "/account/orders", label: "Track your order" },
          { to: "/admin", label: "Admin demo" },
        ].map((l) => (
          <Link key={l.label} to={l.to} onClick={onClose} className="flex min-h-14 items-center justify-between border-b border-hair px-4 text-[1rem] font-semibold">
            {l.label} <CaretRight size={14} className="text-fg-3" />
          </Link>
        ))}
      </motion.nav>
    </>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) => p.published && [p.name, p.fabric, p.color, p.category, ...p.occasions].join(" ").toLowerCase().includes(term)).slice(0, 6);
  }, [q, products]);
  const trending = products.filter((p) => p.published && p.bestseller).slice(0, 4);

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Search" data-lenis-prevent initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] overflow-y-auto bg-page">
      <div className="border-b border-hair">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6 md:py-5">
          <MagnifyingGlass size={22} className="text-fg-2" />
          <form
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
              onClose();
            }}
          >
            <label htmlFor="site-search" className="sr-only">
              Search sarees and jewellery
            </label>
            <input
              ref={inputRef}
              id="site-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search half sarees, Banarasi, temple necklace…"
              className="w-full bg-transparent py-2 text-lg text-fg placeholder:text-fg-3 focus:outline-none md:text-xl"
            />
          </form>
          <button onClick={onClose} aria-label="Close search" className="grid size-11 place-items-center rounded-full hover:bg-paper">
            <X size={22} />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {q.trim() === "" ? (
          <>
            <p className="mb-3 text-[0.78rem] font-bold tracking-wide text-fg-3">POPULAR CATEGORIES</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} onClick={onClose} className="inline-flex min-h-10 items-center rounded-full border border-hair-2 px-4 text-sm text-fg hover:border-fg">
                  {c.name}
                </Link>
              ))}
            </div>
            <p className="mb-3 mt-8 text-[0.78rem] font-bold tracking-wide text-fg-3">TRENDING NOW</p>
            <ResultList items={trending} onClose={onClose} />
          </>
        ) : results.length === 0 ? (
          <p className="text-fg-2">Nothing matches "{q}". Try a weave like Banarasi, a colour, or a piece like jimikki.</p>
        ) : (
          <>
            <ResultList items={results} onClose={onClose} />
            <Link to={`/shop?q=${encodeURIComponent(q.trim())}`} onClick={onClose} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand underline underline-offset-4">
              See all results for "{q}"
            </Link>
          </>
        )}
      </div>
    </motion.div>
  );
}

function ResultList({ items, onClose }: { items: ReturnType<typeof useStore.getState>["products"]; onClose: () => void }) {
  return (
    <ul className="divide-y divide-hair">
      {items.map((p) => (
        <li key={p.id}>
          <Link to={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-4 py-3 hover:bg-paper">
            <img src={img(p.images[0], 120)} alt="" className="h-16 w-12 rounded-md object-cover" />
            <span className="flex-1">
              <span className="block text-[0.95rem] text-fg">{p.name}</span>
              <span className="text-sm text-fg-3">{p.fabric}</span>
            </span>
            <span className="text-sm font-semibold tabular">{money(p.salePrice ?? p.mrp)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
