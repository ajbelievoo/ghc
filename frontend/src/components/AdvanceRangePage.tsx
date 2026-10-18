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
  ["What should an Core server be used for?", "Core servers are versatile machines for everyday workloads — web hosting, business applications, small virtualisation clusters, databases and pre-production environments."],
  ["What is an Core server used for?", "They balance price and performance: AMD EPYC 4005 or Intel Xeon 6 CPUs, DDR5 ECC memory and NVMe or SATA storage — enough for most production workloads without enterprise pricing."],
  ["Where would my data be hosted?", "Core servers deploy across multiple datacentre regions — you pick the location closest to your users during configuration."],
  ["What is the private network?", "Our private network (vRack) links your servers across datacentres in an isolated layer-2 network with guaranteed private bandwidth — free with your server."],
  ["Are Core servers certified ISO 27001?", "Our datacentres and processes are covered by industry certifications including ISO 27001 — see the compliance section for per-region coverage."],
  ["What are the technical specifications of the Core range?", "Up to 16 cores per CPU, boost frequencies up to 5.7 GHz, DDR5 ECC memory, PCIe Gen4/Gen5 NVMe storage and 25 Gbps private bandwidth — varies by model."],
  ["Which is the best server?", "For web hosting pick the entry Core models; for virtualisation and databases choose 16-core EPYC or Xeon variants with NVMe — use the comparison table above."],
  ["Why choose a preconfigured Core dedicated server?", "Preconfigured models are optimised by our teams for common workloads and deploy faster — same hardware, less decision fatigue."],
];

function rangeOf(p: any): string {
  const name = p.invoiceName || "";
  const m = name.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)/);
  if (!m) return "Other";
  const lk = m[1].toLowerCase();
  if (lk.startsWith("hgr")) return "Elite";
  if (lk.startsWith("scale")) return "Flex";
  if (lk.startsWith("adv")) return "Core";
  if (lk.startsWith("game")) return "Arena";
  if (lk.startsWith("stor")) return "Vault";
  return "Other";
}

const RANGE_META: Record<string, { href: string; desc: string }> = {
  Arena: { href: "/dedicated-servers/game", desc: "High-frequency processors for online gaming" },
  Core: { href: "/dedicated-servers/advance", desc: "Powerful versatility for common workloads" },
  Flex: { href: "/dedicated-servers/scale", desc: "Computing power for the most demanding workloads" },
  "Elite": { href: "/dedicated-servers/high-grade", desc: "High performance for critical workloads" },
};

