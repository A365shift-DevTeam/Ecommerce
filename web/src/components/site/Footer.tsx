import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, EnvelopeSimple, InstagramLogo, Phone, WarningCircle, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import { brandMark } from "../../lib/cloudinary";
import { resetScroll, startSmoothScroll, stopSmoothScroll } from "../../lib/smoothScroll";
import { Header } from "./Header";
import { CartDrawer } from "./CartDrawer";

// Simple Icons slugs verified to exist; UPI and RuPay are not in Simple Icons, so they are shown as text.
const payments = [
  { slug: "visa", label: "Visa" },
  { slug: "mastercard", label: "Mastercard" },
  { slug: "americanexpress", label: "American Express" },
  { slug: "googlepay", label: "Google Pay" },
  { slug: "phonepe", label: "PhonePe" },
  { slug: "paytm", label: "Paytm" },
];

export function Footer() {
  const categories = useStore((s) => s.categories);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  return (
    <footer className="bg-brand-deep text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <h2 className="font-display text-[1.6rem] leading-tight">Be the first to see new weaves</h2>
            <p className="mt-1 text-[0.92rem] text-white/70">One email when a new set arrives, usually twice a month. Get ₹750 off your first order.</p>
          </div>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setState(/^\S+@\S+\.\S+$/.test(email) ? "done" : "error");
            }}
            className="w-full md:max-w-md"
          >
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setState("idle");
                }}
                aria-invalid={state === "error"}
                className="min-h-12 min-w-0 flex-1 rounded-lg border border-white/20 bg-white/10 px-4 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
                placeholder="Enter your email"
              />
              <button className="min-h-12 rounded-lg bg-white px-5 font-semibold text-brand-deep hover:bg-paper">Subscribe</button>
            </div>
            {state === "done" && <p className="mt-2 text-sm text-[#9ee0b8]">Subscribed. Your code FIRSTDRAPE is on its way.</p>}
            {state === "error" && <p className="mt-2 text-sm text-[#ffb4ab]">Enter an email like name@example.com.</p>}
          </form>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 lg:grid-cols-5 lg:px-10">
        <div className="col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-3">
            <img src={brandMark(44)} alt="" className="size-11 rounded-full" />
            <span className="font-display text-[1.4rem] tracking-[0.2em]">GRUHAM</span>
          </Link>
          <p className="mt-4 max-w-[36ch] text-[0.92rem] leading-relaxed text-white/70">
            Silk sarees, half sarees and artificial jewellery, chosen by hand and shown on the drape. Studio visits by appointment.
          </p>
          <ul className="mt-5 space-y-2 text-[0.9rem] text-white/80">
            <li className="flex items-center gap-2.5">
              <Phone size={16} /> +91 98412 40000 (10 am to 8 pm)
            </li>
            <li className="flex items-center gap-2.5">
              <EnvelopeSimple size={16} /> care@gruham.in
            </li>
          </ul>
          <div className="mt-5 flex gap-2">
            {[
              { Icon: InstagramLogo, label: "Instagram" },
              { Icon: YoutubeLogo, label: "YouTube" },
              { Icon: WhatsappLogo, label: "WhatsApp" },
            ].map(({ Icon, label }) => (
              <a key={label} href="#" onClick={(e) => e.preventDefault()} aria-label={label} className="grid size-11 place-items-center rounded-full border border-white/20 hover:bg-white hover:text-brand-deep">
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title="Shop">
          {categories.slice(0, 7).map((c) => (
            <FooterLink key={c.id} to={`/shop?category=${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Customer care">
          <FooterLink to="/account/orders">Track your order</FooterLink>
          <FooterLink to="/account">My account</FooterLink>
          <FooterLink to="/account/wishlist">Wishlist</FooterLink>
          <FooterText>Shipping in 3 to 6 days</FooterText>
          <FooterText>7-day saree exchange</FooterText>
          <FooterText>Blouse stitching</FooterText>
        </FooterCol>
        <FooterCol title="About">
          <FooterText>Our studio</FooterText>
          <FooterText>Video styling calls</FooterText>
          <FooterText>Saree care guide</FooterText>
          <FooterText>Privacy policy</FooterText>
          <FooterText>Terms of sale</FooterText>
          <FooterLink to="/admin">Admin demo</FooterLink>
        </FooterCol>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-2" aria-label="Payment methods accepted">
            {payments.map((p) => (
              <span key={p.slug} className="grid h-8 w-12 place-items-center rounded-md bg-white/10" title={p.label}>
                <img src={`https://cdn.simpleicons.org/${p.slug}/ffffff`} alt={p.label} className="h-4 w-auto max-w-9" loading="lazy" />
              </span>
            ))}
            <span className="grid h-8 place-items-center rounded-md bg-white/10 px-2.5 text-[0.7rem] font-bold tracking-wide">UPI</span>
            <span className="grid h-8 place-items-center rounded-md bg-white/10 px-2.5 text-[0.7rem] font-bold tracking-wide">RuPay</span>
            <span className="grid h-8 place-items-center rounded-md bg-white/10 px-2.5 text-[0.7rem] font-bold tracking-wide">COD</span>
          </div>
          <p className="text-[0.8rem] text-white/60">© 2026 Gruham Sarees & Jewellery Studio. Demo store: orders and payments are simulated.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[0.8rem] font-bold tracking-wide text-white">{title.toUpperCase()}</h3>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="inline-flex min-h-9 items-center text-[0.9rem] text-white/70 hover:text-white">
        {children}
      </Link>
    </li>
  );
}
function FooterText({ children }: { children: React.ReactNode }) {
  return <li className="flex min-h-9 items-center text-[0.9rem] text-white/70">{children}</li>;
}

export function Toasts({ light: _light = true }: { light?: boolean }) {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 md:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => dismiss(t.id)}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-lg bg-fg px-5 py-3 text-left text-sm text-white shadow-[0_18px_40px_-18px_rgba(36,22,25,0.6)]"
          >
            {t.tone === "error" ? <WarningCircle size={18} className="shrink-0 text-[#ffb4ab]" /> : <CheckCircle size={18} className="shrink-0 text-[#9ee0b8]" />}
            {t.text}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  useEffect(() => {
    startSmoothScroll();
    return stopSmoothScroll;
  }, []);
  useEffect(() => {
    resetScroll();
  }, [pathname]);
  return (
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip bg-page text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-fg focus:px-4 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toasts />
    </div>
  );
}
