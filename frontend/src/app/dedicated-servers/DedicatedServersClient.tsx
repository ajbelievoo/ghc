"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Server, Cpu, Droplets, Network, ShieldCheck, Gauge, Scale3d, Recycle,
  FileText, BadgeCheck, ChevronDown, Zap,
  Boxes, Activity, ArrowRight, Check, Minus, Database as DatabaseIcon,
} from "lucide-react";

interface Plan {
  planCode: string;
  invoiceName: string;
  family?: string;
  cpuCores?: number | null;
  ramGb?: number | null;
  bandwidthMbps?: number | null;
  currency?: string;
  durations?: { durationLabel: string; monthlyPrice?: number; currency?: string }[];
}

/* ── Range classification (matches OVH bare-metal ranges) ── */
function planRange(p: Plan): string | null {
  const name = (p.invoiceName || "").toUpperCase();
  const code = p.planCode.toLowerCase();
  if (name.startsWith("GAME")) return "Game";
  if (name.startsWith("ADVANCE-STOR") || code.includes("advstor") || name.startsWith("STOR") || /\bSDS\b/.test(name)) return "Storage";
  if (name.startsWith("ADVANCE")) return "Advance";
  if (/scale.?gpu/i.test(code) || /GPU/i.test(name)) return "Scale GPU";
  if (name.startsWith("SCALE") || code.includes("scale")) return "Scale";
  if (/(^|[\s-])(HGR|HGSTOR|HGRAI|HCI|HCISAP|RISE)/.test(name) || code.includes("hci") || code.includes("hg") || code.includes("rise")) return "High Grade";
  if (name.startsWith("STOR") || code.includes("stor")) return "Storage";
  return null;
}

const RANGE_CARDS: {
  id: string; name: string; href: string; desc: string;
  match: (r: string | null) => boolean;
}[] = [
  { id: "game", name: "Game", href: "/dedicated-servers/game", desc: "High-frequency servers optimised for gaming and low-latency workloads.", match: (r) => r === "Game" },
  { id: "advance", name: "Advance", href: "/dedicated-servers/advance", desc: "Versatile servers for SMEs, agencies and developers.", match: (r) => r === "Advance" },
  { id: "scale", name: "Scale", href: "/dedicated-servers/scale", desc: "High-end servers for complex, high-resilience infrastructures.", match: (r) => r === "Scale" || r === "Scale GPU" },
  { id: "high-grade", name: "High Grade", href: "/dedicated-servers/high-grade", desc: "Mission-critical servers for HCI, SAP, storage and AI.", match: (r) => r === "High Grade" },
  { id: "storage", name: "Storage", href: "/dedicated-servers/storage", desc: "High-capacity servers for backups, archives and big data.", match: (r) => r === "Storage" },
];

const RANGE_FEATURES: { label: string; per: Record<string, string | boolean> }[] = [
  { label: "Public bandwidth", per: { game: "1 Gbps", advance: "1 Gbps", scale: "2x 10 Gbps", "high-grade": "10 Gbps", storage: "1 Gbps" } },
  { label: "Private bandwidth (vRack)", per: { game: true, advance: true, scale: true, "high-grade": true, storage: true } },
  { label: "Public IPv4 included", per: { game: true, advance: true, scale: true, "high-grade": true, storage: true } },
  { label: "Anti-DDoS protection", per: { game: "Game DDoS", advance: true, scale: true, "high-grade": true, storage: true } },
  { label: "SLA", per: { game: "99.90%", advance: "99.90%", scale: "99.99%", "high-grade": "99.99%", storage: "99.90%" } },
];

const USE_CASES = [
  { icon: Boxes, tag: "Virtualisation", title: "Consolidate. Containerize. Go at full speed.", desc: "Deploy Proxmox, VMware or Kubernetes on isolated bare metal — full control, no noisy neighbours.", cta: { label: "Discover virtualisation", href: "/private-cloud" } },
  { icon: Activity, tag: "Resilience", title: "Stay online, whatever happens.", desc: "Anti-DDoS, guaranteed bandwidth and redundant network links keep your services reachable.", cta: { label: "Discover resilience", href: "/dedicated-servers/advance" } },
  { icon: DatabaseIcon, tag: "Data", title: "Structure your data. Power through your work.", desc: "High-capacity storage servers for databases, analytics pipelines and backup repositories.", cta: { label: "Discover storage", href: "/dedicated-servers/storage" } },
  { icon: Zap, tag: "Media", title: "Encode faster. Stream without limits.", desc: "High-frequency CPUs and GPU options for transcoding, rendering and game streaming.", cta: { label: "Discover game servers", href: "/dedicated-servers/game" } },
];

