import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Address, Attributes, Banner, CartLine, Category, Collection, Coupon, Customer, Order, OrderStatus, PaymentStatus, Product } from "../data/types";
import * as seed from "../data/seed";
import { addBusinessDays, uid } from "../lib/format";

export interface Toast {
  id: string;
  text: string;
  tone?: "ok" | "error";
}

interface State {
  // Catalogue (shared by shop and admin)
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  coupons: Coupon[];
  attributes: Attributes;
  orders: Order[];
  customers: Customer[];

  // Shopper
  sessionUserId: string | null;
  cart: CartLine[];
  appliedCoupon: string | null;
  wishlist: string[];
  recentlyViewed: string[];

  toasts: Toast[];
  cartOpen: boolean;
}

interface Actions {
  toast: (text: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  setCartOpen: (open: boolean) => void;

  addToCart: (productId: string, qty?: number, size?: string) => void;
  setQty: (productId: string, size: string | undefined, qty: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;

  toggleWishlist: (productId: string) => void;
  markViewed: (productId: string) => void;

  login: (email: string, password: string) => { ok: boolean; message: string };
  register: (input: { name: string; email: string; phone: string; password: string }) => { ok: boolean; message: string };
  logout: () => void;
  updateProfile: (patch: Partial<Pick<Customer, "name" | "phone" | "email" | "city">>) => void;
  saveAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;

  placeOrder: (input: { customer: { name: string; email: string; phone: string }; address: Address; paymentMethod: Order["paymentMethod"] }) => Order;

  // Admin
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  setProductField: <K extends keyof Product>(id: string, key: K, value: Product[K]) => void;
  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  setPaymentStatus: (id: string, status: PaymentStatus) => void;
  upsertCoupon: (c: Coupon, originalCode?: string) => void;
  deleteCoupon: (code: string) => void;
  upsertBanner: (b: Banner) => void;
  deleteBanner: (id: string) => void;
  upsertCollection: (c: Collection) => void;
  setAttributes: (a: Attributes) => void;
  resetDemo: () => void;
}

function initialData() {
  const customers = seed.buildCustomers();
  customers[0].password = seed.demoShopper.password;
  return {
    products: seed.products,
    categories: seed.categories,
    collections: seed.collections,
    banners: seed.banners,
    coupons: seed.coupons,
    attributes: seed.attributes,
    customers,
    orders: seed.buildOrders(customers),
  };
}

export const priceOf = (p: Product) => p.salePrice ?? p.mrp;

/** Coupon maths shared by cart, checkout and admin previews. */
export function couponDiscount(coupon: Coupon | undefined, lines: { product: Product; qty: number }[]) {
  if (!coupon || !coupon.active) return { discount: 0, reason: "This code isn't active." };
  if (new Date(coupon.expiresAt) < new Date()) return { discount: 0, reason: `${coupon.code} expired on ${new Date(coupon.expiresAt).toLocaleDateString("en-IN")}.` };
  const eligible = lines.filter((l) => coupon.appliesTo === "all" || l.product.type === coupon.appliesTo);
  const base = eligible.reduce((s, l) => s + priceOf(l.product) * l.qty, 0);
  if (base === 0) return { discount: 0, reason: `${coupon.code} only applies to ${coupon.appliesTo === "saree" ? "sarees" : "jewellery"}.` };
  if (base < coupon.minOrder) return { discount: 0, reason: `Add ₹${(coupon.minOrder - base).toLocaleString("en-IN")} more of eligible items to use ${coupon.code}.` };
  let d = coupon.type === "percent" ? (base * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return { discount: Math.round(Math.min(d, base)), reason: "" };
}

export const SHIPPING_FREE_ABOVE = 2999;
export const SHIPPING_FEE = 149;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initialData(),
      sessionUserId: null,
      cart: [],
      appliedCoupon: null,
      wishlist: [],
      recentlyViewed: [],
      toasts: [],
      cartOpen: false,
      setCartOpen: (open) => set({ cartOpen: open }),

      toast: (text, tone = "ok") => {
        const id = uid("t");
        set((s) => ({ toasts: [...s.toasts.slice(-2), { id, text, tone }] }));
        setTimeout(() => get().dismissToast(id), 3200);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      addToCart: (productId, qty = 1, size) => {
        const p = get().products.find((x) => x.id === productId);
        if (!p) return;
        const sz = size ?? p.sizes[0];
        const existing = get().cart.find((l) => l.productId === productId && l.size === sz);
        const nextQty = Math.min(p.stock, (existing?.qty ?? 0) + qty);
        if (p.stock === 0) {
          get().toast(`${p.name} is out of stock.`, "error");
          return;
        }
        set((s) => ({
          cart: existing
            ? s.cart.map((l) => (l === existing ? { ...l, qty: nextQty } : l))
            : [...s.cart, { productId, qty: Math.min(qty, p.stock), size: sz }],
        }));
        if (existing && nextQty === existing.qty) get().toast(`Only ${p.stock} in stock. Your bag already has them all.`, "error");
        else set({ cartOpen: true });
      },
      setQty: (productId, size, qty) =>
        set((s) => {
          const p = s.products.find((x) => x.id === productId);
          const capped = Math.max(1, Math.min(qty, p?.stock ?? qty));
          return { cart: s.cart.map((l) => (l.productId === productId && l.size === size ? { ...l, qty: capped } : l)) };
        }),
      removeFromCart: (productId, size) => set((s) => ({ cart: s.cart.filter((l) => !(l.productId === productId && l.size === size)) })),
      clearCart: () => set({ cart: [], appliedCoupon: null }),
      applyCoupon: (raw) => {
        const code = raw.trim().toUpperCase();
        const c = get().coupons.find((x) => x.code === code);
        if (!code) return { ok: false, message: "Enter a coupon code." };
        if (!c) return { ok: false, message: `We couldn't find ${code}. Check the spelling and try again.` };
        const lines = get()
          .cart.map((l) => ({ product: get().products.find((p) => p.id === l.productId)!, qty: l.qty }))
          .filter((l) => l.product);
        const { discount, reason } = couponDiscount(c, lines);
        if (!discount) return { ok: false, message: reason };
        set({ appliedCoupon: code });
        return { ok: true, message: `${code} applied. You save ₹${discount.toLocaleString("en-IN")}.` };
      },
      removeCoupon: () => set({ appliedCoupon: null }),

      toggleWishlist: (productId) => {
        const has = get().wishlist.includes(productId);
        set((s) => ({ wishlist: has ? s.wishlist.filter((x) => x !== productId) : [productId, ...s.wishlist] }));
        const p = get().products.find((x) => x.id === productId);
        get().toast(has ? "Removed from wishlist" : `Saved to wishlist: ${p?.name ?? ""}`);
      },
      markViewed: (productId) => set((s) => ({ recentlyViewed: [productId, ...s.recentlyViewed.filter((x) => x !== productId)].slice(0, 12) })),

      login: (email, password) => {
        const c = get().customers.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!c) return { ok: false, message: "No account uses that email. Create one below, or check for a typo." };
        if ((c.password ?? "gruham123") !== password) return { ok: false, message: "That password doesn't match this account." };
        set({ sessionUserId: c.id });
        return { ok: true, message: `Welcome back, ${c.name.split(" ")[0]}.` };
      },
      register: ({ name, email, phone, password }) => {
        if (get().customers.some((x) => x.email.toLowerCase() === email.trim().toLowerCase()))
          return { ok: false, message: "An account already uses this email. Sign in instead." };
        const c: Customer = { id: uid("u"), name: name.trim(), email: email.trim(), phone, password, city: "", joinedAt: new Date().toISOString(), addresses: [] };
        set((s) => ({ customers: [c, ...s.customers], sessionUserId: c.id }));
        return { ok: true, message: `Account created. Welcome, ${c.name.split(" ")[0]}.` };
      },
      logout: () => set({ sessionUserId: null }),
      updateProfile: (patch) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === s.sessionUserId ? { ...c, ...patch } : c)) })),
      saveAddress: (address) =>
        set((s) => ({
          customers: s.customers.map((c) => {
            if (c.id !== s.sessionUserId) return c;
            let addresses = c.addresses.some((a) => a.id === address.id)
              ? c.addresses.map((a) => (a.id === address.id ? address : a))
              : [...c.addresses, { ...address, isDefault: c.addresses.length === 0 || address.isDefault }];
            if (address.isDefault) addresses = addresses.map((a) => ({ ...a, isDefault: a.id === address.id }));
            return { ...c, addresses };
          }),
        })),
      deleteAddress: (id) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === s.sessionUserId ? { ...c, addresses: c.addresses.filter((a) => a.id !== id) } : c)) })),

      placeOrder: ({ customer, address, paymentMethod }) => {
        const s = get();
        const lines = s.cart.map((l) => ({ line: l, product: s.products.find((p) => p.id === l.productId)! })).filter((x) => x.product);
        const subtotal = lines.reduce((sum, { line, product }) => sum + priceOf(product) * line.qty, 0);
        const coupon = s.coupons.find((c) => c.code === s.appliedCoupon);
        const { discount } = couponDiscount(coupon, lines.map(({ line, product }) => ({ product, qty: line.qty })));
        const shipping = subtotal - discount >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FEE;
        const now = new Date();
        let customerId = s.sessionUserId;
        let customers = s.customers;
        if (!customerId) {
          const existing = customers.find((c) => c.email.toLowerCase() === customer.email.toLowerCase());
          if (existing) customerId = existing.id;
          else {
            const c: Customer = { id: uid("u"), ...customer, city: address.city, joinedAt: now.toISOString(), addresses: [{ ...address, isDefault: true }] };
            customers = [c, ...customers];
            customerId = c.id;
          }
        }
        const order: Order = {
          id: uid("o"),
          number: `GRH-${24900 + s.orders.length * 7 + Math.floor(Math.random() * 6)}`,
          customerId,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone,
          address,
          items: lines.map(({ line, product }) => ({ productId: product.id, name: product.name, image: product.images[0], price: priceOf(product), qty: line.qty, size: line.size })),
          subtotal,
          discount,
          shipping,
          total: subtotal - discount + shipping,
          coupon: discount ? coupon?.code : undefined,
          status: "placed",
          paymentStatus: paymentMethod === "Cash on delivery" ? "pending" : "paid",
          paymentMethod,
          createdAt: now.toISOString(),
          estimatedDelivery: addBusinessDays(now, 5).toISOString(),
          timeline: [{ status: "placed", at: now.toISOString() }],
        };
        set({
          customers,
          orders: [order, ...s.orders],
          products: s.products.map((p) => {
            const bought = lines.filter((l) => l.product.id === p.id).reduce((n, l) => n + l.line.qty, 0);
            return bought ? { ...p, stock: Math.max(0, p.stock - bought), sold: p.sold + bought } : p;
          }),
          coupons: discount && coupon ? s.coupons.map((c) => (c.code === coupon.code ? { ...c, used: c.used + 1 } : c)) : s.coupons,
          cart: [],
          appliedCoupon: null,
        });
        return order;
      },

      upsertProduct: (p) => set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [p, ...s.products] })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id), cart: s.cart.filter((l) => l.productId !== id), wishlist: s.wishlist.filter((w) => w !== id) })),
      setProductField: (id, key, value) => set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, [key]: value } : x)) })),
      upsertCategory: (c) => set((s) => ({ categories: s.categories.some((x) => x.id === c.id) ? s.categories.map((x) => (x.id === c.id ? c : x)) : [...s.categories, c] })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),
      setOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  paymentStatus: status === "cancelled" && o.paymentStatus === "paid" ? "refunded" : status === "delivered" && o.paymentMethod === "Cash on delivery" ? "paid" : o.paymentStatus,
                  timeline: [...o.timeline, { status, at: new Date().toISOString() }],
                }
              : o,
          ),
        })),
      setPaymentStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, paymentStatus: status } : o)) })),
      upsertCoupon: (c, originalCode) =>
        set((s) => {
          const key = originalCode ?? c.code;
          return { coupons: s.coupons.some((x) => x.code === key) ? s.coupons.map((x) => (x.code === key ? c : x)) : [c, ...s.coupons] };
        }),
      deleteCoupon: (code) => set((s) => ({ coupons: s.coupons.filter((x) => x.code !== code), appliedCoupon: s.appliedCoupon === code ? null : s.appliedCoupon })),
      upsertBanner: (b) => set((s) => ({ banners: s.banners.some((x) => x.id === b.id) ? s.banners.map((x) => (x.id === b.id ? b : x)) : [...s.banners, b] })),
      deleteBanner: (id) => set((s) => ({ banners: s.banners.filter((x) => x.id !== id) })),
      upsertCollection: (c) => set((s) => ({ collections: s.collections.some((x) => x.id === c.id) ? s.collections.map((x) => (x.id === c.id ? c : x)) : [...s.collections, c] })),
      setAttributes: (a) => set({ attributes: a }),
      resetDemo: () => set({ ...initialData(), cart: [], appliedCoupon: null, wishlist: [], recentlyViewed: [], sessionUserId: null }),
    }),
    {
      name: "gruham-demo-v4",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ toasts: _t, cartOpen: _c, ...rest }) => rest,
    },
  ),
);

export const useProduct = (idOrSlug: string | undefined) =>
  useStore((s) => s.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug));

export const useCurrentUser = () => useStore((s) => s.customers.find((c) => c.id === s.sessionUserId) ?? null);

/** Cart lines joined with products, plus all totals. */
export function useCartSummary() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const coupons = useStore((s) => s.coupons);
  const applied = useStore((s) => s.appliedCoupon);
  const lines = cart
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.productId)! }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((s, l) => s + priceOf(l.product) * l.qty, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.product.mrp * l.qty, 0);
  const coupon = coupons.find((c) => c.code === applied);
  const { discount, reason } = couponDiscount(coupon, lines);
  const shipping = lines.length === 0 || subtotal - discount >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FEE;
  return {
    lines,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal,
    savings: mrpTotal - subtotal,
    coupon,
    couponInvalidReason: coupon && !discount ? reason : "",
    discount,
    shipping,
    total: subtotal - discount + shipping,
  };
}
