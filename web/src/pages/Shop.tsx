import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, Check, FunnelSimple, MagnifyingGlass, SortAscending, X } from "@phosphor-icons/react";
import { useStore, priceOf } from "../store/useStore";
import { occasions } from "../data/seed";
import { ProductCard } from "../components/site/ProductCard";
import { Breadcrumbs, Button, Container, EmptyState } from "../components/site/ui";
import { discountPct, money } from "../lib/format";
import { lockScroll } from "../lib/smoothScroll";

const sorts = [
  { v: "featured", label: "Featured" },
  { v: "popular", label: "Most popular" },
  { v: "price-asc", label: "Price: low to high" },
  { v: "price-desc", label: "Price: high to low" },
  { v: "new", label: "Newest first" },
  { v: "rating", label: "Top rated" },
  { v: "discount", label: "Biggest discount" },
];
const PAGE = 12;

interface Filters {
  categories: string[];
  colors: string[];
  fabrics: string[];
  occasions: string[];
  min: number;
  max: number;
  minOff: number;
  inStock: boolean;
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const allProducts = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const collections = useStore((s) => s.collections);
  const attributes = useStore((s) => s.attributes);

  const q = params.get("q") ?? "";
  const type = params.get("type") ?? "";
  const category = params.get("category") ?? "";
  const occasion = params.get("occasion") ?? "";
  const collection = params.get("collection") ?? "";
  const offer = params.get("offer") === "1";
  const sort = params.get("sort") ?? "featured";