type Row = { label: string; vals: string[]; summary?: boolean };
const R4 = (a: string, b: string, c: string, d: string) => [a, b, c, d];
const DETAIL: { title: string; rows: Row[] }[] = [
  { title: "CPU", rows: [
    { label: "CPU single socket", vals: R4("✓", "✓", "✓", "✓") },
    { label: "CPU dual socket", vals: R4("–", "–", "✓", "✓") },
    { label: "GPU", vals: R4("–", "–", "✓", "✓") },
    { label: "Cores span", vals: R4("from 8 – 16 cores", "from 6 – 24 cores", "from 16 – 384 cores", "from 16 – 192 cores"), summary: true },
  ] },
  { title: "RAM", rows: [
    { label: "RAM type", vals: R4("DDR5 On-Die ECC", "DDR5 On-Die ECC / DDR5 ECC", "DDR5 ECC", "DDR4 ECC / DDR5 ECC") },
    { label: "RAM quantity", vals: R4("from 64 GB – 256 GB", "from 32 GB – 1 TB", "from 128 GB – 3 TB", "from 128 GB – 3 TB"), summary: true },
  ] },
  { title: "Storage", rows: [
    { label: "Storage interface", vals: R4("PCIe Gen 4.0", "PCIe Gen 4.0 / Gen 5.0", "PCIe Gen 4.0 / Gen 5.0", "PCIe Gen 4.0 / Gen 5.0") },
    { label: "Storage disks quantity", vals: R4("2 disks", "from 2 – 8 disks", "from 2 – 6 disks", "from 2 – 36 disks"), summary: true },
    { label: "Storage type", vals: R4("NVMe", "HDD SAS, NVMe", "NVMe", "HDD SAS, NVMe, SSD") },
  ] },
  { title: "Network", rows: [
    { label: "Public bandwidth", vals: R4("1 Gbps", "from 1 – 5 Gbps", "from 1 – 25 Gbps", "from 1 – 25 Gbps"), summary: true },
    { label: "Private bandwidth", vals: R4("–", "25 Gbps", "50 Gbps", "from 50 – 100 Gbps"), summary: true },
    { label: "DDoS protection", vals: R4("✓", "✓", "✓", "✓") },
    { label: "Anti-DDoS Arena", vals: R4("✓", "–", "–", "–") },
    { label: "IPMI", vals: R4("✓", "✓", "✓", "✓") },
    { label: "Load balancer", vals: R4("✓", "✓", "✓", "✓") },
    { label: "Link aggregation", vals: R4("✓", "✓", "✓", "✓") },
    { label: "vRack private network", vals: R4("✓", "✓", "✓", "✓") },
  ] },
  { title: "Features", rows: [
    { label: "FTP backup", vals: R4("✓", "✓", "✓", "✓") },
    { label: "Dual power supply", vals: R4("–", "–", "✓", "✓") },
    { label: "Hot swap disks", vals: R4("–", "–", "✓", "✓") },
    { label: "Capacity upgrade (RAM, storage)", vals: R4("–", "✓", "✓", "✓") },
  ] },
  { title: "Observability", rows: [
    { label: "OS installation logs", vals: R4("Coming soon", "Coming soon", "Coming soon", "Coming soon") },
    { label: "PXE boot logs", vals: R4("Coming soon", "Coming soon", "Coming soon", "Coming soon") },
    { label: "Netboot logs", vals: R4("Coming soon", "Coming soon", "Coming soon", "Coming soon") },
    { label: "BMC logs & metrics", vals: R4("Coming soon", "Coming soon", "Coming soon", "Coming soon") },
  ] },
  { title: "SLA", rows: [
    { label: "Rate", vals: R4("99.95%", "99.95%", "99.99%", "99.99%") },
  ] },
  { title: "Infrastructure", rows: [
    { label: "Cooling system", vals: R4("Industrial watercooling", "Industrial watercooling", "Industrial watercooling", "Industrial watercooling") },
  ] },
];
const CARD_BG: Record<string, string> = {
  Arena: "bg-[#14161d] text-white",
  Core: "bg-slate-100 text-[#0f172a]",
  Flex: "bg-[#4b4d52] text-white",
  "Elite": "bg-[#14161d] text-white",
};

