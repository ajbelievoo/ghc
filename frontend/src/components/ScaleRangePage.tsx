"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown, Cpu, ArrowRight, Network, Server, Zap, HardDrive, MapPin,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["What should a Scale server be used for?", "Scale servers are engineered for demanding workloads — virtualisation clusters, big databases, HPC, CI/CD fleets and large container platforms that need massive core counts and memory."],
  ["Where would my data be hosted?", "Scale servers deploy across multiple regions on several continents — pick the location closest to your users during configuration."],
  ["What is the private network?", "vRack gives you isolated layer-2 private networking between your servers with up to 50 Gbps private bandwidth — ideal for cluster replication and storage traffic."],
  ["What are the technical specifications of the Scale range?", "AMD EPYC 9004/9005 platforms with up to 384 cores (dual socket), up to 2 TB DDR5 ECC, up to 8+ NVMe Gen4/Gen5 drives and 25 Gbps network ports."],
  ["Are Scale servers certified ISO 27001?", "Our datacentres and management processes carry industry certifications including ISO 27001 — see compliance docs for per-region coverage."],
  ["Why choose a Scale dedicated server?", "Predictable fixed pricing on the highest-density bare metal we sell — enterprise CPUs, water-cooling sustained boost, redundant power and 99.99% SLA."],
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
  return "Other";
}

const RANGE_META: Record<string, { href: string; desc: string }> = {
  Game: { href: "/dedicated-servers/game", desc: "High-frequency processors for online gaming" },
  Advance: { href: "/dedicated-servers/advance", desc: "Powerful versatility for common workloads" },
  Scale: { href: "/dedicated-servers/scale", desc: "Computing power for the most demanding workloads" },
  "High Grade": { href: "/dedicated-servers/high-grade", desc: "High performance for critical workloads" },
};

const MATRIX: { label: string; vals: Record<string, string> }[] = [
  { label: "CPU cores", vals: { Game: "From 8 – 16 cores", Advance: "From 6 – 16 cores", Scale: "From 16 – 384 cores", "High Grade": "From 16 – 192 cores" } },
  { label: "RAM", vals: { Game: "64 – 96 GB DDR5", Advance: "From 64 GB – 256 GB", Scale: "From 128 GB – 2 TB", "High Grade": "From 128 GB – 2 TB" } },
  { label: "Storage disks", vals: { Game: "2 disks", Advance: "2 – 4 disks", Scale: "2 – 26 disks", "High Grade": "2 – 36 disks" } },
  { label: "Public bandwidth", vals: { Game: "1 Gbps", Advance: "500 Mbps – 1 Gbps", Scale: "1 – 25 Gbps", "High Grade": "1 – 25 Gbps" } },
  { label: "Private bandwidth", vals: { Game: "1 Gbps", Advance: "25 Gbps", Scale: "50 Gbps", "High Grade": "50 Gbps" } },
  { label: "Anti-DDoS", vals: { Game: "✓", Advance: "✓", Scale: "✓", "High Grade": "✓" } },
  { label: "SLA", vals: { Game: "99.90%", Advance: "99.95%", Scale: "99.99%", "High Grade": "99.99%" } },
];

