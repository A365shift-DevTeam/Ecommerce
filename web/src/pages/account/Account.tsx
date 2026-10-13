import { useState } from "react";
import { Link, NavLink, Navigate, Outlet, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Heart, MapPin, Package, SignOut, User, ClockCounterClockwise, Trash, PencilSimple } from "@phosphor-icons/react";
import { useCurrentUser, useStore } from "../../store/useStore";
import type { Address } from "../../data/types";
import { demoShopper } from "../../data/seed";
import { img } from "../../lib/cloudinary";
import { money, shortDate, uid } from "../../lib/format";
import { Button, ButtonLink, Container, EmptyState, Field, SelectField } from "../../components/site/ui";
import { ProductCard } from "../../components/site/ProductCard";
import { OrderTimeline, statusLabel } from "./OrderTimeline";

const tabs = [
  { to: "/account", label: "Profile", Icon: User, end: true },
  { to: "/account/orders", label: "Orders", Icon: Package },
  { to: "/account/addresses", label: "Addresses", Icon: MapPin },
  { to: "/account/wishlist", label: "Wishlist", Icon: Heart },
  { to: "/account/recent", label: "Recently viewed", Icon: ClockCounterClockwise },
];

/** Wishlist and recently viewed work signed out; everything else asks you to sign in. */
export function AccountLayout({ publicTab = false }: { publicTab?: boolean }) {
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  if (!user && !publicTab) return <AuthPage />;
  return (
    <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <h1 className="font-display text-[2.2rem] md:text-[3rem]">{user ? `Hello, ${user.name.split(" ")[0]}` : "Your saved pieces"}</h1>
        {user ? (
          <button onClick={logout} className="inline-flex items-center gap-2 self-start text-sm text-fg-2 hover:text-brand md:self-auto">
            <SignOut size={16} /> Sign out
          </button>
        ) : (
          <Link to="/account" className="text-sm text-brand underline underline-offset-4">
            Sign in to see orders and addresses
          </Link>
        )}
      </div>
      <nav aria-label="Account" className="no-scrollbar -mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-hair px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `-mb-px inline-flex shrink-0 items-center gap-2 border-b px-3 py-3 text-sm transition-colors ${isActive ? "border-brand text-fg" : "border-transparent text-fg-2 hover:text-fg"}`}
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="pt-10">
        <Outlet />
      </div>
    </Container>
  );
}

