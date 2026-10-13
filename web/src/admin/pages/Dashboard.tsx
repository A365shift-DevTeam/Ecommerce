import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { WarningCircle } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import { img } from "../../lib/cloudinary";
import { dayMonth, money, shortDate } from "../../lib/format";
import { statusLabel } from "../../pages/account/OrderTimeline";
import { Badge, CHART, ChartTooltip, Panel, PageHeader, Stat, Tabs, orderTone, payTone, rowCls, tableCls, theadCls } from "../ui/kit";

const DAY = 86_400_000;
const compact = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);

export default function Dashboard() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const customers = useStore((s) => s.customers);
  const [range, setRange] = useState<"30" | "90">("30");
  const days = Number(range);

  const stats = useMemo(() => {
    const now = Date.now();
    const valid = orders.filter((o) => o.status !== "cancelled");
    const inRange = (o: (typeof orders)[number], from: number, to: number) => {
      const t = new Date(o.createdAt).getTime();
      return t >= now - from * DAY && t < now - to * DAY;
    };
    const cur = valid.filter((o) => inRange(o, days, 0));
    const prev = valid.filter((o) => inRange(o, days * 2, days));
    const rev = cur.reduce((s, o) => s + o.total, 0);
    const prevRev = prev.reduce((s, o) => s + o.total, 0);
    const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : NaN);

    // Daily revenue series
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(now - (days - 1 - i) * DAY);
      const key = d.toDateString();
      const total = cur.filter((o) => new Date(o.createdAt).toDateString() === key).reduce((s, o) => s + o.total, 0);
      return { day: dayMonth(d.toISOString()), revenue: total };
    });

    // Best sellers in range by units
    const units = new Map<string, { qty: number; revenue: number }>();
    cur.forEach((o) => o.items.forEach((it) => {
      const u = units.get(it.productId) ?? { qty: 0, revenue: 0 };
      units.set(it.productId, { qty: u.qty + it.qty, revenue: u.revenue + it.qty * it.price });
    }));
    const best = [...units.entries()]
      .map(([id, v]) => ({ product: products.find((p) => p.id === id), ...v }))
      .filter((x) => x.product)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    const newCustomers = customers.filter((c) => new Date(c.joinedAt).getTime() >= now - days * DAY).length;
    return {
      rev, revDelta: pct(rev, prevRev),
      count: cur.length, countDelta: pct(cur.length, prev.length),
      aov: cur.length ? rev / cur.length : 0,
      series, best, newCustomers,
    };
  }, [orders, products, customers, days]);

  const lowStock = products.filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock);
  const maxQty = Math.max(1, ...stats.best.map((b) => b.qty));

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub={`Today is ${shortDate(new Date().toISOString())}`}
        actions={<Tabs value={range} onChange={setRange} items={[{ v: "30", label: "Last 30 days" }, { v: "90", label: "Last 90 days" }]} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue" value={money(stats.rev)} delta={stats.revDelta} note={`vs previous ${days} days`} />
        <Stat label="Orders" value={String(stats.count)} delta={stats.countDelta} note={`avg ${money(stats.aov)}`} />
        <Stat label="Products" value={String(products.length)} note={`${products.filter((p) => p.published).length} published, ${products.filter((p) => !p.published).length} drafts`} />
        <Stat label="Customers" value={String(customers.length)} note={`${stats.newCustomers} new in ${days} days`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Daily revenue" className="xl:col-span-2">
          <div className="h-72" role="img" aria-label={`Daily revenue for the last ${days} days, total ${money(stats.rev)}`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.series} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.saree} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={CHART.saree} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={days === 30 ? 4 : 13} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<ChartTooltip fmt={money} />} cursor={{ stroke: CHART.axis, strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART.saree} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Best sellers" action={<span className="text-xs text-ink-3">Units, {days} days</span>}>
          {stats.best.length === 0 ? (
            <p className="text-sm text-ink-3">No sales in this period yet.</p>
          ) : (
            <ol className="space-y-3.5">
              {stats.best.map(({ product, qty, revenue }) => (
                <li key={product!.id} className="flex items-center gap-3">
                  <img src={img(product!.images[0], 80)} alt="" className="h-11 w-9 rounded-[4px] object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product!.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="h-1.5 rounded-full" style={{ width: `${(qty / maxQty) * 100}%`, background: product!.type === "saree" ? CHART.saree : CHART.jewellery }} />
                    </div>
                  </div>
                  <div className="text-right text-xs tabular">
                    <p className="font-semibold text-ink">{qty} sold</p>
                    <p className="text-ink-3">{money(revenue)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 flex gap-4 border-t border-rule pt-3 text-xs text-ink-3">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: CHART.saree }} /> Sarees</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: CHART.jewellery }} /> Jewellery</span>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Recent orders" pad={false} className="xl:col-span-2" action={<Link to="/admin/orders" className="text-sm font-semibold text-peacock hover:underline">View all</Link>}>
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Payment</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 7).map((o) => (
                  <tr key={o.id} className={rowCls}>
                    <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="font-semibold text-peacock hover:underline">{o.number}</Link></td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3 text-ink-3">{shortDate(o.createdAt)}</td>
                    <td className="px-4 py-3"><Badge tone={orderTone(o.status)}>{statusLabel[o.status]}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={payTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                    <td className="px-4 py-3 text-right font-semibold tabular">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Low stock" action={<Link to="/admin/catalog?tab=inventory" className="text-sm font-semibold text-peacock hover:underline">Restock</Link>}>
          {lowStock.length === 0 ? (
            <p className="text-sm text-ink-3">Every product has more than 3 in stock.</p>
          ) : (
            <ul className="space-y-3">
              {lowStock.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <WarningCircle size={18} className={p.stock === 0 ? "text-[#b4232f]" : "text-[#b7791f]"} />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
