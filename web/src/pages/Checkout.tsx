import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { CreditCard, Bank, Money, QrCode, CircleNotch, LockSimple } from "@phosphor-icons/react";
import type { Address, Order } from "../data/types";
import { useCartSummary, useCurrentUser, useStore } from "../store/useStore";
import { uid } from "../lib/format";
import { Button, CheckoutSteps, Container, Field, SelectField } from "../components/site/ui";
import { OrderSummary } from "./Cart";

const states = ["Tamil Nadu", "Karnataka", "Kerala", "Telangana", "Andhra Pradesh", "Maharashtra", "Delhi", "Gujarat", "West Bengal", "Puducherry", "Other"];
const methods: { v: Order["paymentMethod"]; label: string; note: string; Icon: typeof CreditCard }[] = [
  { v: "UPI", label: "UPI", note: "GPay, PhonePe, Paytm or any UPI app", Icon: QrCode },
  { v: "Card", label: "Credit or debit card", note: "Visa, Mastercard, RuPay", Icon: CreditCard },
  { v: "Net banking", label: "Net banking", note: "All major Indian banks", Icon: Bank },
  { v: "Cash on delivery", label: "Cash on delivery", note: "Available up to ₹25,000", Icon: Money },
];

type Errors = Partial<Record<string, string>>;

