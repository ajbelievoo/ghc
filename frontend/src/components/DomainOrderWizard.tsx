"use client";

import { useState, useMemo, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
import {
  Search, Check, X, Loader2, ChevronRight, ChevronLeft, Globe, Shield,
  Trash2, ShoppingCart, CreditCard, Wallet as WalletIcon, Lock, Info,
  Server, Mail, User as UserIcon, Phone, MapPin, Building,
} from "lucide-react";

type DomainItem = { domain: string; tld: string; available: boolean; price: number; currency: string; reason?: string | null; isExact?: boolean };
type CartItem = DomainItem & { years: number };
type PreparedReg = { domain: string; domainId: string; years: number; priceAmount: number; taxAmount: number; totalAmount: number; currency: string };

const STEPS = ["Select", "Options", "Summary", "Payment"];
const fmt = (c: string, n: number) => `${getCurrencySymbol(c)}${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DomainOrderWizard({ user, currency, onClose, onDone, initialQuery }: {
  user: any; currency: string; onClose: () => void; onDone: () => void; initialQuery?: string;
}) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState(initialQuery || "");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<DomainItem[]>([]);
  const [suggestions, setSuggestions] = useState<DomainItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [anycast, setAnycast] = useState<string[]>([]);
  const [prepared, setPrepared] = useState<PreparedReg[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [gateways, setGateways] = useState<any[]>([]);
  const [payGateway, setPayGateway] = useState("wallet");
  const [wallet, setWallet] = useState<any>(null);
  const [terms, setTerms] = useState({ conditions: false, accurate: false });
  const [paying, setPaying] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);

  useEffect(() => {
    api.server.gateways().then((g) => { const list = Array.isArray(g) ? g : []; setGateways(list.filter((x: any) => x.isActive)); if (list.some((x: any) => x.name === "wallet" && x.isActive)) setPayGateway("wallet"); }).catch(() => {});
    api.billing?.wallet?.().then(setWallet).catch(() => {});
    if (initialQuery) doSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (q?: string) => {
    const term = (q ?? query).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\s/g, "");
    if (!term) return;
    setQuery(term);
    setSearching(true);
    setSearched(true);
    setResults([]);
    setSuggestions([]);
    try {
      const kw = term.includes(".") ? term : `${term}`;
      const sugg = await api.server.suggestDomains(kw);
      const list: DomainItem[] = Array.isArray(sugg) ? sugg : [];
      let exact: DomainItem | null = null;
      if (term.includes(".")) {
        try { exact = await api.server.checkDomain(term); } catch {}
      } else {
        const m = list.find((r) => r.domain === `${term}.com`) || list.find((r) => r.isExact);
        if (m) exact = m;
      }
      const combined = [...list];
      if (exact && !combined.some((r) => r.domain === exact!.domain)) combined.unshift(exact);
      else if (exact) combined.forEach((r) => { if (r.domain === exact!.domain) { r.available = exact!.available; r.reason = exact!.reason; } });
      combined.forEach((r) => { if (r.domain === term) r.isExact = true; });
      setResults(combined);
      // "Our suggestions" — variants of the keyword
      if (!term.includes(" ")) {
        const base = term.split(".")[0];
        const variants = [`${base}online`, `my${base}`, `${base}shop`];
        const out: DomainItem[] = [];
        for (const v of variants.slice(0, 2)) {
          try {
            const s = await api.server.suggestDomains(v);
            const pick = (Array.isArray(s) ? s : []).filter((x: DomainItem) => x.available && ["com", "in", "net", "io", "co"].includes(x.tld.replace(/^\./, ""))).slice(0, 2);
            out.push(...pick);
          } catch {}
        }
        setSuggestions(out.slice(0, 6));
      }
    } catch (e: any) { showToast("Search failed: " + e.message, "error"); }
    finally { setSearching(false); }
  };

  const inCart = (domain: string) => cart.some((c) => c.domain === domain);
  const addToCart = (item: DomainItem) => {
    if (!item.available) return;
    setCart((p) => p.some((c) => c.domain === item.domain) ? p : [...p, { ...item, years: 1 }]);
  };
  const removeFromCart = (domain: string) => { setCart((p) => p.filter((c) => c.domain !== domain)); setAnycast((p) => p.filter((d) => d !== domain)); };
  const setYears = (domain: string, years: number) => setCart((p) => p.map((c) => c.domain === domain ? { ...c, years } : c));

  const cartTotal = useMemo(() => cart.reduce((s, c) => s + c.price * c.years, 0), [cart]);
  const exact = results.find((r) => r.isExact);
  const others = results.filter((r) => !r.isExact && r.available).slice(0, 24);
  const taken = results.filter((r) => !r.isExact && !r.available);

  // Step 3 → create pending registrations server-side to get real totals
  const prepareOrder = async () => {
    setPreparing(true);
    try {
      const regs: PreparedReg[] = [];
      for (const c of cart) {
        const parts = c.domain.split(".");
        const r = await api.server.registerDomain({ domainName: parts[0], tld: "." + parts.slice(1).join("."), years: c.years, currency });
        regs.push({ domain: c.domain, domainId: r.domainId, years: c.years, priceAmount: r.priceAmount, taxAmount: r.taxAmount, totalAmount: r.totalAmount, currency: r.currency });
      }
      setPrepared(regs);
      setStep(3);
    } catch (e: any) { showToast("Could not prepare order: " + e.message, "error"); }
    finally { setPreparing(false); }
  };

  const payNow = async () => {
    if (!terms.conditions || !terms.accurate) { showToast("Please accept the terms to continue", "error"); return; }
    setPaying(true);
    setManualMsg(null);
    try {
      for (const reg of prepared) {
        const res = await api.payments.createCheckoutSession({ type: "DOMAIN_REGISTRATION", gateway: payGateway, domainId: reg.domainId, currency });
        if (res.checkoutUrl) { window.location.href = res.checkoutUrl; return; }
        if (res.manual) { setManualMsg(res.instructions || `Manual payment of ${fmt(res.currency || currency, res.amount)} — reference ${res.id}`); }
      }
      if (!manualMsg) { showToast("Payment complete — domains registered!", "success"); onDone(); onClose(); }
    } catch (e: any) { showToast("Payment failed: " + e.message, "error"); }
    finally { setPaying(false); }
  };

  const preparedTotal = prepared.reduce((s, r) => s + r.totalAmount, 0);
  const preparedTax = prepared.reduce((s, r) => s + r.taxAmount, 0);
  const preparedEx = prepared.reduce((s, r) => s + r.priceAmount, 0);

  const gwMeta: Record<string, { label: string; icon: any }> = {
    wallet: { label: "GHC Wallet", icon: WalletIcon },
    paypal: { label: "PayPal", icon: CreditCard },
    manual: { label: "Manual / Bank transfer", icon: Building },
    razorpay: { label: "Card / UPI (Razorpay)", icon: CreditCard },
    stripe: { label: "Credit card (Stripe)", icon: CreditCard },
    cashfree: { label: "UPI / Cards (Cashfree)", icon: CreditCard },
    payu: { label: "UPI / Cards (PayU)", icon: CreditCard },
  };

  const contactCard = (title: string, desc: string, rights?: string[]) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">{user?.name || "—"}</p>
        <p className="text-xs text-slate-500">{user?.country || "IN"}</p>
        <p className="text-xs text-slate-500">{user?.phone || ""}</p>
        <p className="text-xs text-slate-500">{user?.email}</p>
      </div>
      <p className="text-[11px] text-slate-400">{desc}</p>
      {rights && <div className="text-[11px] text-slate-500"><p className="font-semibold">Rights</p>{rights.map((r) => <p key={r}>• {r}</p>)}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* stepper */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center w-24">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${i < step ? "bg-[#00b7ff] border-[#00b7ff] text-white" : i === step ? "border-[#00b7ff] text-[#00b7ff] bg-white" : "border-slate-300 text-slate-400 bg-white"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[11px] mt-1 ${i === step ? "text-[#00b7ff] font-semibold" : "text-slate-500"}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-16 md:w-28 h-0.5 -mt-5 ${i < step ? "bg-[#00b7ff]" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* main column */}
        <div className="lg:col-span-2 space-y-5">
          {step === 0 && (
            <>
              <h2 className="text-2xl font-bold text-[#0f172a]">Search for a domain name</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <form onSubmit={(e) => { e.preventDefault(); doSearch(); }} className="flex gap-2">
                  <div className="relative flex-1">
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="yourname.com" className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#00b7ff]" />
                    {query && <button type="button" onClick={() => { setQuery(""); setResults([]); setSearched(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-4 h-4" /></button>}
                  </div>
                  <button type="submit" disabled={searching} className="rounded-lg bg-[#00b7ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00b7ff]/85 disabled:opacity-50 flex items-center gap-1.5">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                  </button>
                </form>
                <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                  <p><Info className="w-3 h-3 inline mr-1 text-[#00b7ff]" />Get a free domain name for one year when you subscribe to a GHC Web Hosting plan.*</p>
                  <p className="font-semibold">Included with every domain name:</p>
                  <p><Check className="w-3 h-3 inline mr-1 text-green-600" />1 DNSSEC (secure DNS)</p>
                </div>
              </div>

              {searched && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Search results</p>
                  {searching ? <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00b7ff]" /></div> : (
                    <>
                      <p className="text-right text-[10px] text-slate-400">Price ex. GST /1st year</p>
                      {exact && (
                        <div className="flex items-center justify-between rounded-lg bg-[#e8f7ff] border border-[#00b7ff]/30 px-4 py-3">
                          <div>
                            <p className="text-sm font-semibold text-[#0f172a]">{exact.domain}</p>
                            {exact.available ? <p className="text-[11px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Available</p> : <p className="text-[11px] text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {exact.reason || "Unavailable"}</p>}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right"><p className="text-sm font-bold text-[#0f172a]">{fmt(exact.currency, exact.price)}</p><p className="text-[10px] text-slate-400">then {fmt(exact.currency, exact.price)}/year</p></div>
                            {exact.available ? (
                              inCart(exact.domain) ? <button onClick={() => removeFromCart(exact.domain)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600">✓</button>
                              : <button onClick={() => addToCart(exact)} className="rounded-lg bg-[#00b7ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#00b7ff]/85">Buy</button>
                            ) : <span className="rounded-lg bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500">Transfer</span>}
                          </div>
                        </div>
                      )}
                      {others.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-slate-500 pt-3">Other extensions</p>
                          {others.map((r) => (
                            <div key={r.domain} className="flex items-center justify-between border-b border-slate-100 px-2 py-2.5">
                              <div><p className="text-sm font-medium text-[#0f172a]">{r.domain}</p><p className="text-[11px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Available</p></div>
                              <div className="flex items-center gap-3">
                                <div className="text-right"><p className="text-sm font-bold text-[#0f172a]">{fmt(r.currency, r.price)}</p><p className="text-[10px] text-slate-400">then {fmt(r.currency, r.price)}/year</p></div>
                                {inCart(r.domain) ? <button onClick={() => removeFromCart(r.domain)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600">✓</button>
                                : <button onClick={() => addToCart(r)} className="rounded-lg bg-[#00b7ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#00b7ff]/85">Buy</button>}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {suggestions.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-slate-500 pt-3">Our suggestions</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {suggestions.map((r) => (
                              <div key={r.domain} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                                <div><p className="text-sm font-medium text-[#0f172a]">{r.domain}</p><p className="text-[10px] text-green-600">Available</p></div>
                                <div className="flex items-center gap-2"><span className="text-xs font-bold">{fmt(r.currency, r.price)}</span>
                                  {inCart(r.domain) ? <button onClick={() => removeFromCart(r.domain)} className="rounded border border-slate-300 px-3 py-1 text-[11px] font-semibold">✓</button> : <button onClick={() => addToCart(r)} className="rounded bg-[#00b7ff] px-3 py-1 text-[11px] font-semibold text-white">Buy</button>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {!searching && results.length === 0 && <p className="text-xs text-slate-500 py-4 text-center">No extensions found for this search.</p>}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold text-[#0f172a]">Add options to your domains</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-[#0f172a]">DNS Anycast</p>
                  <span className="text-xs text-slate-500">Included — no extra cost</span>
                </div>
                <p className="text-xs font-semibold text-slate-600">Speed up access to your website</p>
                <p className="text-xs text-slate-500">With Anycast DNS, your website loads in record time wherever your users are. Selected domains use our anycast resolver network automatically.</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500">Selected domain names ({anycast.length})</p>
                  {cart.map((c) => (
                    <label key={c.domain} className="flex items-center gap-2 text-xs text-[#0f172a]"><input type="checkbox" className="accent-[#00b7ff]" checked={anycast.includes(c.domain)} onChange={(e) => setAnycast((p) => e.target.checked ? [...p, c.domain] : p.filter((d) => d !== c.domain))} /> {c.domain}</label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between"><p className="text-sm font-bold text-[#0f172a]">Manage contacts/holders</p><button onClick={onClose} className="text-xs text-[#00b7ff] font-medium">Edit profile →</button></div>
                <p className="text-[11px] text-slate-500">These contacts will be used for registrant, administrative, technical and billing roles.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {contactCard("Holder", "This is the person who officially owns the domain name.", ["Renewal", "Transfer", "Settings"])}
                  {contactCard("Administrator", "This person is responsible for making legal decisions about the domain.", ["Renewal", "Transfer", "Settings", "WHOIS modification"])}
                  {contactCard("Technical", "This person is responsible for technical decisions — DNS servers.", ["Setting up DNS servers"])}
                </div>
                {contactCard("Billing", "This is the person who manages billing — including direct debits. The contact receives renewal notifications.")}
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(0)} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => prepareOrder()} disabled={preparing} className="rounded-lg bg-[#00b7ff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#00b7ff]/85 disabled:opacity-50 flex items-center gap-1.5">{preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Continue <ChevronRight className="w-4 h-4" /></button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-[#0f172a]">Order summary <span className="text-sm font-normal text-slate-500">{prepared.length} products</span></h2>
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200 text-[11px] font-semibold uppercase text-slate-500"><th className="px-5 py-3">Product</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Duration</th><th className="px-5 py-3 text-right">Price ex. GST</th></tr></thead>
                  <tbody>
                    {prepared.map((r) => (
                      <tr key={r.domain} className="border-b border-slate-100">
                        <td className="px-5 py-3"><p className="text-xs font-semibold text-slate-400">DOMAINS</p><p className="text-sm font-medium text-[#0f172a]">{r.domain}</p></td>
                        <td className="px-5 py-3 text-xs">× 1</td>
                        <td className="px-5 py-3 text-xs">{r.years} year{r.years > 1 ? "s" : ""}</td>
                        <td className="px-5 py-3 text-right"><p className="text-sm font-bold">{fmt(r.currency, r.priceAmount)}</p><p className="text-[10px] text-slate-400">then {fmt(r.currency, r.priceAmount / r.years)}/year</p></td>
                      </tr>
                    ))}
                    <tr className="border-b border-slate-100"><td className="px-5 py-3 text-xs text-slate-500"><p className="font-semibold text-slate-400">OPTION</p>DNSSEC (secure DNS)</td><td className="px-5 py-3 text-xs">× {prepared.length}</td><td className="px-5 py-3 text-xs">—</td><td className="px-5 py-3 text-right text-xs font-semibold text-green-600">Included</td></tr>
                    {anycast.length > 0 && <tr className="border-b border-slate-100"><td className="px-5 py-3 text-xs text-slate-500"><p className="font-semibold text-slate-400">OPTION</p>Anycast DNS — {anycast.join(", ")}</td><td className="px-5 py-3 text-xs">× {anycast.length}</td><td className="px-5 py-3 text-xs">1 year</td><td className="px-5 py-3 text-right text-xs font-semibold text-green-600">Included</td></tr>}
                  </tbody>
                </table>
                <div className="px-5 py-3 bg-[#e8f7ff] text-[11px] text-slate-600">The default configuration for your DNS zone will be applied.</div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={() => setStep(3)} className="rounded-lg bg-[#00b7ff] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#00b7ff]/85 flex items-center gap-1.5">Pay <ChevronRight className="w-4 h-4" /></button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2"><Lock className="w-5 h-5" /> Pay</h2>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
                <p className="text-sm font-bold text-[#0f172a] flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Billing address</p>
                <p className="text-[11px] text-slate-500">Do not forget to check your billing address. To change it, go to Control Panel → My profile.</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-xs pt-2">
                  <span className="text-slate-500">Name</span><span className="font-medium text-[#0f172a]">{user?.name}</span>
                  <span className="text-slate-500">Country</span><span className="font-medium text-[#0f172a]">{user?.country || "IN"}</span>
                  <span className="text-slate-500">Phone</span><span className="font-medium text-[#0f172a]">{user?.phone || "—"}</span>
                  <span className="text-slate-500">Email</span><span className="font-medium text-[#0f172a]">{user?.email}</span>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <p className="text-sm font-bold text-[#0f172a] flex items-center gap-2"><Check className="w-4 h-4 text-green-600" /> Accept terms and conditions</p>
                <p className="text-[11px] font-semibold text-slate-500">SPECIFIC CONDITIONS FOR THE REGISTRATION, RENEWAL AND TRANSFER OF DOMAIN NAMES</p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 max-h-32 overflow-y-auto text-[11px] text-slate-500 space-y-1">
                  <p>By placing this order you acknowledge that the registered name holder and the publication in WHOIS are subject to your consent, which can be managed through the WHOIS configuration on your management panel.</p>
                  <p>You undertake to provide complete and accurate contact details, as specified in the special conditions. In the event of inaccurate data, GHC reserves the right to suspend the domain name concerned.</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-[#0f172a]"><input type="checkbox" className="accent-[#00b7ff]" checked={terms.conditions} onChange={(e) => setTerms({ ...terms, conditions: e.target.checked })} /> I have read and accept all the conditions.</label>
                <label className="flex items-center gap-2 text-xs text-[#0f172a]"><input type="checkbox" className="accent-[#00b7ff]" checked={terms.accurate} onChange={(e) => setTerms({ ...terms, accurate: e.target.checked })} /> I undertake to provide complete and accurate contact details.</label>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <p className="text-sm font-bold text-[#0f172a]">Choose a payment method</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {gateways.map((g) => {
                    const meta = gwMeta[g.name] || { label: g.displayName || g.name, icon: CreditCard };
                    const Ic = meta.icon;
                    return (
                      <button key={g.name} onClick={() => setPayGateway(g.name)} className={`rounded-lg border p-3 text-left transition-all ${payGateway === g.name ? "border-[#00b7ff] bg-[#00b7ff]/5 ring-1 ring-[#00b7ff]" : "border-slate-200 hover:border-[#00b7ff]/40"}`}>
                        <Ic className={`w-5 h-5 mb-1.5 ${payGateway === g.name ? "text-[#00b7ff]" : "text-slate-400"}`} />
                        <p className="text-xs font-semibold text-[#0f172a]">{meta.label}</p>
                        {g.name === "wallet" && wallet && <p className="text-[10px] text-slate-500">Balance: {fmt(wallet.currency || currency, wallet.balance || 0)}</p>}
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg bg-[#e8f7ff] border border-[#00b7ff]/20 p-3 flex gap-2">
                  <Shield className="w-4 h-4 text-[#00b7ff] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600"><span className="font-semibold">SECURITY AND CONFIDENTIALITY</span><br />All payments are secure. The personal information you send us will remain confidential.</p>
                </div>
                {manualMsg && <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">{manualMsg}</div>}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-slate-500 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</button>
                <button onClick={payNow} disabled={paying || !terms.conditions || !terms.accurate} className="rounded-lg bg-[#00b7ff] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#00b7ff]/85 disabled:opacity-50 flex items-center gap-1.5">{paying ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Pay <ChevronRight className="w-4 h-4" /></button>
              </div>
            </>
          )}
        </div>

        {/* right sidebar — Your selection */}
        <aside className="rounded-xl bg-[#0062d1] text-white p-5 space-y-4 sticky top-6">
          <p className="text-sm font-bold">Your selection</p>
          {cart.length === 0 && step < 2 && (
            <div className="py-8 text-center">
              <ShoppingCart className="w-10 h-10 mx-auto text-white/40" />
              <p className="text-sm text-white/80 mt-2">Your order summary is empty</p>
            </div>
          )}
          {step < 2 && cart.map((c) => (
            <div key={c.domain} className="space-y-1 border-b border-white/15 pb-3">
              <p className="text-[10px] font-semibold uppercase text-white/60">Domains</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{c.domain}</span>
                <div className="flex items-center gap-2"><span className="text-sm font-bold">{fmt(c.currency, c.price * c.years)}</span><button onClick={() => removeFromCart(c.domain)} className="text-white/50 hover:text-white"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
              <p className="text-[10px] text-white/60">then {fmt(c.currency, c.price)}/year</p>
              <div className="text-[11px] text-white/80 flex items-center justify-between">Duration
                <select value={c.years} onChange={(e) => setYears(c.domain, Number(e.target.value))} className="rounded bg-white/15 border-0 text-white text-xs px-2 py-1">
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y} className="text-black">{y} year{y > 1 ? "s" : ""}</option>)}
                </select>
              </div>
              <p className="text-[10px] text-white/50">Renewal for {fmt(c.currency, c.price)}/year</p>
              <p className="text-[11px] text-white/80 flex justify-between">Option DNSSEC (secure DNS) <span className="text-[10px] bg-white/20 rounded px-1.5 py-0.5">Included</span></p>
            </div>
          ))}
          {step >= 2 && prepared.map((r) => (
            <div key={r.domain} className="border-b border-white/15 pb-2">
              <div className="flex justify-between text-sm"><span className="font-semibold">{r.domain}</span><span className="font-bold">{fmt(r.currency, r.priceAmount)}</span></div>
              <p className="text-[10px] text-white/60">{r.years} year{r.years > 1 ? "s" : ""} · DNSSEC included</p>
            </div>
          ))}
          {step >= 2 && prepared.length > 0 && (
            <div className="space-y-1 text-xs">
              <p className="flex justify-between text-white/80">Price ex. GST <span>{fmt(prepared[0]?.currency || currency, preparedEx)}</span></p>
              <p className="flex justify-between text-white/80">GST <span>{fmt(prepared[0]?.currency || currency, preparedTax)}</span></p>
            </div>
          )}
          {(cart.length > 0 || prepared.length > 0) && (
            <div className="pt-1 space-y-2">
              <p className="flex justify-between text-lg font-bold">Total <span>{step < 2 ? fmt(cart[0]?.currency || currency, cartTotal) : fmt(prepared[0]?.currency || currency, preparedTotal)}{step >= 2 && <span className="text-[10px] font-normal"> incl. GST</span>}</span></p>
              <p className="text-[10px] text-white/60">{step < 2 ? cart.length : prepared.length} products</p>
              {step === 0 && cart.length > 0 && <button onClick={() => setStep(1)} className="w-full rounded-lg bg-white text-[#0062d1] py-2.5 text-sm font-bold hover:bg-white/90">Continue Order →</button>}
              {step === 1 && <button onClick={prepareOrder} disabled={preparing} className="w-full rounded-lg bg-white text-[#0062d1] py-2.5 text-sm font-bold hover:bg-white/90 disabled:opacity-60">{preparing ? "Preparing…" : "Continue Order →"}</button>}
              {step === 3 && <button onClick={payNow} disabled={paying || !terms.conditions || !terms.accurate} className="w-full rounded-lg bg-white text-[#0062d1] py-2.5 text-sm font-bold hover:bg-white/90 disabled:opacity-60">{paying ? "Processing…" : "Pay →"}</button>}
            </div>
          )}
        </aside>
      </div>
      <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">← Back to domain names</button>
    </div>
  );
}
