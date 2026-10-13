import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, CloudArrowUp, ImagesSquare, Plus, Trash, X } from "@phosphor-icons/react";
import type { Product } from "../../data/types";
import { occasions } from "../../data/seed";
import { useStore } from "../../store/useStore";
import { CATALOG_IMAGES as LIBRARY, img } from "../../lib/cloudinary";
import { discountPct, downscaleImage, money, slugify, uid } from "../../lib/format";
import { Btn, Input, Modal, PageHeader, Panel, Select, Textarea, Toggle } from "../ui/kit";


const blank = (): Product => ({
  id: uid("p"),
  slug: "",
  name: "",
  type: "saree",
  category: "kanjivaram",
  occasions: [],
  fabric: "Pure Kanjivaram silk",
  color: "Red",
  images: [],
  mrp: 0,
  salePrice: undefined,
  stock: 0,
  sizes: ["Unstitched blouse"],
  description: "",
  details: [],
  care: "Dry clean only.",
  published: false,
  featured: false,
  bestseller: false,
  isNew: true,
  rating: 0,
  reviews: 0,
  sold: 0,
  createdAt: new Date().toISOString(),
});

export default function ProductForm() {
  const { id } = useParams();
  const existing = useStore((s) => s.products.find((p) => p.id === id));
  const categories = useStore((s) => s.categories);
  const attributes = useStore((s) => s.attributes);
  const upsert = useStore((s) => s.upsertProduct);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const isNew = !existing;

  const [p, setP] = useState<Product>(() => existing ?? blank());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [library, setLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((s) => ({ ...s, [k]: v }));
  const off = discountPct(p.mrp, p.salePrice);
  const typeCats = useMemo(() => categories.filter((c) => c.type === p.type), [categories, p.type]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all([...files].slice(0, 6).map((f) => downscaleImage(f)));
      setP((s) => ({ ...s, images: [...s.images, ...urls] }));
      toast(`${urls.length} image${urls.length > 1 ? "s" : ""} added`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = (publish?: boolean) => {
    const e: Record<string, string> = {};
    if (p.name.trim().length < 3) e.name = "Give the product a name of at least 3 characters.";
    if (!p.mrp || p.mrp < 1) e.mrp = "Enter the MRP in rupees.";
    if (p.salePrice !== undefined && p.salePrice >= p.mrp) e.salePrice = "Sale price must be lower than the MRP, or leave it empty.";
    if (p.images.length === 0) e.images = "Add at least one image.";
    if (p.sizes.length === 0) e.sizes = "Pick at least one size or blouse option.";
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Fix the highlighted fields to save.", "error");
      return;
    }
    const final = { ...p, slug: p.slug || slugify(p.name), published: publish ?? p.published };
    try {
      upsert(final);
      toast(isNew ? `Added ${final.name}` : `Saved ${final.name}`);
      navigate("/admin/products");
    } catch {
      toast("Browser storage is full. Remove an uploaded image or use one from the library.", "error");
    }
  };

  return (
    <>
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Products
      </Link>
      <PageHeader
        title={isNew ? "Add product" : `Edit ${existing.name}`}
        actions={
          <>
            <Btn variant="secondary" onClick={() => save(false)}>{isNew ? "Save as draft" : p.published ? "Save and unpublish" : "Save draft"}</Btn>
            <Btn onClick={() => save(true)}>{p.published && !isNew ? "Save changes" : "Save and publish"}</Btn>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Product name" value={p.name} onChange={(e) => set("name", e.target.value)} error={errors.name} className="sm:col-span-2" placeholder="e.g. Peacock green korvai Kanjivaram" />
              <Select label="Type" value={p.type} onChange={(e) => {
                const type = e.target.value as Product["type"];
                const firstCat = categories.find((c) => c.type === type)?.slug ?? "";
                setP((s) => ({ ...s, type, category: firstCat, sizes: type === "saree" ? ["Unstitched blouse"] : ["Free size"], fabric: type === "saree" ? "Pure Kanjivaram silk" : "Antique gold-plated brass" }));
              }}>
                <option value="saree">Saree</option>
                <option value="jewellery">Jewellery</option>
              </Select>
              <Select label="Category" value={p.category} onChange={(e) => set("category", e.target.value)}>
                {typeCats.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </Select>
              <Select label={p.type === "saree" ? "Fabric" : "Material"} value={p.fabric} onChange={(e) => set("fabric", e.target.value)}>
                {attributes.fabrics.map((f) => <option key={f}>{f}</option>)}
              </Select>
              <Select label="Colour" value={p.color} onChange={(e) => set("color", e.target.value)}>
                {attributes.colors.map((c) => <option key={c.name}>{c.name}</option>)}
              </Select>
              <Textarea label="Description" value={p.description} onChange={(e) => set("description", e.target.value)} className="sm:col-span-2" placeholder="What it looks like, how it drapes, what to pair it with." />
            </div>
          </Panel>

          <Panel title="Images" action={<span className="text-xs text-ink-3">First image is the cover. Uploads are resized to 900px.</span>}>
            {p.images.length > 0 && (
              <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {p.images.map((im, i) => (
                  <li key={im.slice(0, 40) + i} className="group relative">
                    <img src={img(im, 240)} alt="" className={`aspect-[4/5] w-full rounded-[6px] object-cover ring-2 ${i === 0 ? "ring-peacock" : "ring-transparent"}`} />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-peacock px-2 py-0.5 text-[0.65rem] font-semibold text-white">Cover</span>}
                    <div className="absolute right-1.5 top-1.5 flex gap-1">
                      {i > 0 && (
                        <button type="button" onClick={() => setP((s) => ({ ...s, images: [s.images[i], ...s.images.filter((_, k) => k !== i)] }))} aria-label="Make cover image" className="grid size-7 place-items-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white">
                          <ArrowUp size={13} />
                        </button>
                      )}
                      <button type="button" onClick={() => setP((s) => ({ ...s, images: s.images.filter((_, k) => k !== i) }))} aria-label="Remove image" className="grid size-7 place-items-center rounded-full bg-white/90 text-[#9c1c27] shadow-sm hover:bg-white">
                        <X size={13} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center gap-2 rounded-[10px] border-2 border-dashed px-4 py-8 text-center ${errors.images ? "border-[#e8b4b8] bg-[#fdf2f3]" : "border-rule"}`}
            >
              <CloudArrowUp size={28} className="text-ink-3" />
              <p className="text-sm text-ink-2">{uploading ? "Processing images…" : "Drag photos here, or"}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Btn type="button" variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Plus size={14} /> Upload from device
                </Btn>
                <Btn type="button" variant="secondary" onClick={() => setLibrary(true)}>
                  <ImagesSquare size={14} /> Choose from library
                </Btn>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
              {errors.images && <p className="text-xs text-[#b4232f]">{errors.images}</p>}
            </div>
          </Panel>

          <Panel title="Specifications" action={<Btn variant="ghost" type="button" onClick={() => set("details", [...p.details, { label: "", value: "" }])}><Plus size={14} /> Add row</Btn>}>
            {p.details.length === 0 && <p className="text-sm text-ink-3">Add rows like Zari, Length or Weight. They show under "Fabric & design" on the product page.</p>}
            <div className="space-y-2">
              {p.details.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input aria-label="Label" value={d.label} onChange={(e) => set("details", p.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder="Label" className="w-28 min-w-0 shrink-0 sm:w-36 rounded-[8px] border border-rule px-3 py-2 text-sm focus:border-peacock focus:outline-none" />
                  <input aria-label="Value" value={d.value} onChange={(e) => set("details", p.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)))} placeholder="Value" className="min-w-0 flex-1 rounded-[8px] border border-rule px-3 py-2 text-sm focus:border-peacock focus:outline-none" />
                  <button type="button" onClick={() => set("details", p.details.filter((_, k) => k !== i))} aria-label="Remove row" className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-desk"><Trash size={15} /></button>
                </div>
              ))}
            </div>
            <Textarea label="Care instructions" value={p.care} onChange={(e) => set("care", e.target.value)} className="mt-4" />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Pricing">
            <div className="grid grid-cols-2 gap-3">
              <Input label="MRP (₹)" type="number" min={0} value={p.mrp || ""} onChange={(e) => set("mrp", Number(e.target.value))} error={errors.mrp} />
              <Input label="Sale price (₹)" type="number" min={0} value={p.salePrice ?? ""} onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : undefined)} error={errors.salePrice} hint="Leave empty for no discount" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="disc" className="text-sm text-ink-2">Or set discount</label>
              <input
                id="disc"
                type="number"
                min={0}
                max={90}
                value={off || ""}
                onChange={(e) => {
                  const pct = Number(e.target.value);
                  set("salePrice", pct > 0 && p.mrp ? Math.round((p.mrp * (100 - pct)) / 100) : undefined);
                }}
                className="w-16 rounded-[8px] border border-rule px-2 py-1.5 text-sm tabular focus:border-peacock focus:outline-none"
              />
              <span className="text-sm text-ink-3">% off</span>
            </div>
            {p.mrp > 0 && <p className="mt-3 rounded-[8px] bg-desk px-3 py-2 text-sm text-ink-2 tabular">Shoppers pay <span className="font-semibold text-ink">{money(p.salePrice ?? p.mrp)}</span>{off ? `, ${off}% off` : ""}</p>}
          </Panel>

          <Panel title="Inventory">
            <Input label="Stock quantity" type="number" min={0} value={p.stock} onChange={(e) => set("stock", Math.max(0, Number(e.target.value)))} hint={p.stock <= 3 ? "Shows as low stock (3 or fewer)." : undefined} />
            <fieldset className="mt-4">
              <legend className="mb-2 text-[0.8rem] font-semibold text-ink-2">{p.type === "saree" ? "Blouse options" : "Sizes"}</legend>
              <div className="flex flex-wrap gap-1.5">
                {attributes.sizes.map((s) => {
                  const on = p.sizes.includes(s);
                  return (
                    <button key={s} type="button" aria-pressed={on} onClick={() => set("sizes", on ? p.sizes.filter((x) => x !== s) : [...p.sizes, s])} className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-peacock bg-[#dff1ef] text-[#1d5a56]" : "border-rule text-ink-3 hover:border-ink-3"}`}>
                      {s}
                    </button>
                  );
                })}
              </div>
              {errors.sizes && <p className="mt-1 text-xs text-[#b4232f]">{errors.sizes}</p>}
            </fieldset>
          </Panel>

          <Panel title="Visibility">
            <div className="flex flex-col gap-3">
              <Toggle showLabel label="Published on storefront" checked={p.published} onChange={(v) => set("published", v)} />
              <Toggle showLabel label="Featured" checked={p.featured} onChange={(v) => set("featured", v)} />
              <Toggle showLabel label="Bestseller" checked={p.bestseller} onChange={(v) => set("bestseller", v)} />
              <Toggle showLabel label="Show in new arrivals" checked={p.isNew} onChange={(v) => set("isNew", v)} />
            </div>
            <fieldset className="mt-5">
              <legend className="mb-2 text-[0.8rem] font-semibold text-ink-2">Occasions</legend>
              <div className="flex flex-col gap-2">
                {occasions.map((o) => (
                  <label key={o.slug} className="flex items-center gap-2 text-sm text-ink-2">
                    <input type="checkbox" checked={p.occasions.includes(o.slug)} onChange={(e) => set("occasions", e.target.checked ? [...p.occasions, o.slug] : p.occasions.filter((x) => x !== o.slug))} className="size-4 accent-[var(--color-peacock)]" />
                    {o.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </Panel>
        </div>
      </div>

      <Modal open={library} onClose={() => setLibrary(false)} title="Image library" wide>
        <p className="mb-4 text-sm text-ink-3">Images already in the Gruham Cloudinary catalogue. Click to add.</p>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {LIBRARY.map((id) => {
            const used = p.images.includes(id);
            return (
              <li key={id}>
                <button type="button" disabled={used} onClick={() => setP((s) => ({ ...s, images: [...s.images, id] }))} className="block w-full disabled:opacity-40" aria-label={`Add ${id}`}>
                  <img src={img(id, 200)} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-[6px] object-cover hover:ring-2 hover:ring-peacock" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-5 flex justify-end">
          <Btn onClick={() => setLibrary(false)}>Done</Btn>
        </div>
      </Modal>
    </>
  );
}