export default function Checkout() {
  const summary = useCartSummary();
  const user = useCurrentUser();
  const placeOrder = useStore((s) => s.placeOrder);
  const saveAddress = useStore((s) => s.saveAddress);
  const navigate = useNavigate();

  const [contact, setContact] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ?? "" });
  const saved = user?.addresses ?? [];
  const [addrId, setAddrId] = useState<string>(saved.find((a) => a.isDefault)?.id ?? saved[0]?.id ?? "new");
  const [addr, setAddr] = useState<Omit<Address, "id">>({ label: "Home", name: "", phone: "", line1: "", line2: "", city: "", state: "Tamil Nadu", pincode: "" });
  const [saveNew, setSaveNew] = useState(true);
  const [method, setMethod] = useState<Order["paymentMethod"]>("UPI");
  const [upi, setUpi] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [placing, setPlacing] = useState(false);

  if (summary.lines.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const codBlocked = method === "Cash on delivery" && summary.total > 25000;

  function validate(): Errors {
    const e: Errors = {};
    if (contact.name.trim().length < 2) e.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(contact.email)) e.email = "Enter an email like name@example.com.";
    if (contact.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit mobile number.";
    if (addrId === "new") {
      if (addr.line1.trim().length < 5) e.line1 = "Enter the house number and street.";
      if (!addr.city.trim()) e.city = "Enter the city.";
      if (!/^[1-9]\d{5}$/.test(addr.pincode)) e.pincode = "Enter a 6-digit pincode.";
    }
    if (method === "UPI" && !/^[\w.-]+@[\w]+$/.test(upi)) e.upi = "Enter a UPI ID like name@okaxis.";
    if (method === "Card") {
      if (card.number.replace(/\s/g, "").length !== 16) e.card = "Enter the 16-digit card number.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) e.expiry = "Use MM/YY.";
      if (!/^\d{3}$/.test(card.cvv)) e.cvv = "3 digits.";
    }
    if (codBlocked) e.method = "Cash on delivery is available up to ₹25,000. Choose another way to pay.";
    return e;
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    setPlacing(true);
    const address: Address =
      addrId === "new" ? { ...addr, id: uid("a"), name: addr.name || contact.name, phone: addr.phone || contact.phone } : saved.find((a) => a.id === addrId)!;
    if (addrId === "new" && user && saveNew) saveAddress({ ...address, isDefault: saved.length === 0 });
    // Simulated payment round-trip
    setTimeout(() => {
      const order = placeOrder({ customer: contact, address, paymentMethod: method });
      navigate(`/order/${order.id}`, { replace: true });
    }, 1400);
  };

  return (
    <Container className="pb-24 pt-[calc(var(--nav-height)+1.5rem)] md:pt-[calc(var(--nav-height)+2.5rem)]">
      <CheckoutSteps current={2} />
      <h1 className="font-display text-[2rem] md:text-[2.6rem]">Checkout</h1>
      {!user && (
        <p className="mt-2 text-fg-2">
          Have an account?{" "}
          <Link to="/account?next=/checkout" className="text-brand underline underline-offset-4">
            Sign in
          </Link>{" "}
          to use saved addresses.
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-12">
        <form id="checkout-form" noValidate onSubmit={submit} className="flex flex-col gap-12 lg:col-span-7">
          <section aria-labelledby="h-contact">
            <h2 id="h-contact" className="mb-5 text-lg font-semibold">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" autoComplete="name" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} error={errors.name} className="sm:col-span-2" />
              <Field label="Email" type="email" autoComplete="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} error={errors.email} hint="Order updates go here." />
              <Field label="Mobile number" type="tel" autoComplete="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} error={errors.phone} hint="For the delivery partner." />
            </div>
          </section>

          <section aria-labelledby="h-addr">
            <h2 id="h-addr" className="mb-5 text-lg font-semibold">Delivery address</h2>
            {saved.length > 0 && (
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {saved.map((a) => (
                  <label key={a.id} className={`cursor-pointer rounded-[10px] border p-4 text-sm transition-colors ${addrId === a.id ? "border-brand bg-brand/5" : "border-hair-2 hover:border-brand/60"}`}>
                    <input type="radio" name="addr" className="sr-only" checked={addrId === a.id} onChange={() => setAddrId(a.id)} />
                    <span className="font-semibold text-fg">{a.label}</span>
                    <span className="mt-1 block text-fg-2">
                      {a.name}, {a.line1}, {a.city} {a.pincode}
                    </span>
                  </label>
                ))}
                <label className={`cursor-pointer rounded-[10px] border p-4 text-sm transition-colors ${addrId === "new" ? "border-brand bg-brand/5" : "border-dashed border-hair-2 hover:border-brand/60"}`}>
                  <input type="radio" name="addr" className="sr-only" checked={addrId === "new"} onChange={() => setAddrId("new")} />
                  <span className="font-semibold text-fg">Use a new address</span>
                </label>
              </div>
            )}
            {addrId === "new" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="House, building and street" autoComplete="address-line1" value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} error={errors.line1} className="sm:col-span-2" />
                <Field label="Area or landmark (optional)" autoComplete="address-line2" value={addr.line2} onChange={(e) => setAddr({ ...addr, line2: e.target.value })} className="sm:col-span-2" />
                <Field label="City" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} error={errors.city} />
                <Field label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, "") })} error={errors.pincode} />
                <SelectField label="State" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })}>
                  {states.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </SelectField>
                <SelectField label="Address type" value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })}>
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </SelectField>
                {user && (
                  <label className="flex items-center gap-3 text-sm text-fg-2 sm:col-span-2">
                    <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
                    Save this address to my account
                  </label>
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="h-pay">
            <h2 id="h-pay" className="mb-1 text-lg font-semibold">Payment</h2>
            <p className="mb-5 text-sm text-fg-3">Demo mode: no money moves. Any valid-looking details will work.</p>
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
              {methods.map(({ v, label, note, Icon }) => (
                <label key={v} className={`flex cursor-pointer gap-3 rounded-[10px] border p-4 transition-colors ${method === v ? "border-brand bg-brand/5" : "border-hair-2 hover:border-brand/60"}`}>
                  <input type="radio" name="method" className="sr-only" checked={method === v} onChange={() => setMethod(v)} />
                  <Icon size={22} className="mt-0.5 shrink-0 text-brand" />
                  <span>
                    <span className="block font-semibold text-fg">{label}</span>
                    <span className="text-sm text-fg-2">{note}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.method && <p className="mt-3 text-sm text-error">{errors.method}</p>}
            <div className="mt-5">
              {method === "UPI" && <Field label="UPI ID" placeholder="name@okaxis" value={upi} onChange={(e) => setUpi(e.target.value.trim())} error={errors.upi} />}
              {method === "Card" && (
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Card number"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="4111 1111 1111 1111"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })}
                    error={errors.card}
                    className="col-span-2"
                  />
                  <Field label="Expiry" placeholder="MM/YY" autoComplete="cc-exp" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.replace(/[^\d/]/g, "").slice(0, 5) })} error={errors.expiry} />
                  <Field label="CVV" inputMode="numeric" autoComplete="cc-csc" type="password" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })} error={errors.cvv} />
                </div>
              )}
              {method === "Net banking" && <p className="text-sm text-fg-2">You'll pick your bank on the next screen. In this demo the payment is approved straight away.</p>}
              {method === "Cash on delivery" && !codBlocked && <p className="text-sm text-fg-2">Pay the delivery partner in cash or by UPI when the parcel arrives.</p>}
            </div>
          </section>
        </form>

        <div className="lg:col-span-5">
          <OrderSummary
            compact
            cta={
              <Button type="submit" form="checkout-form" disabled={placing} className="w-full" trail={!placing}>
                {placing ? (
                  <span className="inline-flex items-center gap-2 py-1.5">
                    <CircleNotch size={18} className="animate-spin" /> Confirming payment
                  </span>
                ) : (
                  <>
                    <LockSimple size={16} /> Place order
                  </>
                )}
              </Button>
            }
          />
        </div>
      </div>
    </Container>
  );
}
