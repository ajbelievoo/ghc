"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useGhcSettings } from "@/lib/ghcSettings";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Cpu, MemoryStick, HardDrive, Gauge, Globe2, ShieldCheck, Zap,
  ChevronDown, Server, Database, Code2, Boxes, ArrowRight, Lock,
} from "lucide-react";

interface Plan {
  planCode: string; invoiceName: string; description?: string;
  cpuCores?: number; ramGb?: number; diskGb?: number; diskType?: string; bandwidthMbps?: number;
  durations?: { durationLabel: string; finalPrice?: number; monthlyPrice?: number; rawPrice?: number; currency?: string }[];
}

const RANGES = [
  { key: "2027", label: "VPS 2027", tag: "New", desc: "Latest generation — NVMe storage, daily backup and up to 3 Gbps bandwidth included.", match: (c: string) => c.startsWith("vps-2027") },
  { key: "essential", label: "Essential", desc: "Entry range for websites, blogs and small apps — reliable performance at the lowest price.", match: (c: string) => c.startsWith("vps-essential") },
  { key: "comfort", label: "Comfort", desc: "Balanced CPU/RAM for production apps, e-commerce and multi-site hosting.", match: (c: string) => c.startsWith("vps-comfort") },
  { key: "elite", label: "Elite", desc: "8 vCores with flexible RAM/storage — for heavier workloads and busy platforms.", match: (c: string) => c.startsWith("vps-elite") },
  { key: "value", label: "Value & Starter", desc: "The cheapest way into a real VPS — dev boxes, bots, VPNs and learning.", match: (c: string) => c.startsWith("vps-value") || c.startsWith("vps-starter") },
  { key: "le", label: "Limited Edition", desc: "Special configurations at special prices — while stock lasts.", match: (c: string) => c.startsWith("vps-le") },
];

const OS_STRIP = ["AlmaLinux", "Ubuntu", "Debian", "Rocky Linux", "Fedora", "CloudLinux", "FreeBSD", "cPanel", "Plesk", "Docker", "WordPress", "Node.js"];

const FAQ = [
  { q: "How quickly is my VPS activated?", a: "Provisioning is automated — once payment is confirmed, most VPS are live within 2–5 minutes. You get the root password or your SSH key injected automatically." },
  { q: "Can I upgrade my VPS later?", a: "Yes — you can move to a higher range from the dashboard. Disks are not down-gradable, so plan storage carefully." },
  { q: "Is traffic really unlimited?", a: "Yes — all VPS come with unlimited traffic on the public port (fair-use applies). The port speed varies per plan (500 Mbps to 3 Gbps)." },
  { q: "Which operating systems can I install?", a: "AlmaLinux, Ubuntu, Debian, Rocky, Fedora, CloudLinux and FreeBSD images are available at order time, plus app images like Docker, WordPress, cPanel and Plesk." },
  { q: "Is DDoS protection included?", a: "Every VPS includes always-on network-level DDoS mitigation at no extra cost." },
  { q: "Do I get backups?", a: "VPS 2027 includes a daily backup of the previous 24 hours. Additional snapshot and backup options are available as paid add-ons at checkout." },
  { q: "Where are the servers located?", a: "VPS are deployed in our partner datacenters across Europe, North America and Asia-Pacific. Region availability is shown during configuration." },
  { q: "Can I get a refund?", a: "First-time VPS orders carry a 72-hour money-back guarantee — see the Refund Policy for details." },
];

function SpecRow({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
      <span className="text-xs leading-5 text-white/85">{children || label}</span>
    </div>
  );
}

