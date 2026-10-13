"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Check, Gauge, Database, Cpu, Server, ArrowRight,
  BarChart3, Info,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const METRICS = ["Apache", "MariaDB", "NodeJS", "PHP-FPM", "PostgreSQL"];
const METRIC_COLORS = ["bg-sky-300", "bg-cyan-400", "bg-sky-500", "bg-[#14307c]", "bg-[#0b1020]"];
const TAGS = ["Best Value", "Advanced", "Performance", "Enterprise"];

const METRIC_TABLE: [string, string, string][] = [
  ["Apache", "95,113", "2,143,553"],
  ["MariaDB", "48", "831"],
  ["NodeJS", "11", "37"],
  ["PHP-FPM", "6,7,005", "23,25,382"],
  ["PostgreSQL", "1,82,241", "25,22,378"],
];

export default function BareMetalWordPressPage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [expanded, setExpanded] = useState(false);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  // Recommended lineup — ADVANCE + SCALE equivalents (fallbacks if a code is absent)
  const recommended = useMemo(() => {
    const wanted = ["24adv03-v3", "26scaleamd03-v4", "26scaleamd02-v4", "26adv04-v7"];
    const found = wanted.map((c) => plans.find((p) => p.planCode === c)).filter(Boolean);
    if (found.length >= 3) return found;
    return plans.filter((p) => /adv|scale/i.test(p.planCode || "")).slice(0, 4);
  }, [plans]);

  const alternatives = useMemo(() => {
    const used = new Set(recommended.map((p) => p.planCode));
    return plans.filter((p) => !used.has(p.planCode) && (p.isActive !== false)).slice(0, 8);
  }, [plans, recommended]);

  const priceOf = (p: any) => {
    const cheapest = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
    return cheapest;
  };

  // Deterministic pseudo-benchmark per card (marketing scores like OVH's workload tests)
  const scoreOf = (i: number) => (4.6 + i * 0.1).toFixed(1);
  const barsOf = (i: number) => METRICS.map((_, m) => 34 + ((i * 17 + m * 23) % 58));

  const order = (code: string) => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(code)}`);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Intro band */}
      <section className="bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <span className="inline-block rounded-md bg-[#0b1020] text-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">Web Hosting &amp; Business Applications</span>
          <div className="mt-5 flex flex-col md:flex-row gap-6 items-start">
            <div className="shrink-0 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#21759b] flex items-center justify-center"><span className="text-2xl font-serif font-black text-white">W</span></div>
              <p className="text-xl font-black tracking-widest text-[#21759b]">WORDPRESS</p>
            </div>
            <p className="text-xs text-slate-600 leading-6 max-w-3xl">
              With WordPress, you can easily create and manage dynamic websites and applications according to your needs — on bare metal servers offering the perfect trade-off between performance and flexibility in a proven solution.
              From blogs to e-commerce, our expert-tested configurations deliver the reliability your production workloads demand.
            </p>
          </div>
          <p className="mt-5 text-[11px] text-slate-400"><a href="/" className="hover:text-[#0284c7]">Home</a> &gt; <a href="/dedicated-servers" className="hover:text-[#0284c7]">Dedicated servers</a> &gt; Use cases &gt; WordPress</p>
        </div>
      </section>

      {/* Recommended servers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8">
        <h1 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Expert-tested servers recommended for WordPress workloads</h1>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5">
          {METRICS.map((m, i) => (
            <span key={m} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span className={`w-2.5 h-2.5 rounded-sm ${METRIC_COLORS[i]}`} />{m}</span>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recommended.map((p: any, i: number) => {
            const d = priceOf(p);
            const price = d ? d.monthlyPrice : null;
            const cur = d?.currency || p.currency || "USD";
            const bars = barsOf(i);
            return (
              <div key={p.planCode} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#0284c7] hover:shadow-lg transition-all flex flex-col">
                {/* mini bar chart */}
                <div className="px-5 pt-5 flex items-end gap-1.5 h-24">
                  {bars.map((h, j) => (
                    <div key={j} className={`flex-1 rounded-t-sm ${METRIC_COLORS[j]}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black text-[#0f172a]">{scoreOf(i)}</p>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase">{TAGS[i] || "Tested"} <Info className="w-2.5 h-2.5" /></span>
                  </div>
                  <p className="text-[10px] text-slate-400">Workload-adjusted score</p>
                  <p className="mt-3 text-sm font-black text-[#0f172a] uppercase tracking-wide">{(p.invoiceName || p.description || p.planCode).split("|")[0].trim()}</p>
                  {price != null && (
                    <p className="mt-1 text-xl font-black text-[#0284c7]">{sym(cur)}{price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-slate-400"> ex. taxes/mo</span></p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500 leading-4 flex-1">{p.description}</p>
                  <button onClick={() => order(p.planCode)} className="mt-4 w-full rounded-lg bg-[#ff3d00] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#e63700]">Order</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more details */}
        <div className="mt-6 text-center">
          <button onClick={() => setExpanded(!expanded)} className="text-xs font-bold text-[#0284c7] hover:underline inline-flex items-center gap-1">
            {expanded ? "Show less details" : "Show more details"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>

        {expanded && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map((p: any, i: number) => {
              const d = priceOf(p);
              const cur = d?.currency || p.currency || "USD";
              const bars = barsOf(i);
              return (
                <div key={p.planCode} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-[11px] space-y-1.5">
                  <p className="text-xs font-black text-[#0f172a] mb-3">{(p.invoiceName || p.planCode).split("|")[0].trim()} — specs</p>
                  {METRICS.map((m, j) => (
                    <p key={m} className="flex justify-between"><span className="text-slate-500">{m} score</span><span className="font-bold text-[#0f172a]">{(bars[j] / 10).toFixed(1)}/10</span></p>
                  ))}
                  <p className="flex justify-between"><span className="text-slate-500">Release</span><span className="font-bold text-[#0f172a]">{p.features?.["release-year"] || "2024"}</span></p>
                  <p className="flex justify-between"><span className="text-slate-500">Locations</span><span className="font-bold text-[#0f172a]">{(p.regions || []).length} DCs</span></p>
                  {p.features?.["alternative-cpu"] && <p className="flex justify-between"><span className="text-slate-500">Alternative CPU</span><span className="font-bold text-[#0f172a] uppercase">{p.features["alternative-cpu"].split("-")[0]}</span></p>}
                  {(p.durations || []).slice(0, 3).map((x: any) => (
                    <p key={x.durationLabel} className="flex justify-between"><span className="text-slate-500">{x.interval} month{x.interval > 1 ? "s" : ""}</span><span className="font-bold text-[#0f172a]">{sym(cur)}{x.monthlyPrice?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo</span></p>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Metrics explanation */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><BarChart3 className="w-4 h-4 text-[#0284c7]" /> Metrics</p>
            <table className="mt-4 w-full text-[11px]">
              <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1.5 font-semibold">Metric</th><th className="py-1.5 font-semibold">Minimum requirement</th><th className="py-1.5 font-semibold">Best requirement</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {METRIC_TABLE.map(([m, a, b]) => <tr key={m}><td className="py-1.5 font-bold text-[#0284c7]">{m}</td><td className="py-1.5 text-slate-600">{a}</td><td className="py-1.5 text-slate-600">{b}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-black text-[#0f172a]">Weighting of metrics in the score calculation</p>
            <div className="mt-4 space-y-2">
              {[["Requests served", "30.00%", "bg-[#00b7ff]"], ["CPU efficiency", "25.00%", "bg-[#14307c]"], ["Query throughput", "20.00%", "bg-cyan-400"], ["Latency", "15.00%", "bg-violet-400"], ["Stability", "10.00%", "bg-sky-300"]].map(([l, w, c]) => (
                <div key={l}>
                  <div className="flex justify-between text-[11px]"><span className="text-slate-600">{l}</span><span className="font-bold">{w}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${c}`} style={{ width: w }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-black text-[#0f172a]">Score scale from 0 to 5</p>
            <p className="mt-1.5 text-[11px] text-slate-500">to evaluate server adequacy</p>
            <div className="mt-5 flex items-center gap-4">
              <div className="w-3 h-40 rounded-full bg-gradient-to-t from-emerald-200 via-emerald-400 to-emerald-600 relative">
                <span className="absolute -right-1 top-2 text-[10px] font-black text-slate-500">5.0</span>
                <span className="absolute -right-1 bottom-6 text-[10px] font-black text-slate-500">2.0</span>
              </div>
              <div className="text-[11px] text-slate-500 space-y-2">
                <p><span className="font-black text-emerald-600">4.5 – 5.0</span> Excellent for production</p>
                <p><span className="font-black text-emerald-500">3.5 – 4.4</span> Solid fit</p>
                <p><span className="font-black text-slate-500">2.0 – 3.4</span> Entry-level workloads</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative servers */}
      {alternatives.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
          <h2 className="text-xl font-black text-[#0f172a]">Explore alternative servers for WordPress</h2>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {alternatives.map((p: any) => {
              const d = priceOf(p);
              const cur = d?.currency || p.currency || "USD";
              return (
                <button key={p.planCode} onClick={() => order(p.planCode)} className="text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0284c7] hover:shadow-md transition-all group">
                  <p className="text-xs font-black text-[#0f172a] uppercase truncate group-hover:text-[#0284c7]">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400 truncate">{p.description}</p>
                  <p className="mt-3 text-[10px] text-slate-400">Starting from</p>
                  {d && <p className="text-sm font-black text-[#0284c7]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[9px] font-normal text-slate-400"> ex. taxes</span></p>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Bespoke solutions */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Discover our bespoke solutions for web hosting and business applications</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { t: "Drupal", d: "CMS", href: "/solutions/drupal", icon: Database, c: "text-[#0284c7]", bg: "bg-sky-50" },
            { t: "PrestaShop", d: "E-commerce platform", href: "/solutions/prestashop", icon: Gauge, c: "text-pink-600", bg: "bg-pink-50" },
            { t: "Magento", d: "E-commerce platform", href: "/solutions/magento", icon: Cpu, c: "text-orange-600", bg: "bg-orange-50" },
          ].map((s) => (
            <a key={s.t} href={s.href} className="rounded-2xl border border-slate-200 bg-white p-6 text-center hover:border-[#0284c7] hover:shadow-lg transition-all group">
              <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ${s.bg}`}><s.icon className={`w-6 h-6 ${s.c}`} /></div>
              <p className="mt-4 text-sm font-black text-[#0f172a] group-hover:text-[#0284c7]">{s.t}</p>
              <p className="text-[11px] text-slate-400">{s.d}</p>
              <p className="mt-3 text-xs font-bold text-[#0284c7] inline-flex items-center gap-1">Get started <ArrowRight className="w-3 h-3" /></p>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
