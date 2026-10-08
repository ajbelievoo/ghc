"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Search, Globe, Loader2, Check, X, ChevronRight, ArrowRight, Shield, BookOpen, MessageSquare, Headphones, Server, Mail, Rocket, Palette, HeartPulse, Briefcase, Layers, Zap, Award } from "lucide-react";

interface DomainResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
  tld?: string;
  reason?: string | null;
}
interface TldPrice { tld: string; price: number; currency: string; }

const POPULAR_TLDS = ["in", "com", "io", "biz", "eu", "pro", "info", "me", "us", "net", "org", "dev", "app", "co", "shop"];
const CATEGORY_TLDS: { title: string; icon: any; tlds: string[] }[] = [
  { title: "For startups", icon: Rocket, tlds: ["ai", "app", "cloud", "dev", "io", "tech", "mobi", "solutions", "co"] },
  { title: "For business founders", icon: Briefcase, tlds: ["biz", "company", "pro", "ltd", "ventures", "business", "consulting", "expert", "international"] },
  { title: "For creative projects", icon: Palette, tlds: ["art", "design", "studio", "photo", "gallery", "me", "blog", "media", "show"] },
  { title: "For health and wellness professionals", icon: HeartPulse, tlds: ["care", "clinic", "healthcare", "yoga", "fit", "bio", "dental", "doctor", "fitness"] },
];

const FAQ = [
  ["What is a domain name?", "A domain name is your address on the internet — the name people type to reach your website, such as yourname.com. It is unique to you once registered."],
  ["How do I reserve a domain name?", "Search for the name you want, pick an available extension, add it to your selection and complete the guided order — choose your duration, contacts and payment method."],
  ["How do I choose the right domain name?", "Keep it short, memorable and easy to spell. Prefer an extension that matches your activity — .com for international, .in for India, .io/.ai for tech."],
  ["What do I do if the domain name I want is unavailable?", "Try another extension from the suggestions list, or use a small variation of the name. You can also transfer a domain you already own to GHC."],
  ["What is the price of a domain name?", "Every extension shows its price ex. GST before you order, plus the renewal price — no hidden fees. The price depends on the extension you choose."],
  ["How do I link a domain to my website?", "Point it to your hosting via DNS records or nameservers — both are managed free in your dashboard under Domain names → DNS zones."],
  ["How do I add sub-domains?", "Create unlimited sub-domains (blog.example.com, shop.example.com) from the DNS zone editor — free with every domain."],
  ["Why choose GHC to get a domain name?", "Transparent pricing, DNSSEC included free, an anycast-ready DNS zone, and one dashboard for domains, hosting, cloud and billing."],
  ["What is a premium domain name?", "Premium domains are short or high-value names sold at special prices set by the registry. They are flagged in search results when applicable."],
  ["How do I manage or update a domain name?", "From your dashboard: renew, toggle auto-renew, edit DNS records, change nameservers and review expiry — all in one place."],
  ["How do I know who owns a domain name?", "Use a WHOIS lookup for public registration data. If a name is taken you can place a transfer or pick one of our suggestions."],
];