export default function ScaleRangePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(8);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const { scaleRows, regionCount, rangeMin } = useMemo(() => {
    const regs = new Set<string>();
    const scaleRows: { p: any; d: any }[] = [];
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      const r = rangeOf(p);
      if (d && RANGE_META[r]) {
        const cur = d.currency || p.currency || "USD";
        if (!rangeMin[r] || d.monthlyPrice < rangeMin[r].price) rangeMin[r] = { price: d.monthlyPrice, cur };
      }
      if (r === "Scale" && d) {
        scaleRows.push({ p, d });
        (p.regions || []).forEach((x: string) => regs.add(x));
      }
    }
    scaleRows.sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
    return { scaleRows, regionCount: regs.size || 10, rangeMin };
  }, [plans]);

  return (
    <div className="min-h-screen bg-[#16181d] text-white">
      <Navbar />

      {/* Range tabs */}
      <div className="border-b border-white/10 sticky top-0 z-30 bg-[#16181d]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {Object.keys(RANGE_META).map((r) => (
            <a key={r} href={RANGE_META[r].href} className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${r === "Scale" ? "border-[#00b7ff] text-[#00b7ff]" : "border-transparent text-white/50 hover:text-white"}`}>{r}</a>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="text-[11px] text-white/40"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Scale</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-black">Built for eco-friendly performance</h1>
        <p className="mt-4 text-sm text-white/70 leading-7 max-w-3xl">
          We design our racks in-house to maintain smooth performance as the infrastructure expands. With complete control over thermal performance, we keep your compute dense and efficient — power performance is consistent and reliable, so you can focus on building the services you run on it.
        </p>
        {/* CSS chassis */}
        <div className="mt-8 hidden md:flex justify-center">
          <div className="w-full max-w-2xl h-24 rounded-xl bg-gradient-to-b from-[#22252e] to-[#16181d] border border-white/15 flex items-center px-8 gap-6">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="flex gap-2">{[0,1,2,3,4,5].map(i => <span key={i} className="w-7 h-11 rounded bg-white/10 border border-white/20" />)}</div>
            <div className="flex-1 h-14 rounded bg-white/10 border border-white/20 grid grid-cols-12 gap-1 p-1.5">
              {Array.from({length: 12}).map((_, i) => <span key={i} className="rounded-sm bg-[#00b7ff]/20" />)}
            </div>
            <Server className="w-8 h-8 text-[#00b7ff]" />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
          <div>
            <p className="text-xs text-white/40">Up to</p>
            <p className="text-2xl font-black">{scaleRows.length} servers</p>
            <p className="text-xs text-white/50">in a rack space</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Deployable in</p>
            <p className="text-2xl font-black">{regionCount} regions</p>
            <p className="text-xs text-white/50">across 4 continents</p>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-start">
            <a href="#scale-plans" className="rounded-lg bg-[#00b7ff] px-6 py-2.5 text-sm font-bold text-[#16181d] hover:bg-sky-400">See Scale servers →</a>
          </div>
        </div>
      </section>

      {/* Network built to scale */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="hidden md:block">
            <div className="w-full max-w-md mx-auto h-20 rounded-lg bg-[#0b1020] border border-[#00b7ff]/30 flex items-center px-5 gap-2">
              {Array.from({length: 10}).map((_, i) => (
                <span key={i} className="flex-1 h-7 rounded bg-[#14235a] border border-[#00b7ff]/30 relative">
                  <span className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
              ))}
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({length: 10}).map((_, i) => (
                <span key={i} className="w-px h-8 bg-gradient-to-b from-[#00b7ff] to-transparent" />
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black">A network built to scale without slowing down</h2>
            <p className="mt-3 text-sm text-white/70 leading-7">
              High-capacity fabric enables guaranteed bandwidth across regions, so your cluster keeps talking fast as it grows. This architecture prevents congestion and keeps latency low — scaling your cluster never means slowing down its performance.
            </p>
            <div className="mt-6">
              <p className="text-2xl font-black text-[#00b7ff]">4 × 25 Gbps</p>
              <p className="text-xs text-white/50">network ports</p>
            </div>
          </div>
        </div>
      </section>

      {/* CPU cards */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">AMD EPYC 9004/9005 series</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1c2f66] to-[#0b1020] border border-[#00b7ff]/40 flex items-center justify-center">
                <Cpu className="w-7 h-7 text-[#00b7ff]" />
              </div>
              <div><p className="text-[10px] text-white/40">Up to</p><p className="text-xl font-black">384 cores</p><p className="text-[10px] text-white/40">with dual socket platforms</p></div>
            </div>
            <p className="mt-4 text-xs text-white/60 leading-5">Massive core density per node — consolidate whole clusters into fewer servers with high-throughput EPYC compute.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Intel Xeon 6 series</p>
            <div className="mt-4 flex items-center gap-5">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#1c2f66] to-[#0b1020] border border-[#00b7ff]/40 flex items-center justify-center">
                <Cpu className="w-7 h-7 text-sky-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[10px] text-white/40">Up to</p><p className="text-xl font-black">32 cores</p><p className="text-[10px] text-white/40">per CPU</p></div>
                <div><p className="text-[10px] text-white/40">Up to</p><p className="text-xl font-black">4.2 GHz</p><p className="text-[10px] text-white/40">boost frequency</p></div>
              </div>
            </div>
            <p className="mt-4 text-xs text-white/60 leading-5">For more demanding workloads at the top end of the range, select configurations also feature Intel Xeon 6, delivering higher single-thread and advanced performance capabilities where needed.</p>
          </div>
        </div>
      </section>

      {/* Redundant PSU + NVMe */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="hidden md:flex justify-center gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="w-32 h-20 rounded-lg bg-[#22252e] border border-white/15 flex items-center justify-center relative">
                  <Zap className="w-8 h-8 text-amber-400" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-400" />
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-xl font-black">Uptime guaranteed even when hardware fails</h2>
              <p className="mt-3 text-sm text-white/70 leading-7">
                Redundant power supplies keep servers alive during maintenance or hardware failure. Even if a power component is swapped out, the platform stays online and applications remain available — protecting your services and your business from avoidable interruptions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-xl font-black">Storage speed that keeps applications responsive</h2>
              <p className="mt-3 text-sm text-white/70 leading-7">
                Eliminate I/O bottlenecks with ultra-fast NVMe storage, optimised for low latency and high concurrent access. Databases respond instantly, cache layers stay efficient, and performance remains consistent even under heavy access — so applications keep up as demand grows.
              </p>
              <div className="mt-6">
                <p className="text-xs text-white/40">Up to</p>
                <p className="text-2xl font-black text-[#00b7ff]">8 × NVMe SSD</p>
                <p className="text-xs text-white/50">per server</p>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
              <div className="w-64 h-28 rounded-lg bg-[#0b1020] border border-white/15 flex items-center justify-center gap-2 relative overflow-hidden">
                <span className="absolute left-0 top-0 bottom-0 w-4 bg-amber-400/30 border-r border-amber-400/50" />
                <HardDrive className="w-10 h-10 text-[#00b7ff]" />
                <div><p className="text-sm font-black">SSD NVMe</p><p className="text-[10px] text-white/40">GHC</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Peak CPU performance */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <h2 className="text-xl md:text-2xl font-black max-w-xl">Peak CPU performance — with zero throttling</h2>
          <p className="mt-3 text-sm text-white/70 leading-7 max-w-xl">
            By extracting heat directly from the CPU, water blocks prevent thermal throttling and allow processors to operate at their true maximum potential. There are no drops in performance over time — even during sustained workloads — enabling faster processing and consistent results for your applications.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="hidden md:flex justify-center">
              <div className="relative w-40 h-40">
                <div className="absolute inset-4 rounded-lg bg-gradient-to-b from-[#22252e] to-[#16181d] border border-white/20" />
                <div className="absolute inset-x-6 top-6 h-3 rounded-full bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400" />
                <div className="absolute inset-x-8 top-12 h-3 rounded-full bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400" />
                <div className="absolute left-1/2 bottom-5 -translate-x-1/2 w-10 h-10 rounded bg-[#0b1020] border border-[#00b7ff]/40 flex items-center justify-center"><Cpu className="w-5 h-5 text-[#00b7ff]" /></div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-2xl font-black text-[#00b7ff]">Full</p>
              <p className="text-xs text-white/50">boost frequency maintained during extended peaks</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs text-white/40">Up to</p>
              <p className="text-2xl font-black text-[#00b7ff]">15°C</p>
              <p className="text-xs text-white/50">of additional thermal headroom before reaching critical limit</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3-AZ resilience */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-black">A resilient architecture in the Region with 3 availability zones (3-AZ)</h2>
            <p className="mt-3 text-sm text-white/70 leading-7">
              Deploy latency-sensitive workloads close to users while benefiting from a resilient multi-AZ architecture. Independent availability zones enable high-availability designs, cross-AZ replication and seamless failover, keeping services online even if a datacentre becomes unavailable.
            </p>
            <a href="/dedicated-servers/use-cases/az-resilience" className="mt-5 inline-block text-xs font-bold text-[#00b7ff] hover:underline">Learn more about multi-AZ regions →</a>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="relative w-64 h-44 rounded-2xl border border-white/10 bg-white/[0.04]">
              <MapPin className="absolute left-10 top-8 w-7 h-7 text-[#00b7ff]" />
              <MapPin className="absolute right-12 top-5 w-7 h-7 text-[#00b7ff]" />
              <MapPin className="absolute left-24 bottom-8 w-7 h-7 text-[#00b7ff]" />
              {["AZ1", "AZ2", "AZ3"].map((az, i) => (
                <span key={az} className="absolute text-[9px] font-black text-white/60" style={{ left: [44, 175, 100][i], top: [62, 38, 128][i] }}>{az}</span>
              ))}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 256 176">
                <line x1="52" y1="52" x2="182" y2="32" stroke="#00b7ff" strokeOpacity="0.4" strokeDasharray="4 3" />
                <line x1="52" y1="52" x2="108" y2="120" stroke="#00b7ff" strokeOpacity="0.4" strokeDasharray="4 3" />
                <line x1="182" y1="32" x2="108" y2="120" stroke="#00b7ff" strokeOpacity="0.4" strokeDasharray="4 3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Discover ranges */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <h2 className="text-xl font-black text-center">Discover GHC dedicated servers</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RANGE_META).map(([r, meta]) => {
              const mn = rangeMin[r];
              const active = r === "Scale";
              return (
                <a key={r} href={meta.href} className={`rounded-2xl border-2 p-5 transition-all ${active ? "border-[#00b7ff] bg-[#00b7ff]/10 shadow-md" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                  <p className="text-sm font-black">{r}</p>
                  <p className="mt-1 text-[11px] text-white/50 leading-4 h-9">{meta.desc}</p>
                  {mn && <p className="mt-3 text-xs text-white/50">Starting from <span className="text-base font-black">{sym(mn.cur)}{mn.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span><span className="text-[10px] text-white/40">/mo</span></p>}
                  <span className={`mt-3 inline-block w-full text-center rounded-lg py-2 text-xs font-bold ${active ? "bg-[#00b7ff] text-[#16181d]" : "bg-white/10 text-white"}`}>Discover →</span>
                </a>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-4 py-3 font-black text-white/40 w-36"></th>
                  {Object.keys(RANGE_META).map((r) => (
                    <th key={r} className={`px-4 py-3 text-center font-black ${r === "Scale" ? "text-[#00b7ff] bg-[#00b7ff]/10" : "text-white"}`}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MATRIX.map((row) => (
                  <tr key={row.label} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-bold text-white/50">{row.label}</td>
                    {Object.keys(RANGE_META).map((r) => (
                      <td key={r} className={`px-4 py-2.5 text-center text-white/60 ${r === "Scale" ? "bg-[#00b7ff]/5 font-semibold text-white" : ""}`}>{row.vals[r]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 text-center">
            <a href="/dedicated-servers" className="inline-block rounded-lg border border-[#00b7ff] px-6 py-2.5 text-xs font-bold text-[#00b7ff] hover:bg-[#00b7ff]/10">View more →</a>
          </div>
        </div>
      </section>

      {/* Scale plan table */}
      <section id="scale-plans" className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black">Explore our selection of Scale servers</h2>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="divide-y divide-white/5">
            {scaleRows.slice(0, visible).map(({ p, d }) => {
              const cur = d?.currency || p.currency || "USD";
              const isNew = !!p.features?.["last-generation"];
              return (
                <div key={p.planCode} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 hover:bg-white/[0.05] transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black uppercase truncate">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                      {isNew && <span className="rounded-full bg-violet-500/20 text-violet-300 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">New</span>}
                    </div>
                    <p className="text-[11px] text-white/40 truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <p className="text-sm font-black">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-white/40">/mo</span></p>
                    <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#00b7ff] px-4 py-2 text-xs font-bold text-[#16181d] hover:bg-sky-400">Order</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {scaleRows.length > visible && (
          <div className="mt-5 text-center">
            <button onClick={() => setVisible((v) => v + 10)} className="inline-block rounded-lg bg-white/10 px-6 py-2.5 text-xs font-bold hover:bg-white/20">Show more servers ({scaleRows.length - visible})</button>
          </div>
        )}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black">Your questions answered</h2>
        <div className="mt-5 divide-y divide-white/10 border-t border-b border-white/10">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#00b7ff]" : "text-white"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-white/60 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