export default function AdvanceRangePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(6);
  const [showMatrix, setShowMatrix] = useState(false);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const { advRows, regionCount, rangeMin } = useMemo(() => {
    const regs = new Set<string>();
    const groups = new Map<string, { p: any; d: any; locations: number }>();
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      const r = rangeOf(p);
      if (d && RANGE_META[r]) {
        const cur = d.currency || p.currency || "USD";
        if (!rangeMin[r] || d.monthlyPrice < rangeMin[r].price) rangeMin[r] = { price: d.monthlyPrice, cur };
      }
      if (r !== "Core" || !d) continue;
      (p.regions || []).forEach((x: string) => regs.add(x));
      // One row per server model+revision — regional variants (…-syd/-mum) group together.
      const key = String(p.planCode || "").split("-").slice(0, 2).join("-");
      const isRegional = /-(syd|mum|sgp|waw|gra|rbx|sbg|bhs|lon|eri|lim|par)$/i.test(String(p.planCode));
      const prev = groups.get(key) as any;
      if (!prev || (prev.isRegional && !isRegional) || (prev.isRegional === isRegional && d.monthlyPrice < prev.d.monthlyPrice)) {
        groups.set(key, { p, d, locations: (prev?.locations || 0) + 1, isRegional } as any);
      } else {
        prev.locations += 1;
      }
    }
    const advRows = Array.from(groups.values()).sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
    return { advRows, regionCount: regs.size || 10, rangeMin };
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Range tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {Object.keys(RANGE_META).map((r) => (
            <a key={r} href={RANGE_META[r].href} className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${r === "Core" ? "border-[#0284c7] text-[#0284c7]" : "border-transparent text-slate-500 hover:text-[#0f172a]"}`}>{r}</a>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="text-[11px] text-slate-400"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Core</p>
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
            <p className="text-xs text-slate-500">in the Core range</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Deployable in</p>
            <p className="text-2xl font-black text-[#0f172a]">{regionCount} regions</p>
            <p className="text-xs text-slate-500">across 4 continents</p>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-start">
            <a href="#adv-plans" className="rounded-lg bg-[#ff3d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">View Core servers →</a>
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
            <p className="mt-4 text-xs text-slate-500 leading-5">Intel Xeon 6 brings efficient performance cores, DDR5 memory and modern I/O — a dependable platform for consolidation, web and application hosting on the Core range.</p>
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

      {/* Discover dedicated servers — one aligned comparison grid, expands in place */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Discover GHC dedicated servers</h2>
        <div className="mt-8 overflow-x-auto">
          <div className="min-w-[760px] grid grid-cols-[170px_repeat(4,minmax(0,1fr))] gap-x-3">
            <div />
            {Object.entries(RANGE_META).map(([r, meta]) => {
              const mn = rangeMin[r];
              const active = r === "Core";
              return (
                <div key={r} className={`rounded-t-xl p-4 flex flex-col ${CARD_BG[r]} ${active ? "border-2 border-b-0 border-[#0284c7]" : ""}`}>
                  <p className="text-lg font-black">{r}</p>
                  <p className={`mt-1 text-[11px] leading-4 min-h-[44px] ${r === "Core" ? "text-slate-600" : "text-white/80"}`}>{meta.desc}</p>
                  {mn && (
                    <p className={`mt-3 text-[10px] ${r === "Core" ? "text-slate-500" : "text-white/70"}`}>Starting from
                      <span className="block text-xl font-black">{sym(mn.cur)}{mn.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal opacity-70"> ex. VAT/month</span></span>
                    </p>
                  )}
                  <a href={meta.href} className="mt-3 block rounded-md bg-[#0050d7] py-2 text-center text-xs font-bold text-white hover:bg-[#0043b3]">Discover →</a>
                </div>
              );
            })}

            {DETAIL.map((sec, si) => {
              const rows = showMatrix ? sec.rows : sec.rows.filter((x) => x.summary);
              if (!rows.length) return null;
              const lastSection = (showMatrix ? si === DETAIL.length - 1 : si === DETAIL.findLastIndex((d) => d.rows.some((x) => x.summary)));
              return (
                <div key={sec.title} className="contents">
                  <p className="col-span-5 mt-4 mb-1 text-[11px] font-black text-[#0f172a] border-b border-slate-200 pb-1">{sec.title}</p>
                  {rows.map((row, ri) => {
                    const lastRow = lastSection && ri === rows.length - 1;
                    return (
                      <div key={row.label} className="contents">
                        <div className="py-2 pr-2 text-[11px] text-slate-500 self-center">{row.label}</div>
                        {Object.keys(RANGE_META).map((r, ci) => {
                          const v = row.vals[ci];
                          const active = r === "Core";
                          return (
                            <div key={r} className={`py-2 px-2 text-center text-[11px] self-center ${active ? `bg-sky-50/70 border-x-2 border-[#0284c7] ${lastRow ? "border-b-2 rounded-b-xl pb-3" : ""}` : "bg-slate-50/60"} ${v === "✓" ? "text-emerald-600 font-bold" : v === "–" ? "text-slate-300" : v === "Coming soon" ? "text-slate-400" : "text-[#0f172a] font-semibold"}`}>{v}</div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => setShowMatrix((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-[#0050d7] hover:underline">
            {showMatrix ? "View less" : "View more"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMatrix ? "rotate-180" : ""}`} />
          </button>
        </div>
      </section>

      {/* Core plan table */}
      <section id="adv-plans" className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Explore our selection of Core servers</h2>
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
              {advRows.slice(0, visible).map(({ p, d, locations }: any) => {
                const cur = d?.currency || p.currency || "USD";
                const isNew = String(p.features?.["release-year"] || "") === "2026" || String(p.features?.["last-generation"]) === "true";
                const spec = p.spec || {};
                const name = p.displayName || (p.invoiceName || p.planCode).split("|")[0].trim();
                return (
                  <tr key={p.planCode} className="hover:bg-sky-50/50 transition-colors">
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#0f172a]">{name}</span>
                        {isNew && <span className="rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">New</span>}
                      </div>
                      {locations > 1 && <p className="mt-0.5 text-[10px] text-slate-400">{locations} locations</p>}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-600">{spec.cpu || p.description || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-600 whitespace-nowrap">{spec.ram || (p.ramGb ? `${p.ramGb} GB` : "—")}</td>
                    <td className="px-4 py-3.5 align-top text-slate-600 whitespace-nowrap">{spec.storage || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-600 whitespace-nowrap">{spec.bandwidth || (p.bandwidthMbps ? `${p.bandwidthMbps >= 1000 ? `${p.bandwidthMbps / 1000} Gbps` : `${p.bandwidthMbps} Mbps`}` : "—")}</td>
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
        {advRows.length > visible && (
          <div className="mt-5 text-center">
            <a href="/dedicated-servers/prices?range=advance" className="inline-block rounded-lg bg-[#0050d7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0043b3]">Show more servers →</a>
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
