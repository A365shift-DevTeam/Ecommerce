import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Minus, PencilSimple, Plus, Trash, WarningCircle, X } from "@phosphor-icons/react";
import type { Category } from "../../data/types";
import { useStore } from "../../store/useStore";
import { CATALOG_IMAGES, img } from "../../lib/cloudinary";
import { slugify, uid } from "../../lib/format";
import { Badge, Btn, Empty, Input, Modal, PageHeader, Panel, SearchBox, Select, Tabs, Textarea, rowCls, tableCls, theadCls } from "../ui/kit";

const LOW = 3;
const imageChoices = CATALOG_IMAGES;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as "categories" | "inventory" | "attributes") ?? "categories";
  const products = useStore((s) => s.products);
  const low = products.filter((p) => p.stock <= LOW).length;
  return (
    <>
      <PageHeader title="Catalog & inventory" sub="Categories, stock levels and the options products can use." />
      <Tabs
        value={tab}
        onChange={(v) => setParams({ tab: v }, { replace: true })}
        items={[
          { v: "categories", label: "Categories" },
          { v: "inventory", label: "Inventory", count: low || undefined },
          { v: "attributes", label: "Sizes, colours & fabrics" },
        ]}
      />
      <div className="mt-5">{tab === "categories" ? <Categories /> : tab === "inventory" ? <Inventory /> : <Attributes />}</div>
    </>
  );
}

