"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Cpu, Gauge, ShieldCheck, Leaf, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["What is grid computing?", "Grid computing connects many machines into a single virtual system that shares processing power for compute-intensive tasks. A large job is split into smaller units, distributed across nodes, then aggregated into a result — delivering supercomputer-class capacity from standard servers."],
  ["Why choose dedicated servers for grid computing?", "Bare-metal servers give you the full, predictable performance of the CPU and RAM with no hypervisor overhead — critical when jobs run for hours at 100% utilisation. You also control the OS, scheduling software and network fabric end to end."],
  ["Which business sectors are best served by grid computing?", "Finance (risk calculation, portfolio simulation), life sciences (molecular modelling, genomics), engineering (crash and fluid simulations), energy, research and any field where massive parallel computation shortens time-to-result."],
  ["Why choose GHC for your grid computing project?", "Servers designed for grid computing, with high core counts, generous bandwidth, anti-DDoS protection and private networking between nodes — so your cluster scales horizontally without unpredictable cloud billing."],
];

export default function GridComputingPage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const gridPlans = useMemo(() => {
    const tagged = plans.filter((p) =>
      String(p.features?.["baremetal-server-usecases"] || "").includes("grid-computing")
    );
    const list = tagged.length ? tagged : plans.filter((p) => String(p.family || p.category || "").toUpperCase().includes("SCALE"));
    return list.slice(0, 6).map((p) => {
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      return { p, d };
    });
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Grid computing</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Grid computing</p>
          <h1 className="mt-10 text-3xl md:text-4xl font-black leading-tight max-w-3xl">
            Deploy compute-intensive models for your critical issues
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-7 max-w-2xl">
            Whether for risk calculation, portfolio valuation or molecular simulations — for massive computing jobs like Monte-Carlo analysis and simulations of critical configurations requiring enormous processing power, we offer dedicated servers designed for grid computing.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Powerful solutions to tackle grid computing challenges</h2>
        <p className="mt-2 text-sm text-slate-500">Deploy servers engineered for sustained, parallel, compute-heavy workloads.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Cpu, t: "Optimised price-performance ratio at the core", d: "By combining a strong performance base and predictable fixed pricing, our servers are designed for grid computing at the core. You get maximal processing capability for your investment — no per-second billing surprises." },
            { icon: Gauge, t: "Ability to handle high workloads", d: "High core counts, large memory configurations and fast storage let you split a huge workload across machines. Our servers run at full utilisation for as long as the job demands." },
            { icon: ShieldCheck, t: "High availability and reliability", d: "Thanks to our own global network and infrastructure, your grid keeps running. Anti-DDoS protection and redundant connectivity are included on every node." },
          ].map((c, i) => (
            <div key={c.t} className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-9 overflow-hidden hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400"][i]}`} />
              <c.icon className="w-9 h-9 text-[#0284c7]" />
              <p className="mt-4 text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Responsible solution */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="rounded-3xl border border-slate-200 bg-sky-50/50 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 border border-emerald-200">
                <Leaf className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="mt-4 text-xl font-black text-[#0f172a]">A responsible solution</h2>
              <p className="mt-3 text-xs text-slate-600 leading-6">
                For more than 20 years, our commitment to innovation has been focused on reducing the impact of our infrastructure on the planet — so your compute-heavy workloads run more sustainably.
              </p>
            </div>
            <ul className="space-y-2.5">
              {[
                "Increasing our use of renewable and low-carbon energy year after year",
                "Energy-efficient server design, reused components and extended hardware lifecycles",
                "Water-cooling innovation that dramatically reduces power consumption",
                "Free cooling and heat recovery in our datacentres",
                "Transparent carbon reporting across our global footprint",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{b}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Get a quote band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#155e75] to-[#00b7ff] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Get a quote</h2>
          <p className="mt-2 text-sm text-white/80">Our experts will contact you.</p>
          <a href="/support" className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-[#0284c7] hover:bg-slate-100">Get started</a>
        </div>
      </section>

      {/* Recommended servers */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Servers recommended for grid computing</h2>
        <p className="mt-2 text-sm text-slate-500">High core counts and sustained performance for distributed compute clusters.</p>
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridPlans.map(({ p, d }) => {
            const cur = d?.currency || p.currency || "USD";
            return (
              <div key={p.planCode} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-[#0284c7] hover:shadow-lg transition-all flex flex-col">
                <p className="text-sm font-black text-[#0f172a] uppercase">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                <p className="mt-1 text-xs text-slate-500 flex-1 line-clamp-3">{p.description}</p>
                <div className="mt-4 flex items-center gap-3 text-[11px] text-slate-500">
                  {!!p.cpuCores && <span>{p.cpuCores} cores</span>}
                  {!!p.ramGb && <span>{p.ramGb} GB RAM</span>}
                </div>
                {d && <p className="mt-3 text-lg font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[11px] font-normal text-slate-400">/mo</span></p>}
                <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="mt-3 w-full rounded-lg bg-[#ff3d00] py-2.5 text-xs font-bold text-white hover:bg-[#e63700] flex items-center justify-center gap-1.5">
                  Configure <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
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
