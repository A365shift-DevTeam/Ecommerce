import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DownloadSimple, Table } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import { dayMonth, money } from "../../lib/format";
import { Btn, CHART, ChartTooltip, PageHeader, Panel, Stat, Tabs, rowCls, theadCls } from "../ui/kit";

const DAY = 86_400_000;
const compact = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);

export default function Reports() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const [range, setRange] = useState<"30" | "90" | "120">("90");
  const [showTable, setShowTable] = useState(false);
  const days = Number(range);

  const r = useMemo(() => {
    const now = Date.now();
    const valid = orders.filter((o) => o.status !== "cancelled" && new Date(o.createdAt).getTime() >= now - days * DAY);
    const typeOf = (id: string) => products.find((p) => p.id === id)?.type ?? "saree";
    const catOf = (id: string) => products.find((p) => p.id === id)?.category ?? "";

    // Weekly revenue split by line type
    const weeks = Math.ceil(days / 7);
    const weekly = Array.from({ length: weeks }, (_, i) => {
      const end = now - (weeks - 1 - i) * 7 * DAY;
      const start = end - 7 * DAY;
      const inWeek = valid.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t > start && t <= end;
      });
      const sum = (type: string) => inWeek.reduce((s, o) => s + o.items.filter((it) => typeOf(it.productId) === type).reduce((a, it) => a + it.price * it.qty, 0), 0);
      return { week: `w/c ${dayMonth(new Date(start + DAY).toISOString())}`, saree: sum("saree"), jewellery: sum("jewellery") };
    });

    const byCat = new Map<string, { revenue: number; units: number }>();
    valid.forEach((o) => o.items.forEach((it) => {
      const k = catOf(it.productId);
      const c = byCat.get(k) ?? { revenue: 0, units: 0 };
      byCat.set(k, { revenue: c.revenue + it.price * it.qty, units: c.units + it.qty });
    }));
    const catRows = [...byCat.entries()].map(([slug, v]) => ({ name: categories.find((c) => c.slug === slug)?.name ?? slug, ...v })).sort((a, b) => b.revenue - a.revenue);

    const byPay = new Map<string, { count: number; revenue: number }>();
    valid.forEach((o) => {
      const c = byPay.get(o.paymentMethod) ?? { count: 0, revenue: 0 };
      byPay.set(o.paymentMethod, { count: c.count + 1, revenue: c.revenue + o.total });
    });

    const byCity = new Map<string, number>();
    valid.forEach((o) => byCity.set(o.address.city, (byCity.get(o.address.city) ?? 0) + o.total));

    const revenue = valid.reduce((s, o) => s + o.total, 0);
    const units = valid.reduce((s, o) => s + o.items.reduce((a, it) => a + it.qty, 0), 0);
    const discounts = valid.reduce((s, o) => s + o.discount, 0);
    return {
      valid, weekly, catRows, revenue, units, discounts,
      aov: valid.length ? revenue / valid.length : 0,
      payRows: [...byPay.entries()].sort((a, b) => b[1].revenue - a[1].revenue),
      cityRows: [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [orders, products, categories, days]);

  const exportCsv = () => {
    const head = "Order,Date,Customer,City,Items,Subtotal,Discount,Shipping,Total,Status,Payment\n";
    const body = r.valid
      .map((o) => [o.number, o.createdAt.slice(0, 10), o.customerName, o.address.city, o.items.reduce((n, i) => n + i.qty, 0), o.subtotal, o.discount, o.shipping, o.total, o.status, o.paymentStatus].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `gruham-sales-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxCat = Math.max(1, ...r.catRows.map((c) => c.revenue));

  return (
    <>
      <PageHeader
        title="Sales reports"
        sub="Excludes cancelled orders."
        actions={
          <>
            <Tabs value={range} onChange={setRange} items={[{ v: "30", label: "30 days" }, { v: "90", label: "90 days" }, { v: "120", label: "120 days" }]} />
            <Btn variant="secondary" onClick={exportCsv}><DownloadSimple size={16} /> Export CSV</Btn>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Net revenue" value={money(r.revenue)} note={`${r.valid.length} orders`} />
        <Stat label="Average order" value={money(r.aov)} />
        <Stat label="Items sold" value={String(r.units)} />
        <Stat label="Coupon discounts" value={money(r.discounts)} note={r.revenue ? `${((r.discounts / (r.revenue + r.discounts)) * 100).toFixed(1)}% of gross` : undefined} />
      </div>

      <Panel
        title="Weekly revenue by line"
        className="mt-4"
        action={<Btn variant="ghost" onClick={() => setShowTable((v) => !v)}><Table size={16} /> {showTable ? "Show chart" : "Show table"}</Btn>}
      >
        {showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={theadCls}><tr><th className="px-3 py-2">Week</th><th className="px-3 py-2 text-right">Sarees</th><th className="px-3 py-2 text-right">Jewellery</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
              <tbody>
                {r.weekly.map((w) => (
                  <tr key={w.week} className={rowCls}><td className="px-3 py-2">{w.week}</td><td className="px-3 py-2 text-right tabular">{money(w.saree)}</td><td className="px-3 py-2 text-right tabular">{money(w.jewellery)}</td><td className="px-3 py-2 text-right font-semibold tabular">{money(w.saree + w.jewellery)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-80" role="img" aria-label="Weekly revenue split between sarees and jewellery">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={r.weekly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="22%">
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} interval={days > 60 ? 1 : 0} />
                <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: CHART.axis }} tickLine={false} axisLine={false} width={56} />
                <Tooltip content={<ChartTooltip fmt={money} />} cursor={{ fill: "rgba(29,37,35,0.04)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: CHART.axis, paddingTop: 8 }} />
                <Bar dataKey="saree" name="Sarees" stackId="a" fill={CHART.saree} stroke="#fff" strokeWidth={2} />
                <Bar dataKey="jewellery" name="Jewellery" stackId="a" fill={CHART.jewellery} stroke="#fff" strokeWidth={2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Sales by category" className="lg:col-span-2" pad={false}>
          <table className="w-full text-left text-sm">
            <thead className={theadCls}><tr><th className="px-4 py-2.5">Category</th><th className="px-4 py-2.5">Share</th><th className="px-4 py-2.5 text-right">Units</th><th className="px-4 py-2.5 text-right">Revenue</th></tr></thead>
            <tbody>
              {r.catRows.map((c) => (
                <tr key={c.name} className={rowCls}>
                  <td className="px-4 py-2.5 font-medium">{c.name}</td>
                  <td className="w-1/3 px-4 py-2.5"><span className="block h-1.5 rounded-full bg-peacock/70" style={{ width: `${(c.revenue / maxCat) * 100}%` }} /></td>
                  <td className="px-4 py-2.5 text-right tabular">{c.units}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular">{money(c.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Payment methods">
            <ul className="space-y-2.5 text-sm">
              {r.payRows.map(([m, v]) => (
                <li key={m} className="flex justify-between"><span>{m} <span className="text-ink-3">({v.count})</span></span><span className="font-semibold tabular">{money(v.revenue)}</span></li>
              ))}
            </ul>
          </Panel>
          <Panel title="Top cities">
            <ul className="space-y-2.5 text-sm">
              {r.cityRows.map(([c, v]) => (
                <li key={c} className="flex justify-between"><span>{c}</span><span className="font-semibold tabular">{money(v)}</span></li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
