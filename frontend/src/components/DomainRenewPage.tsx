"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Search, Loader2, Globe, ShieldCheck, RefreshCw,
  CalendarClock, BookOpen, MessageSquare, Headphones, Server, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

const TOPICS = [
  {
    title: "Domain name: key to your online visibility",
    pills: ["Security", "Continuity", "Credibility"],
    text: "By renewing your domain name, you maintain your online presence. Without this, your website and your email accounts would become inaccessible. Keep control of your identity online and ensure your web address cannot be taken over or misused by a third party.",
    cta: { label: "Renew my domain", href: "/dashboard?tab=domains" },
    icon: ShieldCheck,
  },
  {
    title: "How to renew your domain and its services",
    pills: ["Speed", "Simplicity", "Transparency"],
    text: "With a few clicks from your Control Panel, you can renew your domain name and associated services (hosting, emails, SSL certificates, etc). Even if you do it in advance, the anniversary date stays the same: you keep the full period you already paid for, and there will be no service interruption.",
    cta: { label: "View the guide", href: "/kb" },
    icon: RefreshCw,
  },
];

const FAQS: [string, string][] = [
  ["What is a domain name?", "A domain name is your address on the internet — the name visitors type to reach your website (e.g. yourbusiness.com). It is registered for a fixed period and must be renewed to keep it."],
  ["Why buy or renew a domain name?", "Your domain is your online identity. If it expires, your website and email stop working and someone else can register it — renewing protects your brand, SEO and customer trust."],
  ["How do I register or renew a domain name?", "Log in to your GHC Control Panel, open the Domains section, select the domain and choose Renew. You can extend it by 1 year or more, or enable automatic renewal."],
  ["How do I know if a domain name is available?", "Use the search bar above or the domain search page — we check availability instantly across 800+ extensions and show you the price."],
  ["How do I find a domain name owner?", "Look the domain up in the public WHOIS database. If the owner uses WHOIS privacy, the registrant details are hidden but registrar contact information is shown."],
  ["What is the renewal price for a domain name?", "Renewal prices are shown per extension in your Control Panel before you confirm. Prices may differ from the first-year promotional price — check the catalogue for each TLD."],
  ["What happens if I don't renew my domain name on time?", "After expiry, the domain enters a grace/redemption period where renewal is still possible (sometimes with a recovery fee). After that it is released publicly and anyone can register it."],
  ["How do I recover an expired domain?", "During the grace period, renew it normally from the Control Panel. In the redemption period, a recovery can be requested for an additional fee. Once released, you can only re-register it if it is still free."],
  ["How do I renew an expired domain?", "Open the Domains section in the Control Panel — expired but recoverable domains show a renewal option. Complete payment to restore the domain and its services."],
  ["Can I transfer a domain name to GHC?", "Yes — unlock the domain at your current registrar, get the auth/EPP code and start the transfer from our domain page. A one-year renewal is included with most transfers."],
  ["Is automatic renewal mandatory?", "No — it is optional. Enable it to avoid accidental expiry; you can disable it anytime from the Control Panel before the next billing date."],
];

