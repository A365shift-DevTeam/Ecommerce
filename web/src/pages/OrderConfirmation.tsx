import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle } from "@phosphor-icons/react";
import { useStore } from "../store/useStore";
import { img } from "../lib/cloudinary";
import { money, shortDate } from "../lib/format";
import { ButtonLink, Container, EmptyState, CheckoutSteps } from "../components/site/ui";
import { OrderTimeline } from "./account/OrderTimeline";

export default function OrderConfirmation() {
  const { id } = useParams();
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  if (!order) {
    return (
      <Container className="pt-[calc(var(--nav-height)+2rem)]">
        <EmptyState title="We can't find that order" body="Check the link in your confirmation email, or look in your account's order history." action={<ButtonLink to="/account/orders">Your orders</ButtonLink>} />
      </Container>
    );
  }
  return (
    <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
      <div className="mx-auto max-w-3xl">
        <div className="flex justify-center">
          <CheckoutSteps current={3} />
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }} className="text-center">
          <CheckCircle size={52} weight="light" className="mx-auto text-success" />
          <h1 className="mt-4 font-display text-[2.2rem] leading-tight md:text-[3rem]">Order placed</h1>
          <p className="mt-3 text-fg-2">
            Thank you, {order.customerName.split(" ")[0]}. Order <span className="font-semibold text-fg">{order.number}</span> is confirmed and a receipt is on its way to {order.email}.
          </p>
          <p className="mt-2 text-fg">Expected by {shortDate(order.estimatedDelivery)}</p>
        </motion.div>

        <div className="mt-12 rounded-[var(--radius-panel)] border border-hair bg-paper p-5 md:p-8">
          <OrderTimeline order={order} />
          <ul className="mt-8 divide-y divide-hair border-t border-hair">
            {order.items.map((it) => (
              <li key={it.productId + it.size} className="flex items-center gap-4 py-4">
                <img src={img(it.image, 120)} alt="" className="h-16 w-13 rounded-[4px] object-cover" />
                <span className="flex-1 text-sm">
                  {it.name}
                  <span className="block text-fg-3">Qty {it.qty}{it.size ? `, ${it.size}` : ""}</span>
                </span>
                <span className="tabular text-sm">{money(it.price * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-hair pt-5 text-sm tabular">
            <div className="flex justify-between"><dt className="text-fg-2">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
            {order.discount > 0 && <div className="flex justify-between"><dt className="text-fg-2">Coupon {order.coupon}</dt><dd className="text-success">−{money(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-fg-2">Shipping</dt><dd>{order.shipping ? money(order.shipping) : "Free"}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Total paid</dt><dd>{money(order.total)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-2">Payment</dt><dd>{order.paymentMethod}, {order.paymentStatus === "paid" ? "paid" : "due on delivery"}</dd></div>
          </dl>
          <div className="mt-6 border-t border-hair pt-5 text-sm">
            <p className="font-semibold">Delivering to</p>
            <p className="mt-1 text-fg-2">
              {order.address.name}, {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink to={`/account/orders/${order.id}`}>Track this order</ButtonLink>
          <Link to="/shop" className="inline-flex items-center rounded-full border border-hair-2 px-6 py-3 font-semibold hover:border-brand hover:text-brand">
            Keep shopping
          </Link>
        </div>
      </div>
    </Container>
  );
}
