import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle, EnvelopeSimple, InstagramLogo, Phone, WarningCircle, WhatsappLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useStore } from "../../store/useStore";
import { brandMark } from "../../lib/cloudinary";
import { resetScroll, startSmoothScroll, stopSmoothScroll } from "../../lib/smoothScroll";
import { Header } from "./Header";
import { CartDrawer } from "./CartDrawer";
import { DiamondRule } from "./ui";

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
    <footer className="surface-deep border-t border-hair text-fg">
      {/* Closing line */}
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-14 pt-20 text-center">
        <p className="text-[0.78rem] font-medium uppercase tracking-[0.5em] text-fg sm:text-[0.9rem]">Silk, chosen by hand</p>
        <p className="mt-3 text-[0.62rem] font-medium uppercase tracking-[0.5em] text-brand">Draped with care</p>
        <span aria-hidden="true" className="my-8 block h-14 w-px bg-gradient-to-b from-brand to-transparent" />
        <p className="font-display text-[1.05rem] leading-relaxed text-fg-2 sm:text-[1.15rem]">
          Woven on small looms. Shown on the drape before it ships.
          <br />
          Thank you for letting us be part of your occasions.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-x-8 gap-y-12 border-t border-hair px-4 py-14 sm:px-6 md:grid-cols-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.4fr] lg:px-10">
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <img src={brandMark(64)} alt="" className="size-20 rounded-full ring-1 ring-brand/60" />
            <span className="font-display text-[1.6rem] tracking-[0.5em] pl-[0.5em] text-gold-light">GRUHAM</span>
            <DiamondRule className="[&::after]:w-10 [&::before]:w-10" />
          </Link>
          <p className="mt-5 max-w-[34ch] text-[0.88rem] leading-relaxed text-fg-2">
            Silk sarees, half sarees and artificial jewellery, chosen by hand and shown on the drape. Studio visits by appointment.
          </p>
          <ul className="mt-5 space-y-2 text-[0.85rem] text-fg-2">
            <li className="flex items-center gap-2.5">
              <Phone size={16} weight="light" className="text-brand" /> +91 98412 40000 (10 am to 8 pm)
            </li>
            <li className="flex items-center gap-2.5">
              <EnvelopeSimple size={16} weight="light" className="text-brand" /> care@gruham.in
            </li>
          </ul>
          <p className="mt-6 font-accent text-[1.6rem] leading-none text-gold-light">Draped with love</p>
          <span aria-hidden="true" className="mt-3 block h-px w-28 bg-gradient-to-r from-brand to-transparent" />
        </div>

        <FooterCol title="Shop">
          {categories.slice(0, 7).map((c) => (
            <FooterLink key={c.id} to={`/shop?category=${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="Help">
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

        <div className="col-span-2 md:col-span-1">
          <FooterHeading>Stay in touch</FooterHeading>
          <p className="text-[0.88rem] leading-relaxed text-fg-2">One email when a new set arrives, usually twice a month. Get ₹750 off your first order.</p>
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setState(/^\S+@\S+\.\S+$/.test(email) ? "done" : "error");
            }}
            className="mt-5"
          >
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <div className="flex items-center rounded-full border border-hair-2 bg-page/40 p-1.5 pl-5 transition-colors focus-within:border-brand">
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setState("idle");
                }}
                aria-invalid={state === "error"}
                className="min-h-10 min-w-0 flex-1 bg-transparent text-[0.88rem] text-fg placeholder:text-fg-3 focus:outline-none"
                placeholder="Your email address"
              />
              <button aria-label="Subscribe" className="gold-fill grid size-10 shrink-0 place-items-center rounded-full text-on-brand transition-transform hover:scale-105 active:scale-95">
                <ArrowRight size={17} />
              </button>
            </div>
            {state === "done" && <p className="mt-2 text-sm text-success">Subscribed. Your code FIRSTDRAPE is on its way.</p>}
            {state === "error" && <p className="mt-2 text-sm text-error">Enter an email like name@example.com.</p>}
          </form>
          <div className="mt-6 flex gap-2.5">
            {[
              { Icon: InstagramLogo, label: "Instagram" },
              { Icon: YoutubeLogo, label: "YouTube" },
              { Icon: WhatsappLogo, label: "WhatsApp" },
            ].map(({ Icon, label }) => (
              <a key={label} href="#" onClick={(e) => e.preventDefault()} aria-label={label} className="grid size-11 place-items-center rounded-full border border-hair-2 text-fg transition-colors hover:border-brand hover:bg-brand hover:text-on-brand">
                <Icon size={18} weight="light" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-hair">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-2" aria-label="Payment methods accepted">
            {payments.map((p) => (
              <span key={p.slug} className="grid h-8 w-12 place-items-center rounded-[2px] border border-hair bg-page/40" title={p.label}>
                <img src={`https://cdn.simpleicons.org/${p.slug}/d9c08a`} alt={p.label} className="h-4 w-auto max-w-9" loading="lazy" />
              </span>
            ))}
            {["UPI", "RuPay", "COD"].map((t) => (
              <span key={t} className="grid h-8 place-items-center rounded-[2px] border border-hair bg-page/40 px-2.5 text-[0.62rem] font-semibold tracking-[0.14em] text-fg-2">
                {t}
              </span>
            ))}
          </div>
          <p className="text-[0.72rem] tracking-[0.04em] text-fg-3">© 2026 Gruham Sarees & Jewellery Studio. Demo store: orders and payments are simulated.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-fg">
      {children}
      <span aria-hidden="true" className="mt-3 block h-px w-6 bg-brand" />
    </h3>
  );
}
function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link to={to} className="inline-flex min-h-9 items-center font-display text-[0.98rem] text-fg-2 transition-colors hover:text-gold-light">
        {children}
      </Link>
    </li>
  );
}
function FooterText({ children }: { children: React.ReactNode }) {
  return <li className="flex min-h-9 items-center font-display text-[0.98rem] text-fg-2">{children}</li>;
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
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-[2px] border border-hair-2 bg-paper-2 px-5 py-3 text-left text-sm text-fg shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)]"
          >
            {t.tone === "error" ? <WarningCircle size={18} className="shrink-0 text-error" /> : <CheckCircle size={18} className="shrink-0 text-brand" />}
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
    <div className="flex min-h-[100dvh] flex-col overflow-x-clip bg-page text-fg [color-scheme:dark]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-[2px] focus:bg-brand focus:px-4 focus:py-2 focus:text-on-brand">
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
