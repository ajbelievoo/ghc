"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Globe, MapPin, Database, Layers, Boxes, ArrowRight,
  BookOpen, Server, Info,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["Will all regions benefit from multi-AZ in the future?", "3-AZ deployment is rolling out progressively across regions. Regions with three independent availability zones are announced as they reach production readiness — watch the status page and changelog."],
  ["What can I deploy on a 3-AZ Region?", "Any workload that must survive a site failure: replicated databases, virtualisation clusters, distributed storage and highly available web applications. Combine servers across zones with private networking for true fault tolerance."],
  ["What is the difference between a region and an AZ?", "A region is a geographical area (e.g. Paris, Mumbai). An availability zone (AZ) is an isolated site inside a region with independent power, cooling and network. A 3-AZ region lets you spread replicas across three sites for maximum resilience."],
];

export default function AzResiliencePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [cmpTab, setCmpTab] = useState(0);
  const [visible, setVisible] = useState(10);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const rows = useMemo(() => {
    // 3-AZ compatible ranges per our catalog: Scale + High Grade (multi-AZ use-case plans)
    const groups = new Map<string, { p: any; d: any; locations: number; isRegional: boolean }>();
    for (const p of plans) {
      if (p.isActive === false) continue;
      const name = (p.invoiceName || "").toLowerCase();
      const useCases = (p.useCases || p.use_cases || []).join(" ").toLowerCase();
      const isScale = name.startsWith("scale") || name.startsWith("hgr");
      const isMultiAz = useCases.includes("multi-az") || useCases.includes("multi az");
      if (!isScale && !isMultiAz) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      if (!d) continue;
      const key = String(p.planCode || "").split("-").slice(0, 2).join("-");
      const isRegional = /-(syd|mum|sgp|waw|gra|rbx|sbg|bhs|lon|eri|lim|par)$/i.test(String(p.planCode));
      const prev = groups.get(key);
      if (!prev || (prev.isRegional && !isRegional) || (prev.isRegional === isRegional && d.monthlyPrice < prev.d.monthlyPrice)) {
        groups.set(key, { p, d, locations: (prev?.locations || 0) + 1, isRegional });
      } else {
        prev.locations += 1;
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — navy + node map */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">AZ and resilience</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; AZ and resilience</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Improve the resilience of your services</h1>
              <p className="mt-4 text-sm text-white/80 leading-7">
                To strengthen your service continuity and make your services highly available, it is vital to distribute them across several sites. We provide a 3-AZ region: this is why we designed our multi-AZ Regions.
              </p>
              <ul className="mt-5 space-y-2">
                {["3 independent availability zones", "Minimum 30 km distance between AZs", "An independent low-latency network"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold"><Check className="w-4 h-4 text-emerald-400 shrink-0" />{b}</li>
                ))}
              </ul>
            </div>
            {/* CSS region map */}
            <div className="flex justify-center">
              <div className="relative w-72 h-56">
                <svg viewBox="0 0 200 160" className="w-full h-full">
                  <path d="M60,20 L120,15 L160,40 L170,80 L150,120 L110,145 L70,140 L40,110 L35,60 Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <line x1="70" y1="55" x2="135" y2="50" stroke="#00b7ff" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="70" y1="55" x2="100" y2="115" stroke="#00b7ff" strokeWidth="1.5" strokeDasharray="4 3" />
                  <line x1="135" y1="50" x2="100" y2="115" stroke="#00b7ff" strokeWidth="1.5" strokeDasharray="4 3" />
                  {[[70, 55], [135, 50], [100, 115]].map(([x, y], i) => (
                    <g key={i}>
                      <circle cx={x} cy={y} r="16" fill="#0b1020" stroke="#00b7ff" strokeWidth="1.5" />
                      <text x={x} y={y + 4} textAnchor="middle" fill="#00b7ff" fontSize="9" fontWeight="900">AZ{i + 1}</text>
                    </g>
                  ))}
                  <text x="100" y="100" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">3-AZ</text>
                  <text x="100" y="112" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="700">Region</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why deploy — 3 cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Why deploy your infrastructure in our 3-AZ Region?</h2>
        <p className="mt-2 text-sm text-slate-500">By deploying your services across several AZs, you can make your key cases more reliable and resilient.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Layers, t: "Virtualisation and containerisation", d: "Combine the performance of these clusters and deploy your own virtualisation, storage and networking capabilities in several zones with full isolation." },
            { icon: Database, t: "Database replication", d: "Deploy your databases (MySQL, PostgreSQL, etc.) across several zones to guarantee high availability and resilience of your data." },
            { icon: Boxes, t: "Storage distribution", d: "Replicating your storage on a dedicated server gives you a resilient architecture for file sharing, backup and disaster recovery." },
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

      {/* 1-AZ vs 3-AZ — tabbed comparison */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Key differences between a 1-AZ Region and a 3-AZ Region</h2>
        <div className="mt-6 flex justify-center">
          <div className="inline-flex gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-1.5">
            {["3-AZ Region", "1-AZ Region"].map((t, i) => (
              <button key={t} onClick={() => setCmpTab(i)} className={`rounded-full px-5 py-2 text-xs font-bold transition ${cmpTab === i ? "bg-[#0b1020] text-white shadow" : "text-slate-500 hover:text-[#0f172a]"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-sky-50/50 p-6 md:p-10">
          {cmpTab === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-40 h-40 rounded-full border-2 border-dashed border-[#00b7ff]/50 flex items-center justify-center relative">
                    <span className="absolute -top-3 bg-[#0b1020] text-[#00b7ff] text-[9px] font-black px-2 py-0.5 rounded-full">1 AZ Region</span>
                    {[[0, -52], [45, 26], [-45, 26]].map(([x, y], i) => (
                      <span key={i} className="absolute w-10 h-10 rounded-full bg-[#0b1020] border-2 border-[#00b7ff] flex items-center justify-center text-[9px] font-black text-[#00b7ff]" style={{ transform: `translate(${x}px, ${y}px)` }}>AZ{i + 1}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-[#0f172a]">3-AZ Region</h3>
                <p className="mt-2 text-xs text-slate-600 leading-6">A 3-AZ Region comprises three availability zones (AZs) in completely independent locations, connected by a high-bandwidth, low-latency private network.</p>
                <ul className="mt-3 space-y-2">
                  {["At least 30 km between each AZ in the region", "Independent power, cooling and network per AZ", "Data and service replication for near-zero downtime", "Designed for mission-critical, regulated workloads"].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <div className="w-40 h-40 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center relative">
                  <span className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black text-white">AZ1</span>
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-[#0f172a]">1-AZ Region</h3>
                <p className="mt-2 text-xs text-slate-600 leading-6">A standard single-zone region: all infrastructure sits in one availability zone. It is ideal for development, staging and workloads that can tolerate a site-level interruption.</p>
                <ul className="mt-3 space-y-2">
                  {["Single datacentre zone per region", "Lower cost, simplest deployment", "Best for non-critical and dev workloads", "Combine two 1-AZ regions for DIY redundancy"].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Server table — 3-AZ compatible ranges, real specs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Deploy on our dedicated servers</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">Compatible ranges for multi-AZ deployments: Scale and High Grade servers with high private bandwidth for cross-zone replication.</p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 font-black text-slate-500">Name</th>
                <th className="px-4 py-3 font-black text-slate-500">Processor</th>
                <th className="px-4 py-3 font-black text-slate-500">Memory</th>
                <th className="px-4 py-3 font-black text-slate-500">Storage</th>
                <th className="px-4 py-3 font-black text-slate-500">Bandwidth</th>
                <th className="px-4 py-3 font-black text-slate-500 text-right">Price</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, visible).map(({ p, d, locations }: any) => {
                const cur = d?.currency || p.currency || "USD";
                const spec = p.spec || {};
                const name = p.displayName || (p.invoiceName || p.planCode).split("|")[0].trim();
                return (
                  <tr key={p.planCode} className="hover:bg-sky-50/50 transition-colors">
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#0f172a]">{name}</span>
                        {locations >= 3 && <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">Multi-DC</span>}
                      </div>
                      {locations > 1 && <p className="mt-0.5 text-[10px] text-slate-400">{locations} locations</p>}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-500">{spec.cpu || p.description || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.ram || (p.ramGb ? `${p.ramGb} GB` : "—")}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.storage || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.bandwidth || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                      <span className="text-sm font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] font-normal text-slate-400">/mo</span>
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63700] whitespace-nowrap">Configure</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > visible && (
          <div className="mt-5 text-center">
            <button onClick={() => setVisible((v) => v + 10)} className="text-xs font-bold text-[#0284c7] hover:underline">Show more servers ({rows.length - visible}) →</button>
          </div>
        )}
      </section>

      {/* Infra cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Server, t: "Our global infrastructure", d: "With more than 40 datacentres, our infrastructure allows you to deploy your services and solutions anywhere in the world.", l: "Find out more →", href: "/network" },
            { icon: MapPin, t: "Our Regions", d: "27 Regions, 43+ zones and 38+ PoPs on five continents — optimal coverage for your cloud projects.", l: "Find out more →", href: "/network" },
            { icon: BookOpen, t: "Glossary", d: "Each concept is explained simply and precisely in our glossary, to make your choice easier.", l: "Find out more →", href: "/kb" },
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
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#155e75] to-[#00b7ff] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Make your services highly resilient with our 3-AZ regions</h2>
          <a href="/support" className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-[#0284c7] hover:bg-slate-100">Contact our teams</a>
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
