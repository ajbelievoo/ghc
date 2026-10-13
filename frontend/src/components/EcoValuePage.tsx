"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, ShieldCheck, Zap, LifeBuoy, SlidersHorizontal,
  Boxes, Container, Database, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["How do I configure a dedicated server after ordering?", "After delivery you get root access — install your OS from our catalogue (Linux, Windows, Proxmox, panels), configure disks and RAID, attach IPs and set your firewall. Everything is managed from the control panel or API."],
  ["How much bandwidth does a dedicated server offer?", "Every server includes guaranteed public bandwidth (from 500 Mbps up to 50 Gbps on high-end ranges) with unlimited traffic, plus private bandwidth on our vRack private network for cluster traffic."],
  ["Where can I rent an affordable dedicated server that includes anti-DDoS protection?", "Right here — every GHC dedicated server includes always-on anti-DDoS protection at no extra cost, with entry-level prices starting from our Eco value range."],
  ["What is the best value dedicated server for my project?", "For simple projects and light workloads, choose our lowest-priced servers — unbeatable price-to-performance. For game servers pick the Game range, and for demanding production pick Advance or Scale."],
  ["What are the advantages of a VPS compared to a dedicated server?", "A VPS is cheaper and quicker to resize, while a dedicated server gives you 100% of the hardware, more storage and stable performance. Choose VPS for small sites, dedicated for sustained workloads."],
  ["How do I choose the right configuration (CPU, RAM, disk) for my server?", "Match cores to parallelism, RAM to your working set and disks to capacity/IOPS. Start small — you can migrate to a bigger server later without rebuilding your stack."],
];

function rangeOf(p: any): string {
  const name = p.invoiceName || p.planCode || "";
  const m = name.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)/);
  if (!m) return "Other";
  const lk = m[1].toLowerCase();
  if (lk.startsWith("hgr")) return "High Grade";
  if (lk.startsWith("scale-gpu")) return "Scale GPU";
  if (lk.startsWith("scale")) return "Scale";
  if (lk.startsWith("adv")) return "Advance";
  if (lk.startsWith("game")) return "Game";
  if (lk.startsWith("stor")) return "Storage";
  if (lk.startsWith("hci")) return "Hosted Private Cloud";
  if (lk.startsWith("sds")) return "Software-Defined Storage";
  return m[1].toUpperCase();
}