export default function DomainRenewPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const searchDomain = () => {
    const d = query.trim().toLowerCase();
    if (!d) return;
    setSearching(true);
    router.push(`/domain?q=${encodeURIComponent(d)}`);
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — centered navy banner + search pill */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white px-6 py-14 md:py-16 text-center">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#00b7ff]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#7c3aed]/20 blur-3xl pointer-events-none" />
          <span className="relative inline-block rounded-full bg-[#00b7ff] text-[#0b1020] px-4 py-1.5 text-[11px] font-black uppercase tracking-widest">Domain name renewal</span>
          <h1 className="relative mt-5 text-3xl md:text-4xl font-black leading-tight max-w-2xl mx-auto">Renew your domain name and stay online</h1>
          <p className="relative mt-4 text-sm text-white/80 leading-7 max-w-xl mx-auto">Keep your website, emails and brand safe — renew in seconds from your Control Panel, or turn on automatic renewal and never worry again.</p>
          <div className="relative mt-8 mx-auto max-w-lg bg-white/95 backdrop-blur rounded-full shadow-2xl p-2 flex gap-2">
            <div className="flex items-center pl-3 text-slate-400"><Search className="w-4 h-4" /></div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchDomain()}
              placeholder="Find your domain name"
              className="flex-1 min-w-0 rounded-full px-2 py-2.5 text-sm outline-none text-[#0f172a] bg-transparent"
            />
            <button onClick={searchDomain} className="rounded-full bg-[#ff3d00] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#e63700] flex items-center gap-1.5 shrink-0">
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Search
            </button>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/60 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> 1-click renewal</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> Auto-renew option</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> 800+ extensions</span>
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400"><a href="/" className="hover:text-[#0284c7]">Home</a> &gt; <a href="/domain" className="hover:text-[#0284c7]">Domain names</a> &gt; Renew your domain name</p>
      </section>

      {/* Topic rows — accent cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14 space-y-5">
        {TOPICS.map((t, i) => (
          <div key={t.title} className="relative rounded-2xl border border-slate-200 bg-white p-6 md:p-8 overflow-hidden hover:border-[#0284c7] transition-colors">
            <span className={`absolute top-0 left-0 h-full w-1.5 ${i === 0 ? "bg-[#00b7ff]" : "bg-violet-500"}`} />
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 border border-sky-100">
                <t.icon className="w-7 h-7 text-[#0284c7]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-[#0f172a]">{t.title}</h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {t.pills.map((p) => (
                    <span key={p} className="rounded-full bg-sky-50 text-[#0284c7] px-3 py-1 text-[11px] font-bold">{p}</span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-7">{t.text}</p>
              </div>
              <a href={t.cta.href} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#ff3d00] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#e63700] self-start md:self-center">{t.cta.label} <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
          </div>
        ))}
      </section>

      {/* Auto-renewal — dark band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white p-8 md:p-12">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#00b7ff]/10 blur-3xl pointer-events-none" />
          <div className="relative grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#00b7ff]">Never lose a domain again</p>
              <h2 className="mt-2 text-2xl font-black">Opt for automatic renewal</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Reliability", "Convenience", "Control"].map((p) => (
                  <span key={p} className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold">{p}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-white/75 leading-7">Set up auto-renewal for your domain names, so you have one less thing to worry about. This can help to keep your website or emails running smoothly. You can enable or disable auto-renewal at any time from the GHC Control Panel.</p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <a href="/dashboard?tab=domains" className="inline-flex items-center gap-2 rounded-xl bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Enable now <ArrowRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Assistance and support */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-black text-center text-[#0f172a]">Assistance and support</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, t: "Guides", d: "Step-by-step tutorials on configuring your services.", l: "Access documentation →", href: "/kb" },
              { icon: MessageSquare, t: "Chatbot", d: "The GHC assistant answers 24/7 about our services.", l: "Contact us →", href: "/support" },
              { icon: Headphones, t: "Support Levels", d: "Standard, Premium and Business support for every workload.", l: "Find out more →", href: "/products/support-levels" },
            ].map((a) => (
              <a key={a.t} href={a.href} className="rounded-xl border border-slate-200 bg-white p-6 flex gap-4 hover:border-[#0284c7] hover:shadow-md transition-all">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100">
                  <a.icon className="w-5 h-5 text-[#0284c7]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">{a.t}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-5">{a.d}</p>
                  <p className="mt-2.5 text-xs font-semibold text-[#0284c7]">{a.l}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* To complete */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">To complete your domain names</h2>
        <a href="/web-hosting" className="mt-5 flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#0284c7] hover:shadow-md transition-all max-w-xl">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0b1020]">
            <Server className="w-6 h-6 text-[#00b7ff]" />
          </div>
          <div>
            <p className="text-sm font-black text-[#0f172a]">Web hosting</p>
            <p className="mt-1.5 text-xs text-slate-500 leading-5">Comprehensive packs tailored to all your web projects. Expand your online presence with our web hosting plans, which include a free domain name for the first year* and mailboxes.</p>
            <p className="mt-2.5 text-xs font-bold text-[#0284c7]">Explore our web hosting plans →</p>
          </div>
        </a>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0284c7]" : "text-[#0f172a]"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-slate-600 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
