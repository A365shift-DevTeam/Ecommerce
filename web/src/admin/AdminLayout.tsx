import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { ChartBar, ChartLineUp, Package, Receipt, SquaresFour, Stack, Storefront, Tag, Users, List, X, ArrowCounterClockwise } from "@phosphor-icons/react";
import { brandMark } from "../lib/cloudinary";
import { useStore } from "../store/useStore";
import { Toasts } from "../components/site/Footer";

const nav = [
  { to: "/admin", label: "Dashboard", Icon: SquaresFour, end: true },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: Receipt },
  { to: "/admin/catalog", label: "Catalog & inventory", Icon: Stack },
  { to: "/admin/customers", label: "Customers", Icon: Users },
  { to: "/admin/promotions", label: "Promotions", Icon: Tag },
  { to: "/admin/reports", label: "Reports", Icon: ChartLineUp },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const resetDemo = useStore((s) => s.resetDemo);
  const toast = useStore((s) => s.toast);
  const pending = orders.filter((o) => o.status === "placed").length;
  const low = products.filter((p) => p.stock <= 3).length;

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.colorScheme = "light";
    document.body.style.background = "var(--color-desk)";
    return () => {
      document.documentElement.style.colorScheme = "";
      document.body.style.background = "";
    };
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="flex items-center gap-2.5 px-5 py-5">
        <img src={brandMark(36)} alt="" className="size-9 rounded-full" />
        <span className="leading-tight">
          <span className="block font-display text-lg tracking-[0.18em] text-ink">GRUHAM</span>
          <span className="block text-[0.7rem] text-ink-3">Store admin</span>
        </span>
      </Link>
      <nav aria-label="Admin" className="flex flex-col gap-0.5 px-3">
        {nav.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? "bg-peacock text-white" : "text-ink-2 hover:bg-desk hover:text-ink"}`}
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {label === "Orders" && pending > 0 && <span className="rounded-full bg-[#fbf0dc] px-1.5 text-xs font-semibold text-[#8a5a0b] tabular">{pending}</span>}
            {label === "Catalog & inventory" && low > 0 && <span className="rounded-full bg-[#fbe5e6] px-1.5 text-xs font-semibold text-[#9c1c27] tabular">{low}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto space-y-1 border-t border-rule p-3">
        <Link to="/" className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm text-ink-2 hover:bg-desk">
          <Storefront size={18} /> View storefront
        </Link>
        <button
          onClick={() => {
            if (confirm("Reset all demo data? Products, orders and customers go back to the starting set.")) {
              resetDemo();
              toast("Demo data reset");
            }
          }}
          className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm text-ink-2 hover:bg-desk"
        >
          <ArrowCounterClockwise size={18} /> Reset demo data
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-root min-h-[100dvh] bg-desk text-ink" style={{ colorScheme: "light" }}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-rule bg-sheet lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sheet shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-5 grid size-9 place-items-center rounded-full hover:bg-desk">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-rule bg-sheet/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="grid size-9 place-items-center rounded-full hover:bg-desk lg:hidden">
            <List size={20} />
          </button>
          <p className="flex items-center gap-2 text-sm text-ink-3">
            <ChartBar size={16} className="hidden sm:block" /> Demo mode. Changes save in this browser and show on the storefront straight away.
          </p>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-maroon text-xs font-bold text-ivory">SR</span>
            <span className="hidden text-sm leading-tight sm:block">
              <span className="block font-semibold">Sudha Ramanathan</span>
              <span className="block text-xs text-ink-3">Store manager</span>
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
      <Toasts light />
    </div>
  );
}