const FEATURE_TABS: { id: string; label: string; items: { t: string; d: string }[] }[] = [
  {
    id: "antiddos", label: "Anti-DDoS",
    items: [
      { t: "Included Anti-DDoS protection", d: "Every dedicated server ships with always-on DDoS mitigation at the network edge — at no extra cost." },
      { t: "Game DDoS protection", d: "Game-range servers add protocol-aware filtering for UDP game traffic." },
      { t: "Firewall network", d: "Optional edge firewall rules configurable from the control panel." },
    ],
  },
  {
    id: "software", label: "Software",
    items: [
      { t: "90+ distributions", d: "Install Linux, Windows Server, Proxmox, VMware ESXi and control panels in one click." },
      { t: "API & automation", d: "Provision, reboot and reinstall via the GHC API and Terraform-compatible workflows." },
      { t: "Backup options", d: "FTP backup storage, snapshots and managed backup add-ons." },
    ],
  },
  {
    id: "vrack", label: "vRack",
    items: [
      { t: "vRack private network", d: "Connect your servers across datacentres on an isolated layer-2 network." },
      { t: "Private bandwidth", d: "Unmetered private traffic between your servers — build clusters freely." },
      { t: "Load balancing", d: "Combine with Load Balancer and Floating IPs for HA architectures." },
    ],
  },
  {
    id: "observability", label: "Observability",
    items: [
      { t: "Metrics & monitoring", d: "Bandwidth, health and availability graphs in the dashboard." },
      { t: "Logs", d: "Service logs and order history with full OVH API traceability." },
      { t: "Alerts", d: "Renewal, suspension and provisioning alerts by email." },
    ],
  },
  {
    id: "sla", label: "SLA",
    items: [
      { t: "Up to 99.99% SLA", d: "Scale and High Grade ranges carry enhanced availability SLAs." },
      { t: "Guaranteed bandwidth", d: "Public bandwidth is committed, not shared oversold capacity." },
      { t: "24/7 support", d: "Ticket support and status page transparency at status.believoo.com." },
    ],
  },
];

const APART = [
  { icon: Gauge, t: "Performance", d: "Latest-generation AMD EPYC and Intel platforms, NVMe storage and guaranteed bandwidth for demanding workloads." },
  { icon: ShieldCheck, t: "Availability", d: "Anti-DDoS included, redundant links and up to 99.99% SLA keep services reachable." },
  { icon: Scale3d, t: "Scalability", d: "From a single ADVANCE box to multi-datacentre High Grade clusters — scale on demand." },
  { icon: Recycle, t: "Sustainability", d: "In-house designed servers with a refurbished-hardware programme and efficient cooling." },
  { icon: FileText, t: "Transparency", d: "Clear specs, clear prices, no hidden fees — you pay the listed price, nothing else." },
  { icon: BadgeCheck, t: "Compliance", d: "ISO 27001-certified datacentres and GDPR-compliant infrastructure." },
];

const FAQ = [
  { q: "What is a dedicated server?", a: "A dedicated server (bare metal) is a physical machine reserved entirely for you — no hypervisor sharing, full root access and predictable performance." },
  { q: "How long does delivery take?", a: "Most in-stock ranges provision in minutes after the upstream order clears. Some ranges may take longer depending on datacentre stock." },
  { q: "Can I install my own OS?", a: "Yes. Choose from 90+ templates at order time or reinstall later from the dashboard — Linux, Windows Server, Proxmox, ESXi and more." },
  { q: "Is DDoS protection really included?", a: "Yes — automatic, always-on mitigation is included on every server at no extra cost." },
  { q: "How does billing work?", a: "Monthly subscription in your chosen currency. Renewal reminders are sent 15/7/3/1 days before the due date." },
  { q: "What is the refund policy?", a: "Dedicated servers are provisioned upstream on demand and are non-refundable once provisioned — see the Refund Policy for details." },
];

function money(v?: number | null, currency?: string) {
  if (v == null) return "—";
  const sym = getCurrencySymbol((currency || "USD").toUpperCase());
  return `${sym}${Math.round(v).toLocaleString("en-IN")}`;
}

