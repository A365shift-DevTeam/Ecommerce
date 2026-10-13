import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag, Trash, Truck, X } from "@phosphor-icons/react";
import { SHIPPING_FREE_ABOVE, useCartSummary, useStore } from "../../store/useStore";
import { img } from "../../lib/cloudinary";
import { money } from "../../lib/format";
import { lockScroll } from "../../lib/smoothScroll";
import { ButtonLink, QtyStepper } from "./ui";

/** Slide-in mini bag. Opens whenever something is added to the bag, or from the header bag icon. */
export function CartDrawer() {
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const s = useCartSummary();
  const { pathname } = useLocation();
  const toFree = Math.max(0, SHIPPING_FREE_ABOVE - (s.subtotal - s.discount));
  const pct = Math.min(100, ((s.subtotal - s.discount) / SHIPPING_FREE_ABOVE) * 100);

  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[55] bg-black/40" onClick={() => setOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            data-lenis-prevent
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-md flex-col bg-page shadow-[-20px_0_40px_-20px_rgba(36,22,25,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-hair px-5 py-3">
              <h2 className="text-lg font-semibold">
                Your bag <span className="text-fg-3 tabular">({s.count})</span>
              </h2>
              <button onClick={() => setOpen(false)} aria-label="Close bag" className="grid size-11 place-items-center rounded-full hover:bg-paper">
                <X size={20} />
              </button>
            </div>

            {s.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <ShoppingBag size={40} weight="light" className="text-fg-3" />
                <p className="font-semibold">Your bag is empty</p>
                <p className="text-sm text-fg-2">Add a saree or a piece of jewellery and it will wait here.</p>
                <ButtonLink to="/shop" className="mt-2">
                  Start shopping
                </ButtonLink>
              </div>
            ) : (
              <>
                <div className="border-b border-hair bg-paper px-5 py-3">
                  <p className="flex items-center gap-2 text-[0.85rem] text-fg">
                    <Truck size={18} className="text-brand" />
                    {toFree > 0 ? (
                      <span>
                        Add <span className="font-semibold">{money(toFree)}</span> more for free shipping
                      </span>
                    ) : (
                      <span className="font-semibold text-success">You've unlocked free shipping</span>
                    )}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-hair">
                    <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <ul className="flex-1 divide-y divide-hair overflow-y-auto px-5">
                  {s.lines.map((l) => (
                    <li key={l.productId + l.size} className="flex gap-3 py-4">
                      <Link to={`/product/${l.product.slug}`} className="w-20 shrink-0">
                        <img src={img(l.product.images[0], 200)} alt="" className="aspect-[3/4] w-full rounded-md object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link to={`/product/${l.product.slug}`} className="line-clamp-2 text-[0.9rem] font-medium hover:underline">
                          {l.product.name}
                        </Link>
                        {l.size && l.product.sizes.length > 1 && <p className="text-[0.78rem] text-fg-3">{l.size}</p>}
                        <p className="mt-1 text-[0.92rem] font-bold tabular">{money((l.product.salePrice ?? l.product.mrp) * l.qty)}</p>
                        <div className="mt-auto flex items-center justify-between pt-2">
                          <QtyStepper value={l.qty} max={l.product.stock} onChange={(n) => setQty(l.productId, l.size, n)} label={`Quantity of ${l.product.name}`} />
                          <button onClick={() => remove(l.productId, l.size)} aria-label={`Remove ${l.product.name}`} className="grid size-11 place-items-center rounded-full text-fg-3 hover:bg-paper hover:text-error">
                            <Trash size={18} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-hair px-5 py-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-fg-2">Subtotal</span>
                    <span className="text-xl font-bold tabular">{money(s.subtotal)}</span>
                  </div>
                  {s.savings > 0 && <p className="mt-0.5 text-right text-[0.82rem] font-semibold text-success">You save {money(s.savings)}</p>}
                  <p className="mt-1 text-[0.78rem] text-fg-3">Coupons and shipping are applied at checkout.</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ButtonLink to="/cart" variant="ghost">
                      View bag
                    </ButtonLink>
                    <ButtonLink to="/checkout">Checkout</ButtonLink>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
