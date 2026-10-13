"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Network, Cpu, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["What should an Advance server be used for?", "Advance servers are versatile machines for everyday workloads — web hosting, business applications, small virtualisation clusters, databases and pre-production environments."],
  ["What is an Advance server used for?", "They balance price and performance: AMD EPYC 4005 or Intel Xeon 6 CPUs, DDR5 ECC memory and NVMe or SATA storage — enough for most production workloads without enterprise pricing."],
  ["Where would my data be hosted?", "Advance servers deploy across multiple datacentre regions — you pick the location closest to your users during configuration."],
  ["What is the private network?", "Our private network (vRack) links your servers across datacentres in an isolated layer-2 network with guaranteed private bandwidth — free with your server."],
  ["Are Advance servers certified ISO 27001?", "Our datacentres and processes are covered by industry certifications including ISO 27001 — see the compliance section for per-region coverage."],
  ["What are the technical specifications of the Advance range?", "Up to 16 cores per CPU, boost frequencies up to 5.7 GHz, DDR5 ECC memory, PCIe Gen4/Gen5 NVMe storage and 25 Gbps private bandwidth — varies by model."],
  ["Which is the best server?", "For web hosting pick the entry Advance models; for virtualisation and databases choose 16-core EPYC or Xeon variants with NVMe — use the comparison table above."],
  ["Why choose a preconfigured Advance dedicated server?", "Preconfigured models are optimised by our teams for common workloads and deploy faster — same hardware, less decision fatigue."],
];

function rangeOf(p: any): string {
  const name = p.invoiceName || "";
  const m = name.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)/);
  if (!m) return "Other";
  const lk = m[1].toLowerCase();
  if (lk.startsWith("hgr")) return "High Grade";
  if (lk.startsWith("scale")) return "Scale";
  if (lk.startsWith("adv")) return "Advance";
  if (lk.startsWith("game")) return "Game";
  if (lk.startsWith("stor")) return "Storage";
  return "Other";
}

const RANGE_META: Record<string, { href: string; desc: string }> = {
  Game: { href: "/dedicated-servers/game", desc: "High-frequency processors for online gaming" },
  Advance: { href: "/dedicated-servers/advance", desc: "Powerful versatility for common workloads" },
  Scale: { href: "/dedicated-servers/scale", desc: "Computing power for the most demanding workloads" },
  "High Grade": { href: "/dedicated-servers/high-grade", desc: "High performance for critical workloads" },
};

const MATRIX: { label: string; vals: Record<string, string> }[] = [
  { label: "CPU cores", vals: { Game: "Up to 24 cores", Advance: "From 6 – 16 cores", Scale: "From 16 – 384 cores", "High Grade": "From 16 – 192 cores" } },
  { label: "RAM", vals: { Game: "DDR5 ECC up to 128 GB", Advance: "DDR4/DDR5 ECC up to 256 GB", Scale: "DDR5 ECC up to 2 TB", "High Grade": "DDR5 ECC up to 1.5 TB" } },
  { label: "Storage", vals: { Game: "NVMe Gen4", Advance: "NVMe Gen4 / SATA", Scale: "NVMe Gen4/Gen5, up to 26 disks", "High Grade": "NVMe, SAS, up to 36 disks" } },
  { label: "Public bandwidth", vals: { Game: "1 Gbps", Advance: "500 Mbps – 1 Gbps", Scale: "1 – 25 Gbps", "High Grade": "1 – 25 Gbps" } },
  { label: "Private bandwidth", vals: { Game: "—", Advance: "25 Gbps", Scale: "50 Gbps", "High Grade": "50 Gbps" } },
  { label: "Anti-DDoS", vals: { Game: "✓", Advance: "✓", Scale: "✓", "High Grade": "✓" } },
  { label: "vRack private network", vals: { Game: "—", Advance: "✓", Scale: "✓", "High Grade": "✓" } },
  { label: "SLA", vals: { Game: "99.90%", Advance: "99.95%", Scale: "99.99%", "High Grade": "99.99%" } },
  { label: "Cooling", vals: { Game: "Air", Advance: "Industrial water-cooling", Scale: "Industrial water-cooling", "High Grade": "Industrial water-cooling" } },
];

