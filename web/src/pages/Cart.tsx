import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Trash, X } from "@phosphor-icons/react";
import { SHIPPING_FREE_ABOVE, useCartSummary, useStore } from "../store/useStore";
import { img } from "../lib/cloudinary";
import { money } from "../lib/format";
import { ButtonLink, Container, EmptyState, QtyStepper, CheckoutSteps } from "../components/site/ui";

export default function Cart() {
  const summary = useCartSummary();
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);

  if (summary.lines.length === 0) {
    return (
      <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
        <EmptyState title="Your bag is empty" body="Pieces you add will wait here. Start with a weave, or see what's selling this season." action={<ButtonLink to="/shop">Browse the shop</ButtonLink>} />
      </Container>
    );
  }

  return (
    <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
      <CheckoutSteps current={1} />
      <h1 className="font-display text-[2rem] md:text-[2.6rem]">Your bag</h1>
      <p className="mt-1 text-fg-2 tabular">{summary.count} {summary.count === 1 ? "item" : "items"}</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <ul className="divide-y divide-hair border-y border-hair lg:col-span-7">
          {summary.lines.map((l) => (
            <li key={l.productId + l.size} className="flex gap-4 py-6">
              <Link to={`/product/${l.product.slug}`} className="w-24 shrink-0 md:w-28">
                <img src={img(l.product.images[0], 240)} alt="" className="aspect-[4/5] w-full rounded-[4px] object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/product/${l.product.slug}`} className="font-medium hover:text-brand">
                    {l.product.name}
                  </Link>
                  <span className="font-semibold tabular">{money((l.product.salePrice ?? l.product.mrp) * l.qty)}</span>
                </div>
                <p className="text-sm text-fg-3">
                  {l.product.fabric}
                  {l.size && l.product.sizes.length > 1 ? `, ${l.size}` : ""}
                </p>
                {l.product.salePrice && <p className="text-sm text-brand tabular">{money(l.product.salePrice)} each, was {money(l.product.mrp)}</p>}
                {l.qty >= l.product.stock && <p className="text-sm text-brand">That's all we have in stock.</p>}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QtyStepper value={l.qty} max={l.product.stock} onChange={(n) => setQty(l.productId, l.size, n)} label={`Quantity of ${l.product.name}`} />
                  <button onClick={() => remove(l.productId, l.size)} className="inline-flex items-center gap-1.5 text-sm text-fg-2 hover:text-error">
                    <Trash size={16} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="lg:col-span-5">
          <OrderSummary cta={<ButtonLink to="/checkout" className="w-full">Go to checkout</ButtonLink>} />
        </div>
      </div>
    </Container>
  );
}

export function OrderSummary({ cta, compact = false }: { cta?: React.ReactNode; compact?: boolean }) {
  const s = useCartSummary();
  const coupons = useStore((st) => st.coupons);
  const applyCoupon = useStore((st) => st.applyCoupon);
  const removeCoupon = useStore((st) => st.removeCoupon);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const suggestions = coupons.filter((c) => c.active && new Date(c.expiresAt) > new Date()).slice(0, 3);
  const toFree = SHIPPING_FREE_ABOVE - (s.subtotal - s.discount);

  return (
    <div className="rounded-[var(--radius-panel)] border border-hair bg-paper p-5 md:p-7 lg:sticky lg:top-[calc(var(--nav-height)+1.5rem)]">
      <h2 className="font-display text-xl">Order summary</h2>

      {compact && (
        <ul className="mt-5 space-y-3">
          {s.lines.map((l) => (
            <li key={l.productId + l.size} className="flex items-center gap-3 text-sm">
              <div className="relative">
                <img src={img(l.product.images[0], 120)} alt="" className="h-14 w-11 rounded-[4px] object-cover" />
                <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-brand text-[0.68rem] font-bold text-white">{l.qty}</span>
              </div>
              <span className="flex-1 text-fg">{l.product.name}</span>
              <span className="tabular">{money((l.product.salePrice ?? l.product.mrp) * l.qty)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Coupon */}
      <div className="mt-6">
        {s.coupon ? (
          <div className="flex items-center justify-between rounded-[10px] border border-dashed border-brand/70 px-4 py-3">
            <span className="flex items-center gap-2 text-sm">
              <Tag size={16} className="text-brand" />
              <span className="font-semibold tracking-wide">{s.coupon.code}</span>
              {s.discount > 0 ? <span className="text-success">applied</span> : <span className="text-error">not applicable</span>}
            </span>
            <button onClick={() => { removeCoupon(); setMsg(null); }} aria-label="Remove coupon" className="grid size-8 place-items-center rounded-full hover:bg-paper">
              <X size={14} />
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const r = applyCoupon(code);
              setMsg({ ok: r.ok, text: r.message });
              if (r.ok) setCode("");
            }}
          >
            <label htmlFor="coupon" className="text-sm font-medium text-fg-2">
              Coupon code
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="min-w-0 flex-1 rounded-full border border-hair-2 bg-page px-4 py-2.5 uppercase tracking-wide text-fg placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-3 focus:border-brand focus:outline-none"
                placeholder="Enter code"
              />
              <button className="rounded-full border border-hair-2 px-5 text-sm font-semibold hover:border-brand hover:text-brand">Apply</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((c) => (
                <button type="button" key={c.code} onClick={() => setCode(c.code)} title={c.description} className="rounded-full bg-paper-2 px-3 py-1 text-xs tracking-wide text-fg-2 hover:text-fg">
                  {c.code}
                </button>
              ))}
            </div>
          </form>
        )}
        {s.couponInvalidReason && <p className="mt-2 text-sm text-error">{s.couponInvalidReason}</p>}
        {msg && !s.coupon && <p className={`mt-2 text-sm ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</p>}
        {msg?.ok && s.coupon && <p className="mt-2 text-sm text-success">{msg.text}</p>}
      </div>

      <dl className="mt-6 space-y-3 border-t border-hair pt-5 text-[0.95rem] tabular">
        <Row label="Subtotal" value={money(s.subtotal)} />
        {s.savings > 0 && <Row label="Sale savings included" value={`−${money(s.savings)}`} tone="text-brand" />}
        {s.discount > 0 && <Row label={`Coupon ${s.coupon?.code}`} value={`−${money(s.discount)}`} tone="text-success" />}
        <Row label="Shipping" value={s.shipping === 0 ? "Free" : money(s.shipping)} />
        <div className="flex items-baseline justify-between border-t border-hair pt-4">
          <dt className="font-semibold">Total</dt>
          <dd className="text-2xl font-semibold">{money(s.total)}</dd>
        </div>
      </dl>
      {toFree > 0 && <p className="mt-3 text-sm text-fg-2">Add {money(toFree)} more for free shipping.</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

function Row({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-fg-2">{label}</dt>
      <dd className={tone}>{value}</dd>
    </div>
  );
}