export default function DedicatedServersClient({ initialPlans }: { initialPlans?: Plan[] }) {
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>(initialPlans || []);
  const [tab, setTab] = useState("antiddos");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    let alive = true;
    api.server.plans("DEDICATED").then((d: Plan[]) => { if (alive) setPlans(d || []); }).catch(() => {});
    const onCurrency = () => api.server.plans("DEDICATED").then((d: Plan[]) => { if (alive) setPlans(d || []); });
    window.addEventListener("currencychange", onCurrency);
    return () => { alive = false; window.removeEventListener("currencychange", onCurrency); };
  }, [currency]);

  const rangeStats = useMemo(() => {
    const stats: Record<string, { count: number; min?: number; cur?: string }> = {};
    plans.forEach((p) => {
      const r = planRange(p);
      if (!r) return;
      const card = RANGE_CARDS.find((c) => c.match(r));
      if (!card) return;
      const d = (p.durations || []).find((x) => x.durationLabel === "1_month");
      const s = (stats[card.id] = stats[card.id] || { count: 0 });
      s.count += 1;
      if (d?.monthlyPrice != null && (s.min == null || d.monthlyPrice < s.min)) {
        s.min = d.monthlyPrice;
        s.cur = d.currency || p.currency;
      }
    });
    return stats;
  }, [plans]);

  const activeTab = FEATURE_TABS.find((t) => t.id === tab) || FEATURE_TABS[0];

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Sub-nav */}
      <div className="border-b border-slate-200 bg-[#0f0c29]">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-2">
          <Link href="/dedicated-servers" className="whitespace-nowrap border-b-2 border-[#00b7ff] px-3 py-2 text-xs font-bold text-white">Dedicated servers</Link>
          <Link href="/vps" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">VPS</Link>
          <Link href="/dedicated-servers/storage" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Storage &amp; Backup</Link>
          <Link href="/network" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Network</Link>
          <Link href="/security" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Security &amp; Identity</Link>
          <Link href="/operations" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Operations</Link>
        </div>
      </div>

      {/* Hero banner */}
      <section className="bg-gradient-to-r from-[#0f0c29] via-[#17285c] to-[#1e3a8a] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-8 px-6 py-14">
          <div className="min-w-[280px] flex-1">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Pioneering dedicated servers for demanding workloads</h1>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
              {["Raw bare-metal performance, no noisy neighbours", "Enterprise hardware from latest-generation platforms", "Built-in Anti-DDoS and vRack private networking", "Transparent pricing — pay what you see"].map((b) => (
                <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-[#00b7ff]" /> {b}</li>
              ))}
            </ul>
            <a href="#ranges" className="mt-6 inline-block rounded bg-[#00b7ff] px-6 py-3 text-sm font-bold text-white hover:bg-[#009de0]">Explore the ranges</a>
          </div>
          <div className="hidden flex-1 items-center justify-center md:flex">
            <div className="flex h-40 w-full max-w-md items-center justify-center rounded-lg border border-white/10 bg-white/5">
              <Server className="h-20 w-20 text-[#00b7ff]" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise-grade hardware */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">Enterprise-grade hardware</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Latest generation CPUs", "Supply chain control", "Water cooling"].map((c) => (
                <span key={c} className="rounded-full border border-slate-200 bg-[#f8faff] px-3 py-1 text-[11px] font-bold text-slate-600">{c}</span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Get exclusive access to high-performance servers, built for demanding workloads. Choose from the latest
              generation of CPUs, fast NVMe storage, and optimised configurations — with no virtualisation overhead.
              Plus, our in-house hardware lifecycle management ensures consistent performance and long-term reliability.
            </p>
            <a href="#ranges" className="mt-6 inline-block rounded bg-[#00b7ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#009de0]">Discover the hardware</a>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-[#f8faff] p-10">
            <Cpu className="h-24 w-24 text-[#0f0c29]" strokeWidth={1} />
          </div>
        </div>
      </section>

      {/* Global network */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="order-2 flex items-center justify-center rounded-lg border border-slate-200 bg-[#f8faff] p-10 md:order-1">
            <Network className="h-24 w-24 text-[#0f0c29]" strokeWidth={1} />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-black md:text-3xl">A high-performance global network</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {["High bandwidth", "Low latency", "DDoS Protection"].map((c) => (
                <span key={c} className="rounded-full border border-slate-200 bg-[#f8faff] px-3 py-1 text-[11px] font-bold text-slate-600">{c}</span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Run your workloads on a resilient, low-latency network designed to grow with your business. Benefit from
              high-capacity connectivity, built-in DDoS protection and seamless integration with your services — fast,
              secure and accessible wherever you are.
            </p>
            <Link href="/network" className="mt-6 inline-block rounded bg-[#00b7ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#009de0]">Find out more</Link>
          </div>
        </div>
      </section>

      {/* Range cards + comparison */}
      <section id="ranges" className="scroll-mt-20 border-t border-slate-100 bg-[#f8faff]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-2xl font-black md:text-3xl">Discover GHC dedicated servers</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">{plans.length} configurations synced from our upstream catalogue</p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {RANGE_CARDS.map((c) => {
              const s = rangeStats[c.id];
              return (
                <div key={c.id} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#00b7ff]/50 hover:shadow-md">
                  <div className="flex h-20 items-center justify-center rounded bg-[#0f0c29]"><Server className="h-10 w-10 text-[#00b7ff]" strokeWidth={1.2} /></div>
                  <h3 className="mt-4 text-base font-black">{c.name}</h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{c.desc}</p>
                  <p className="mt-3 text-lg font-black text-[#00b7ff]">
                    {s?.min != null ? <>From {money(s.min, s.cur)}<span className="text-[10px] font-medium text-slate-400">/mo</span></> : <span className="text-sm text-slate-400">—</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">{s?.count || 0} configurations</p>
                  <Link href={c.href} className="mt-3 inline-flex items-center justify-center gap-1 rounded bg-[#0f0c29] px-4 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]">
                    Discover <ChevronRightIcon />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Feature comparison strip */}
          <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-[#f8faff]">
                  <th className="px-4 py-3 text-xs font-bold text-slate-500" />
                  {RANGE_CARDS.map((c) => <th key={c.id} className="px-4 py-3 text-xs font-bold text-[#0f172a]">{c.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {RANGE_FEATURES.map((f) => (
                  <tr key={f.label} className="border-b border-slate-100">
                    <td className="px-4 py-2.5 text-xs font-bold text-slate-500">{f.label}</td>
                    {RANGE_CARDS.map((c) => {
                      const v = f.per[c.id];
                      return (
                        <td key={c.id} className="px-4 py-2.5 text-xs text-[#0f172a]">
                          {v === true ? <Check className="h-4 w-4 text-[#00b7ff]" /> : v === false ? <Minus className="h-4 w-4 text-slate-300" /> : v}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Help me choose */}
      <section className="mx-auto max-w-7xl px-6 py-10 text-center">
        <h3 className="text-lg font-bold">Not sure which server is right for you?</h3>
        <Link href="/support" className="mt-4 inline-block rounded border border-[#00b7ff] px-6 py-2.5 text-sm font-bold text-[#00b7ff] hover:bg-[#e6f7ff]">Help me choose</Link>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-wide text-[#00b7ff]">{u.tag}</span>
              <h3 className="mt-2 text-sm font-bold">{u.title}</h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-500">{u.desc}</p>
              <Link href={u.cta.href} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00b7ff] hover:underline">{u.cta.label} <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* Features tabs */}
      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-black">Features of our dedicated servers</h2>
          <div className="mt-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
            {FEATURE_TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition ${tab === t.id ? "bg-[#00b7ff] text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>{t.label}</button>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {activeTab.items.map((f) => (
              <div key={f.t} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-bold text-[#00b7ff]">{f.t}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{f.d}</p>
                <span className="mt-3 inline-block rounded bg-[#00b7ff]/20 px-2 py-0.5 text-[10px] font-bold text-[#00b7ff]">Included</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Liquid cooling banner */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-slate-200 bg-[#f8faff] p-8">
          <div className="flex items-center gap-4">
            <Droplets className="h-12 w-12 text-[#00b7ff]" strokeWidth={1.2} />
            <div>
              <h3 className="text-lg font-black">Our servers are cooled by innovative liquid cooling</h3>
              <p className="mt-1 max-w-lg text-sm text-slate-500">Water-cooling technology keeps frequencies stable and improves energy efficiency across our datacentres.</p>
            </div>
          </div>
          <a href="#ranges" className="rounded bg-[#00b7ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#009de0]">Discover the technology</a>
        </div>
      </section>

      {/* What sets us apart */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl font-black">What sets GHC dedicated servers apart?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {APART.map((a) => (
            <div key={a.t} className="rounded-lg border border-slate-200 bg-white p-6">
              <a.icon className="h-7 w-7 text-[#00b7ff]" />
              <h3 className="mt-3 text-sm font-bold">{a.t}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="text-center text-2xl font-black">Your questions answered</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="text-sm font-bold">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-500">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0f0c29] to-[#1e3a8a] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-12">
          <div>
            <h2 className="text-xl font-black">Ready to deploy bare metal?</h2>
            <p className="mt-1 text-sm text-slate-300">Pick a range and configure your server in minutes.</p>
          </div>
          <div className="flex gap-3">
            <a href="#ranges" className="rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Browse ranges</a>
            <Link href="/support" className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Contact sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ChevronRightIcon() {
  return <ArrowRight className="h-3.5 w-3.5" />;
}
