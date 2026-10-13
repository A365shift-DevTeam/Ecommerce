import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { Banner, Collection, Coupon } from "../../data/types";
import { useStore } from "../../store/useStore";
import { CATALOG_IMAGES, img } from "../../lib/cloudinary";
import { money, shortDate, uid } from "../../lib/format";
import { Badge, Btn, Input, Modal, PageHeader, Panel, Select, Tabs, Textarea, Toggle, rowCls, tableCls, theadCls } from "../ui/kit";

const bannerImages = CATALOG_IMAGES;

export default function Promotions() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") as "coupons" | "banners" | "collections") ?? "coupons";
  return (
    <>
      <PageHeader title="Promotions" sub="Coupons, the home page offer banner and featured collections." />
      <Tabs value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} items={[{ v: "coupons", label: "Coupons" }, { v: "banners", label: "Banners" }, { v: "collections", label: "Featured collections" }]} />
      <div className="mt-5">{tab === "coupons" ? <Coupons /> : tab === "banners" ? <Banners /> : <Collections />}</div>
    </>
  );
}

function Coupons() {
  const coupons = useStore((s) => s.coupons);
  const upsert = useStore((s) => s.upsertCoupon);
  const del = useStore((s) => s.deleteCoupon);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<{ c: Coupon; original?: string } | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});

  const describe = (c: Coupon) => `${c.type === "percent" ? `${c.value}% off` : `${money(c.value)} off`}${c.maxDiscount ? `, up to ${money(c.maxDiscount)}` : ""}`;
  const isExpired = (c: Coupon) => new Date(c.expiresAt) < new Date();

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Btn onClick={() => { setErr({}); setEdit({ c: { code: "", description: "", type: "percent", value: 10, minOrder: 0, appliesTo: "all", active: true, expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(), used: 0 } }); }}>
          <Plus size={16} weight="bold" /> Create coupon
        </Btn>
      </div>
      <Panel pad={false}>
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead className={theadCls}>
              <tr>
                <th className="px-4 py-2.5 font-semibold">Code</th>
                <th className="px-4 py-2.5 font-semibold">Discount</th>
                <th className="px-4 py-2.5 font-semibold">Rules</th>
                <th className="px-4 py-2.5 font-semibold">Used</th>
                <th className="px-4 py-2.5 font-semibold">Expires</th>
                <th className="px-4 py-2.5 font-semibold">Status</th>
                <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.code} className={rowCls}>
                  <td className="px-4 py-3 font-mono font-semibold tracking-wide">{c.code}</td>
                  <td className="px-4 py-3">{describe(c)}</td>
                  <td className="px-4 py-3 text-ink-2">
                    {c.appliesTo === "all" ? "Everything" : c.appliesTo === "saree" ? "Sarees only" : "Jewellery only"}
                    {c.minOrder > 0 && <span className="block text-xs text-ink-3">Min. order {money(c.minOrder)}</span>}
                  </td>
                  <td className="px-4 py-3 tabular">{c.used}</td>
                  <td className="px-4 py-3 text-ink-3">{shortDate(c.expiresAt)}</td>
                  <td className="px-4 py-3">
                    {isExpired(c) ? <Badge>Expired</Badge> : (
                      <Toggle checked={c.active} label={`${c.active ? "Pause" : "Activate"} ${c.code}`} onChange={(v) => { upsert({ ...c, active: v }); toast(`${c.code} ${v ? "active" : "paused"}`); }} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setErr({}); setEdit({ c, original: c.code }); }} aria-label={`Edit ${c.code}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk"><PencilSimple size={15} /></button>
                      <button onClick={() => { del(c.code); toast(`Deleted ${c.code}`); }} aria-label={`Delete ${c.code}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-[#fbe5e6] hover:text-[#9c1c27]"><Trash size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.original ? `Edit ${edit.original}` : "Create coupon"}>
        {edit && (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const c = { ...edit.c, code: edit.c.code.trim().toUpperCase() };
              const er: Record<string, string> = {};
              if (!/^[A-Z0-9]{4,16}$/.test(c.code)) er.code = "4 to 16 letters or numbers, no spaces.";
              else if (c.code !== edit.original && coupons.some((x) => x.code === c.code)) er.code = "That code already exists.";
              if (!(c.value > 0)) er.value = "Enter a discount above 0.";
              if (c.type === "percent" && c.value > 90) er.value = "Keep percentage discounts at 90% or less.";
              setErr(er);
              if (Object.keys(er).length) return;
              upsert({ ...c, description: c.description || `${describe(c)}${c.minOrder ? ` on orders over ${money(c.minOrder)}` : ""}` }, edit.original);
              toast(`Saved ${c.code}`);
              setEdit(null);
            }}
          >
            <Input label="Code" value={edit.c.code} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, code: e.target.value.toUpperCase() } })} error={err.code} className="sm:col-span-2" placeholder="PONGAL15" />
            <Select label="Discount type" value={edit.c.type} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, type: e.target.value as Coupon["type"] } })}>
              <option value="percent">Percentage</option>
              <option value="flat">Flat amount (₹)</option>
            </Select>
            <Input label={edit.c.type === "percent" ? "Percent off" : "Amount off (₹)"} type="number" min={1} value={edit.c.value} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, value: Number(e.target.value) } })} error={err.value} />
            <Input label="Minimum order (₹)" type="number" min={0} value={edit.c.minOrder} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, minOrder: Number(e.target.value) } })} />
            <Input label="Maximum discount (₹)" type="number" min={0} value={edit.c.maxDiscount ?? ""} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, maxDiscount: e.target.value ? Number(e.target.value) : undefined } })} hint="Optional cap" />
            <Select label="Applies to" value={edit.c.appliesTo} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, appliesTo: e.target.value as Coupon["appliesTo"] } })}>
              <option value="all">Everything</option>
              <option value="saree">Sarees only</option>
              <option value="jewellery">Jewellery only</option>
            </Select>
            <Input label="Expires on" type="date" value={edit.c.expiresAt.slice(0, 10)} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, expiresAt: new Date(e.target.value + "T23:59:00").toISOString() } })} />
            <Input label="Description shown to shoppers" value={edit.c.description} onChange={(e) => setEdit({ ...edit, c: { ...edit.c, description: e.target.value } })} className="sm:col-span-2" hint="Leave empty to generate one from the rules." />
            <div className="sm:col-span-2"><Toggle showLabel label="Active" checked={edit.c.active} onChange={(v) => setEdit({ ...edit, c: { ...edit.c, active: v } })} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Btn type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn type="submit">Save coupon</Btn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Banners() {
  const banners = useStore((s) => s.banners);
  const upsert = useStore((s) => s.upsertBanner);
  const del = useStore((s) => s.deleteBanner);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<Banner | null>(null);

  const activate = (b: Banner, v: boolean) => {
    // Only one offer banner shows on the home page at a time.
    banners.forEach((x) => x.id !== b.id && v && x.active && upsert({ ...x, active: false }));
    upsert({ ...b, active: v });
    toast(v ? `"${b.title}" is now on the home page` : `"${b.title}" hidden`);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-3">One banner shows on the home page at a time.</p>
        <Btn onClick={() => setEdit({ id: uid("b"), title: "", body: "", image: bannerImages[0], cta: "Shop now", link: "/shop", active: false })}>
          <Plus size={16} weight="bold" /> New banner
        </Btn>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="overflow-hidden rounded-[12px] border border-rule bg-sheet">
            <div className="relative aspect-[21/9]">
              <img src={img(b.image, 900)} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-maroon-deep/90 to-transparent" />
              <div className="absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center p-5 text-ivory">
                <p className="font-display text-xl leading-tight">{b.title || "Untitled banner"}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ivory/80">{b.body}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Toggle showLabel label={b.active ? "Live on home page" : "Hidden"} checked={b.active} onChange={(v) => activate(b, v)} />
              <div className="ml-auto flex gap-1">
                <button onClick={() => setEdit(b)} aria-label={`Edit ${b.title}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk"><PencilSimple size={15} /></button>
                <button onClick={() => { del(b.id); toast("Banner deleted"); }} aria-label={`Delete ${b.title}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-[#fbe5e6] hover:text-[#9c1c27]"><Trash size={15} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Banner" wide>
        {edit && (
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.title.trim()) return toast("Give the banner a headline.", "error");
              if (edit.active) activate(edit, true);
              else upsert(edit);
              toast("Banner saved");
              setEdit(null);
            }}
          >
            <Input label="Headline" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="sm:col-span-2" />
            <Textarea label="Body" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} className="sm:col-span-2" />
            <Input label="Button label" value={edit.cta} onChange={(e) => setEdit({ ...edit, cta: e.target.value })} />
            <Input label="Button link" value={edit.link} onChange={(e) => setEdit({ ...edit, link: e.target.value })} hint="e.g. /shop?occasion=festive" />
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-[0.8rem] font-semibold text-ink-2">Background image</legend>
              <div className="grid grid-cols-3 gap-2">
                {bannerImages.map((id) => (
                  <button type="button" key={id} onClick={() => setEdit({ ...edit, image: id })} aria-pressed={edit.image === id} aria-label={id} className={`overflow-hidden rounded-[6px] ring-2 ${edit.image === id ? "ring-peacock" : "ring-transparent"}`}>
                    <img src={img(id, 300)} alt="" className="aspect-[16/9] w-full object-cover" />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="sm:col-span-2"><Toggle showLabel label="Show on home page" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Btn type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn type="submit">Save banner</Btn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

function Collections() {
  const collections = useStore((s) => s.collections);
  const products = useStore((s) => s.products);
  const upsert = useStore((s) => s.upsertCollection);
  const toast = useStore((s) => s.toast);
  const [edit, setEdit] = useState<Collection | null>(null);

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-3">Featured collections appear as tabs on the home page.</p>
        <Btn onClick={() => setEdit({ id: uid("col"), name: "", blurb: "", image: "halfsaree-lavender-peacock", productIds: [], featured: false })}>
          <Plus size={16} weight="bold" /> New collection
        </Btn>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {collections.map((c) => (
          <div key={c.id} className="flex flex-col rounded-[12px] border border-rule bg-sheet">
            <img src={img(c.image, 600)} alt="" className="aspect-[16/10] w-full rounded-t-[12px] object-cover" />
            <div className="flex flex-1 flex-col p-4">
              <p className="font-semibold">{c.name}</p>
              <p className="mt-1 text-sm text-ink-3">{c.productIds.length} products</p>
              <p className="mt-2 line-clamp-2 text-sm text-ink-2">{c.blurb}</p>
              <div className="mt-auto flex items-center justify-between pt-4">
                <Toggle showLabel label="Featured" checked={c.featured} onChange={(v) => { upsert({ ...c, featured: v }); toast(v ? `${c.name} featured on the home page` : `${c.name} removed from the home page`); }} />
                <Btn variant="secondary" onClick={() => setEdit(c)}>Edit</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Collection" wide>
        {edit && (
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!edit.name.trim()) return toast("Name the collection.", "error");
              upsert(edit);
              toast(`Saved ${edit.name}`);
              setEdit(null);
            }}
          >
            <Input label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <Textarea label="Description" value={edit.blurb} onChange={(e) => setEdit({ ...edit, blurb: e.target.value })} />
            <fieldset>
              <legend className="mb-2 text-[0.8rem] font-semibold text-ink-2">Products ({edit.productIds.length} selected, first four show on the home page)</legend>
              <ul className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto rounded-[8px] border border-rule p-2 sm:grid-cols-2">
                {products.map((p) => {
                  const on = edit.productIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <label className={`flex cursor-pointer items-center gap-2.5 rounded-[6px] p-1.5 text-sm ${on ? "bg-[#dff1ef]" : "hover:bg-desk"}`}>
                        <input type="checkbox" checked={on} onChange={() => setEdit({ ...edit, productIds: on ? edit.productIds.filter((x) => x !== p.id) : [...edit.productIds, p.id] })} className="size-4 accent-[var(--color-peacock)]" />
                        <img src={img(p.images[0], 60)} alt="" className="h-9 w-7 rounded-[3px] object-cover" />
                        <span className="truncate">{p.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
            <Select label="Cover image" value={edit.image} onChange={(e) => setEdit({ ...edit, image: e.target.value })}>
              {[...new Set(products.flatMap((p) => p.images).filter((i) => !i.startsWith("data:")))].map((i) => <option key={i}>{i}</option>)}
            </Select>
            <Toggle showLabel label="Feature on home page" checked={edit.featured} onChange={(v) => setEdit({ ...edit, featured: v })} />
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn type="submit">Save collection</Btn>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