export default function EcoValuePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Record<string, number>>({});
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const groups = useMemo(() => {
    const map = new Map<string, { p: any; d: any }[]>();
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      if (!d) continue;
      const r = rangeOf(p);
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push({ p, d });
    }
    return [...map.entries()]
      .map(([name, rows]) => ({
        name,
        rows: rows.sort((a, b) => (a.d.monthlyPrice || 0) - (b.d.monthlyPrice || 0)),
        min: Math.min(...rows.map((r) => r.d.monthlyPrice || Infinity)),
      }))
      .sort((a, b) => a.min - b.min);
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-16">
          <p className="text-xs text-white/70">Eco dedicated servers</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Eco</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Dedicated servers at the best value, without compromise</h1>
              <p className="mt-4 text-sm text-white/80 leading-7">
                High-performance dedicated servers, ready for immediate deployment no matter your location. The power of a global cloud at unbeatable prices.
              </p>
              <a href="#servers" className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-slate-100">See the full list of servers</a>
            </div>
            {/* CSS server stack */}
            <div className="hidden md:flex justify-center">
              <div className="space-y-1.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div key={s} className="w-72 h-10 rounded-md bg-gradient-to-b from-[#1c2f66] to-[#14235a] border border-[#00b7ff]/40 flex items-center px-3 gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="w-2 h-2 rounded-full bg-[#00b7ff]" />
                    <div className="flex gap-1 ml-2">
                      {[0, 1, 2, 3].map((b) => <span key={b} className="w-3 h-5 rounded-sm bg-white/10 border border-white/15" />)}
                    </div>
                    <span className="flex-1" />
                    <span className="w-10 h-1.5 rounded bg-white/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* View our servers — grouped tables */}
      <section id="servers" className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">View our servers</h2>
        <p className="mt-2 text-sm text-slate-500">Sorted by price — unbeatable value across every range.</p>
        <div className="mt-8 space-y-10">
          {groups.map((g) => {
            const shown = expanded[g.name] || 5;
            return (
              <div key={g.name}>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-base font-black text-[#0f172a] uppercase tracking-wide">{g.name}</h3>
                  <span className="text-[11px] text-slate-400">({g.rows.length} configurations)</span>
                  <span className="text-[11px] text-[#0284c7] font-semibold">from {sym(g.rows[0]?.d?.currency || "USD")}{g.min.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo</span>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {g.rows.slice(0, shown).map(({ p, d }) => {
                      const cur = d?.currency || p.currency || "USD";
                      return (
                        <div key={p.planCode} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 hover:bg-sky-50/50 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-[#0f172a] uppercase truncate">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                            <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                          </div>
                          <div className="flex items-center gap-5 shrink-0 text-[11px] text-slate-500">
                            {!!p.cpuCores && <span>{p.cpuCores}c</span>}
                            {!!p.ramGb && <span>{p.ramGb} GB</span>}
                            {!!p.diskGb && <span>{p.diskGb >= 1000 ? `${(p.diskGb / 1000).toFixed(0)} TB` : `${p.diskGb} GB`}</span>}
                            <p className="text-sm font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-slate-400">/mo</span></p>
                            <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63700]">Configure</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {g.rows.length > shown && (
                  <div className="mt-3 text-center">
                    <button onClick={() => setExpanded((e) => ({ ...e, [g.name]: shown + 10 }))} className="text-xs font-bold text-[#0284c7] hover:underline">Show more servers ({g.rows.length - shown}) →</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Enjoy the computing power */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">Enjoy the computing power of a physical server at the best price.</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Web hosting", "Game servers", "Archiving and backup"].map((t) => (
                <span key={t} className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-[#0284c7]">{t}</span>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              Why choose a server like this? The price of our servers is more than just a number: it reflects an eco range built on circular economy principles and industrial optimisation. By maintaining control over the entire chain — from server assembly to deployment in our datacentres — we remove any third parties.
            </p>
            <p className="mt-3 text-sm text-slate-600 leading-7">
              This means we can give you unbeatable prices and finally make dedicated servers more reliable and affordable. Whether you are a student, sysadmin, or a small business, you have access to a secure global infrastructure (anti-DDoS included) to host your projects with peace of mind.
            </p>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="space-y-1.5">
              {[0, 1, 2, 3].map((s) => (
                <div key={s} className="w-80 h-12 rounded-lg border-2 border-[#00b7ff]/40 bg-sky-50/60 flex items-center px-4 gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]" />
                  <div className="flex gap-1.5 ml-1">
                    {[0, 1, 2].map((b) => <span key={b} className="w-4 h-6 rounded-sm bg-white border border-slate-200" />)}
                  </div>
                  <span className="flex-1" />
                  <span className="w-12 h-1.5 rounded bg-slate-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Why choose GHC?</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: ShieldCheck, t: "Secure infrastructure", d: "DDoS protection included and certified datacentres." },
            { icon: Zap, t: "Instant deployment", d: "Your server is ready within minutes after ordering." },
            { icon: LifeBuoy, t: "Expert support", d: "Technical team available 24/7 to assist you." },
            { icon: SlidersHorizontal, t: "Total flexibility", d: "Full root access and the possibility to install your preferred OS." },
          ].map((c, i) => (
            <div key={c.t} className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-9 text-center overflow-hidden hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400", "bg-amber-400"][i]}`} />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 border border-sky-100">
                <c.icon className="w-6 h-6 text-[#0284c7]" />
              </div>
              <p className="mt-3 text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-1.5 text-xs text-slate-500 leading-5">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Use cases</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Boxes, t: "Virtualisation", d: "Save time and improve efficiency for your virtual environment projects with pre-installed Proxmox virtualisation systems and Windows Hyper-V Server.", href: "/dedicated-servers/use-cases/virtualisation" },
            { icon: Container, t: "Containerisation", d: "Featuring a high SLA and a well-balanced CPU/RAM ratio, these servers offer the perfect environment for your Kubernetes projects.", href: "/dedicated-servers/use-cases/virtualisation" },
            { icon: Database, t: "Database", d: "When it comes to optimising database operations, our servers with high-performance RAM and storage technologies are the top choice.", href: "/dedicated-servers/storage" },
          ].map((u, i) => (
            <a key={u.t} href={u.href} className="group relative rounded-2xl border border-slate-200 bg-white p-6 pt-8 overflow-hidden hover:border-[#0284c7] hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400"][i]}`} />
              <u.icon className="w-8 h-8 text-[#0284c7]" />
              <p className="mt-3 text-sm font-black text-[#0f172a] group-hover:text-[#0284c7]">{u.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{u.d}</p>
              <p className="mt-3 text-xs font-bold text-[#0284c7] flex items-center gap-1">Learn more <ArrowRight className="w-3.5 h-3.5" /></p>
            </a>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Your questions answered</h2>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0284c7]" : "text-[#0f172a]"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="px-5 pb-5 text-sm text-slate-600 leading-7">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