export default function VpsClient({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const ghc = useGhcSettings();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>(initialPlans || []);
  const [range, setRange] = useState("2027");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const refetch = () => api.server.plans("VPS").then((d: Plan[]) => { if (alive) setPlans(d || []); }).catch(() => {});
    refetch();
    window.addEventListener("currencychange", refetch);
    return () => { alive = false; window.removeEventListener("currencychange", refetch); };
  }, [currency]);

  const ranges = useMemo(() => {
    return RANGES.map((r) => ({
      ...r,
      plans: (plans || [])
        .filter((p) => r.match(p.planCode))
        .sort((a, b) => (a.durations?.[0]?.finalPrice || 0) - (b.durations?.[0]?.finalPrice || 0)),
    }));
  }, [plans]);

  const active = ranges.find((r) => r.key === range) || ranges[0];
  const nextRange = ranges[ranges.indexOf(active) + 1];

  const monthly = (p: Plan) => p.durations?.find((d) => d.durationLabel === "1_month")?.monthlyPrice ?? p.durations?.[0]?.finalPrice ?? p.durations?.[0]?.monthlyPrice ?? 0;
  const planCur = (p: Plan) => (p.durations?.[0]?.currency || currency || "USD").toUpperCase();
  const money = (v: number, cur: string) => `${getCurrencySymbol(cur)}${Math.round(v).toLocaleString("en-IN")}`;

  const configure = (code: string) => router.push(`/configure?category=VPS&plan=${encodeURIComponent(code)}`);

  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />

      {/* ===== Hero + plan cards (Contabo-style) ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#101a3f] to-[#0b1020] text-white">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-[#00b7ff]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-[10%] h-80 w-80 rounded-full bg-[#7b2ff7]/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 pt-14 pb-16 text-center">
          <h1 className="text-4xl font-black md:text-5xl">{active.label}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">{active.desc}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-white/80">
            <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-[#00b7ff]" /> Latest-gen vCPUs</span>
            <span className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 text-[#00b7ff]" /> NVMe SSD storage</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#00b7ff]" /> DDoS protection included</span>
            <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-[#00b7ff]" /> Unlimited traffic</span>
          </div>

          {/* range tabs */}
          <div className="mt-8 inline-flex flex-wrap justify-center gap-1 rounded-full border border-white/15 bg-white/5 p-1 backdrop-blur">
            {ranges.filter((r) => r.plans.length > 0).map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${range === r.key ? "bg-[#00b7ff] text-white shadow-[0_0_16px_rgba(0,183,255,.4)]" : "text-white/70 hover:bg-white/10"}`}
              >
                {r.label}{r.tag ? <span className="ml-1.5 rounded bg-emerald-400/20 px-1.5 py-0.5 text-[9px] text-emerald-300">{r.tag}</span> : null}
              </button>
            ))}
          </div>

          {/* plan cards */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {active.plans.map((p) => {
              const bw = p.bandwidthMbps ? (p.bandwidthMbps >= 1000 ? `${(p.bandwidthMbps / 1000).toFixed(0)} Gbps` : `${p.bandwidthMbps} Mbps`) : null;
              return (
                <div key={p.planCode} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left backdrop-blur transition hover:border-[#00b7ff]/50 hover:bg-white/[0.09]">
                  <p className="text-sm font-black text-white">{p.invoiceName || p.planCode}</p>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">{money(monthly(p), planCur(p))}</span>
                    <span className="text-xs text-white/60">/month</span>
                  </div>
                  <p className="text-[10px] text-white/50">ex. GST · billed monthly</p>

                  <div className="mt-4 space-y-0 divide-y divide-white/5 border-t border-white/10">
                    <SpecRow label="" icon={Cpu}>{p.cpuCores ? `${p.cpuCores} vCores` : "vCore"}</SpecRow>
                    <SpecRow label="" icon={MemoryStick}>{p.ramGb ? `${p.ramGb} GB RAM` : "—"}</SpecRow>
                    <SpecRow label="" icon={HardDrive}>{p.diskGb ? `${p.diskGb} GB ${p.diskType || "SSD NVMe"}` : "—"}</SpecRow>
                    <SpecRow label="" icon={Gauge}>{bw ? `${bw} port` : "—"}</SpecRow>
                    <SpecRow label="" icon={Globe2}>Unlimited traffic</SpecRow>
                  </div>

                  <button onClick={() => configure(p.planCode)} className="mt-5 w-full rounded-xl bg-[#00b7ff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#009fe0] group-hover:shadow-[0_0_18px_rgba(0,183,255,.4)]">
                    Configure
                  </button>
                </div>
              );
            })}
          </div>
          {active.plans.length === 0 && <p className="mt-10 text-sm text-white/50">No plans in this range right now — check another range.</p>}

          {nextRange && nextRange.plans.length > 0 && (
            <p className="mt-8 text-xs text-white/60">
              Need more power?{" "}
              <button onClick={() => setRange(nextRange.key)} className="font-bold text-[#00b7ff] hover:underline">
                Go with {nextRange.label} →
              </button>
            </p>
          )}
        </div>
      </section>

      {/* ===== Use cases ===== */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-3xl font-black text-[#0f172a]">Cloud VPS built for what your workload actually needs</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">
          Email servers, blogs, dev environments, stores and game servers — everyday workloads run perfectly on
          proven, low-cost GHC infrastructure.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe2, t: "Web hosting & CMS", d: "WordPress, Joomla, Drupal, Ghost — NVMe storage and unmetered traffic keep sites fast under load." },
            { icon: Code2, t: "Dev & CI environments", d: "Staging servers, GitLab runners, build agents — root access, snapshots and hourly-consistent billing." },
            { icon: Database, t: "Databases & storage", d: "MySQL, PostgreSQL, Redis — dedicated RAM keeps query performance predictable." },
            { icon: Boxes, t: "Private cloud & file sync", d: "Nextcloud, VPNs, monitoring stacks — your own private infrastructure with full control." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#00b7ff]/50 hover:shadow-md">
              <c.icon className="h-6 w-6 text-[#00b7ff]" />
              <p className="mt-3 font-bold text-[#0f172a]">{c.t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Range comparison ===== */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="text-center text-3xl font-black text-[#0f172a]">Compare VPS ranges</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500">Every range targets a different workload — pick yours.</p>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faff]">
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Range</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">Best for</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">vCores</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">RAM</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500">From</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {ranges.filter((r) => r.plans.length > 0).map((r) => {
                const cheapest = r.plans[0];
                const maxC = Math.max(...r.plans.map((p) => p.cpuCores || 0));
                const maxR = Math.max(...r.plans.map((p) => p.ramGb || 0));
                const minC = Math.min(...r.plans.map((p) => p.cpuCores || 99));
                const minR = Math.min(...r.plans.map((p) => p.ramGb || 999));
                return (
                  <tr key={r.key} className={`border-b border-slate-100 transition hover:bg-[#f8faff] ${range === r.key ? "bg-[#e8f6ff]/60" : ""}`}>
                    <td className="px-5 py-3.5 font-black text-[#0f172a]">{r.label}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{r.desc.split("—")[0]}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{minC}–{maxC}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">{minR}–{maxR} GB</td>
                    <td className="px-5 py-3.5 font-bold text-[#0f172a]">{money(monthly(cheapest), planCur(cheapest))}<span className="text-[10px] font-normal text-slate-400">/mo</span></td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => { setRange(r.key); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center gap-1 rounded-lg bg-[#00b7ff]/10 px-3 py-1.5 text-xs font-bold text-[#0050d7] hover:bg-[#00b7ff]/20">
                        View <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== OS & apps strip ===== */}
      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-2xl font-black text-[#0f172a]">Your operating systems, apps and panels</h2>
          <p className="mt-2 text-sm text-slate-500">Choose at configuration — reinstall anytime from the dashboard.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            {OS_STRIP.map((o) => (
              <span key={o} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#00b7ff]/50 hover:bg-[#e8f6ff]">{o}</span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            <Link href="/vps/cpanel" className="font-bold text-[#0050d7] hover:underline">cPanel VPS →</Link>
            <Link href="/vps/plesk" className="font-bold text-[#0050d7] hover:underline">Plesk VPS →</Link>
            <Link href="/vps/wordpress" className="font-bold text-[#0050d7] hover:underline">WordPress VPS →</Link>
            <Link href="/vps/comfort" className="font-bold text-[#0050d7] hover:underline">Comfort VPS →</Link>
          </div>
        </div>
      </section>

      {/* ===== Why choose ===== */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="text-center text-3xl font-black text-[#0f172a]">Why GHC VPS</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Always-on DDoS protection", d: "Network-level mitigation on every VPS, included free — attacks are absorbed at the edge before they reach you." },
            { icon: Zap, t: "NVMe performance", d: "Enterprise NVMe SSDs across every range — your apps get the I/O headroom shared hosting can't give." },
            { icon: Globe2, t: "Unlimited traffic", d: "Unmetered bandwidth on every plan — no surprise overage bills when your project takes off." },
            { icon: Lock, t: "Full root access", d: "Real root, your kernel, your rules — install anything, tune everything, host anything legal." },
            { icon: Server, t: "Snapshots & reinstall", d: "Rebuild your VPS to any supported OS in minutes, straight from the dashboard." },
            { icon: Gauge, t: "Predictable billing", d: "Flat monthly pricing, GST shown at checkout, no hidden bandwidth or I/O metering." },
          ].map((f) => (
            <div key={f.t} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <f.icon className="h-6 w-6 text-[#00b7ff]" />
              <p className="mt-3 font-bold text-[#0f172a]">{f.t}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <h2 className="text-center text-3xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {FAQ.map((f, i) => (
            <div key={i}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="text-sm font-bold text-[#0f172a]">{f.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-gradient-to-r from-[#0050d7] to-[#00b7ff] py-12 text-center text-white">
        <h2 className="text-2xl font-black md:text-3xl">Take your project to the next level</h2>
        <p className="mt-2 text-sm text-white/80">Deploy a {ghc.name} VPS in minutes — {ghc.tagline}.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mt-5 rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#0050d7] shadow-lg transition hover:scale-105">
          Choose a VPS
        </button>
      </section>

      <Footer />
    </div>
  );
}
