"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Check, ChevronDown, ShoppingCart, Server, Cpu, Shield, Gauge,
  HardDrive, Globe, Lock, RefreshCw, Settings2, Network, Database,
} from "lucide-react";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const REGION_NAMES: Record<string, string> = {
  gra: "France (Gravelines)", sbg: "France (Strasbourg)", rbx: "France (Roubaix)",
  bhs: "Canada (Beauharnois)", waw: "Poland (Warsaw)", de: "Germany (Limburg)",
  eri: "UK (Erith)", mil: "Italy (Milan)", prg: "Czech Republic (Prague)",
  mad: "Spain (Madrid)", ams: "Netherlands (Amsterdam)", bru: "Belgium (Brussels)",
  mrs: "France (Marseille)", vie: "Austria (Vienna)", zrh: "Switzerland (Zurich)",
  sgp: "Singapore", syd: "Australia (Sydney)", bom: "India (Mumbai)",
  mum: "India (Mumbai)", uk: "UK (London)",
};

const SERVICE_TABS: Record<string, { title: string; desc: string; tag: string }[]> = {
  HARDWARE: [
    { title: "1-click scaling", desc: "Get a new VPS instance instantly, with no service disruption or data migration. This keeps your configuration aligned with your project's changing needs.", tag: "Included" },
    { title: "Advanced backup options", desc: "Opt for Premium automatic backup, offering 7-day rotations and secure external storage, tailored to your business requirements.", tag: "Optional" },
  ],
  SOFTWARE: [
    { title: "Ultra-fast NVMe storage", desc: "All our Metal servers come with NVMe disks, delivering speeds up to five times faster than standard SSDs. They are well-suited to high-speed applications.", tag: "Included" },
    { title: "Wide choice of distributions", desc: "Ubuntu, Debian, AlmaLinux, Rocky Linux, Fedora, Windows Server and popular apps like Docker, Plesk and cPanel — deployable in one click.", tag: "Included" },
  ],
  "NETWORK & IP": [
    { title: "Unlimited traffic", desc: "Your Metal VPS includes unlimited inbound and outbound traffic with bandwidth up to 1.5 Gbps — no hidden metering.", tag: "Included" },
    { title: "IPv4 + IPv6", desc: "Each VPS gets a dedicated public IPv4 address and an IPv6 range, with failover IP options for high availability.", tag: "Included" },
  ],
  SERVICES: [
    { title: "Daily automatic backup", desc: "Rest easy knowing your data is automatically backed up daily. A single restore of your VPS is just a click away if needed.", tag: "Included" },
    { title: "Anti-DDoS protection", desc: "Every Metal VPS is protected by always-on DDoS mitigation at the network edge — included at no extra cost.", tag: "Included" },
  ],
};

const USE_CASES = [
  { title: "Web hosting", desc: "Host your websites on a flexible, high-powered VPS, with dedicated resources and high availability to deliver fast load times and a smooth user experience." },
  { title: "Software hosting", desc: "Deploy your applications on a secure, scalable VPS, with configurations tailored to your business development and usage." },
  { title: "Database hosting", desc: "Store and manage your databases on our fast and reliable VPS, designed to scale and adapt to the most demanding workloads." },
  { title: "Hosting a WordPress multisite platform", desc: "Build and manage your multisite platform on the cloud, at the very best price." },
  { title: "Game hosting", desc: "Host your online games on a scalable, secure VPS. It's the perfect solution for creating private servers for Minecraft, Counter-Strike, Rust, and many other titles." },
  { title: "Test server deployment", desc: "In just a few seconds, create a dynamic virtual sandbox to accelerate your workflow from concept to production." },
  { title: "Hosting trading applications", desc: "Run your Forex trading strategies on a high-performing and stable VPS built to handle market demands." },
];

const FAQS = [
  { q: "Can I easily upgrade my Metal VPS to a higher or downgrade to a lower configuration?", a: "Yes. You can scale your Metal VPS up or down at any time from your control panel — upgrades apply instantly and billing is adjusted pro-rata." },
  { q: "Is automatic backup included with my Metal VPS?", a: "Yes — daily automatic backup is included free with every Metal VPS. Premium backup rotations and snapshots are available as paid options." },
  { q: "What is a VPS, and what is it used for?", a: "A Virtual Private Server is a virtualised environment with dedicated resources (CPU, RAM, NVMe storage) on shared hardware. It's ideal for websites, apps, game servers, VPNs and dev environments." },
  { q: "Who are Metal VPS solutions designed for?", a: "Developers, agencies, resellers and businesses who want dedicated performance at a predictable monthly price — with the flexibility to scale." },
  { q: "Can I host several websites on a Metal VPS?", a: "Absolutely. A single Metal VPS can host unlimited websites — add a control panel like Plesk or cPanel to manage them easily." },
  { q: "How do I choose between a Metal VPS and a web hosting plan?", a: "Choose a Metal VPS when you need root access, custom software or dedicated resources. Web hosting suits simple sites that don't need server-level control." },
  { q: "What are the advantages of a Metal VPS compared to a dedicated server?", a: "Metal VPS gives you dedicated resources at a fraction of the cost of bare metal — instant deployment, easy scaling and no hardware management." },
];