  const published = useMemo(() => allProducts.filter((p) => p.published), [allProducts]);
  const priceCeil = useMemo(() => Math.ceil(Math.max(...published.map(priceOf), 1000) / 1000) * 1000, [published]);
  const blank = (): Filters => ({
    categories: [],
    colors: [],
    fabrics: [],
    occasions: [],
    min: Number(params.get("min")) || 0,
    max: Number(params.get("max")) || priceCeil,
    minOff: 0,
    inStock: false,
  });
  const [f, setF] = useState<Filters>(blank);
  const [drawer, setDrawer] = useState(false);
  const [sortSheet, setSortSheet] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);
  // Price links from the menus (?min / ?max) set the price filter.
  useEffect(() => {
    setF((s) => ({ ...s, min: Number(params.get("min")) || 0, max: Number(params.get("max")) || priceCeil }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("min"), params.get("max"), priceCeil]);
  useEffect(() => setShown(PAGE), [params, f]);
  useEffect(() => {
    lockScroll(drawer || sortSheet);
  }, [drawer, sortSheet]);

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k === "type") next.delete("category");
    setParams(next, { replace: true });
  };

  const cat = categories.find((c) => c.slug === category);
  const effectiveType = type || cat?.type || "";
  const col = collections.find((c) => c.id === collection);
  const occ = occasions.find((o) => o.slug === occasion);

  // Products in the URL scope (before sidebar filters); facet options come from these.
  const scoped = useMemo(() => {
    const term = q.trim().toLowerCase();
    return published.filter(
      (p) =>
        (!effectiveType || p.type === effectiveType) &&
        (!category || p.category === category) &&
        (!occasion || p.occasions.includes(occasion)) &&
        (!col || col.productIds.includes(p.id)) &&
        (!offer || (p.salePrice && p.salePrice < p.mrp)) &&
        (!term || [p.name, p.fabric, p.color, p.category, ...p.occasions].join(" ").toLowerCase().includes(term)),
    );
  }, [published, effectiveType, category, occasion, col, offer, q]);

  const results = useMemo(() => {
    const r = scoped.filter(
      (p) =>
        (f.categories.length === 0 || f.categories.includes(p.category)) &&
        (f.colors.length === 0 || f.colors.includes(p.color)) &&
        (f.fabrics.length === 0 || f.fabrics.includes(p.fabric)) &&
        (f.occasions.length === 0 || f.occasions.some((o) => p.occasions.includes(o))) &&
        priceOf(p) >= f.min &&
        priceOf(p) <= f.max &&
        discountPct(p.mrp, p.salePrice) >= f.minOff &&
        (!f.inStock || p.stock > 0),
    );
    const by: Record<string, (a: (typeof r)[number], b: (typeof r)[number]) => number> = {
      featured: (a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold,
      popular: (a, b) => b.sold - a.sold,
      "price-asc": (a, b) => priceOf(a) - priceOf(b),
      "price-desc": (a, b) => priceOf(b) - priceOf(a),
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      discount: (a, b) => discountPct(b.mrp, b.salePrice) - discountPct(a.mrp, a.salePrice),
    };
    return [...r].sort(by[sort] ?? by.featured);
  }, [scoped, f, sort]);

  const facetCats = categories.filter((c) => scoped.some((p) => p.category === c.slug));
  const colorOptions = attributes.colors.filter((c) => scoped.some((p) => p.color === c.name));
  const fabricOptions = attributes.fabrics.filter((fa) => scoped.some((p) => p.fabric === fa));
  const occasionOptions = occasions.filter((o) => scoped.some((p) => p.occasions.includes(o.slug)));

  const chips: { label: string; clear: () => void }[] = [
    ...(occ ? [{ label: `Occasion: ${occ.name}`, clear: () => setParam("occasion", null) }] : []),
    ...(col ? [{ label: col.name, clear: () => setParam("collection", null) }] : []),
    ...(offer ? [{ label: "On offer", clear: () => setParam("offer", null) }] : []),
    ...(q ? [{ label: `"${q}"`, clear: () => setParam("q", null) }] : []),
    ...f.categories.map((c) => ({ label: categories.find((x) => x.slug === c)?.name ?? c, clear: () => setF((s) => ({ ...s, categories: s.categories.filter((x) => x !== c) })) })),
    ...f.colors.map((c) => ({ label: c, clear: () => setF((s) => ({ ...s, colors: s.colors.filter((x) => x !== c) })) })),
    ...f.fabrics.map((c) => ({ label: c, clear: () => setF((s) => ({ ...s, fabrics: s.fabrics.filter((x) => x !== c) })) })),
    ...f.occasions.map((c) => ({ label: occasions.find((o) => o.slug === c)?.name ?? c, clear: () => setF((s) => ({ ...s, occasions: s.occasions.filter((x) => x !== c) })) })),
    ...(f.min > 0 || f.max < priceCeil ? [{ label: `${money(f.min)} to ${money(f.max)}`, clear: () => setF((s) => ({ ...s, min: 0, max: priceCeil })) }] : []),
    ...(f.minOff ? [{ label: `${f.minOff}% off or more`, clear: () => setF((s) => ({ ...s, minOff: 0 })) }] : []),
    ...(f.inStock ? [{ label: "In stock", clear: () => setF((s) => ({ ...s, inStock: false })) }] : []),
  ];
  const clearAll = () => {
    setF({ categories: [], colors: [], fabrics: [], occasions: [], min: 0, max: priceCeil, minOff: 0, inStock: false });
    const keep = new URLSearchParams();
    if (type) keep.set("type", type);
    if (category) keep.set("category", category);
    setParams(keep, { replace: true });
  };

  const title = q ? `Results for "${q}"` : col?.name ?? cat?.name ?? occ?.name ?? (offer ? "Offers" : effectiveType === "saree" ? "Sarees" : effectiveType === "jewellery" ? "Jewellery" : "All products");
  const filterCount = chips.length;

  const panel = (
    <FacetPanel
      f={f}
      setF={setF}
      cats={category ? [] : facetCats}
      colorOptions={colorOptions}
      fabricOptions={fabricOptions}
      occasionOptions={occasion ? [] : occasionOptions}
      priceCeil={priceCeil}
      scoped={scoped}
    />
  );

  return (
    <div className="pb-28 pt-[calc(var(--nav-height)+1.25rem)] lg:pb-20">
      <Container>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            ...(effectiveType && (cat || col || occ || offer) ? [{ label: effectiveType === "saree" ? "Sarees" : "Jewellery", to: `/shop?type=${effectiveType}` }] : []),
            { label: title },
          ]}
        />
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-[1.9rem] leading-tight sm:text-[2.4rem]">{title}</h1>
            <p className="mt-1 text-[0.9rem] text-fg-2 tabular">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
          </div>
          <form
            role="search"
            className="relative w-full md:w-80"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", search.trim() || null);
            }}
          >
            <label htmlFor="shop-search" className="sr-only">
              Search the shop
            </label>
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
            <input
              id="shop-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within the shop"
              className="min-h-11 w-full rounded-lg border border-hair-2 bg-page pl-10 pr-4 text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none"
            />
          </form>
        </div>

        {/* Category tabs */}
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[
            ["", "All"],
            ["saree", "Sarees"],
            ["jewellery", "Jewellery"],
          ].map(([v, l]) => (
            <button
              key={l}
              onClick={() => setParam("type", v || null)}
              aria-pressed={effectiveType === v && !category}
              className={`min-h-10 shrink-0 rounded-full border px-4 text-[0.85rem] font-medium ${effectiveType === v && !category ? "border-brand bg-brand text-on-brand" : "border-hair-2 text-fg hover:border-fg"}`}
            >
              {l}
            </button>
          ))}
          <span className="mx-1 w-px shrink-0 bg-hair" aria-hidden="true" />
          {categories
            .filter((c) => !effectiveType || c.type === effectiveType)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setParam("category", category === c.slug ? null : c.slug)}
                aria-pressed={category === c.slug}
                className={`min-h-10 shrink-0 rounded-full border px-4 text-[0.85rem] font-medium ${category === c.slug ? "border-brand bg-brand text-on-brand" : "border-hair-2 text-fg hover:border-fg"}`}
              >
                {c.name}
              </button>
            ))}
        </div>

        <div className="mt-6 grid gap-8 border-t border-hair pt-6 lg:grid-cols-[16rem_1fr] lg:gap-10">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-[calc(var(--nav-height)+1.25rem)]">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[0.95rem] font-bold">Filters</h2>
                {filterCount > 0 && (
                  <button onClick={clearAll} className="text-[0.82rem] font-semibold text-brand underline underline-offset-4">
                    Clear all
                  </button>
                )}
              </div>
              {panel}
            </div>
          </aside>

          <div>
            <div className="mb-5 hidden items-center justify-between gap-3 lg:flex">
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Chip key={c.label} label={c.label} onClear={c.clear} />
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <label htmlFor="sort" className="text-sm text-fg-2">
                  Sort by
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
                  className="min-h-10 rounded-lg border border-hair-2 bg-page px-3 text-sm font-medium text-fg focus:border-fg focus:outline-none"
                >
                  {sorts.map((s) => (
                    <option key={s.v} value={s.v}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
                {chips.map((c) => (
                  <Chip key={c.label} label={c.label} onClear={c.clear} />
                ))}
              </div>
            )}

            {results.length === 0 ? (
              <EmptyState title="No products match these filters" body="Widen the price range or remove a filter to see more pieces." action={<Button variant="ghost" onClick={clearAll}>Clear all filters</Button>} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
                  {results.slice(0, shown).map((p, i) => (
                    <ProductCard key={p.id} product={p} eager={i < 6} sizes="(min-width: 1024px) 26vw, (min-width: 768px) 33vw, 50vw" />
                  ))}
                </div>
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-sm text-fg-2 tabular">
                    Showing {Math.min(shown, results.length)} of {results.length}
                  </p>
                  {shown < results.length && (
                    <Button variant="ghost" onClick={() => setShown((n) => n + PAGE)}>
                      Load more
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile: sticky Sort / Filter bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 border-t border-hair bg-page pb-[env(safe-area-inset-bottom)] lg:hidden">
        <button onClick={() => setSortSheet(true)} className="flex min-h-14 items-center justify-center gap-2 border-r border-hair text-[0.9rem] font-semibold">
          <SortAscending size={18} /> Sort
        </button>
        <button onClick={() => setDrawer(true)} className="flex min-h-14 items-center justify-center gap-2 text-[0.9rem] font-semibold">
          <FunnelSimple size={18} /> Filter{filterCount ? ` (${filterCount})` : ""}
        </button>
      </div>

      <AnimatePresence>
        {(drawer || sortSheet) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => (setDrawer(false), setSortSheet(false))} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={drawer ? "Filters" : "Sort"}
              data-lenis-prevent
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[88dvh] flex-col rounded-t-2xl bg-page lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-hair px-5 py-3">
                <h2 className="text-lg font-bold">{drawer ? "Filters" : "Sort by"}</h2>
                <button onClick={() => (setDrawer(false), setSortSheet(false))} aria-label="Close" className="grid size-11 place-items-center rounded-full hover:bg-paper">
                  <X size={20} />
                </button>
              </div>
              {drawer ? (
                <>
                  <div className="flex-1 overflow-y-auto px-5">{panel}</div>
                  <div className="grid grid-cols-2 gap-2 border-t border-hair p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <Button variant="ghost" onClick={clearAll}>
                      Clear all
                    </Button>
                    <Button onClick={() => setDrawer(false)}>Show {results.length}</Button>
                  </div>
                </>
              ) : (
                <ul className="px-2 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-1">
                  {sorts.map((s) => (
                    <li key={s.v}>
                      <button
                        onClick={() => {
                          setParam("sort", s.v === "featured" ? null : s.v);
                          setSortSheet(false);
                        }}
                        className="flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-left text-[0.95rem] hover:bg-paper"
                      >
                        {s.label}
                        {sort === s.v && <Check size={18} weight="bold" className="text-brand" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-full bg-paper-2 py-1 pl-3.5 pr-1 text-[0.82rem] font-medium text-fg">
      {label}
      <button onClick={onClear} aria-label={`Remove ${label}`} className="grid size-7 place-items-center rounded-full hover:bg-hair-2">
        <X size={12} />
      </button>
    </span>
  );
}

function Group({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-hair">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-12 w-full items-center justify-between text-left text-[0.9rem] font-semibold">
        {title}
        <CaretDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

function CheckRow({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.88rem] text-fg-2 hover:text-fg">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[0.78rem] text-fg-3 tabular">{count}</span>}
    </label>
  );
}

function FacetPanel({
  f,
  setF,
  cats,
  colorOptions,
  fabricOptions,
  occasionOptions,
  priceCeil,
  scoped,
}: {
  f: Filters;
  setF: React.Dispatch<React.SetStateAction<Filters>>;
  cats: { slug: string; name: string }[];
  colorOptions: { name: string; hex: string }[];
  fabricOptions: string[];
  occasionOptions: { slug: string; name: string }[];
  priceCeil: number;
  scoped: ReturnType<typeof useStore.getState>["products"];
}) {
  const toggle = (key: "categories" | "colors" | "fabrics" | "occasions", v: string) => setF((s) => ({ ...s, [key]: s[key].includes(v) ? s[key].filter((x) => x !== v) : [...s[key], v] }));
  return (
    <div>
      {cats.length > 1 && (
        <Group title="Category">
          {cats.map((c) => (
            <CheckRow key={c.slug} label={c.name} count={scoped.filter((p) => p.category === c.slug).length} checked={f.categories.includes(c.slug)} onChange={() => toggle("categories", c.slug)} />
          ))}
        </Group>
      )}
      <Group title="Price">
        <div className="flex justify-between text-[0.85rem] font-semibold tabular">
          <span>{money(f.min)}</span>
          <span>{money(f.max)}</span>
        </div>
        <label className="mt-3 block text-xs text-fg-3" htmlFor="pmin">
          Minimum
        </label>
        <input id="pmin" type="range" min={0} max={priceCeil} step={500} value={f.min} onChange={(e) => setF((s) => ({ ...s, min: Math.min(Number(e.target.value), s.max) }))} className="w-full" />
        <label className="mt-1 block text-xs text-fg-3" htmlFor="pmax">
          Maximum
        </label>
        <input id="pmax" type="range" min={0} max={priceCeil} step={500} value={f.max} onChange={(e) => setF((s) => ({ ...s, max: Math.max(Number(e.target.value), s.min) }))} className="w-full" />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            [0, 5000, "Under ₹5k"],
            [5000, 10000, "₹5k to ₹10k"],
            [10000, 20000, "₹10k to ₹20k"],
            [20000, priceCeil, "₹20k+"],
          ].map(([a, b, l]) => (
            <button key={l as string} onClick={() => setF((s) => ({ ...s, min: a as number, max: b as number }))} className="min-h-9 rounded-full border border-hair-2 px-3 text-xs font-medium text-fg-2 hover:border-fg hover:text-fg">
              {l}
            </button>
          ))}
        </div>
      </Group>
      {colorOptions.length > 0 && (
        <Group title="Colour">
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((c) => {
              const on = f.colors.includes(c.name);
              return (
                <button key={c.name} onClick={() => toggle("colors", c.name)} aria-pressed={on} title={c.name} className="flex min-h-11 flex-col items-center gap-1">
                  <span className={`grid size-8 place-items-center rounded-full ring-1 ring-offset-2 ring-offset-page transition ${on ? "ring-2 ring-fg" : "ring-hair-2"}`} style={{ background: c.hex }}>
                    {on && <Check size={13} weight="bold" className={["Ivory", "Gold", "Mustard"].includes(c.name) ? "text-on-brand" : "text-white"} />}
                  </span>
                  <span className="text-[0.68rem] text-fg-2">{c.name}</span>
                </button>
              );
            })}
          </div>
        </Group>
      )}
      {fabricOptions.length > 0 && (
        <Group title="Fabric & material" defaultOpen={false}>
          {fabricOptions.map((fa) => (
            <CheckRow key={fa} label={fa} count={scoped.filter((p) => p.fabric === fa).length} checked={f.fabrics.includes(fa)} onChange={() => toggle("fabrics", fa)} />
          ))}
        </Group>
      )}
      {occasionOptions.length > 0 && (
        <Group title="Occasion" defaultOpen={false}>
          {occasionOptions.map((o) => (
            <CheckRow key={o.slug} label={o.name} count={scoped.filter((p) => p.occasions.includes(o.slug)).length} checked={f.occasions.includes(o.slug)} onChange={() => toggle("occasions", o.slug)} />
          ))}
        </Group>
      )}
      <Group title="Discount" defaultOpen={false}>
        {[10, 20, 30].map((n) => (
          <label key={n} className="flex min-h-9 cursor-pointer items-center gap-3 text-[0.88rem] text-fg-2 hover:text-fg">
            <input type="radio" name="minOff" checked={f.minOff === n} onChange={() => setF((s) => ({ ...s, minOff: n }))} className="size-4" />
            {n}% off or more
          </label>
        ))}
        {f.minOff > 0 && (
          <button onClick={() => setF((s) => ({ ...s, minOff: 0 }))} className="mt-1 text-xs font-semibold text-brand underline underline-offset-4">
            Any discount
          </button>
        )}
      </Group>
      <div className="py-3">
        <CheckRow label="Hide sold-out products" checked={f.inStock} onChange={() => setF((s) => ({ ...s, inStock: !s.inStock }))} />
      </div>
    </div>
  );
}
