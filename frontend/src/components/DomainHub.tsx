"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Globe, Search, ArrowLeft, Check, X, Loader2, Shield, AlertCircle } from "lucide-react";

interface DomainHubProps {
  user?: any;
  onBack?: () => void;
  onComplete?: () => void;
}

function StepCard({ title, children, back }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        {back && <button onClick={back} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"><ArrowLeft className="w-4 h-4" /></button>}
        <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function DomainHub({ user, onBack, onComplete }: DomainHubProps) {
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [tlds, setTlds] = useState<any[]>([]);
  const [years, setYears] = useState(1);
  const [gateway, setGateway] = useState("razorpay");
  const [activeGateways, setActiveGateways] = useState<string[]>(["razorpay"]);
  const [processing, setProcessing] = useState(false);
  const [myDomains, setMyDomains] = useState<any[]>([]);

  useEffect(() => {
    api.server.gateways().then((g: any[]) => setActiveGateways(g.map((x: any) => x.name))).catch(() => {});
    api.server.domains().then(setTlds).catch(() => {});
    api.server.myDomains().then(setMyDomains).catch(() => {});
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSuggestions([]);
    setSelected(null);
    try {
      const list = await api.server.suggestDomains(query.trim());
      setSuggestions(Array.isArray(list) ? list : []);
      if (Array.isArray(list) && list.length > 0 && list[0].available) {
        setSelected(list[0]);
      }
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const register = async () => {
    if (!selected?.available) { showToast("Domain is not available", "error"); return; }
    setProcessing(true);
    try {
      const reg = await api.server.registerDomain({
        domainName: selected.domain,
        tld: selected.tld,
        years,
        currency,
      });
      if (reg.success) {
        const res = await api.payments.createCheckoutSession({
          type: "DOMAIN_REGISTRATION",
          amount: reg.totalAmount,
          gateway,
          domainId: reg.registration.id,
          domainName: selected.domain,
          tld: selected.tld,
          years,
          currency,
        });
        if (res.paid) {
          showToast("Domain registered", "success");
          onComplete?.();
        } else if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl;
        } else { showToast("Payment failed", "error"); }
      } else { showToast(reg.message || "Registration failed", "error"); }
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setProcessing(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-4">
          {onBack && <button onClick={onBack} className="p-2 rounded-lg bg-white/10 hover:bg-white/20"><ArrowLeft className="w-5 h-5" /></button>}
          <Globe className="w-8 h-8 text-[#00b7ff]" />
          <div>
            <h2 className="text-2xl font-bold">Domain Search & Registration</h2>
            <p className="text-slate-200">Find and register your perfect domain name.</p>
          </div>
        </div>
      </div>

      <StepCard title="Search a domain">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="example.com or myname" className="w-full rounded-lg bg-slate-100 border border-slate-200 pl-10 pr-4 py-3 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
          </div>
          <button onClick={search} disabled={loading} className="rounded-lg bg-[#00b7ff] text-white px-5 py-3 text-sm font-semibold hover:bg-[#009fe0] disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Search
          </button>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {suggestions.map((r: any) => (
              <button
                key={r.domain}
                onClick={() => r.available && setSelected(r)}
                disabled={!r.available}
                className={`text-left rounded-lg border p-2.5 transition-all ${selected?.domain === r.domain ? "border-[#00b7ff] bg-[#00b7ff]/5 ring-1 ring-[#00b7ff]" : r.available ? "border-slate-200 bg-white/60 hover:border-[#00b7ff]/50" : "border-slate-200 bg-slate-100/50 opacity-60 cursor-not-allowed"}`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0f172a] text-sm truncate">{r.domain}</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.available ? "Available" : r.reason || "Not available"}</p>
                  </div>
                  {r.available ? <Check className="w-3.5 h-3.5 text-[#00ff88] shrink-0" /> : <X className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                </div>
                {r.available && (
                  <p className="mt-1.5 text-xs font-bold text-[#00b7ff]">{getCurrencySymbol(currency)}{r.price?.toFixed(2)} {currency}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {suggestions.length === 0 && !loading && query && (
          <p className="mt-4 text-sm text-slate-500 text-center">No suggestions found. Try a different keyword.</p>
        )}

        {selected?.available && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-[#00b7ff] shrink-0" />
              <div>
                <p className="font-bold text-[#0f172a]">{selected.domain}</p>
                <p className="text-[#00b7ff] font-bold">{getCurrencySymbol(currency)}{selected.price?.toFixed(2)} {currency}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-2">Registration period</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 10].map((y) => (
                  <button key={y} onClick={() => setYears(y)} className={`rounded-lg border px-3 py-1.5 text-sm ${years === y ? "border-[#00b7ff] bg-[#00b7ff]/10 text-[#00b7ff]" : "border-slate-200 text-slate-600"}`}>
                    {y} {y === 1 ? "year" : "years"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Payment gateway</label>
              <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">
                {activeGateways.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex items-start gap-2 text-xs text-slate-500"><AlertCircle className="w-4 h-4 text-[#00b7ff] shrink-0" /> Price is calculated server-side. The amount used at checkout is what GHC shows, never a client-submitted value.</div>
            <button onClick={register} disabled={processing} className="w-full rounded-lg bg-[#00b7ff] text-white py-2.5 text-sm font-semibold hover:bg-[#009fe0] disabled:opacity-50 flex items-center justify-center gap-2">
              {processing && <Loader2 className="w-4 h-4 animate-spin" />} Register {selected.domain} for {years} {years === 1 ? "year" : "years"}
            </button>
          </div>
        )}
      </StepCard>

      {myDomains.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold text-[#0f172a] mb-4">My Domains</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-4 py-2 text-xs font-semibold text-slate-500">Domain</th><th className="px-4 py-2 text-xs font-semibold text-slate-500">Status</th><th className="px-4 py-2 text-xs font-semibold text-slate-500">Expiry</th></tr></thead>
              <tbody>
                {myDomains.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-[#0f172a]">{d.domainName}.{d.tld}</td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#00ff88]/10 text-[#00ff88]">{d.status}</span></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {tlds.slice(0, 16).map((t) => (
          <button key={t.tld} onClick={() => { setQuery(`myname.${t.tld}`); search(); }} className="rounded-lg border border-slate-200 bg-white/60 p-2 text-left hover:border-[#00b7ff]/50 transition-all">
            <p className="font-bold text-[#0f172a] text-xs">.{t.tld}</p>
            <p className="text-[10px] text-slate-500">{t.finalPrice > 0 ? `${getCurrencySymbol(currency)}${t.finalPrice?.toFixed(2)}` : "—"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
