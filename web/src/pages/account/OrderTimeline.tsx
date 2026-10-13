import { Check, X } from "@phosphor-icons/react";
import type { Order, OrderStatus } from "../../data/types";
import { dateTime } from "../../lib/format";

export const statusLabel: Record<OrderStatus, string> = {
  placed: "Order placed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const steps: OrderStatus[] = ["placed", "packed", "shipped", "out_for_delivery", "delivered"];

/** Horizontal on wide screens, vertical on phones. */
export function OrderTimeline({ order, light = false }: { order: Order; light?: boolean }) {
  if (order.status === "cancelled") {
    const at = order.timeline.find((t) => t.status === "cancelled")?.at;
    return (
      <div className={`flex items-center gap-3 rounded-[10px] p-4 text-sm ${light ? "bg-red-50 text-red-800" : "bg-error/10 text-error"}`}>
        <X size={18} /> Cancelled{at ? ` on ${dateTime(at)}` : ""}. {order.paymentStatus === "refunded" ? "The refund has been issued to the original payment method." : ""}
      </div>
    );
  }
  const reached = steps.indexOf(order.status);
  const done = light ? "bg-peacock text-white" : "bg-brand text-white";
  const todo = light ? "border border-rule text-ink-3 bg-white" : "border border-hair-2 text-fg-3";
  const line = light ? "bg-peacock" : "bg-brand";
  const lineTodo = light ? "bg-rule" : "bg-hair-2";
  return (
    <ol className="grid gap-0 md:grid-cols-5" aria-label="Delivery progress">
      {steps.map((s, i) => {
        const at = order.timeline.find((t) => t.status === s)?.at;
        const isDone = i <= reached;
        return (
          <li key={s} className="relative flex gap-3 pb-6 md:flex-col md:gap-2 md:pb-0" aria-current={i === reached ? "step" : undefined}>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px md:left-7 md:top-[13px] md:h-px md:w-[calc(100%-1.75rem)] ${i < reached ? line : lineTodo}`} />
            )}
            <span className={`relative z-10 grid size-[27px] shrink-0 place-items-center rounded-full text-xs ${isDone ? done : todo}`}>{isDone ? <Check size={13} weight="bold" /> : i + 1}</span>
            <span className="text-sm">
              <span className={`block font-semibold ${isDone ? (light ? "text-ink" : "text-fg") : light ? "text-ink-3" : "text-fg-3"}`}>{statusLabel[s]}</span>
              {at && <span className={light ? "text-ink-3" : "text-fg-3"}>{dateTime(at)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
