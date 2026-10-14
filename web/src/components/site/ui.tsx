import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { ArrowRight, Minus, Plus, Star } from "@phosphor-icons/react";
import { discountPct, money } from "../../lib/format";

/*
  Storefront UI kit (dark forest green and antique gold).
  Shape rule: buttons, inputs, cards and images are near-square (2px); only icon buttons and chips are round.
  Buttons carry tracked uppercase labels.
*/

type Variant = "primary" | "secondary" | "ghost" | "link";

const base =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-[2px] px-7 text-[0.72rem] font-medium uppercase tracking-[0.2em] whitespace-nowrap transition-[background-color,color,border-color,transform] duration-300 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  primary: "gold-fill border border-brand text-on-brand hover:bg-none hover:bg-transparent hover:text-gold-light",
  secondary: "border border-brand/80 text-fg hover:bg-brand hover:text-on-brand",
  ghost: "border border-fg/35 text-fg hover:border-brand hover:text-brand",
  link: "!min-h-0 !px-0 !tracking-[0.16em] text-fg underline decoration-brand/50 underline-offset-[6px] hover:text-brand hover:decoration-brand",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; trail?: boolean }>(
  function Button({ variant = "primary", trail: _trail, className = "", ...rest }, ref) {
    return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...rest} />;
  },
);

export function ButtonLink({ variant = "primary", trail: _trail, className = "", ...rest }: LinkProps & { variant?: Variant; trail?: boolean }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

/** Thin long arrow used after button labels. */
export function LongArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 12" aria-hidden="true" className={`h-3 w-7 shrink-0 fill-none stroke-current transition-transform duration-300 group-hover:translate-x-1 ${className}`} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6h27M23 1.5 28 6l-5 4.5" />
    </svg>
  );
}

export function IconButton({ label, children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`relative grid size-11 place-items-center rounded-full text-fg transition-colors hover:bg-paper-2 hover:text-brand active:scale-95 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Price({ mrp, sale, size = "md" }: { mrp: number; sale?: number; size?: "md" | "lg" }) {
  const off = discountPct(mrp, sale);
  const big = size === "lg";
  return (
    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 tabular">
      <span className={big ? "font-display text-[1.8rem] text-gold-light" : "text-[0.95rem] font-semibold text-gold-light"}>{money(sale ?? mrp)}</span>
      {off > 0 && (
        <>
          <span className={`text-fg-3 line-through ${big ? "text-base" : "text-[0.8rem]"}`}>{money(mrp)}</span>
          <span className={`font-medium uppercase tracking-[0.12em] text-brand ${big ? "text-[0.8rem]" : "text-[0.66rem]"}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}

export function Stars({ rating, reviews, size = 13 }: { rating: number; reviews?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8rem] text-fg-2" aria-label={`Rated ${rating.toFixed(1)} out of 5${reviews !== undefined ? `, ${reviews} reviews` : ""}`}>
      <span className="inline-flex items-center gap-px" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} weight={rating >= i - 0.25 ? "fill" : "regular"} className={rating >= i - 0.75 ? "text-gold" : "text-hair-2"} />
        ))}
      </span>
      <span className="font-semibold text-fg tabular">{rating.toFixed(1)}</span>
      {reviews !== undefined && <span className="tabular">({reviews})</span>}
    </span>
  );
}

export function QtyStepper({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: number; label: string }) {
  return (
    <div className="inline-flex h-12 items-center rounded-[2px] border border-hair-2 bg-paper" role="group" aria-label={label}>
      <button className="grid h-full w-10 place-items-center transition-colors hover:text-brand disabled:opacity-35" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular" aria-live="polite">
        {value}
      </span>
      <button className="grid h-full w-10 place-items-center transition-colors hover:text-brand disabled:opacity-35" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={14} />
      </button>
    </div>
  );
}

const inputCls =
  "w-full min-h-12 rounded-[2px] border border-hair-2 bg-paper px-4 py-3 text-fg placeholder:text-fg-3 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 aria-[invalid=true]:border-error";
