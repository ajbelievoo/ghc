"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Search, Loader2, Globe, Lock, KeyRound, ArrowRight,
  ShieldCheck, Wallet, BookOpen, MessageSquare, Headphones, Server, RefreshCw,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

const STEPS = [
  { n: "01", icon: Lock, t: "Unlock your domain", d: "At your current registrar, disable the transfer lock (clientTransferProhibited) so the domain can be moved." },
  { n: "02", icon: Search, t: "Check it on our tool", d: "Search for the domain above or open the transfer form — we verify it's unlocked and transferable." },
  { n: "03", icon: KeyRound, t: "Enter the transfer code", d: "Get the auth/EPP code from your current provider and paste it in. We take care of the rest." },
];

const FAQS: [string, string][] = [
  ["How long does it take to transfer a domain name?", "Most transfers complete within 5–7 days once approved. Some registries are faster; the current registrar can also approve the transfer immediately instead of waiting for the timeout."],
  ["Can I speed up the transfer process?", "Yes — unlock the domain and get the auth code ready before you start, and approve the confirmation email your current registrar sends. Many registrars also offer an 'approve transfer' button that cuts the wait to hours."],
  ["How much does it cost to transfer a domain?", "Transfer price equals a one-year renewal for most extensions — that year is added to your registration, so you don't lose the time already paid for. Pricing per extension is listed in our domain catalogue."],
  ["Can I transfer an expired domain?", "Expired domains generally cannot be transferred — renew it at your current registrar first (it's usually still possible during the grace period), then start the transfer. Recently renewed domains may need to wait ~60 days per registry rules."],
  ["What could cause my transfer to fail?", "A transfer lock still enabled, wrong/expired auth code, domain registered or transferred less than 60 days ago, expired domain, or a rejected confirmation email. Fix the blocker and restart — no charge for failed attempts."],
  ["Will my website go down during the transfer?", "No — DNS settings are carried over, so your website and email keep working throughout. You can update nameservers after the transfer completes."],
];

export default function DomainTransferPage() {
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

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white px-6 py-14 md:py-16 text-center">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#00b7ff]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-[#7c3aed]/20 blur-3xl pointer-events-none" />
          <span className="relative inline-block rounded-full bg-[#00b7ff] text-[#0b1020] px-4 py-1.5 text-[11px] font-black uppercase tracking-widest">Domain transfer</span>
          <h1 className="relative mt-5 text-3xl md:text-4xl font-black leading-tight max-w-2xl mx-auto">Transfer your domain name securely</h1>
          <p className="relative mt-4 text-sm text-white/80 leading-7 max-w-xl mx-auto">Move your domain to GHC in three simple steps — transparent pricing, centralised management and zero downtime.</p>
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
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> No downtime</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> +1 year added on transfer</span>
            <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4" /> Transparent pricing</span>
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400"><a href="/" className="hover:text-[#0284c7]">Home</a> &gt; <a href="/domain" className="hover:text-[#0284c7]">Domain names</a> &gt; Domain transfer</p>
      </section>

      {/* Transfer in three steps — step cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0284c7]">Simple process</p>
            <h2 className="mt-1 text-xl md:text-2xl font-black text-[#0f172a]">Transfer in three steps</h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-6">You can transfer your domain name to GHC in three simple steps. First, disable the transfer lock, then search for the domain in our tool, and finally enter the transfer code from your current provider. We take care of the rest.</p>
          </div>
          <a href="/kb" className="text-xs font-bold text-[#0284c7] hover:underline shrink-0">Explore our guides →</a>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#0284c7] hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black text-sky-100 leading-none">{s.n}</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 border border-sky-100">
                  <s.icon className="w-5 h-5 text-[#0284c7]" />
                </div>
              </div>
              <p className="mt-4 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
              {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3.5 w-7 text-slate-300 font-black text-center">→</div>}
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          <a href="/domain#transfer" className="inline-flex items-center gap-2 rounded-xl bg-[#ff3d00] px-7 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Start my transfer <ArrowRight className="w-4 h-4" /></a>
        </div>
      </section>

      {/* Centralised management — split card */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 md:p-10 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8">
              <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Centralised management and clear pricing</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Efficiency", "Transparency"].map((p) => (
                  <span key={p} className="rounded-full bg-sky-50 text-[#0284c7] px-3 py-1 text-[11px] font-bold">{p}</span>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-600 leading-7">Consolidate your domain names with GHC to manage everything from one interface: renewals, transfers, subdomains, DNS zones, and associated emails. Transparent pricing keeps your budget predictable, with no unexpected costs at renewal.</p>
              <a href="/domain#tlds" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#0284c7] hover:underline">View our prices <ArrowRight className="w-4 h-4" /></a>
            </div>
            <div className="md:col-span-4">
              <div className="rounded-2xl bg-[#0b1020] p-6 text-white">
                <Globe className="w-8 h-8 text-[#00b7ff]" />
                <ul className="mt-4 space-y-2.5 text-xs text-white/75">
                  {["All domains in one Control Panel", "DNS zones, subdomains & contacts together", "One renewal calendar, predictable prices", "WHOIS privacy where supported"].map((b) => (
                    <li key={b} className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Assistance */}
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