function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (mode === "register" && form.name.trim().length < 2) er.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = "Enter an email like name@example.com.";
    if (mode === "register" && form.phone.replace(/\D/g, "").length < 10) er.phone = "Enter a 10-digit mobile number.";
    if (form.password.length < 6) er.password = "Use at least 6 characters.";
    setErrors(er);
    if (Object.keys(er).length) return;
    const r = mode === "login" ? login(form.email, form.password) : register(form);
    if (!r.ok) {
      setFormError(r.message);
      return;
    }
    toast(r.message);
    if (next) navigate(next);
  };

  return (
    <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[var(--radius-panel)] border border-hair md:grid-cols-2">
        <div className="relative hidden md:block">
          <img src={img("halfsaree-lavender-peacock", 1000)} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <p className="absolute bottom-8 left-8 right-8 font-display text-2xl leading-snug text-white">Your orders, addresses and saved sarees in one place.</p>
        </div>
        <div className="bg-paper p-6 sm:p-10">
          <h1 className="font-display text-[2rem]">{mode === "login" ? "Sign in" : "Create an account"}</h1>
          <p className="mt-2 text-sm text-fg-2">
            {mode === "login" ? "New to Gruham? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErrors({});
                setFormError("");
              }}
              className="text-brand underline underline-offset-4"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <form noValidate onSubmit={submit} className="mt-8 flex flex-col gap-4">
            {mode === "register" && <Field label="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />}
            <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
            {mode === "register" && <Field label="Mobile number" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} />}
            <Field label="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
            {formError && <p role="alert" className="text-sm text-error">{formError}</p>}
            <Button type="submit" className="mt-2 w-full">
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>
          {mode === "login" && (
            <div className="mt-8 rounded-[10px] border border-dashed border-hair-2 p-4 text-sm text-fg-2">
              <p className="font-semibold text-fg">Demo shopper</p>
              <p className="mt-1">
                {demoShopper.email} / {demoShopper.password}
              </p>
              <button onClick={() => setForm({ ...form, email: demoShopper.email, password: demoShopper.password })} className="mt-2 text-brand underline underline-offset-4">
                Fill in demo details
              </button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export function ProfileTab() {
  const user = useCurrentUser()!;
  const update = useStore((s) => s.updateProfile);
  const toast = useStore((s) => s.toast);
  const orders = useStore((s) => s.orders);
  const mine = orders.filter((o) => o.customerId === user.id);
  const [form, setForm] = useState({ name: user.name, email: user.email, phone: user.phone, city: user.city });
  const spent = mine.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <form
        className="grid gap-4 sm:grid-cols-2 lg:col-span-7"
        onSubmit={(e) => {
          e.preventDefault();
          update(form);
          toast("Profile saved");
        }}
      >
        <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="sm:col-span-2" />
        <Field label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Field label="Mobile number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Field label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <div className="flex items-end">
          <Button type="submit" trail={false}>Save profile</Button>
        </div>
      </form>
      <dl className="grid grid-cols-2 gap-6 self-start border-t border-hair pt-6 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
        <div>
          <dt className="text-sm text-fg-2">Orders</dt>
          <dd className="mt-1 font-display text-3xl tabular">{mine.length}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-2">Spent with us</dt>
          <dd className="mt-1 font-display text-3xl tabular">{money(spent)}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-2">Member since</dt>
          <dd className="mt-1">{shortDate(user.joinedAt)}</dd>
        </div>
        <div>
          <dt className="text-sm text-fg-2">Saved addresses</dt>
          <dd className="mt-1">{user.addresses.length}</dd>
        </div>
      </dl>
    </div>
  );
}

export function OrdersTab() {
  const user = useCurrentUser()!;
  const orders = useStore((s) => s.orders);
  const mine = orders.filter((o) => o.customerId === user.id);
  if (!mine.length) return <EmptyState title="No orders yet" body="When you place an order, it shows up here with live tracking." action={<ButtonLink to="/shop">Browse the shop</ButtonLink>} />;
  return (
    <ul className="divide-y divide-hair border-y border-hair">
      {mine.map((o) => (
        <li key={o.id}>
          <Link to={`/account/orders/${o.id}`} className="flex flex-col gap-3 py-5 hover:bg-paper sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((it, i) => (
                <img key={i} src={img(it.image, 120)} alt="" className="h-14 w-11 rounded-[4px] object-cover ring-2 ring-page" />
              ))}
            </div>
            <div className="flex-1 sm:pl-3">
              <p className="font-semibold">{o.number}</p>
              <p className="text-sm text-fg-2">
                {shortDate(o.createdAt)}, {o.items.reduce((n, i) => n + i.qty, 0)} items
              </p>
            </div>
            <span className={`text-sm ${o.status === "delivered" ? "text-success" : o.status === "cancelled" ? "text-error" : "text-brand"}`}>{statusLabel[o.status]}</span>
            <span className="tabular font-semibold sm:w-28 sm:text-right">{money(o.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrderDetailTab() {
  const { id } = useParams();
  const user = useCurrentUser()!;
  const order = useStore((s) => s.orders.find((o) => o.id === id && o.customerId === user.id));
  if (!order) return <Navigate to="/account/orders" replace />;
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Link to="/account/orders" className="text-sm text-fg-2 hover:text-brand">
          All orders
        </Link>
        <h2 className="mt-2 font-display text-2xl">Order {order.number}</h2>
        <p className="text-sm text-fg-2">
          Placed {shortDate(order.createdAt)}. {order.status !== "delivered" && order.status !== "cancelled" ? `Expected by ${shortDate(order.estimatedDelivery)}.` : ""}
        </p>
        <div className="mt-8">
          <OrderTimeline order={order} />
        </div>
        <ul className="mt-8 divide-y divide-hair border-y border-hair">
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
      </div>
      <aside className="space-y-6 text-sm lg:col-span-4">
        <div className="rounded-[var(--radius-panel)] border border-hair p-5">
          <p className="font-semibold">Delivery address</p>
          <p className="mt-2 text-fg-2">
            {order.address.name}
            <br />
            {order.address.line1}
            <br />
            {order.address.city}, {order.address.state} {order.address.pincode}
            <br />
            {order.address.phone}
          </p>
        </div>
        <dl className="space-y-2 rounded-[var(--radius-panel)] border border-hair p-5 tabular">
          <div className="flex justify-between"><dt className="text-fg-2">Subtotal</dt><dd>{money(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between"><dt className="text-fg-2">Coupon</dt><dd className="text-success">−{money(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-fg-2">Shipping</dt><dd>{order.shipping ? money(order.shipping) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-hair pt-2 font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-2">{order.paymentMethod}</dt><dd className="capitalize">{order.paymentStatus}</dd></div>
        </dl>
      </aside>
    </div>
  );
}

export function AddressesTab() {
  const user = useCurrentUser()!;
  const save = useStore((s) => s.saveAddress);
  const del = useStore((s) => s.deleteAddress);
  const toast = useStore((s) => s.toast);
  const blank: Address = { id: "", label: "Home", name: user.name, phone: user.phone, line1: "", line2: "", city: "", state: "Tamil Nadu", pincode: "" };
  const [editing, setEditing] = useState<Address | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-7">
        {user.addresses.map((a) => (
          <div key={a.id} className="rounded-[var(--radius-panel)] border border-hair p-5 text-sm">
            <p className="font-semibold">
              {a.label} {a.isDefault && <span className="ml-2 text-xs font-normal text-brand">Default</span>}
            </p>
            <p className="mt-2 text-fg-2">
              {a.name}, {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
            </p>
            <div className="mt-4 flex gap-4">
              <button onClick={() => setEditing(a)} className="inline-flex items-center gap-1.5 text-fg-2 hover:text-brand"><PencilSimple size={14} /> Edit</button>
              <button onClick={() => { del(a.id); toast("Address removed"); }} className="inline-flex items-center gap-1.5 text-fg-2 hover:text-error"><Trash size={14} /> Remove</button>
              {!a.isDefault && <button onClick={() => save({ ...a, isDefault: true })} className="text-fg-2 hover:text-brand">Make default</button>}
            </div>
          </div>
        ))}
        {user.addresses.length === 0 && <p className="text-fg-2">No saved addresses yet. Add one and checkout will fill it in for you.</p>}
        {!editing && (
          <button onClick={() => setEditing({ ...blank, id: "" })} className="rounded-[var(--radius-panel)] border border-dashed border-hair-2 p-5 text-left text-sm text-fg-2 hover:border-brand hover:text-fg">
            Add a new address
          </button>
        )}
      </div>
      {editing && (
        <form
          noValidate
          className="grid gap-4 self-start sm:grid-cols-2 lg:col-span-5"
          onSubmit={(e) => {
            e.preventDefault();
            const er: Record<string, string> = {};
            if (editing.line1.trim().length < 5) er.line1 = "Enter the house number and street.";
            if (!editing.city.trim()) er.city = "Enter the city.";
            if (!/^[1-9]\d{5}$/.test(editing.pincode)) er.pincode = "Enter a 6-digit pincode.";
            setErr(er);
            if (Object.keys(er).length) return;
            save({ ...editing, id: editing.id || uid("a") });
            toast(editing.id ? "Address updated" : "Address saved");
            setEditing(null);
          }}
        >
          <h2 className="font-display text-xl sm:col-span-2">{editing.id ? "Edit address" : "New address"}</h2>
          <Field label="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <Field label="Phone" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
          <Field label="House, building and street" value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} error={err.line1} className="sm:col-span-2" />
          <Field label="City" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} error={err.city} />
          <Field label="Pincode" inputMode="numeric" maxLength={6} value={editing.pincode} onChange={(e) => setEditing({ ...editing, pincode: e.target.value.replace(/\D/g, "") })} error={err.pincode} />
          <SelectField label="Label" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })}>
            <option>Home</option>
            <option>Work</option>
            <option>Other</option>
          </SelectField>
          <label className="flex items-center gap-3 self-end pb-3 text-sm text-fg-2">
            <input type="checkbox" checked={!!editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
            Default address
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <Button type="submit" trail={false}>Save address</Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </form>
      )}
    </div>
  );
}

export function WishlistTab() {
  const wishlist = useStore((s) => s.wishlist);
  const products = useStore((s) => s.products);
  const list = wishlist.map((id) => products.find((p) => p.id === id && p.published)).filter(Boolean) as typeof products;
  if (!list.length) return <EmptyState title="Nothing saved yet" body="Tap the heart on any saree or piece of jewellery to keep it here." action={<ButtonLink to="/shop">Browse the shop</ButtonLink>} />;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
      {list.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function RecentTab() {
  const recent = useStore((s) => s.recentlyViewed);
  const products = useStore((s) => s.products);
  const list = recent.map((id) => products.find((p) => p.id === id && p.published)).filter(Boolean) as typeof products;
  if (!list.length) return <EmptyState title="You haven't looked at anything yet" body="Pieces you open will be listed here so you can find them again." action={<ButtonLink to="/shop">Browse the shop</ButtonLink>} />;
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
      {list.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