export default function MetalVpsClient({ initialPlans }: { initialPlans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>(initialPlans || []);
  const [svcTab, setSvcTab] = useState<keyof typeof SERVICE_TABS>("HARDWARE");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api.server.metalVpsPlans()
      .then((p: any[]) => { if (alive && Array.isArray(p) && p.length) setPlans(p); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currency]);

  const sorted = useMemo(() => {
    const price = (p: any) => {
      const d = (p.durations || []).find((x: any) => x.durationLabel === "1_month") || p.durations?.[0];
      return d?.monthlyPrice ?? d?.finalPrice ?? Infinity;
    };
    return [...(plans || [])].filter((p) => price(p) !== Infinity).sort((a, b) => price(a) - price(b));
  }, [plans]);

  const regions = useMemo(() => {
    const seen = new Set<string>();
    for (const p of sorted) for (const r of p.regions || []) seen.add(String(r).toLowerCase());
    return Array.from(seen);
  }, [sorted]);

  const configure = (planCode: string) => {
    router.push(`/configure?category=VPS&plan=${encodeURIComponent(planCode)}&brand=metal`);
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-br from-[#0b1a45] via-[#0f2566] to-[#12308f] text-white">
        <div className="mx-auto max-w-7xl px-6 pt-4 pb-14">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/70">
            <span>Metal</span><span className="text-white/40">›</span><span className="text-white">VPS</span>
            <span className="ml-auto hidden gap-6 text-[11px] normal-case tracking-normal md:flex">
              <a href="#plans" className="hover:text-[#00b7ff]">Our prices</a>
              <a href="#services" className="hover:text-[#00b7ff]">Services and options</a>
              <a href="#locations" className="hover:text-[#00b7ff]">Our locations</a>
              <a href="#usecases" className="hover:text-[#00b7ff]">Use cases</a>
            </span>
          </div>
          <div className="mt-8 grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h1 className="text-4xl font-black leading-tight md:text-5xl">Metal VPS — Virtual Private Servers</h1>
              <p className="mt-3 text-lg text-white/80">A simple, powerful cloud platform tailored to your needs</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {["Maximised value for money, whatever the use",
                  "Enhanced security with anti-DDoS and daily backup included",
                  "Unlimited bandwidth, up to 1.5 Gbps*"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-[#00ff88]" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="flex h-44 w-44 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00b7ff]/30 to-[#8b5cf6]/30 shadow-2xl ring-1 ring-white/20 backdrop-blur">
                <Server className="h-24 w-24 text-[#00b7ff] drop-shadow-[0_0_25px_rgba(0,183,255,.6)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Plan cards ─── */}
      <section id="plans" className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-2xl font-black">Metal VPS Range</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-slate-500">
          Choose the configuration that fits your needs — web hosting, gaming, VPNs, development and more.
        </p>
        {sorted.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">Plans are loading — please check back shortly.</p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((p) => {
              const d = (p.durations || []).find((x: any) => x.durationLabel === "1_month") || p.durations?.[0];
              const specs: string[] = [
                p.cpuCores ? `${p.cpuCores} vCores` : "",
                p.ramGb ? `${p.ramGb} GB RAM` : "",
                p.diskGb ? `${p.diskGb} GB ${p.diskType || "NVMe SSD"}` : "",
                p.bandwidthMbps ? `${p.bandwidthMbps >= 1000 ? `${(p.bandwidthMbps / 1000).toFixed(1)} Gbps` : `${p.bandwidthMbps} Mbps`} unmetered` : "Unmetered bandwidth",
                "Anti-DDoS protection",
              ].filter(Boolean);
              return (
                <div key={p.planCode} className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#00b7ff] hover:shadow-xl">
                  <div className="p-5">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">New</span>
                    <h3 className="mt-2 text-lg font-bold text-[#0f172a]">{p.invoiceName || p.planCode}</h3>
                    <p className="mt-1 text-xs text-slate-500">From</p>
                    <p className="text-2xl font-black text-[#0f172a]">{money(d?.monthlyPrice ?? d?.finalPrice, d?.currency)}</p>
                    <p className="text-[11px] text-slate-400">ex. taxes/month</p>
                    <button onClick={() => configure(p.planCode)} className="mt-4 inline-flex items-center gap-2 rounded bg-[#ff3d00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">
                      <ShoppingCart className="h-4 w-4" /> Configure
                    </button>
                  </div>
                  <ul className="mt-auto space-y-2 border-t border-slate-100 p-5 pt-4">
                    {specs.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-xs text-slate-600">
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#00b7ff]" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Essentials ─── */}
      <section className="border-t border-slate-100 bg-[#f8faff]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black">New Metal range: the essentials included, with added peace of mind</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Our Metal range is designed to focus on the essentials: configurations calibrated for your actual usage, automatic daily backups included to protect your data, and NVMe-level performance. You get high security without the premium price tag.
              </p>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br from-[#00b7ff]/20 to-[#8b5cf6]/20 ring-1 ring-slate-200">
                <Shield className="h-20 w-20 text-[#00b7ff]" />
              </div>
            </div>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Gauge, t: "Performance at the right price" },
              { icon: Lock, t: "Isolated environment" },
              { icon: Settings2, t: "Scalable configuration" },
              { icon: RefreshCw, t: "Advanced management" },
            ].map((f) => (
              <div key={f.t} className="flex flex-col items-center text-center">
                <f.icon className="h-8 w-8 text-[#00b7ff]" />
                <p className="mt-2 text-sm font-bold">{f.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Services & options tabs ─── */}
      <section id="services" className="bg-[#0b1a45] py-14 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-black">Our services and options included with your Metal VPS</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-1 border-b border-white/15">
            {(Object.keys(SERVICE_TABS) as (keyof typeof SERVICE_TABS)[]).map((t) => (
              <button key={t} onClick={() => setSvcTab(t)} className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wide transition ${svcTab === t ? "border-b-2 border-[#00b7ff] text-white" : "text-white/60 hover:text-white"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {SERVICE_TABS[svcTab].map((c) => (
              <div key={c.title} className="rounded-lg bg-[#12275e] p-5 ring-1 ring-white/10">
                <p className="text-sm font-bold">{c.title}</p>
                <p className="mt-2 text-xs leading-5 text-white/70">{c.desc}</p>
                <span className={`mt-3 inline-block rounded px-2 py-0.5 text-[10px] font-black uppercase ${c.tag === "Included" ? "bg-[#00ff88]/20 text-[#00ff88]" : "bg-white/10 text-white/80"}`}>{c.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Locations ─── */}
      <section id="locations" className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl font-black">Your data, hosted wherever you need it</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Deploy your Metal VPS in one of our worldwide datacenters — close to your users for the lowest latency.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(regions.length ? regions : Object.keys(REGION_NAMES)).map((r) => (
            <span key={r} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0f172a]">
              <Globe className="h-3 w-3 text-[#00b7ff]" /> {REGION_NAMES[r] || r.toUpperCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Compatible options ─── */}
      <section className="border-t border-slate-100 bg-[#f0f6ff]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-center text-2xl font-black">Options compatible with our Metal VPS solutions</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { t: "Standard automatic backup", d: "Effortlessly protect your data every day.", p: "Included", cta: null },
              { t: "Premium automatic backup", d: "Your custom backups, with rotating 7-day restores.", p: "Optional add-on", cta: "Select at checkout" },
              { t: "Snapshots", d: "Easily back up and restore your data at any time.", p: "Optional add-on", cta: "Select at checkout" },
            ].map((o) => (
              <div key={o.t} className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{o.t}</p>
                <p className="mt-1 text-xs text-slate-500">{o.d}</p>
                <p className="mt-4 text-xl font-black text-[#0f172a]">{o.p}</p>
                <p className="mt-3 text-xs font-bold text-[#00b7ff]">{o.cta || "Free with every Metal VPS"}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-500">
            You can also customise your environment with additional IPs, a Load Balancer, and external storage.
          </p>
        </div>
      </section>

      {/* ─── Use cases ─── */}
      <section id="usecases" className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-2xl font-black">Use cases</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CASES.map((u) => (
            <div key={u.title} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-[#00b7ff] hover:shadow-md">
              <p className="text-sm font-bold">{u.title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg bg-gradient-to-r from-[#0b1a45] to-[#12308f] px-8 py-10 text-center text-white">
          <h3 className="text-2xl font-black">Take your business to the next level!</h3>
          <a href="#plans" className="mt-5 inline-block rounded bg-white px-6 py-2.5 text-sm font-bold text-[#0f172a] hover:bg-slate-100">Choose a Metal VPS</a>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <h2 className="text-2xl font-black">Your questions answered</h2>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-[#0050d7] hover:text-[#00b7ff]">
                  {f.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="pb-4 text-sm leading-6 text-slate-600">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
