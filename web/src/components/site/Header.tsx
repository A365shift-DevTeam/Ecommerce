import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, CaretRight, Heart, List, MagnifyingGlass, ShoppingBag, User, X } from "@phosphor-icons/react";
import { brandMark, img } from "../../lib/cloudinary";
import { useCartSummary, useCurrentUser, useStore } from "../../store/useStore";
import { occasions } from "../../data/seed";
import { money } from "../../lib/format";
import { lockScroll } from "../../lib/smoothScroll";
import { useIsMobile } from "../../hooks/useIsMobile";

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
type NavLink = { label: string; to: string; menu?: MenuKey };

/** Logo: the round brand mark over a tracked GRUHAM, stacked on desktop where it sits centred in the nav. */
export function Wordmark({ stacked = false }: { stacked?: boolean }) {
  return (
    <Link to="/" className={`flex shrink-0 items-center ${stacked ? "flex-col gap-1" : "gap-2.5"}`} aria-label="Gruham home">
      <img src={brandMark(44)} alt="" width={44} height={44} className={`rounded-full ring-1 ring-brand/50 ${stacked ? "size-10" : "size-9"}`} />
      <span className={`flex flex-col leading-none ${stacked ? "items-center" : ""}`}>
        <span className={`font-display text-fg ${stacked ? "text-[1.05rem] tracking-[0.42em] pl-[0.42em]" : "text-[1.15rem] tracking-[0.3em]"}`}>GRUHAM</span>
        <span className={`mt-1 text-[0.5rem] tracking-[0.36em] text-brand ${stacked ? "pl-[0.36em]" : "hidden sm:block"}`}>SAREES · JEWELLERY</span>
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
    <div className="flex h-[var(--announce-height)] items-center justify-center overflow-hidden border-b border-hair bg-void px-4 text-gold-light">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="truncate text-center text-[0.62rem] font-medium uppercase tracking-[0.24em]"
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

  // Desktop home: the main row is see-through over the showroom frames until they finish playing
  // (when #hero-end, the bottom of the pinned hero, reaches the bottom of the screen).
  const mobile = useIsMobile();
  const [overHero, setOverHero] = useState(false);
  useEffect(() => {
    if (mobile || pathname !== "/") return setOverHero(false);
    let raf = 0;
    const check = () => {
      raf = 0;
      const end = document.getElementById("hero-end");
      setOverHero(!!end && end.getBoundingClientRect().top > window.innerHeight + 1);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [mobile, pathname]);
  const clear = overHero && !mega;

  const openMega = (k: MenuKey) => {
    clearTimeout(closeTimer.current);
    setMega(k);
  };
  const closeMega = () => {
    closeTimer.current = window.setTimeout(() => setMega(null), 120);
  };

  // Split around the centred logo.
  const leftLinks: NavLink[] = [
    { label: "Sarees", to: "/shop?type=saree", menu: "saree" },
    { label: "Half sarees", to: "/shop?category=half-sarees" },
    { label: "Jewellery", to: "/shop?type=jewellery", menu: "jewellery" },
  ];
  const rightLinks: NavLink[] = [
    { label: "Bridal", to: "/shop?occasion=bridal" },
    { label: "New in", to: "/shop?sort=new" },
    { label: "Offers", to: "/shop?offer=1" },
  ];
  const navItem = (l: NavLink) => (
    <div key={l.label} className="flex items-stretch" onMouseEnter={() => (l.menu ? openMega(l.menu) : closeMega())}>
      <Link
        to={l.to}
        aria-haspopup={l.menu ? "true" : undefined}
        aria-expanded={l.menu ? mega === l.menu : undefined}
        onFocus={() => l.menu && openMega(l.menu)}
        className={`relative flex items-center gap-1 whitespace-nowrap px-2.5 text-[0.68rem] font-medium uppercase tracking-[0.2em] transition-colors after:absolute after:inset-x-2.5 after:bottom-[1.6rem] after:h-px after:origin-left after:bg-brand after:transition-transform after:duration-300 hover:text-brand hover:after:scale-x-100 xl:px-4 xl:after:inset-x-4 ${
          mega && l.menu === mega ? "text-brand after:scale-x-100" : "text-fg after:scale-x-0"
        }`}
      >
        {l.label}
        {l.menu && <CaretDown size={10} weight="bold" className="opacity-60" />}
      </Link>
    </div>
  );
  const iconCls = "relative grid size-10 place-items-center rounded-full text-fg transition-colors hover:text-brand";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-[var(--nav-height)] text-fg" onMouseLeave={closeMega}>
        <AnnouncementBar />
        <div className="relative h-[var(--main-nav-height)]">
          {/* Solid row and its gold hairline fade out over the hero; a soft shade keeps the text readable on bright frames. */}
          <div aria-hidden="true" className={`absolute inset-0 border-b border-hair bg-page/95 backdrop-blur-md transition-opacity duration-300 ${clear ? "opacity-0" : "opacity-100"}`} />
          <div aria-hidden="true" className={`pointer-events-none absolute inset-x-0 top-0 h-[180%] bg-gradient-to-b from-black/60 via-black/25 to-transparent transition-opacity duration-300 ${clear ? "opacity-100" : "opacity-0"}`} />
          <div className="relative mx-auto grid h-full max-w-[1500px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-6 lg:px-8">
            <div className="flex h-full items-center justify-start lg:justify-end">
              <button className="grid size-11 place-items-center rounded-full hover:text-brand lg:hidden" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
                <List size={22} weight="light" />
              </button>
              <button onClick={() => setSearchOpen(true)} aria-label="Search" className={`${iconCls} size-11 sm:hidden`}>
                <MagnifyingGlass size={20} weight="light" />
              </button>
              <nav aria-label="Main" className="hidden h-full items-stretch lg:flex">
                {leftLinks.map(navItem)}
              </nav>
            </div>

            <div className="px-2 lg:px-6 xl:px-10">
              <span className="lg:hidden">
                <Wordmark />
              </span>
              <span className="hidden lg:block">
                <Wordmark stacked />
              </span>
            </div>

            <div className="flex h-full items-center">
              <nav aria-label="More" className="hidden h-full items-stretch lg:flex">
                {rightLinks.map(navItem)}
              </nav>
              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                <button onClick={() => setSearchOpen(true)} aria-label="Search" className={`${iconCls} hidden sm:grid`}>
                  <MagnifyingGlass size={20} weight="light" />
                </button>
                <Link to="/account" aria-label={user ? `Account, ${user.name.split(" ")[0]}` : "Account"} className={`${iconCls} hidden md:grid`}>
                  <User size={20} weight="light" />
                </Link>
                <Link to="/account/wishlist" aria-label={wishCount ? `Wishlist, ${wishCount} items` : "Wishlist"} className={`${iconCls} hidden sm:grid`}>
                  <Heart size={20} weight="light" />
                  {!!wishCount && <CountBadge n={wishCount} />}
                </Link>
                <button onClick={() => setCartOpen(true)} aria-label={`Bag, ${count} items`} className={iconCls}>
                  <ShoppingBag size={20} weight="light" />
                  {count > 0 && <CountBadge n={count} />}
                </button>
              </div>
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
              className="surface-glow absolute inset-x-0 top-full hidden border-b border-hair-2 shadow-[0_30px_50px_-24px_rgba(0,0,0,0.7)] lg:block"
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

function CountBadge({ n }: { n: number }) {
  return <span className="gold-fill absolute -right-0.5 top-0 grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[0.6rem] font-semibold leading-none text-on-brand tabular">{n}</span>;
}

function MegaMenu({ kind }: { kind: MenuKey }) {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const cats = categories.filter((c) => c.type === kind);
  const featured = kind === "saree" ? { image: "halfsaree-lavender-peacock", title: "Festive half sarees", to: "/shop?category=half-sarees" } : { image: "jewel-temple-necklace", title: "The temple jewellery edit", to: "/shop?collection=col2" };
  const count = (slug: string) => products.filter((p) => p.published && p.category === slug).length;
  const head = "eyebrow mb-4 border-b border-hair pb-3";
  const item = "block py-1.5 font-display text-[1rem] text-fg-2 transition-colors hover:text-gold-light";
  return (
    <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_1fr_1fr_18rem] gap-12 px-10 py-10">
      <div>
        <p className={head}>Shop by category</p>
        <ul className="space-y-0.5">
          <li>
            <Link to={`/shop?type=${kind}`} className="block py-1.5 font-display text-[1rem] text-fg hover:text-gold-light">
              All {kind === "saree" ? "sarees" : "jewellery"}
            </Link>
          </li>
          {cats.map((c) => (
            <li key={c.id}>
              <Link to={`/shop?category=${c.slug}`} className={`${item} flex items-center justify-between`}>
                {c.name} <span className="font-sans text-[0.72rem] text-fg-3 tabular">{count(c.slug)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className={head}>Shop by occasion</p>
        <ul className="space-y-0.5">
          {occasions.map((o) => (
            <li key={o.slug}>
              <Link to={`/shop?type=${kind}&occasion=${o.slug}`} className={item}>
                {o.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className={head}>Shop by price</p>
        <ul className="space-y-0.5">
          {priceBands.map((b) => (
            <li key={b.label}>
              <Link to={`/shop?type=${kind}&${b.q}`} className={item}>
                {b.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Link to={featured.to} className="arch group relative block aspect-[4/5] overflow-hidden border border-hair-2">
        <img src={img(featured.image, 600)} alt="" className="absolute inset-0 size-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-page via-page/20 to-transparent" />
        <div className="absolute inset-x-4 bottom-5 text-center">
          <p className="eyebrow">Featured</p>
          <p className="mt-2 font-display text-xl text-fg">{featured.title}</p>
        </div>
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.nav
        aria-label="Mobile"
        data-lenis-prevent
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-sm flex-col overflow-y-auto border-r border-hair-2 bg-page"
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
            <button onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} className="flex min-h-14 w-full items-center justify-between px-4 text-left font-display text-[1.1rem]">
              {k === "saree" ? "Sarees" : "Jewellery"}
              <CaretDown size={16} className={`transition-transform ${open === k ? "rotate-180" : ""}`} />
            </button>
            {open === k && (
              <ul className="pb-3">
                <li>
                  <Link to={`/shop?type=${k}`} onClick={onClose} className="flex min-h-11 items-center px-6 text-[0.68rem] font-medium uppercase tracking-[0.2em] text-brand">
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
          <Link key={l.label} to={l.to} onClick={onClose} className="flex min-h-14 items-center justify-between border-b border-hair px-4 font-display text-[1.1rem]">
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
            <p className="eyebrow mb-4">POPULAR CATEGORIES</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} onClick={onClose} className="inline-flex min-h-10 items-center rounded-full border border-hair-2 px-4 text-sm text-fg transition-colors hover:border-brand hover:text-brand">
                  {c.name}
                </Link>
              ))}
            </div>
            <p className="eyebrow mb-4 mt-10">TRENDING NOW</p>
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
            <img src={img(p.images[0], 120)} alt="" className="h-16 w-12 rounded-[2px] border border-hair object-cover" />
            <span className="flex-1">
              <span className="block font-display text-[1rem] text-fg">{p.name}</span>
              <span className="text-sm text-fg-3">{p.fabric}</span>
            </span>
            <span className="text-sm font-semibold text-gold-light tabular">{money(p.salePrice ?? p.mrp)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