export default function AdvanceRangePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(8);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const { advRows, regionCount, rangeMin } = useMemo(() => {
    const regs = new Set<string>();
    const advRows: { p: any; d: any }[] = [];
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      const r = rangeOf(p);
      if (d && RANGE_META[r]) {
        const cur = d.currency || p.currency || "USD";
        if (!rangeMin[r] || d.monthlyPrice < rangeMin[r].price) rangeMin[r] = { price: d.monthlyPrice, cur };
      }
      if (r === "Advance" && d) {
        advRows.push({ p, d });
        (p.regions || []).forEach((x: string) => regs.add(x));
      }
    }
    advRows.sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
    return { advRows, regionCount: regs.size || 10, rangeMin };
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Range tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {Object.keys(RANGE_META).map((r) => (
            <a key={r} href={RANGE_META[r].href} className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${r === "Advance" ? "border-[#0284c7] text-[#0284c7]" : "border-transparent text-slate-500 hover:text-[#0f172a]"}`}>{r}</a>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="text-[11px] text-slate-400"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Advance</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-black text-[#0f172a]">Reliable performance for everyday workloads</h1>
        <p className="mt-4 text-sm text-slate-600 leading-7 max-w-3xl">
          Standard racks provide consistent airflow and stable temperatures, which are excellent for everyday workloads. Applications run smoothly, without requiring advanced cooling systems or very high-density configurations. This offers businesses a way to achieve predictable performance with no added complexity.
        </p>
        {/* CSS chassis */}
        <div className="mt-8 hidden md:flex justify-center">
          <div className="w-full max-w-2xl h-24 rounded-xl bg-gradient-to-b from-slate-100 to-slate-200 border border-slate-300 flex items-center px-8 gap-6 shadow-sm">
            <div className="flex gap-2">{[0,1,2,3].map(i => <span key={i} className="w-8 h-10 rounded bg-slate-300 border border-slate-400" />)}</div>
            <div className="flex-1 h-12 rounded bg-slate-300/70 border border-slate-400 grid grid-cols-8 gap-1 p-1.5">
              {Array.from({length: 8}).map((_, i) => <span key={i} className="rounded-sm bg-slate-400/50" />)}
            </div>
            <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /></div>
          </div>
        </div>
        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
          <div>
            <p className="text-xs text-slate-400">Up to</p>
            <p className="text-2xl font-black text-[#0f172a]">{advRows.length} servers</p>
            <p className="text-xs text-slate-500">in the Advance range</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Deployable in</p>
            <p className="text-2xl font-black text-[#0f172a]">{regionCount} regions</p>
            <p className="text-xs text-slate-500">across 4 continents</p>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-start">
            <a href="#adv-plans" className="rounded-lg bg-[#ff3d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">View Advance servers →</a>
          </div>
        </div>
      </section>

      {/* Network connectivity */}
      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* CSS switch */}
          <div className="hidden md:block">
            <div className="w-full max-w-md mx-auto h-20 rounded-lg bg-[#0b1020] border border-[#1c2f66] flex items-center px-5 gap-2">
              {Array.from({length: 8}).map((_, i) => (
                <span key={i} className="flex-1 h-7 rounded bg-[#14235a] border border-[#00b7ff]/30 relative">
                  <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
              ))}
            </div>
            <div className="flex justify-center gap-1 mt-0">
              {Array.from({length: 8}).map((_, i) => (
                <span key={i} className="w-px h-8 bg-gradient-to-b from-[#00b7ff] to-transparent" />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Simplified and stable network connectivity</h2>
            <p className="mt-3 text-sm text-slate-600 leading-7">
              A straightforward network topology keeps latency predictable and bandwidth easy to manage. This architecture is particularly suitable for hosting environments, small-scale virtualisation deployments, and business applications that require reliability more than ultra-low-latency fabrics.
            </p>
          </div>
        </div>
      </section>

      {/* CPU cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AMD EPYC 4005 series</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#0b1020] to-[#14307c] border border-[#00b7ff]/30 flex items-center justify-center">
                <Cpu className="w-7 h-7 text-[#00b7ff]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] text-slate-400">Up to</p><p className="text-xl font-black text-[#0f172a]">16 cores</p><p className="text-[10px] text-slate-400">per CPU</p></div>
                <div><p className="text-[10px] text-slate-400">Up to</p><p className="text-xl font-black text-[#0f172a]">5.7 GHz</p><p className="text-[10px] text-slate-400">boost frequency</p></div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-5">The AMD EPYC 4005 series provides the right balance of frequency and core count to keep business applications responsive and consistent — performant on CPU, lightweight databases and web services for small virtual environments.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intel Xeon 6 series</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1e2a5a] to-[#2b3a75] border border-sky-300/30 flex items-center justify-center">
                <Cpu className="w-7 h-7 text-sky-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] text-slate-400">Efficient</p><p className="text-xl font-black text-[#0f172a]">E-cores</p><p className="text-[10px] text-slate-400">dense compute</p></div>
                <div><p className="text-[10px] text-slate-400">Memory</p><p className="text-xl font-black text-[#0f172a]">DDR5</p><p className="text-[10px] text-slate-400">latest generation</p></div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 leading-5">Intel Xeon 6 brings efficient performance cores, DDR5 memory and modern I/O — a dependable platform for consolidation, web and application hosting on the Advance range.</p>
          </div>
        </div>
      </section>

      {/* Stable CPU performance */}
      <section className="border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Stable CPU performance for everyday workloads</h2>
          <p className="mt-3 text-sm text-slate-600 leading-7 max-w-3xl">
            The chosen cooling systems enable CPUs to run at their maximum boost clock with stable performance. These chips are well-cooled and can use turbo and boost frequencies constantly — the system stays stable, predictable and easy to manage.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl">
            {[
              { v: "8%", d: "performance variation during peak usage" },
              { v: "250 W TDP", d: "CPU thermal envelope supported by the cooling system" },
              { v: "1.15", d: "Power Usage Effectiveness (PUE) target with water-cooling technology" },
            ].map((s) => (
              <div key={s.v} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                <p className="text-2xl font-black text-[#0284c7]">{s.v}</p>
                <p className="mt-1.5 text-[11px] text-slate-500 leading-4">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discover dedicated servers — range cards + matrix */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Discover GHC dedicated servers</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(RANGE_META).map(([r, meta], i) => {
            const mn = rangeMin[r];
            const active = r === "Advance";
            return (
              <a key={r} href={meta.href} className={`rounded-2xl border-2 p-5 transition-all ${active ? "border-[#0284c7] bg-sky-50/50 shadow-md" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                <p className="text-sm font-black text-[#0f172a]">{r}</p>
                <p className="mt-1 text-[11px] text-slate-500 leading-4 h-9">{meta.desc}</p>
                {mn && <p className="mt-3 text-xs text-slate-500">Starting from <span className="text-base font-black text-[#0f172a]">{sym(mn.cur)}{mn.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span><span className="text-[10px] text-slate-400">/mo</span></p>}
                <span className={`mt-3 inline-block w-full text-center rounded-lg py-2 text-xs font-bold ${active ? "bg-[#ff3d00] text-white" : "bg-[#0b1020] text-white"}`}>Discover →</span>
              </a>
            );
          })}
        </div>
        {/* Comparison matrix */}
        <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[640px] text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 font-black text-slate-500 w-36"></th>
                {Object.keys(RANGE_META).map((r) => (
                  <th key={r} className={`px-4 py-3 text-center font-black ${r === "Advance" ? "text-[#0284c7] bg-sky-50" : "text-[#0f172a]"}`}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX.map((row) => (
                <tr key={row.label} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-bold text-slate-500">{row.label}</td>
                  {Object.keys(RANGE_META).map((r) => (
                    <td key={r} className={`px-4 py-2.5 text-center text-slate-600 ${r === "Advance" ? "bg-sky-50/50 font-semibold text-[#0f172a]" : ""}`}>{row.vals[r]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 text-center">
          <a href="/dedicated-servers" className="inline-block rounded-lg border border-[#0284c7] px-6 py-2.5 text-xs font-bold text-[#0284c7] hover:bg-sky-50">View less →</a>
        </div>
      </section>

      {/* Advance plan table */}
      <section id="adv-plans" className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Explore our selection of Advance servers</h2>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {advRows.slice(0, visible).map(({ p, d }) => {
              const cur = d?.currency || p.currency || "USD";
              const isNew = !!p.features?.["last-generation"];
              return (
                <div key={p.planCode} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 hover:bg-sky-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#0f172a] uppercase truncate">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                      {isNew && <span className="rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">New</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <p className="text-sm font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-slate-400">/mo</span></p>
                    <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63700]">Order</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {advRows.length > visible && (
          <div className="mt-5 text-center">
            <button onClick={() => setVisible((v) => v + 10)} className="inline-block rounded-lg bg-[#0b1020] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#101d42]">Show more servers ({advRows.length - visible})</button>
          </div>
        )}
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
