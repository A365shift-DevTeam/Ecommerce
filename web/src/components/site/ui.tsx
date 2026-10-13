import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Minus, Plus, Star } from "@phosphor-icons/react";
import { discountPct, money } from "../../lib/format";

/*
  Storefront UI kit (light theme).
  Shape rule: buttons, inputs, cards and images use 8px corners; only chips and badges are pills.
*/

type Variant = "primary" | "secondary" | "ghost" | "link";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-6 text-[0.92rem] font-semibold whitespace-nowrap transition-[background-color,color,border-color,transform] duration-200 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none";
const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover",
  secondary: "border border-fg bg-page text-fg hover:bg-fg hover:text-white",
  ghost: "border border-hair-2 bg-page text-fg hover:border-fg",
  link: "!min-h-0 !px-0 text-fg underline decoration-hair-2 underline-offset-4 hover:decoration-fg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; trail?: boolean }>(
  function Button({ variant = "primary", trail: _trail, className = "", ...rest }, ref) {
    return <button ref={ref} className={`${base} ${variants[variant]} ${className}`} {...rest} />;
  },
);

export function ButtonLink({ variant = "primary", trail: _trail, className = "", ...rest }: LinkProps & { variant?: Variant; trail?: boolean }) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

export function IconButton({ label, children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`relative grid size-11 place-items-center rounded-full text-fg transition-colors hover:bg-paper active:scale-95 ${className}`}
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
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 tabular">
      <span className={big ? "text-[1.6rem] font-bold text-fg" : "text-[0.98rem] font-bold text-fg"}>{money(sale ?? mrp)}</span>
      {off > 0 && (
        <>
          <span className={`text-fg-3 line-through ${big ? "text-base" : "text-[0.82rem]"}`}>{money(mrp)}</span>
          <span className={`font-semibold text-success ${big ? "text-base" : "text-[0.82rem]"}`}>{off}% off</span>
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
    <div className="inline-flex h-11 items-center rounded-lg border border-hair-2 bg-page" role="group" aria-label={label}>
      <button className="grid h-full w-10 place-items-center rounded-l-lg hover:bg-paper disabled:opacity-35" onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <span className="w-9 text-center text-sm font-semibold tabular" aria-live="polite">
        {value}
      </span>
      <button className="grid h-full w-10 place-items-center rounded-r-lg hover:bg-paper disabled:opacity-35" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={14} />
      </button>
    </div>
  );
}

const inputCls =
  "w-full min-h-12 rounded-lg border border-hair-2 bg-page px-4 py-3 text-fg placeholder:text-fg-3 transition-colors focus:border-fg focus:outline-none focus:ring-2 focus:ring-fg/10 aria-[invalid=true]:border-error";

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, id, className = "", ...rest }, ref) {
    const fid = id ?? `f-${label.replace(/\W+/g, "-").toLowerCase()}`;
    return (
      <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={fid} className="text-[0.85rem] font-semibold text-fg">
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
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fid} className="text-[0.85rem] font-semibold text-fg">
        {label}
      </label>
      <select
        id={fid}
        className={`${inputCls} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%23241619%22 fill=%22none%22 stroke-width=%221.5%22/></svg>')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
        {...rest}
      >
        {children}
      </select>
    </div>
  );
}

export function SectionHead({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[52ch]">
        <h2 className="font-display text-[1.75rem] leading-[1.12] text-fg sm:text-[2.1rem] lg:text-[2.4rem]">{title}</h2>
        {children && <p className="mt-2 text-[0.95rem] leading-relaxed text-fg-2">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAll({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1.5 text-[0.92rem] font-semibold text-fg underline decoration-hair-2 underline-offset-4 hover:decoration-fg">
      {children}
    </Link>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      <div className="zari-rule w-16" />
      <h2 className="font-display text-2xl text-fg">{title}</h2>
      <p className="text-fg-2">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[0.82rem] text-fg-3">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-2">
            {it.to ? (
              <Link to={it.to} className="hover:text-fg">
                {it.label}
              </Link>
            ) : (
              <span className="text-fg-2" aria-current="page">
                {it.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Badge({ children, tone = "light" }: { children: ReactNode; tone?: "light" | "brand" | "gold" | "dark" }) {
  const t = {
    light: "bg-page text-fg",
    brand: "bg-brand text-white",
    gold: "bg-gold text-fg",
    dark: "bg-fg text-white",
  }[tone];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold leading-none tracking-wide shadow-[0_1px_2px_rgba(36,22,25,0.08)] ${t}`}>{children}</span>;
}

/** Checkout progress: Bag > Details & payment > Confirmation. */
export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Bag", "Address & payment", "Confirmation"];
  return (
    <ol className="mb-8 flex items-center gap-2 text-[0.8rem] sm:gap-3 sm:text-[0.88rem]" aria-label="Checkout progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const done = n < current;
        const now = n === current;
        return (
          <li key={s} className="flex items-center gap-2 sm:gap-3" aria-current={now ? "step" : undefined}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-[0.75rem] font-bold ${done || now ? "bg-brand text-white" : "border border-hair-2 text-fg-3"}`}>{done ? "✓" : n}</span>
            <span className={`whitespace-nowrap ${now ? "font-semibold text-fg" : done ? "text-fg-2" : "text-fg-3"}`}>{s}</span>
            {n < steps.length && <span className="h-px w-5 bg-hair-2 sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
