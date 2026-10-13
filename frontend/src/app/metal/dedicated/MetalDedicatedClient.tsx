"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Check, ChevronDown, ShoppingCart, Server, Shield, Gauge,
  Globe, Lock, RefreshCw, Cpu, Flame, Zap, HardDrive, Network,
  Boxes, Database, Container, Layers,
} from "lucide-react";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 0;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
}

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

const RANGE_META: Record<string, { tagline: string; desc: string; badge?: string }> = {
  "Advance": { tagline: "Versatility for SMEs", desc: "Single-socket workhorses balancing compute, memory and storage — the default choice for production apps, e-commerce and virtualisation hosts.", badge: "Most popular" },
  "Game": { tagline: "Performance and security for your games", desc: "High-frequency AMD Ryzen CPUs with game-optimised anti-DDoS — built for Minecraft, Rust, CS2 and voice servers that hate lag.", badge: "High clock" },
  "Scale": { tagline: "Power for heavy workloads", desc: "Dual-socket and many-core configurations for databases, analytics clusters, container fleets and render farms.", badge: "Many-core" },
  "Scale GPU": { tagline: "Compute with acceleration", desc: "Scale-range chassis fitted with datacenter GPUs — for AI inference, ML training and GPU-accelerated pipelines.", badge: "GPU" },
  "High Grade": { tagline: "The most powerful for critical loads", desc: "Dual high-core-count CPUs, huge RAM footprints and up to 50 Gbps links — mission-critical infrastructure without compromise.", badge: "Flagship" },
  "Storage": { tagline: "Capacity first", desc: "Dense disk configurations for backup targets, archives and object storage." },
  "Hosted Private Cloud": { tagline: "Dedicated virtualisation hosts", desc: "Single-tenant hypervisor hosts for building private clouds." },
  "Software-Defined Storage": { tagline: "Ceph clusters", desc: "SDS nodes for replicated storage backends." },
};

const USE_CASES = [
  { icon: Layers, t: "Virtualisation", d: "Run Proxmox, ESXi or Hyper-V clusters on dedicated hardware — no noisy neighbours, full VT-x/AMD-V access." },
  { icon: Database, t: "Databases", d: "PostgreSQL, ClickHouse, Cassandra and Redis on NVMe-backed bare metal with predictable I/O." },
  { icon: Container, t: "Kubernetes", d: "Build container platforms on raw metal — Metal servers are ideal K8s workers and control-plane nodes." },
  { icon: Flame, t: "Game hosting", d: "High-clock Game range CPUs plus always-on game anti-DDoS for smooth multiplayer experiences." },
  { icon: Boxes, t: "AI & GPU compute", d: "Scale GPU configurations accelerate inference, fine-tuning and media pipelines." },
  { icon: Shield, t: "Critical workloads", d: "High Grade range for payment systems, core platforms and anything that cannot afford to go down." },
];

const FAQS = [
  { q: "What is a Metal dedicated server?", a: "A physical single-tenant server — 100% of the CPU, RAM and disk is yours. No hypervisor tax, no shared resources: raw performance for production workloads." },
  { q: "How fast is delivery?", a: "Most Metal dedicated servers are delivered automatically within minutes of payment. High Grade and custom configurations can take up to 24 hours." },
  { q: "Is anti-DDoS included?", a: "Yes — every Metal dedicated server includes always-on DDoS mitigation at the network edge, free of charge." },
  { q: "Which operating systems can I install?", a: "Ubuntu, Debian, AlmaLinux, Rocky Linux, Fedora, Windows Server, Proxmox, ESXi and one-click apps — install or reinstall any time from the control panel." },
  { q: "Can I customise hardware (disks, RAID, network)?", a: "Yes — during configuration you can pick disk layouts, RAID levels, additional IPs and bandwidth upgrades depending on the range." },
];

