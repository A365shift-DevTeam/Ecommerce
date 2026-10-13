import { forwardRef, useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretDown, CaretUp, MagnifyingGlass, X } from "@phosphor-icons/react";

/* Chart palette, validated with the dataviz checker on the white admin surface. */
export const CHART = { saree: "#008a7e", jewellery: "#b8762e", grid: "#e6e9e7", axis: "#77817d" };

type BtnVariant = "primary" | "secondary" | "danger" | "ghost";
const btnBase = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none";
const btnV: Record<BtnVariant, string> = {
  primary: "bg-peacock text-white hover:bg-[#1d5a56]",
  secondary: "border border-rule bg-white text-ink hover:border-ink-3",
  danger: "bg-[#b4232f] text-white hover:bg-[#961b26]",
  ghost: "text-ink-2 hover:bg-desk",
};

export const Btn = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }>(function Btn({ variant = "primary", className = "", ...rest }, ref) {
  return <button ref={ref} className={`${btnBase} ${btnV[variant]} ${className}`} {...rest} />;
});

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[1.6rem] font-bold tracking-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-ink-3">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className = "", pad = true }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`rounded-[12px] border border-rule bg-sheet ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3.5">
          {title && <h2 className="text-[0.95rem] font-semibold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, delta, note }: { label: string; value: string; delta?: number; note?: string }) {
  return (
    <div className="rounded-[12px] border border-rule bg-sheet p-5">
      <p className="text-sm text-ink-3">{label}</p>
      <p className="mt-2 text-[1.75rem] font-bold tracking-tight text-ink tabular">{value}</p>
      <p className="mt-1 text-xs text-ink-3 tabular">
        {delta !== undefined && Number.isFinite(delta) && (
          <span className={`mr-1 font-semibold ${delta >= 0 ? "text-[#0f7a52]" : "text-[#b4232f]"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {note}
      </p>
    </div>
  );
}

const tones = {
  green: "bg-[#e3f4ec] text-[#0f6b48]",
  amber: "bg-[#fbf0dc] text-[#8a5a0b]",
  red: "bg-[#fbe5e6] text-[#9c1c27]",
  blue: "bg-[#e4eefb] text-[#1f4f8f]",
  teal: "bg-[#dff1ef] text-[#1d5a56]",
  gray: "bg-[#eceeed] text-ink-2",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export const orderTone = (s: string): Tone =>
  ({ placed: "blue", packed: "teal", shipped: "teal", out_for_delivery: "amber", delivered: "green", cancelled: "red" })[s] as Tone ?? "gray";
export const payTone = (s: string): Tone => ({ paid: "green", pending: "amber", refunded: "gray", failed: "red" })[s] as Tone ?? "gray";

const inputBase = "w-full rounded-[8px] border border-rule bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-peacock focus:outline-none focus:ring-2 focus:ring-peacock/15 aria-[invalid=true]:border-[#b4232f]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }>(function Input({ label, error, hint, id, className = "", ...rest }, ref) {
  const fid = id ?? (label ? `ai-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fid} className="text-[0.8rem] font-semibold text-ink-2">
          {label}
        </label>
      )}
      <input ref={ref} id={fid} aria-invalid={!!error} className={inputBase} {...rest} />
      {hint && !error && <p className="text-xs text-ink-3">{hint}</p>}
      {error && <p className="text-xs text-[#b4232f]">{error}</p>}
    </div>
  );
});

export function Textarea({ label, id, className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const fid = id ?? `at-${label.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fid} className="text-[0.8rem] font-semibold text-ink-2">
        {label}
      </label>
      <textarea id={fid} className={`${inputBase} min-h-28 leading-relaxed`} {...rest} />
    </div>
  );
}

export function Select({ label, id, className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  const fid = id ?? (label ? `as-${label.replace(/\W+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fid} className="text-[0.8rem] font-semibold text-ink-2">
          {label}
        </label>
      )}
      <select id={fid} className={`${inputBase} pr-8`} {...rest}>
        {children}
      </select>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
      <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputBase} pl-9`} />
    </div>
  );
}

export function Toggle({ checked, onChange, label, showLabel = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; showLabel?: boolean }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-peacock" : "bg-[#c9cfcc]"}`}
      >
        <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
      {showLabel && label}
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { v: T; label: string; count?: number }[] }) {
  return (
    <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-rule">
      {items.map((it) => (
        <button
          key={it.v}
          role="tab"
          aria-selected={value === it.v}
          onClick={() => onChange(it.v)}
          className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${value === it.v ? "border-peacock text-ink" : "border-transparent text-ink-3 hover:text-ink"}`}
        >
          {it.label}
          {it.count !== undefined && <span className="ml-1.5 rounded-full bg-desk px-1.5 text-xs tabular text-ink-3">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function SortTh({ label, k, sort, setSort, className = "" }: { label: string; k: string; sort: { k: string; dir: 1 | -1 }; setSort: (s: { k: string; dir: 1 | -1 }) => void; className?: string }) {
  const active = sort.k === k;
  return (
    <th scope="col" className={`px-4 py-2.5 font-semibold ${className}`} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => setSort({ k, dir: active ? (sort.dir === 1 ? -1 : 1) : -1 })} className="inline-flex items-center gap-1 hover:text-ink">
        {label}
        {active && (sort.dir === 1 ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />)}
      </button>
    </th>
  );
}

export const tableCls = "w-full min-w-[720px] text-left text-sm";
export const theadCls = "border-b border-rule bg-desk/60 text-xs text-ink-3";
export const rowCls = "border-b border-rule last:border-0 hover:bg-desk/50";

export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[14px] bg-white sm:rounded-[14px] ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-white px-5 py-3.5">
              <h2 className="font-semibold text-ink">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-desk">
                <X size={16} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-3">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ChartTooltip({ active, payload, label, fmt }: { active?: boolean; payload?: { name: string; value: number; color: string; dataKey: string }[]; label?: string; fmt: (n: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-rule bg-white px-3 py-2 text-xs shadow-[0_8px_24px_-12px_rgba(29,37,35,0.35)]">
      <p className="mb-1 font-semibold text-ink">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-ink-2 tabular">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-ink">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}
