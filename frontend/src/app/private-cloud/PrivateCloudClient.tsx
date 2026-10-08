"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Server, ShieldCheck, Award, Zap, Layers, RefreshCcw, Database,
  ChevronRight, CheckCircle2, Network, Lock, Gauge, ArrowRight,
} from "lucide-react";

interface Plan {
  planCode: string;
  invoiceName: string;
  description?: string;
  family?: string;
  cpuCores?: number | null;
  ramGb?: number | null;
  diskGb?: number | null;
  bandwidthMbps?: number | null;
  currency?: string;
  durations?: { durationLabel: string; monthlyPrice?: number; finalPrice?: number; currency?: string }[];
}

const RANGES: { id: string; name: string; desc: string }[] = [
  { id: "essentials", name: "Essentials", desc: "Entry-level VMware vSphere dedicated hosts — single-socket servers to start your private cloud." },
  { id: "general", name: "General Purpose", desc: "Balanced vSphere/NSX hosts for production virtualisation workloads." },
  { id: "premier", name: "Premier", desc: "High-performance hosts with larger memory footprints for demanding environments." },
  { id: "sddc", name: "SDDC", desc: "Software-Defined Data Center packs — pre-sized host bundles for full VMware SDDC deployments." },
  { id: "storage", name: "Storage", desc: "Storage-dense hosts with large local capacity for data-heavy workloads." },
  { id: "sap-hana", name: "SAP HANA", desc: "Certified hosts for SAP HANA in-memory databases on trusted cloud infrastructure." },
  { id: "hpc", name: "HPC", desc: "High-performance computing hosts for intensive compute clusters." },
  { id: "cdi", name: "CDI", desc: "Cloud Dedicated Infrastructure — legacy dedicated host ranges." },
  { id: "other", name: "Other", desc: "Additional dedicated host options." },
];

const BENEFITS = [
  { icon: Layers, title: "Comprehensive high-end solutions", desc: "Our Hosted Private Cloud solutions offer a range of services, including virtualization and containerization options to give you more speed and flexibility. Deploy your dedicated environments in less than an hour." },
  { icon: ShieldCheck, title: "Security and certifications", desc: "Our private cloud infrastructures include dedicated, isolated datacenters that meet the strictest certifications. Your data is hosted in our certified datacentres across the globe." },
  { icon: Award, title: "A leading provider of Hosted Private Cloud solutions", desc: "Our goal is to promote cutting-edge innovative solutions that meet your needs — scalable, sovereign and accessible private cloud infrastructure." },
];

const SPECS = [
  { icon: Zap, title: "On-demand resources", desc: "Deploy new hosts and datastores on demand from the control panel, and scale your infrastructure as your needs grow." },
  { icon: ShieldCheck, title: "Trusted cloud hosting", desc: "Build a trusted cloud with certified and isolated infrastructure. Our private cloud is GDPR compliant and hosted in our datacentres." },
  { icon: RefreshCcw, title: "Multi-cloud environments", desc: "Deploy your services across multiple OVHcloud solutions and your infrastructure, thanks to our multi-cloud approach and interoperability." },
  { icon: Database, title: "Disaster Recovery Plan", desc: "Include a DRP in your hosted private cloud. Our solutions include Veeam, Zerto and vSphere Replication options to ensure business continuity." },
];

const SOLUTIONS = [
  {
    key: "vmware",
    title: "VMware on GHC",
    tag: "VMWARE READY",
    desc: "Scalable and secure solutions dedicated to hosting your business applications — including vSphere, vSAN, NSX and Veeam. Deliver optimal performance and security for your data, all without any vendor lock-in.",
    range: "essentials",
    cta: "VMware on GHC",
  },
  {
    key: "nutanix",
    title: "Nutanix on GHC",
    tag: "NUTANIX READY",
    desc: "Hyperconverged private cloud on dedicated hosts. Nutanix licence portability and a unified management console to run all of your workloads — databases, business apps and virtual desktops.",
    range: "sddc",
    cta: "Nutanix-ready hosts",
  },
  {
    key: "sap",
    title: "SAP HANA on Private Cloud",
    tag: "SAP CERTIFIED",
    desc: "This solution enables you to host your SAP HANA databases in a secure, high-performance and GDPR-compliant environment. SAP HANA certified hosts delivered by our trusted cloud infrastructure.",
    range: "sap-hana",
    cta: "SAP HANA on Private Cloud",
  },
];

