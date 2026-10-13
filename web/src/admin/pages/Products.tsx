import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PencilSimple, Plus, Trash, ArrowSquareOut } from "@phosphor-icons/react";
import { priceOf, useStore } from "../../store/useStore";
import { img } from "../../lib/cloudinary";
import { discountPct, money } from "../../lib/format";
import { Badge, Btn, Empty, Modal, PageHeader, Panel, SearchBox, Select, SortTh, Toggle, rowCls, tableCls, theadCls } from "../ui/kit";

export default function Products() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const setField = useStore((s) => s.setProductField);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "createdAt", dir: -1 });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    const r = products.filter(
      (p) =>
        (!term || p.name.toLowerCase().includes(term) || p.id.includes(term)) &&
        (!type || p.type === type) &&
        (!cat || p.category === cat) &&
        (!status || (status === "published" ? p.published : status === "draft" ? !p.published : status === "low" ? p.stock <= 3 : p.salePrice)),
    );
    const val = (p: (typeof r)[number]) => (sort.k === "price" ? priceOf(p) : sort.k === "stock" ? p.stock : sort.k === "sold" ? p.sold : sort.k === "name" ? p.name : p.createdAt);
    return [...r].sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * sort.dir);
  }, [products, q, type, cat, status, sort]);

  const toDelete = products.find((p) => p.id === confirmDel);

  return (
    <>
      <PageHeader
        title="Products"
        sub={`${products.length} products, ${products.filter((p) => p.published).length} live on the storefront`}
        actions={
          <Btn onClick={() => navigate("/admin/products/new")}>
            <Plus size={16} weight="bold" /> Add product
          </Btn>
        }
      />
      <Panel pad={false}>
        <div className="flex flex-col gap-3 border-b border-rule p-4 md:flex-row md:items-center">
          <SearchBox value={q} onChange={setQ} placeholder="Search by name or ID" label="Search products" />
          <div className="grid grid-cols-3 gap-2 md:ml-auto md:flex">
            <Select aria-label="Type" value={type} onChange={(e) => { setType(e.target.value); setCat(""); }}>
              <option value="">All types</option>
              <option value="saree">Sarees</option>
              <option value="jewellery">Jewellery</option>
            </Select>
            <Select aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.filter((c) => !type || c.type === type).map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </Select>
            <Select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              <option value="published">Published</option>
              <option value="draft">Unpublished</option>
              <option value="low">Low stock (3 or fewer)</option>
              <option value="sale">On sale</option>
            </Select>
          </div>
        </div>
        {rows.length === 0 ? (
          <Empty title="No products match" body="Clear the search or filters, or add a new product." />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <SortTh label="Product" k="name" sort={sort} setSort={setSort} />
                  <th className="px-4 py-2.5 font-semibold">Category</th>
                  <SortTh label="Price" k="price" sort={sort} setSort={setSort} />
                  <SortTh label="Stock" k="stock" sort={sort} setSort={setSort} />
                  <SortTh label="Sold" k="sold" sort={sort} setSort={setSort} />
                  <th className="px-4 py-2.5 font-semibold">Published</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const off = discountPct(p.mrp, p.salePrice);
                  return (
                    <tr key={p.id} className={rowCls}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={img(p.images[0], 80)} alt="" className="h-12 w-10 rounded-[4px] object-cover" />
                          <div>
                            <Link to={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-peacock">{p.name}</Link>
                            <p className="text-xs text-ink-3">{p.id.toUpperCase()} · {p.fabric}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-2">{categories.find((c) => c.slug === p.category)?.name ?? p.category}</td>
                      <td className="px-4 py-3 tabular">
                        <span className="font-semibold">{money(priceOf(p))}</span>
                        {off > 0 && <span className="ml-1.5 text-xs text-ink-3 line-through">{money(p.mrp)}</span>}
                        {off > 0 && <span className="ml-1.5"><Badge tone="teal">{off}% off</Badge></span>}
                      </td>
                      <td className="px-4 py-3">
                        <label className="sr-only" htmlFor={`stock-${p.id}`}>Stock for {p.name}</label>
                        <input
                          id={`stock-${p.id}`}
                          type="number"
                          min={0}
                          value={p.stock}
                          onChange={(e) => setField(p.id, "stock", Math.max(0, Number(e.target.value) || 0))}
                          className={`w-20 rounded-[6px] border px-2 py-1 text-sm tabular focus:border-peacock focus:outline-none ${p.stock === 0 ? "border-[#e8b4b8] bg-[#fdf2f3]" : p.stock <= 3 ? "border-[#ecd29c] bg-[#fdf8ec]" : "border-rule"}`}
                        />
                      </td>
                      <td className="px-4 py-3 tabular text-ink-2">{p.sold}</td>
                      <td className="px-4 py-3">
                        <Toggle
                          checked={p.published}
                          label={`${p.published ? "Unpublish" : "Publish"} ${p.name}`}
                          onChange={(v) => {
                            setField(p.id, "published", v);
                            toast(v ? `${p.name} is live` : `${p.name} hidden from the storefront`);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" aria-label={`View ${p.name} on storefront`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk hover:text-ink"><ArrowSquareOut size={16} /></a>
                          <Link to={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk hover:text-ink"><PencilSimple size={16} /></Link>
                          <button onClick={() => setConfirmDel(p.id)} aria-label={`Delete ${p.name}`} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-[#fbe5e6] hover:text-[#9c1c27]"><Trash size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={!!toDelete} onClose={() => setConfirmDel(null)} title="Delete product">
        <p className="text-sm text-ink-2">
          Delete <span className="font-semibold text-ink">{toDelete?.name}</span>? It's removed from the storefront and from any shopper's bag. Past orders keep their line items. To hide it without deleting, unpublish it instead.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancel</Btn>
          <Btn
            variant="danger"
            onClick={() => {
              deleteProduct(toDelete!.id);
              toast(`Deleted ${toDelete!.name}`);
              setConfirmDel(null);
            }}
          >
            Delete product
          </Btn>
        </div>
      </Modal>
    </>
  );
}