function DomainPageContent() {
  const params = useSearchParams();
  const { currency } = useCurrency();
  const [query, setQuery] = useState(params?.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searched, setSearched] = useState(!!params?.get("q"));
  const [tlds, setTlds] = useState<TldPrice[]>([]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [cat, setCat] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [tldQuery, setTldQuery] = useState("");

  const sym = (c: string) => getCurrencySymbol((c || currency || "INR").toUpperCase());
  const fmt = (v: number, c: string) => `${sym(c)}${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ex. ${(c || currency || "INR") === "INR" ? "GST" : "TAX"}`;

  useEffect(() => {
    api.server.domains().then((list: any) => {
      if (Array.isArray(list)) setTlds(list.map((t: any) => ({ tld: (t.tld || "").replace(/^\./, ""), price: t.finalPrice ?? t.price ?? 0, currency: t.currency || "INR" })));
    }).catch(() => {});
  }, []);

  const tldMap = useMemo(() => { const m: Record<string, TldPrice> = {}; tlds.forEach((t) => { m[t.tld.toLowerCase()] = t; }); return m; }, [tlds]);
  const popular = POPULAR_TLDS.map((t) => tldMap[t]).filter(Boolean).slice(0, 9);
  const tldCount = tlds.length || 900;

  const doSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const list = await api.server.suggestDomains(value.trim().toLowerCase());
      setResults((Array.isArray(list) ? list : []).map((r: any) => ({ ...r, currency: r.currency || "INR" })));
      document.getElementById("domain-results")?.scrollIntoView({ behavior: "smooth" });
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = params?.get("q");
    if (q) doSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const buy = (domain: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const target = `/dashboard?tab=domains&domain=${encodeURIComponent(domain)}`;
    if (token) window.location.href = target;
    else { localStorage.setItem("pendingCheckout", target); window.location.href = "/login"; }
  };

  const searchForm = (
    <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} className="flex gap-2 w-full">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Find your domain name"
        className="flex-1 rounded px-5 py-3.5 text-sm outline-none border bg-white text-[#0f172a] border-transparent"
      />
      <button type="submit" disabled={loading} className="rounded bg-[#ff3d00] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#e63700] disabled:opacity-50 flex items-center gap-2 shrink-0">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      {/* promo strip */}
      <div className="bg-gradient-to-r from-lime-300 to-emerald-300 text-[#0f172a] text-center text-xs py-2 px-4">
        <span className="font-bold mr-2">Promotion</span> Register both .com and .net together and secure your domain name today.
      </div>
      <Navbar />

      {/* hero */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden">
            <div className="bg-[#0050d7] text-white p-8 md:p-12">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Domain name</p>
              <h1 className="mt-3 text-3xl md:text-4xl font-black leading-tight">Affirm and secure your identity</h1>
            </div>
            <div className="bg-gradient-to-br from-[#7b2ff7] via-[#4f6df5] to-[#f3506d] p-8 md:p-12 flex items-center">
              <div className="text-white/90 text-5xl md:text-6xl font-black tracking-tight select-none" aria-hidden>.com&nbsp;.in&nbsp;.io</div>
            </div>
          </div>
          <div className="mx-auto max-w-2xl -mt-7 relative z-10 rounded-xl bg-white shadow-xl p-3 border border-slate-100">
            {searchForm}
          </div>
          <p className="text-xs text-slate-400 mt-6">Home &gt; Domain name</p>
        </div>
      </section>

      {/* live results */}
      <section id="domain-results" className="mx-auto max-w-5xl px-6">
        {searched && (
          <div className="mt-8 rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0f172a] flex items-center gap-2"><Search className="w-4 h-4 text-[#00b7ff]" /> Search results</p>
              <span className="text-[10px] text-slate-400">Price ex. GST /1st year</span>
            </div>
            {loading ? <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#00b7ff]" /></div> : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No results found.</p>
            ) : (
              results.slice(0, 30).map((r) => (
                <div key={r.domain} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 hover:bg-slate-50/60">
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">{r.domain}</p>
                    {r.available ? <p className="text-[11px] text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Available</p> : <p className="text-[11px] text-red-500 flex items-center gap-1"><X className="w-3 h-3" /> {r.reason || "Taken"}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    {r.available && <div className="text-right"><p className="text-sm font-bold">{fmt(r.price, r.currency)}</p><p className="text-[10px] text-slate-400">then {fmt(r.price, r.currency)}/year</p></div>}
                    {r.available ? <button onClick={() => buy(r.domain)} className="rounded bg-[#0050d7] px-5 py-1.5 text-xs font-bold text-white hover:bg-[#0040aa]">Buy</button> : <span className="rounded bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-400">—</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* popular TLD strip */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {(popular.length ? popular : POPULAR_TLDS.slice(0, 9).map((t) => ({ tld: t, price: 0, currency }))).map((t) => (
            <button key={t.tld} onClick={() => { setQuery(`example.${t.tld}`); doSearch(`example.${t.tld}`); }} className="min-w-[130px] rounded-xl border border-slate-200 bg-white px-4 py-4 text-center hover:border-[#00b7ff] hover:shadow-md transition-all">
              <p className="text-lg font-black text-[#0f172a]">.{t.tld.toUpperCase()}</p>
              <p className="mt-1 text-sm font-bold text-[#0050d7]">{t.price ? fmt(t.price, t.currency) : "—"}</p>
              <p className="text-[10px] text-slate-400">{t.price ? `Renew ${fmt(t.price, t.currency)}` : ""}</p>
            </button>
          ))}
        </div>
      </section>

      {/* extensions by category */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="text-2xl font-black text-[#0f172a]">Pick from over {tldCount} extensions to stand out</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            {CATEGORY_TLDS.map((c, i) => {
              const Ic = c.icon;
              return (
                <button key={c.title} onClick={() => setCat(i)} className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-semibold transition-all ${cat === i ? "bg-[#e8f7ff] text-[#0050d7] border-l-4 border-[#0050d7]" : "text-[#0f172a] hover:bg-slate-50"}`}>
                  <Ic className="w-4 h-4" /> {c.title} <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              );
            })}
            <p className="text-xs text-[#0050d7] font-semibold pt-2 pl-4 cursor-pointer" onClick={() => setShowAll(!showAll)}>{showAll ? "Hide" : "See"} all extensions →</p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORY_TLDS[cat].tlds.map((t) => {
              const p = tldMap[t];
              return (
                <button key={t} onClick={() => { const d = `yourname.${t}`; setQuery(d); doSearch(d); }} className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center hover:border-[#00b7ff] hover:shadow-md transition-all">
                  <p className="text-base font-black text-[#0f172a]">.{t.toUpperCase()}</p>
                  <p className="mt-1 text-sm font-bold text-[#0050d7]">{p ? fmt(p.price, p.currency) : "—"}</p>
                  <p className="text-[10px] text-slate-400">{p ? `Renew ${fmt(p.price, p.currency)}` : ""}</p>
                </button>
              );
            })}
          </div>
        </div>
        {showAll && (
          <div className="mt-8 rounded-xl border border-slate-200 p-4">
            <input value={tldQuery} onChange={(e) => setTldQuery(e.target.value)} placeholder="Filter extensions… (.com, .io, .shop)" className="w-full rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff] mb-4" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-[420px] overflow-y-auto">
              {tlds.filter((t) => t.tld.includes(tldQuery.toLowerCase().replace(/^\./, ""))).map((t) => (
                <button key={t.tld} onClick={() => { const d = `yourname.${t.tld}`; setQuery(d); doSearch(d); }} className="rounded-lg border border-slate-100 px-2 py-2 text-center hover:border-[#00b7ff] transition-all">
                  <p className="text-xs font-bold text-[#0f172a]">.{t.tld}</p>
                  <p className="text-[10px] text-[#0050d7] font-semibold">{fmt(t.price, t.currency)}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3 text-right">{tlds.filter((t) => t.tld.includes(tldQuery.toLowerCase().replace(/^\./, ""))).length} of {tlds.length} extensions</p>
          </div>
        )}
      </section>

      {/* clear pricing */}
      <section className="bg-[#f6f8fc] py-14">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-black text-[#0f172a]">Clear pricing with no surprises</h2>
            <p className="mt-3 text-sm text-slate-600 leading-6">All extensions show the price for the first year and the renewal price up front. No hidden fees — and your domain includes DNSSEC, our free DNS zone, and easy management tools.</p>
            <a href="#domain-results" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="mt-5 inline-flex items-center gap-2 rounded bg-[#0050d7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0040aa]">Take a look at our domain prices <ArrowRight className="w-3.5 h-3.5" /></a>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#e8f7ff] to-white border border-slate-100 p-8 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Shield className="w-10 h-10 mx-auto text-[#0050d7]" />
              <p className="text-sm font-bold text-[#0f172a]">DNSSEC included free</p>
              <p className="text-xs text-slate-500">secure DNS on every domain</p>
            </div>
          </div>
        </div>
      </section>

      {/* protected domain */}
      <section className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-br from-[#0a2540] to-[#0050d7] p-10 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Security</p>
          <div className="mt-4 flex items-center gap-2 text-3xl font-black"><Shield className="w-8 h-8" /> DNSSEC</div>
          <p className="mt-3 text-xs text-white/70 leading-5">Domain Name System Security Extensions protect your visitors from DNS spoofing — included free with every registration.</p>
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-2xl font-black text-[#0f172a]">Your protected domain name</h2>
          <p className="mt-3 text-sm text-slate-600 leading-6">Protect your online identity: DNSSEC signs your DNS zone, registrar lock prevents unauthorized transfers, and renewals are handled from one dashboard.</p>
          <button onClick={() => { const d = "yourname.com"; setQuery(d); doSearch(d); }} className="mt-5 inline-flex items-center gap-2 rounded bg-[#0050d7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0040aa]">Activate DNS protection <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
      </section>

      {/* blue CTA band */}
      <section className="bg-[#0050d7] py-14">
        <div className="mx-auto max-w-3xl px-6">
          {searchForm}
          <p className="mt-6 text-center text-white text-lg font-bold">Over {tldCount} extensions are already available on GHC.</p>
        </div>
      </section>

      {/* feature cards */}
      <section className="mx-auto max-w-7xl px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Layers, t: "Create and manage sub-domains", d: "Create sub-domains for all of your projects — blog, shop, api — directly from the DNS zone editor, free with every domain." },
          { icon: Zap, t: "Automate renewal with our API", d: "Use the GHC API to renew, configure and manage your domain names automatically — integrated with your tooling." },
          { icon: Award, t: "Showcase expertise", d: "With our selection of domain extensions, you should be able to find one that suits your business or passion project perfectly." },
        ].map((f) => (
          <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-7">
            <f.icon className="w-8 h-8 text-[#0050d7]" />
            <p className="mt-4 text-sm font-bold text-[#0f172a]">{f.t}</p>
            <p className="mt-2 text-xs text-slate-500 leading-5">{f.d}</p>
          </div>
        ))}
      </section>

      {/* assistance */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="text-2xl font-black text-[#0f172a]">Assistance and support</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, t: "Guides", d: "We have published our guides on a range of topics to configure your services.", l: "Access documentation →", href: "/kb" },
            { icon: MessageSquare, t: "Chatbot", d: "The GHC assistant can answer your questions 24/7 about our services.", l: "Contact us →", href: "/support" },
            { icon: Headphones, t: "Support ticket", d: "Need help? Our team is available 24/7 by telephone and ticket for your specific needs.", l: "Find out more →", href: "/support" },
          ].map((a) => (
            <a key={a.t} href={a.href} className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#00b7ff] transition-all block">
              <a.icon className="w-8 h-8 text-[#0050d7]" />
              <p className="mt-4 text-sm font-bold text-[#0f172a]">{a.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{a.d}</p>
              <p className="mt-4 text-xs font-semibold text-[#0050d7]">{a.l}</p>
            </a>
          ))}
        </div>
      </section>

      {/* complete your domain */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="text-2xl font-black text-[#0f172a]">To complete your domain name</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: Server, t: "Web hosting", d: "Your hosting solution is tailored to all your web projects. Expand your online presence with our web hosting plans, which include a free domain name for the first year.", l: "Explore our solutions →", href: "/web-hosting" },
            { icon: Mail, t: "Email", d: "Messaging for complete data protection. Add a personalised email address like contact@yourcompany.com to project a professional image.", l: "Find out more →", href: "/email-hosting" },
          ].map((a) => (
            <a key={a.t} href={a.href} className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#00b7ff] transition-all block">
              <a.icon className="w-8 h-8 text-[#0050d7]" />
              <p className="mt-4 text-sm font-bold text-[#0f172a]">{a.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{a.d}</p>
              <p className="mt-4 text-xs font-semibold text-[#0050d7]">{a.l}</p>
            </a>
          ))}
        </div>
      </section>

      {/* gradient band */}
      <section className="bg-gradient-to-r from-[#7b2ff7] via-[#4f6df5] to-[#f3506d] py-12 text-center text-white">
        <p className="text-xl font-black">Your entire online presence in one place</p>
        <div className="mt-2 flex justify-center gap-2 text-white/70"><Globe className="w-5 h-5" /><Mail className="w-5 h-5" /></div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <h2 className="text-2xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between py-4 text-left text-sm font-semibold text-[#0f172a] hover:text-[#0050d7]">
                {q}
                <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${faqOpen === i ? "rotate-90" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-4 text-xs text-slate-500 leading-5">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function DomainPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00b7ff]" /></div>}>
      <DomainPageContent />
    </Suspense>
  );
}