const labelCls = "text-[0.68rem] font-medium uppercase tracking-[0.18em] text-fg-2";

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, id, className = "", ...rest }, ref) {
    const fid = id ?? `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label htmlFor={fid} className={labelCls}>
          {label}
        </label>
        <input ref={ref} id={fid} aria-invalid={!!error} aria-describedby={error ? `${fid}-err` : hint ? `${fid}-hint` : undefined} className={inputCls} {...rest} />
        {hint && !error && (
          <p id={`${fid}-hint`} className="text-xs text-fg-3">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${fid}-err`} className="text-sm text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);

export function SelectField({ label, children, id, className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const fid = id ?? `s-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={fid} className={labelCls}>
        {label}
      </label>
      <select
        id={fid}
        className={`${inputCls} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%23c9a35f%22 fill=%22none%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

/** Gold hairline, diamond, gold hairline. */
export function DiamondRule({ className = "" }: { className?: string }) {
  return (
    <div className={`diamond-rule ${className}`} aria-hidden="true">
      <i />
    </div>
  );
}

/** Section heading. `center` stacks eyebrow, uppercase title and diamond rule, as on the home page. */
export function SectionHead({ title, eyebrow, children, action, center = false }: { title: string; eyebrow?: string; children?: ReactNode; action?: ReactNode; center?: boolean }) {
  if (center) {
    return (
      <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="max-w-[22ch] font-display text-[1.9rem] uppercase leading-[1.1] tracking-[0.03em] text-fg sm:text-[2.6rem] lg:text-[3.1rem]">{title}</h2>
        <DiamondRule className="mt-5" />
        {children && <p className="mt-5 max-w-[56ch] font-accent text-[1.2rem] leading-snug text-fg-2 sm:text-[1.4rem]">{children}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    );
  }
  return (
    <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[52ch]">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="font-display text-[1.75rem] leading-[1.12] text-fg sm:text-[2.1rem] lg:text-[2.5rem]">{title}</h2>
        <div className="mt-4 h-px w-14 bg-gradient-to-r from-brand to-transparent" aria-hidden="true" />
        {children && <p className="mt-4 font-accent text-[1.15rem] leading-snug text-fg-2 sm:text-[1.25rem]">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="group inline-flex min-h-11 items-center gap-3 self-start text-[0.7rem] font-medium uppercase tracking-[0.22em] text-fg transition-colors hover:text-brand sm:self-auto">
      {children}
      <ArrowRight size={16} weight="light" className="text-brand transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      <div className="zari-rule w-28" />
      <h2 className="font-display text-[1.9rem] text-fg">{title}</h2>
      <p className="font-accent text-[1.2rem] leading-snug text-fg-2">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.66rem] uppercase tracking-[0.18em] text-fg-3">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            {it.to ? (
              <Link to={it.to} className="hover:text-brand">
                {it.label}
              </Link>
            ) : (
              <span className="text-fg-2" aria-current="page">
                {it.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true" className="text-brand/60">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Badge({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "brand" | "gold" | "dark" }) {
  const t = {
    light: "border border-hair-2 bg-page/85 text-fg backdrop-blur-sm",
    brand: "gold-fill text-on-brand",
    gold: "border border-brand/70 bg-brand-deep/80 text-gold-light backdrop-blur-sm",
    dark: "bg-void/85 text-fg-2",
  }[tone];
  return <span className={`inline-flex items-center rounded-[2px] px-2.5 py-1.5 text-[0.6rem] font-medium uppercase leading-none tracking-[0.18em] ${t}`}>{children}</span>;
}

/** Checkout progress: Bag > Details & payment > Confirmation. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Bag", "Address & payment", "Confirmation"];
  return (
    <ol className="mb-8 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.14em] sm:gap-3 sm:text-[0.72rem]" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const now = n === current;
        return (
          <li key={s} className="flex items-center gap-2 sm:gap-3" aria-current={now ? "step" : undefined}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[0.72rem] font-semibold ${done || now ? "bg-brand text-on-brand" : "border border-hair-2 text-fg-3"}`}>{done ? "✓" : n}</span>
            <span className={`whitespace-nowrap ${now ? "font-semibold text-fg" : done ? "text-fg-2" : "text-fg-3"}`}>{s}</span>
            {n < steps.length && <span className="h-px w-5 bg-hair-2 sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
