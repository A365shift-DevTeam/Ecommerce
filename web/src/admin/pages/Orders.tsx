import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Phone, EnvelopeSimple } from "@phosphor-icons/react";
import type { OrderStatus, PaymentStatus } from "../../data/types";
import { useStore } from "../../store/useStore";
import { img } from "../../lib/cloudinary";
import { dateTime, money, shortDate } from "../../lib/format";
import { OrderTimeline, statusLabel } from "../../pages/account/OrderTimeline";
import { Badge, Btn, Empty, PageHeader, Panel, SearchBox, Select, SortTh, Tabs, orderTone, payTone, rowCls, tableCls, theadCls } from "../ui/kit";

const statuses: OrderStatus[] = ["placed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const PAGE = 15;

export default function Orders() {
  const orders = useStore((s) => s.orders);
  const [tab, setTab] = useState<"all" | OrderStatus>("all");
  const [q, setQ] = useState("");
  const [pay, setPay] = useState("");
  const [sort, setSort] = useState<{ k: string; dir: 1 | -1 }>({ k: "date", dir: -1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    const r = orders.filter(
      (o) =>
        (tab === "all" || o.status === tab) &&
        (!pay || o.paymentStatus === pay) &&
        (!term || o.number.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term) || o.email.toLowerCase().includes(term) || o.address.city.toLowerCase().includes(term)),
    );
    return [...r].sort((a, b) => (sort.k === "total" ? a.total - b.total : a.createdAt.localeCompare(b.createdAt)) * sort.dir);
  }, [orders, tab, q, pay, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <>
      <PageHeader title="Orders" sub={`${orders.length} orders, ${count("placed")} waiting to be packed`} />
      <Panel pad={false}>
        <div className="px-4 pt-2">
          <Tabs
            value={tab}
            onChange={(v) => { setTab(v); setPage(0); }}
            items={[{ v: "all" as const, label: "All", count: orders.length }, ...statuses.map((s) => ({ v: s, label: statusLabel[s], count: count(s) }))]}
          />
        </div>
        <div className="flex flex-col gap-3 border-b border-rule p-4 sm:flex-row sm:items-center">
          <SearchBox value={q} onChange={(v) => { setQ(v); setPage(0); }} placeholder="Order number, customer, city" label="Search orders" />
          <Select aria-label="Payment status" value={pay} onChange={(e) => { setPay(e.target.value); setPage(0); }} className="sm:ml-auto sm:w-48">
            <option value="">Any payment status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </Select>
        </div>
        {view.length === 0 ? (
          <Empty title="No orders here" body="Try another status tab or clear the search." />
        ) : (
          <div className="overflow-x-auto">
            <table className={tableCls}>
              <thead className={theadCls}>
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <SortTh label="Date" k="date" sort={sort} setSort={setSort} />
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Items</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Payment</th>
                  <SortTh label="Total" k="total" sort={sort} setSort={setSort} className="text-right" />
                </tr>
              </thead>
              <tbody>
                {view.map((o) => (
                  <tr key={o.id} className={rowCls}>
                    <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="font-semibold text-peacock hover:underline">{o.number}</Link></td>
                    <td className="px-4 py-3 text-ink-3">{dateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      {o.customerName}
                      <span className="block text-xs text-ink-3">{o.address.city}</span>
                    </td>
                    <td className="px-4 py-3 tabular text-ink-2">{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className="px-4 py-3"><Badge tone={orderTone(o.status)}>{statusLabel[o.status]}</Badge></td>
                    <td className="px-4 py-3">
                      <Badge tone={payTone(o.paymentStatus)}>{o.paymentStatus}</Badge>
                      <span className="block pt-0.5 text-xs text-ink-3">{o.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-rule px-4 py-3 text-sm text-ink-3">
          <span className="tabular">
            {rows.length ? `${page * PAGE + 1} to ${Math.min(rows.length, (page + 1) * PAGE)} of ${rows.length}` : "0 orders"}
          </span>
          <div className="flex gap-2">
            <Btn variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Btn>
            <Btn variant="secondary" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Btn>
          </div>
        </div>
      </Panel>
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const customerOrders = useStore((s) => s.orders.filter((o) => o.customerId === order?.customerId).length);
  const setStatus = useStore((s) => s.setOrderStatus);
  const setPayment = useStore((s) => s.setPaymentStatus);
  const toast = useStore((s) => s.toast);
  const [next, setNext] = useState<OrderStatus | "">("");

  if (!order) return <Empty title="Order not found" body="It may have been removed when the demo data was reset." action={<Link to="/admin/orders" className="text-peacock underline">Back to orders</Link>} />;

  const flow = statuses.filter((s) => s !== "cancelled");
  const options = order.status === "cancelled" || order.status === "delivered" ? [] : [...flow.slice(flow.indexOf(order.status) + 1), "cancelled" as const];

  return (
    <>
      <Link to="/admin/orders" className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={14} /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.number}`}
        sub={`Placed ${dateTime(order.createdAt)}. Expected by ${shortDate(order.estimatedDelivery)}.`}
        actions={<Btn variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print invoice</Btn>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel title="Progress" action={<Badge tone={orderTone(order.status)}>{statusLabel[order.status]}</Badge>}>
            <OrderTimeline order={order} light />
            {options.length > 0 && (
              <form
                className="mt-6 flex flex-col gap-2 border-t border-rule pt-5 sm:flex-row sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!next) return;
                  setStatus(order.id, next);
                  toast(`${order.number} marked ${statusLabel[next].toLowerCase()}`);
                  setNext("");
                }}
              >
                <Select label="Update status" value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} className="sm:w-64">
                  <option value="">Choose next status</option>
                  {options.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                </Select>
                <Btn type="submit" disabled={!next} variant={next === "cancelled" ? "danger" : "primary"}>
                  {next === "cancelled" ? "Cancel order" : "Update status"}
                </Btn>
              </form>
            )}
          </Panel>

          <Panel title={`Items (${order.items.reduce((n, i) => n + i.qty, 0)})`} pad={false}>
            <ul>
              {order.items.map((it) => (
                <li key={it.productId + it.size} className="flex items-center gap-4 border-b border-rule px-5 py-3 last:border-0">
                  <img src={img(it.image, 100)} alt="" className="h-14 w-11 rounded-[4px] object-cover" />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{it.name}</p>
                    <p className="text-xs text-ink-3">{it.size} · {money(it.price)} × {it.qty}</p>
                  </div>
                  <span className="text-sm font-semibold tabular">{money(it.price * it.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-rule px-5 py-4 text-sm tabular">
              <div className="flex justify-between"><dt className="text-ink-3">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between"><dt className="text-ink-3">Coupon {order.coupon}</dt><dd>−{money(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-3">Shipping</dt><dd>{order.shipping ? money(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Payment">
            <p className="text-sm text-ink-2">{order.paymentMethod}</p>
            <Select
              label="Payment status (demo)"
              value={order.paymentStatus}
              onChange={(e) => {
                setPayment(order.id, e.target.value as PaymentStatus);
                toast(`Payment marked ${e.target.value}`);
              }}
              className="mt-3"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="failed">Failed</option>
            </Select>
          </Panel>
          <Panel title="Customer">
            <p className="font-semibold">{order.customerName}</p>
            <p className="text-xs text-ink-3">{customerOrders} {customerOrders === 1 ? "order" : "orders"} with Gruham</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink-2"><EnvelopeSimple size={15} /> {order.email}</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-ink-2"><Phone size={15} /> {order.phone}</p>
            <Link to={`/admin/customers?c=${order.customerId}`} className="mt-3 inline-block text-sm font-semibold text-peacock hover:underline">View customer</Link>
          </Panel>
          <Panel title="Delivery address">
            <address className="text-sm not-italic leading-relaxed text-ink-2">
              {order.address.name}
              <br />
              {order.address.line1}
              {order.address.line2 && <><br />{order.address.line2}</>}
              <br />
              {order.address.city}, {order.address.state} {order.address.pincode}
              <br />
              {order.address.phone}
            </address>
          </Panel>
        </div>
      </div>
    </>
  );
}