function Categories() {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const upsert = useStore((s) => s.upsertCategory);
  const del = useStore((s) => s.deleteCategory);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<Category | null>(null);
  const [err, setErr] = useState("");

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Btn onClick={() => { setErr(""); setEdit({ id: uid("c"), slug: "", name: "", type: "saree", image: imageChoices[0], blurb: "" }); }}>
          <Plus size={16} weight="bold" /> New category
        </Btn>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const n = products.filter((p) => p.category === c.slug).length;
          return (
            <div key={c.id} className="flex gap-4 rounded-[12px] border border-rule bg-sheet p-4">
              <img src={img(c.image, 160)} alt="" className="h-20 w-16 rounded-[6px] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-ink-3">{c.type === "saree" ? "Sarees" : "Jewellery"}, {n} products</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-2">{c.blurb}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => { setErr(""); setEdit(c); }} aria-label={`Edit ${c.name}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk"><PencilSimple size={15} /></button>
                <button
                  onClick={() => {
                    if (n > 0) {
                      toast(`Move the ${n} products out of ${c.name} before deleting it.`, "error");
                      return;
                    }
                    del(c.id);
                    toast(`Deleted ${c.name}`);
                  }}
                  aria-label={`Delete ${c.name}`}
                  className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-[#fbe5e6] hover:text-[#9c1c27]"
                >
                  <Trash size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit && categories.some((c) => c.id === edit.id) ? "Edit category" : "New category"}>
        {edit && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (edit.name.trim().length < 2) {
                setErr("Enter a category name.");
                return;
              }
              const slug = edit.slug || slugify(edit.name);
              if (categories.some((c) => c.slug === slug && c.id !== edit.id)) {
                setErr("Another category already uses this name.");
                return;
              }
              upsert({ ...edit, slug });
              toast(`Saved ${edit.name}`);
              setEdit(null);
            }}
          >
            <Input label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} error={err} />
            <Select label="Type" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as Category["type"] })}>
              <option value="saree">Sarees</option>
              <option value="jewellery">Jewellery</option>
            </Select>
            <Textarea label="Short description" value={edit.blurb} onChange={(e) => setEdit({ ...edit, blurb: e.target.value })} />
            <fieldset>
              <legend className="mb-2 text-[0.8rem] font-semibold text-ink-2">Cover image</legend>
              <div className="grid grid-cols-7 gap-2">
                {imageChoices.map((id) => (
                  <button type="button" key={id} onClick={() => setEdit({ ...edit, image: id })} aria-pressed={edit.image === id} aria-label={id} className={`overflow-hidden rounded-[4px] ring-2 ${edit.image === id ? "ring-peacock" : "ring-transparent"}`}>
                    <img src={img(id, 100)} alt="" className="aspect-[4/5] w-full object-cover" />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn type="submit">Save category</Btn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Inventory() {
  const products = useStore((s) => s.products);
  const setField = useStore((s) => s.setProductField);
  const toast = useStore((s) => s.toast);
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const rows = useMemo(
    () => products.filter((p) => (!onlyLow || p.stock <= LOW) && p.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.stock - b.stock),
    [products, q, onlyLow],
  );
  const totalUnits = products.reduce((n, p) => n + p.stock, 0);
  const out = products.filter((p) => p.stock === 0).length;
  const low = products.filter((p) => p.stock > 0 && p.stock <= LOW).length;

  return (
    <Panel pad={false}>
      <div className="flex flex-col gap-3 border-b border-rule p-4 md:flex-row md:items-center">
        <SearchBox value={q} onChange={setQ} placeholder="Search products" label="Search inventory" />
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="size-4 accent-[var(--color-peacock)]" />
          Only low stock
        </label>
        <p className="text-sm text-ink-3 tabular md:ml-auto">
          {totalUnits} units in stock. <span className="font-semibold text-[#9c1c27]">{out} sold out</span>, <span className="font-semibold text-[#8a5a0b]">{low} low</span>.
        </p>
      </div>
      {rows.length === 0 ? (
        <Empty title="Nothing is running low" body="Every product has more than 3 units in stock." />
      ) : (
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">Level</th>
                <th className="px-4 py-2.5 font-semibold">Adjust</th>
                <th className="px-4 py-2.5 font-semibold">Quick restock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className={rowCls}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={img(p.images[0], 80)} alt="" className="h-11 w-9 rounded-[4px] object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.stock === 0 ? (
                      <Badge tone="red"><WarningCircle size={12} className="mr-1" /> Sold out</Badge>
                    ) : p.stock <= LOW ? (
                      <Badge tone="amber"><WarningCircle size={12} className="mr-1" /> Low, {p.stock} left</Badge>
                    ) : (
                      <Badge tone="green">{p.stock} in stock</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center rounded-full border border-rule">
                      <button onClick={() => setField(p.id, "stock", Math.max(0, p.stock - 1))} aria-label={`Remove one ${p.name}`} className="grid size-8 place-items-center rounded-full hover:bg-desk"><Minus size={13} /></button>
                      <input
                        aria-label={`Stock for ${p.name}`}
                        type="number"
                        min={0}
                        value={p.stock}
                        onChange={(e) => setField(p.id, "stock", Math.max(0, Number(e.target.value) || 0))}
                        className="w-14 bg-transparent text-center text-sm tabular focus:outline-none"
                      />
                      <button onClick={() => setField(p.id, "stock", p.stock + 1)} aria-label={`Add one ${p.name}`} className="grid size-8 place-items-center rounded-full hover:bg-desk"><Plus size={13} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {[5, 10].map((n) => (
                        <Btn key={n} variant="secondary" className="!px-3 !py-1 text-xs" onClick={() => { setField(p.id, "stock", p.stock + n); toast(`Added ${n} units of ${p.name}`); }}>
                          +{n}
                        </Btn>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function Attributes() {
  const attributes = useStore((s) => s.attributes);
  const setAttributes = useStore((s) => s.setAttributes);
  const products = useStore((s) => s.products);
  const toast = useStore((s) => s.toast);
  const [size, setSize] = useState("");
  const [fabric, setFabric] = useState("");
  const [color, setColor] = useState({ name: "", hex: "#7a2a3a" });

  const removeGuard = (kind: "sizes" | "fabric" | "color", value: string) => {
    const used = products.filter((p) => (kind === "sizes" ? p.sizes.includes(value) : kind === "fabric" ? p.fabric === value : p.color === value)).length;
    if (used) {
      toast(`${value} is used by ${used} products. Change those first.`, "error");
      return false;
    }
    return true;
  };

  const chip = (label: string, onRemove: () => void, swatch?: string) => (
    <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-white py-1 pl-3 pr-1 text-sm">
      {swatch && <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: swatch }} />}
      {label}
      <button onClick={onRemove} aria-label={`Remove ${label}`} className="grid size-6 place-items-center rounded-full text-ink-3 hover:bg-desk"><X size={11} /></button>
    </span>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Panel title="Sizes & blouse options">
        <div className="flex flex-wrap gap-2">
          {attributes.sizes.map((s) => chip(s, () => removeGuard("sizes", s) && setAttributes({ ...attributes, sizes: attributes.sizes.filter((x) => x !== s) })))}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (size.trim() && !attributes.sizes.includes(size.trim())) { setAttributes({ ...attributes, sizes: [...attributes.sizes, size.trim()] }); setSize(""); } }}>
          <Input aria-label="New size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="e.g. Stitched blouse 42" className="flex-1" />
          <Btn type="submit" variant="secondary">Add</Btn>
        </form>
      </Panel>
      <Panel title="Colours">
        <div className="flex flex-wrap gap-2">
          {attributes.colors.map((c) => chip(c.name, () => removeGuard("color", c.name) && setAttributes({ ...attributes, colors: attributes.colors.filter((x) => x.name !== c.name) }), c.hex))}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (color.name.trim() && !attributes.colors.some((c) => c.name === color.name.trim())) { setAttributes({ ...attributes, colors: [...attributes.colors, { name: color.name.trim(), hex: color.hex }] }); setColor({ ...color, name: "" }); } }}>
          <input aria-label="Swatch colour" type="color" value={color.hex} onChange={(e) => setColor({ ...color, hex: e.target.value })} className="h-9 w-10 cursor-pointer rounded-[8px] border border-rule" />
          <Input aria-label="New colour name" value={color.name} onChange={(e) => setColor({ ...color, name: e.target.value })} placeholder="e.g. Peacock blue" className="flex-1" />
          <Btn type="submit" variant="secondary">Add</Btn>
        </form>
      </Panel>
      <Panel title="Fabrics & materials">
        <div className="flex flex-wrap gap-2">
          {attributes.fabrics.map((f) => chip(f, () => removeGuard("fabric", f) && setAttributes({ ...attributes, fabrics: attributes.fabrics.filter((x) => x !== f) })))}
        </div>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (fabric.trim() && !attributes.fabrics.includes(fabric.trim())) { setAttributes({ ...attributes, fabrics: [...attributes.fabrics, fabric.trim()] }); setFabric(""); } }}>
          <Input aria-label="New fabric" value={fabric} onChange={(e) => setFabric(e.target.value)} placeholder="e.g. Chanderi silk cotton" className="flex-1" />
          <Btn type="submit" variant="secondary">Add</Btn>
        </form>
      </Panel>
    </div>
  );
}