function money(value?: number | null, currency?: string) {
  if (value == null) return "—";
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  return `${sym}${Math.round(value).toLocaleString("en-IN")}`;
}

export default function PrivateCloudClient({ initialPlans }: { initialPlans?: Plan[] }) {
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>(initialPlans || []);
  const [range, setRange] = useState("essentials");
  const [loading, setLoading] = useState(false);

  // Deep links: /private-cloud?s=vmware|nutanix|sap-hana|<range>
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    const map: Record<string, string> = { vmware: "essentials", nutanix: "sddc", "sap-hana": "sap-hana" };
    const target = s ? (map[s] || s) : null;
    if (target && RANGES.some((r) => r.id === target)) {
      setRange(target);
      setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }), 300);
    } else if (window.location.hash === "#catalog") {
      setTimeout(() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.server.plans("PRIVATE_CLOUD").then((data: Plan[]) => {
      if (alive) setPlans(data || []);
    }).catch(() => {}).finally(() => alive && setLoading(false));
    const onCurrency = () => {
      api.server.plans("PRIVATE_CLOUD").then((data: Plan[]) => {
        if (alive) setPlans(data || []);
      });
    };
    window.addEventListener("currencychange", onCurrency);
    return () => { alive = false; window.removeEventListener("currencychange", onCurrency); };
  }, [currency]);

  const hosts = useMemo(
    () => plans.filter((p) => p.planCode.startsWith("pcc-host-") && !p.planCode.endsWith("-consumption")),
    [plans]
  );

  const byRange = useMemo(() => {
    const map: Record<string, Plan[]> = {};
    hosts.forEach((p) => {
      const f = p.family || "other";
      (map[f] = map[f] || []).push(p);
    });
    Object.values(map).forEach((list) =>
      list.sort((a, b) => {
        const pa = (a.durations || []).find((d) => d.durationLabel === "1_month")?.monthlyPrice ?? Infinity;
        const pb = (b.durations || []).find((d) => d.durationLabel === "1_month")?.monthlyPrice ?? Infinity;
        return pa - pb;
      })
    );
    return map;
  }, [hosts]);

  const visibleRanges = RANGES.filter((r) => (byRange[r.id] || []).length > 0);
  const activeRange = visibleRanges.find((r) => r.id === range) || visibleRanges[0];
  const activePlans = activeRange ? byRange[activeRange.id] || [] : [];

  const monthly = (p: Plan) =>
    (p.durations || []).find((d) => d.durationLabel === "1_month")
    || (p.durations || []).slice().sort((a, b) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];

  const jump = (id: string) => {
    if (RANGES.some((r) => r.id === id)) setRange(id);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* OVH-style sub navigation */}
      <div className="border-b border-slate-200 bg-[#0f0c29]">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 py-2">
          <Link href="/private-cloud" className="whitespace-nowrap border-b-2 border-[#00b7ff] px-3 py-2 text-xs font-bold text-white">Hosted Private Cloud</Link>
          <a href="#catalog" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Host catalog</a>
          <Link href="/network" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Network</Link>
          <Link href="/dedicated-servers/storage" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Storage &amp; Backup</Link>
          <Link href="/security" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Security &amp; Identity</Link>
          <Link href="/operations" className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-300 hover:text-white">Operations</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#17285c] to-[#1e3a8a] text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#00b7ff]">Hosted Private Cloud</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Your private datacentre in the cloud</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 md:text-base">
            Accelerate your digital transformation with our scalable Hosted Private Cloud solutions.
            Our products are agile, innovative, and deliver optimal security for your data —
            so you can focus on your business.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#solutions" className="rounded bg-[#00b7ff] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#009de0]">Discover our solutions</a>
            <a href="#catalog" className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">View host pricing</a>
          </div>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00b7ff]" /> Dedicated hosts</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00b7ff]" /> VMware / Nutanix ready</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#00b7ff]" /> ISO 27001 certified datacentres</span>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-black">Benefits for your projects</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <b.icon className="h-8 w-8 text-[#00b7ff]" />
              <h3 className="mt-4 text-base font-bold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Specifications */}
      <section className="border-t border-slate-100 bg-[#f8faff]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-2xl font-black">Hosted Private Cloud specifications</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SPECS.map((s) => (
              <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <s.icon className="h-7 w-7 text-[#00b7ff]" />
                <h3 className="mt-4 text-sm font-bold">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="solutions" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-16">
        <h2 className="text-2xl font-black">Our Hosted Private Cloud solutions</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <div key={s.key} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#00b7ff]/50 hover:shadow-md">
              <span className="inline-flex w-fit rounded bg-[#e6f7ff] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#0078a8]">{s.tag}</span>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              <button onClick={() => jump(s.range)} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-[#00b7ff] hover:underline">
                {s.cta} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Host catalog */}
      <section id="catalog" className="scroll-mt-20 border-t border-slate-100 bg-[#f8faff]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Dedicated host catalog</h2>
              <p className="mt-1 text-sm text-slate-500">
                {hosts.length} OVH-backed dedicated hosts · monthly prices {loading && <span className="text-[#00b7ff]">(refreshing…)</span>}
              </p>
            </div>
            <p className="text-xs text-slate-400">Prices exclude GST · billed monthly in {currency}</p>
          </div>

          {/* Range tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {visibleRanges.map((r) => (
              <button
                key={r.id}
                onClick={() => setRange(r.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                  activeRange?.id === r.id
                    ? "border-[#00b7ff] bg-[#00b7ff] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#00b7ff]"
                }`}
              >
                {r.name} <span className="opacity-70">({(byRange[r.id] || []).length})</span>
              </button>
            ))}
          </div>

          {activeRange && (
            <div className="mt-6">
              <p className="mb-4 text-sm text-slate-500">{activeRange.desc}</p>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f8faff]">
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">Host</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">vCPU / Cores</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">Memory</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">Network</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500">Price / month</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {activePlans.map((p) => {
                      const d = monthly(p);
                      return (
                        <tr key={p.planCode} className="border-b border-slate-100 transition hover:bg-[#f8faff]">
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-[#0f172a]">{p.invoiceName || p.planCode}</p>
                            <p className="text-[10px] text-slate-400">{p.planCode}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-[#0f172a]">{p.cpuCores ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-[#0f172a]">{p.ramGb ? `${p.ramGb} GB` : "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{p.bandwidthMbps ? `${p.bandwidthMbps >= 1000 ? `${p.bandwidthMbps / 1000} Gbps` : `${p.bandwidthMbps} Mbps`}` : "—"}</td>
                          <td className="px-4 py-3">
                            <p className="text-base font-black text-[#00b7ff]">{money(d?.monthlyPrice, d?.currency)}</p>
                            <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/configure?plan=${p.planCode}`} className="whitespace-nowrap rounded bg-[#ff3d00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63700]">
                              Configure
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    {activePlans.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">No hosts found in this range.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Included */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-black">Included with every private cloud</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Anti-DDoS protection", d: "Automatic mitigation on all traffic" },
            { icon: Network, t: "vRack private network", d: "Isolated L2 networking between services" },
            { icon: Lock, t: "VMware licence included", d: "vSphere, vSAN and NSX licences managed" },
            { icon: Gauge, t: "Guaranteed resources", d: "Dedicated CPU and RAM, no overselling" },
          ].map((f) => (
            <div key={f.t} className="flex gap-3 rounded-lg border border-slate-200 p-4">
              <f.icon className="h-5 w-5 shrink-0 text-[#00b7ff]" />
              <div>
                <p className="text-sm font-bold">{f.t}</p>
                <p className="mt-0.5 text-xs text-slate-500">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#0f0c29] to-[#1e3a8a] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-12">
          <div>
            <h2 className="text-xl font-black">Browse our Hosted Private Cloud solutions</h2>
            <p className="mt-1 text-sm text-slate-300">Deploy your dedicated environment in under an hour.</p>
          </div>
          <div className="flex gap-3">
            <a href="#catalog" className="rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Choose a host</a>
            <Link href="/support" className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Contact sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
