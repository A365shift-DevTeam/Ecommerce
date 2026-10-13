import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { money, shortDate } from "../../lib/format";
import { statusLabel } from "../../pages/account/OrderTimeline";
import { Badge, Empty, Modal, PageHeader, Panel, SearchBox, SortTh, orderTone, rowCls, tableCls, theadCls } from "../ui/kit";

export default function Customers() {
  const customers = useStore((s) => s.customers);
  const orders = useStore((s) => s.orders);
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "spent", dir: -1 });
  const openId = params.get("c");

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    const data = customers.map((c) => {
      const mine = orders.filter((o) => o.customerId === c.id);
      const valid = mine.filter((o) => o.status !== "cancelled");
      return { c, count: mine.length, spent: valid.reduce((s, o) => s + o.total, 0), last: mine[0]?.createdAt ?? "" };
    });
    return data
      .filter(({ c }) => !term || [c.name, c.email, c.city, c.phone].join(" ").toLowerCase().includes(term))
      .sort((a, b) => {
        const v = (x: (typeof data)[number]) => (sort.k === "orders" ? x.count : sort.k === "last" ? x.last : sort.k === "name" ? x.c.name : x.spent);
        return (v(a) > v(b) ? 1 : v(a) < v(b) ? -1 : 0) * sort.dir;
      });
  }, [customers, orders, q, sort]);

  const open = customers.find((c) => c.id === openId);
  const openOrders = orders.filter((o) => o.customerId === openId);

  return (
    <>
      <PageHeader title="Customers" sub={`${customers.length} customers, ${rows.filter((r) => r.count > 1).length} have ordered more than once`} />
      <Panel pad={false}>
        <div className="border-b border-rule p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Name, email, phone or city" label="Search customers" />
        </div>
        {rows.length === 0 ? (
          <Empty title="No customers match" body="Try a different name or city." />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <SortTh label="Customer" k="name" sort={sort} setSort={setSort} />
                  <th className="px-4 py-2.5 font-semibold">City</th>
                  <SortTh label="Orders" k="orders" sort={sort} setSort={setSort} />
                  <SortTh label="Lifetime spend" k="spent" sort={sort} setSort={setSort} />
                  <SortTh label="Last order" k="last" sort={sort} setSort={setSort} />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, count, spent, last }) => (
                  <tr key={c.id} className={`${rowCls} cursor-pointer`} onClick={() => setParams({ c: c.id })}>
                    <td className="px-4 py-3">
                      <button className="text-left font-medium text-ink hover:text-peacock" onClick={() => setParams({ c: c.id })}>{c.name}</button>
                      <span className="block text-xs text-ink-3">{c.email}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-2">{c.city || "Not set"}</td>
                    <td className="px-4 py-3 tabular">{count}</td>
                    <td className="px-4 py-3 font-semibold tabular">{money(spent)}</td>
                    <td className="px-4 py-3 text-ink-3">{last ? shortDate(last) : "No orders"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal open={!!open} onClose={() => setParams({})} title={open?.name ?? ""} wide>
        {open && (
          <>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div><dt className="text-ink-3">Email</dt><dd className="break-all">{open.email}</dd></div>
              <div><dt className="text-ink-3">Phone</dt><dd>{open.phone}</dd></div>
              <div><dt className="text-ink-3">Joined</dt><dd>{shortDate(open.joinedAt)}</dd></div>
              <div><dt className="text-ink-3">Spent</dt><dd className="font-semibold tabular">{money(openOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0))}</dd></div>
            </dl>
            {open.addresses[0] && (
              <p className="mt-4 rounded-[8px] bg-desk px-3 py-2 text-sm text-ink-2">
                {open.addresses[0].line1}, {open.addresses[0].city}, {open.addresses[0].state} {open.addresses[0].pincode}
              </p>
            )}
            <h3 className="mb-2 mt-6 font-semibold">Order history</h3>
            {openOrders.length === 0 ? (
              <p className="text-sm text-ink-3">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-rule rounded-[8px] border border-rule">
                {openOrders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <Link to={`/admin/orders/${o.id}`} className="font-semibold text-peacock hover:underline">{o.number}</Link>
                    <span className="text-ink-3">{shortDate(o.createdAt)}</span>
                    <Badge tone={orderTone(o.status)}>{statusLabel[o.status]}</Badge>
                    <span className="ml-auto font-semibold tabular">{money(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