export default function MetalDedicatedClient({ initialPlans }: { initialPlans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>(initialPlans || []);
  const [expanded, setExpanded] = useState<Record<string, number>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api.server.metalDedicatedPlans()
      .then((p: any[]) => { if (alive && Array.isArray(p) && p.length) setPlans(p); })
      .catch(() => {});
    return () => { alive = false; };
  }, [currency]);

  const groups = useMemo(() => {
    const map = new Map<string, { p: any; d: any }[]>();
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice ?? a.finalPrice ?? 0) - (b.monthlyPrice ?? b.finalPrice ?? 0))[0];
      if (!d) continue;
      const r = rangeOf(p);
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push({ p, d });
    }
    return [...map.entries()]
      .map(([name, rows]) => ({
        name,
        rows: rows.sort((a, b) => (a.d.monthlyPrice ?? a.d.finalPrice ?? 0) - (b.d.monthlyPrice ?? b.d.finalPrice ?? 0)),
        min: Math.min(...rows.map((r) => r.d.monthlyPrice ?? r.d.finalPrice ?? Infinity)),
      }))
      .sort((a, b) => a.min - b.min);
  }, [plans]);

  const anchor = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "");

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="ghc-metal-grid relative overflow-hidden bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="ghc-metal-orb ghc-metal-orb-a -left-24 top-6 h-96 w-96" />
        <div className="ghc-metal-orb ghc-metal-orb-b right-0 top-1/3 h-[26rem] w-[26rem]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-16">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-white/60">
            <span className="ghc-metal-text-grad">Metal</span><span className="text-white/30">›</span><span className="text-white/90">Dedicated servers</span>
            <span className="ml-auto hidden gap-6 text-[11px] normal-case tracking-normal md:flex">
              <a href="#ranges" className="transition-colors hover:text-[#ffb347]">Server ranges</a>
              <a href="#why" className="transition-colors hover:text-[#ffb347]">Why Metal</a>
              <a href="#usecases" className="transition-colors hover:text-[#ffb347]">Use cases</a>
            </span>
          </div>
          <div className="mt-10 grid items-center gap-10 md:grid-cols-[1.25fr_1fr]">
            <div className="ghc-metal-fade">
              <span className="ghc-metal-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffb347]">
                <Flame className="h-3 w-3" /> 100% raw metal. No hypervisor.
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Metal Dedicated — <span className="ghc-metal-text-grad">maximum performance, no compromise</span>
              </h1>
              <p className="mt-3 max-w-xl text-lg text-white/70">
                Single-tenant bare metal forged for production: dedicated CPU, RAM and NVMe, delivered in minutes with always-on anti-DDoS.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-white/85">
                {["Root access — full control over hardware, OS and network",
                  "Unmetered bandwidth with anti-DDoS included on every server",
                  "Deploy in minutes across worldwide datacentres"].map((b, i) => (
                  <li key={b} className="ghc-metal-fade flex items-center gap-2.5" style={{ ["--d" as any]: `${120 + i * 90}ms` }}>
                    <Check className="h-4 w-4 shrink-0 text-[#ffb347]" /> {b}
                  </li>
                ))}
              </ul>
              <a href="#ranges" className="ghc-metal-btn mt-8 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-bold">
                <Zap className="h-4 w-4" /> Browse server ranges
              </a>
            </div>
            <div className="hidden justify-center md:flex">
              <div className="ghc-metal-scan space-y-2 rounded-2xl p-4">
                {[0, 1, 2, 3, 4].map((s) => (
                  <div key={s} className="ghc-metal-card ghc-metal-fade flex h-11 w-80 items-center gap-2.5 rounded-md px-3" style={{ ["--d" as any]: `${200 + s * 110}ms` }}>
                    <span className="ghc-metal-led h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" />
                    <span className="ghc-metal-led h-2 w-2 rounded-full bg-[#ff8a2a] text-[#ff8a2a]" style={{ animationDelay: `${s * 220}ms` }} />
                    <div className="ml-2 flex gap-1">
                      {[0, 1, 2, 3, 4, 5].map((b) => <span key={b} className="h-5 w-3 rounded-sm border border-white/10 bg-white/5" />)}
                    </div>
                    <span className="flex-1" />
                    <span className="h-1.5 w-10 rounded bg-[#ff8a2a]/25" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <hr className="ghc-metal-hr relative" />
      </section>

      {/* ─── Ranges ─── */}
      <section id="ranges" className="relative mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-center text-2xl font-black md:text-3xl"><span className="ghc-metal-text-grad">Choose your forge</span></h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-white/55">
          Every Metal dedicated range, sorted by price — premium bare metal with Metal-only perks on every server.
        </p>
        <div className="mx-auto mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
          {["Priority deployment", "Daily backup included", "Anti-DDoS protection", "Unmetered bandwidth", "Metal care support"].map((perk) => (
            <span key={perk} className="ghc-metal-chip inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#ffb347]">
              <Check className="h-3 w-3" /> {perk}
            </span>
          ))}
        </div>

        {/* Range quick nav */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {groups.map((g) => (
            <a key={g.name} href={`#${anchor(g.name)}`} className="ghc-metal-chip rounded-full px-4 py-1.5 text-xs font-bold text-white/80 hover:text-[#ffb347]">
              {g.name} <span className="text-white/40">· {g.rows.length}</span>
            </a>
          ))}
        </div>

        {groups.length === 0 && (
          <p className="mt-10 text-center text-sm text-white/50">Servers are loading — please check back shortly.</p>
        )}

        <div className="mt-12 space-y-14">
          {groups.map((g, gi) => {
            const meta = RANGE_META[g.name] || { tagline: "", desc: "" };
            const shown = expanded[g.name] || 6;
            return (
              <div key={g.name} id={anchor(g.name)} className="ghc-metal-fade scroll-mt-28" style={{ ["--d" as any]: `${gi * 60}ms` }}>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="text-xl font-black uppercase tracking-wide"><span className="ghc-metal-text-grad">{g.name}</span></h3>
                  {meta.badge && <span className="rounded bg-[#ff7a18]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#ffb347]">{meta.badge}</span>}
                  <span className="text-[11px] text-white/40">({g.rows.length} configurations)</span>
                  <span className="ml-auto text-sm font-black text-[#ffb347]">from {money(g.min, g.rows[0]?.d?.currency)}/mo</span>
                </div>
                {meta.tagline && <p className="mt-1 text-sm font-semibold text-white/70">{meta.tagline}</p>}
                {meta.desc && <p className="mt-0.5 max-w-3xl text-xs leading-5 text-white/45">{meta.desc}</p>}

                <div className="ghc-metal-card mt-4 overflow-hidden rounded-xl">
                  <div className="divide-y divide-white/5">
                    {g.rows.slice(0, shown).map(({ p, d }) => {
                      const cur = d?.currency || p.currency || "USD";
                      return (
                        <div key={p.planCode} className="ghc-metal-row flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black uppercase text-white">{p.displayName || (p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                            <p className="truncate text-[11px] text-white/40">{p.spec?.cpu || p.description || p.planCode}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-5 text-[11px] text-white/60">
                            {!!p.spec?.ram && <span>{p.spec.ramMin && p.spec.ramMax && p.spec.ramMin !== p.spec.ramMax ? `${p.spec.ramMin}–${p.spec.ramMax} GB` : p.spec.ram}</span>}
                            {!!p.spec?.storage && <span className="inline-flex items-center gap-1"><HardDrive className="h-3 w-3 text-[#ff8a2a]" />{p.spec.storage}</span>}
                            {!!p.spec?.bandwidth && <span className="inline-flex items-center gap-1"><Network className="h-3 w-3 text-[#ff8a2a]" />{p.spec.bandwidth}</span>}
                            <p className="ghc-metal-text-grad text-base font-black">{money(d.monthlyPrice ?? d.finalPrice, cur)}<span className="text-[10px] font-normal text-white/40">/mo</span></p>
                            <button
                              onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}&brand=metal`)}
                              className="ghc-metal-btn inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" /> Configure
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {g.rows.length > shown && (
                  <div className="mt-3 text-center">
                    <button onClick={() => setExpanded((e) => ({ ...e, [g.name]: shown + 10 }))} className="ghc-metal-btn-ghost rounded-lg px-4 py-1.5 text-xs font-bold">
                      Show more servers ({g.rows.length - shown}) →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Why Metal dedicated ─── */}
      <section id="why" className="relative border-t border-white/5 bg-[#0d0c12]">
        <div className="ghc-metal-orb ghc-metal-orb-c left-10 top-10 h-64 w-64 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-2xl font-black"><span className="ghc-metal-text-grad">Forged for production</span></h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Server, t: "Single-tenant hardware", d: "No hypervisor layer, no shared CPU — every cycle is yours." },
              { icon: Gauge, t: "Predictable performance", d: "Dedicated IOPS and bandwidth — consistent latency under load." },
              { icon: Shield, t: "Anti-DDoS included", d: "Always-on mitigation at the network edge, free on every range." },
              { icon: RefreshCw, t: "Deploy in minutes", d: "Automated provisioning with your choice of OS, apps and RAID." },
            ].map((f, i) => (
              <div key={f.t} className="ghc-metal-card ghc-metal-fade rounded-xl p-6" style={{ ["--d" as any]: `${i * 90}ms` }}>
                <f.icon className="h-8 w-8 text-[#ff8a2a] drop-shadow-[0_0_14px_rgba(255,122,24,.5)]" />
                <p className="mt-3 text-sm font-bold text-white">{f.t}</p>
                <p className="mt-1.5 text-xs leading-5 text-white/55">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Use cases ─── */}
      <section id="usecases" className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">Built for your workload</span></h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <div key={u.t} className="ghc-metal-card ghc-metal-fade rounded-xl p-6" style={{ ["--d" as any]: `${i * 60}ms` }}>
              <u.icon className="h-5 w-5 text-[#ff8a2a]" />
              <p className="mt-3 text-sm font-bold text-white">{u.t}</p>
              <p className="mt-2 text-xs leading-5 text-white/55">{u.d}</p>
            </div>
          ))}
        </div>
        <div className="ghc-metal-scan relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1c0d04] via-[#2a1206] to-[#3d1608] px-8 py-12 text-center ring-1 ring-[#ff7a18]/30">
          <div className="ghc-metal-orb ghc-metal-orb-a -left-20 -top-20 h-64 w-64 opacity-40" />
          <h3 className="relative text-2xl font-black"><span className="ghc-metal-text-grad">Need raw power? Forge it.</span></h3>
          <a href="#ranges" className="ghc-metal-btn relative mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold">Configure a Metal server</a>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-black"><span className="ghc-metal-text-grad">Your questions answered</span></h2>
          <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {FAQS.map((f, i) => (
              <div key={f.q}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-[#ffb347] transition-colors hover:text-[#ffc966]">
                  {f.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <p className="pb-4 text-sm leading-6 text-white/60">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
