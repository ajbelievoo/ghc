"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Cpu, Gamepad2, ShieldCheck, MonitorPlay, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["What should a Game server be used for?", "Game servers are built for multiplayer game hosting — Minecraft, Rust, CS2, ARK, FiveM and more. High-frequency CPUs with large caches deliver the tick rates that keep gameplay smooth under load."],
  ["What is a Game server used for?", "Hosting dedicated game instances, voice servers, matchmaking backends and game community websites — anything where single-thread performance and DDoS resilience matter most."],
  ["Where would my data be hosted?", "Game servers deploy across our global regions — pick the datacentre closest to your player base to minimise latency."],
  ["What is the private network?", "The vRack private network connects your game servers, databases and panels over isolated layer-2 networking — cluster traffic never touches the public internet."],
  ["Are Game servers certified ISO 27001?", "Yes — our datacentres and management processes are covered by industry certifications including ISO 27001, depending on region."],
  ["What are the technical specifications of the Game range?", "AMD Ryzen 9800X 3D / 9950X 3D processors — up to 16 cores, 5.7 GHz boost, 3D V-Cache, DDR5 ECC memory and NVMe Gen4 storage, with Game-optimised anti-DDoS protection."],
  ["Which is the best Game server?", "For most game communities the 9800X 3D models offer the best value; esports-grade deployments pick the 9950X 3D with maximum cores."],
  ["Which Game dedicated server should I choose?", "Match player count and mod load to cores and RAM — light vanilla servers need less, heavily modded instances benefit from the top-tier model."],
  ["Why choose a Game dedicated server?", "Purpose-built cooling sustains boost clocks, Game DDoS protection filters gaming-protocol attacks, and fixed monthly pricing keeps costs predictable as your community grows."],
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
    { label: "Private bandwidth", vals: R4("1 Gbps", "25 Gbps", "50 Gbps", "from 50 – 100 Gbps"), summary: true },
    { label: "DDoS protection", vals: R4("✓", "✓", "✓", "✓") },
    { label: "Anti-DDoS Game", vals: R4("✓", "–", "–", "–") },
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
    { label: "Rate", vals: R4("99.90%", "99.95%", "99.99%", "99.99%") },
  ] },
  { title: "Infrastructure", rows: [
    { label: "Cooling system", vals: R4("Air", "Industrial watercooling", "Industrial watercooling", "Industrial watercooling") },
  ] },
];

export default function GameRangePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(6);
  const [showMatrix, setShowMatrix] = useState(false);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const { gameRows, regionCount, rangeMin } = useMemo(() => {
    const regs = new Set<string>();
    const groups = new Map<string, { p: any; d: any; locations: number; isRegional: boolean }>();
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      const r = rangeOf(p);
      if (d && RANGE_META[r]) {
        const cur = d.currency || p.currency || "USD";
        if (!rangeMin[r] || d.monthlyPrice < rangeMin[r].price) rangeMin[r] = { price: d.monthlyPrice, cur };
      }
      if (r !== "Game" || !d) continue;
      (p.regions || []).forEach((x: string) => regs.add(x));
      const key = String(p.planCode || "").split("-").slice(0, 2).join("-");
      const isRegional = /-(syd|mum|sgp|waw|gra|rbx|sbg|bhs|lon|eri|lim|par)$/i.test(String(p.planCode));
      const prev = groups.get(key);
      if (!prev || (prev.isRegional && !isRegional) || (prev.isRegional === isRegional && d.monthlyPrice < prev.d.monthlyPrice)) {
        groups.set(key, { p, d, locations: (prev?.locations || 0) + 1, isRegional });
      } else {
        prev.locations += 1;
      }
    }
    const gameRows = Array.from(groups.values()).sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
    return { gameRows, regionCount: regs.size || 5, rangeMin };
  }, [plans]);

  const tabs = (
    <div className="border-b border-white/10 sticky top-0 z-30 bg-[#050914]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex gap-1 overflow-x-auto">
        {Object.keys(RANGE_META).map((r) => (
          <a key={r} href={RANGE_META[r].href} className={`px-5 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition ${r === "Game" ? "border-[#00b7ff] text-[#00b7ff]" : "border-transparent text-white/50 hover:text-white"}`}>{r}</a>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <Navbar />
      {tabs}

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <p className="text-[11px] text-white/40"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Game</p>
        <h1 className="mt-6 text-3xl md:text-4xl font-black">A platform built for game hosting</h1>
        <p className="mt-4 text-sm text-white/70 leading-7 max-w-3xl">
          Game servers, with their AMD Ryzen 9000X 3D processors and custom DDoS protection for online gaming, are built to deliver a top-notch, lag-free experience for your players and customers alike.
        </p>
        {/* CSS chassis */}
        <div className="mt-8 hidden md:flex justify-center">
          <div className="w-full max-w-2xl h-24 rounded-xl bg-gradient-to-b from-[#101d42] to-[#0b1020] border border-[#00b7ff]/30 flex items-center px-8 gap-6">
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
            <div className="flex gap-2">{[0,1,2,3].map(i => <span key={i} className="w-8 h-12 rounded bg-[#14235a] border border-[#00b7ff]/25" />)}</div>
            <div className="flex-1 h-14 rounded bg-[#14235a] border border-[#00b7ff]/25 grid grid-cols-10 gap-1 p-1.5">
              {Array.from({length: 10}).map((_, i) => <span key={i} className="rounded-sm bg-[#00b7ff]/20" />)}
            </div>
            <Gamepad2 className="w-8 h-8 text-[#00b7ff]" />
          </div>
        </div>
        {/* Stats */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl">
          <div>
            <p className="text-xs text-white/40">Up to</p>
            <p className="text-2xl font-black">{gameRows.length} servers</p>
            <p className="text-xs text-white/50">in a rack space</p>
          </div>
          <div>
            <p className="text-xs text-white/40">Deployable in</p>
            <p className="text-2xl font-black">{regionCount} regions</p>
            <p className="text-xs text-white/50">on 5 continents, including the US</p>
          </div>
          <div className="col-span-2 md:col-span-1 flex items-start">
            <a href="#game-plans" className="rounded-lg bg-[#00b7ff] px-6 py-2.5 text-sm font-bold text-[#050914] hover:bg-sky-400">Discover Game servers →</a>
          </div>
        </div>
      </section>

      {/* CPU card */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl border border-[#00b7ff]/25 bg-white/[0.04] p-6">
          <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">AMD Ryzen 9800X 3D / 9950X 3D</p>
          <div className="mt-4 flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#101d42] to-[#1c2f66] border border-[#00b7ff]/40 flex items-center justify-center">
              <Cpu className="w-7 h-7 text-[#00b7ff]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] text-white/40">Up to</p><p className="text-xl font-black">16 cores</p><p className="text-[10px] text-white/40">per CPU</p></div>
              <div><p className="text-[10px] text-white/40">Up to</p><p className="text-xl font-black">5.7 GHz</p><p className="text-[10px] text-white/40">boost frequency</p></div>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/60 leading-5">Equipped with AMD Ryzen 9800X 3D and 9950X 3D processors, Game servers offer high clock frequencies and an expanded L3 3D V-Cache. The high frequencies and low latency memory deliver faster tick times, improved performance stability, and a seamless gaming experience.</p>
        </div>
      </section>

      {/* Game DDoS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="hidden md:flex justify-center">
          <div className="relative w-72 h-40">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#101d42] to-[#0b1020] border border-[#00b7ff]/25" />
            <ShieldCheck className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 text-[#00b7ff]" />
            <Gamepad2 className="absolute bottom-4 right-5 w-10 h-10 text-white/40" />
          </div>
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black">Ensure a smooth gameplay with our Game DDoS Protection</h2>
          <p className="mt-3 text-sm text-white/70 leading-7">
            Deliver service quality by reducing downtime, and enjoy easy setup via our control panel. Designed to suit just a few clicks and deployed within a minute — what's more, we're always adding new protected game profiles.
          </p>
        </div>
      </section>

      {/* Game Panel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-black">GHC Game Panel</h2>
          <p className="mt-3 text-sm text-white/70 leading-7">
            Our game panel is a simple and easy-to-use web interface for deploying, configuring and managing your game servers on your GHC dedicated servers. Designed for gaming communities and game-hosting pros, it strips away technical complexity, making the entire process — from deployment to monitoring — effortless.
          </p>
          <ul className="mt-5 space-y-2.5">
            {[
              "Game server setup should be quick and easy, without needing command lines or hours of configuration. Our panel simplifies everything.",
              "Get your server up and running with one click via a clear and rapid web interface — start, stop, restart.",
              "It's ideal for quickly setting up a server with friends, so you can just jump in and play without any technical headaches.",
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-xs text-white/70"><Check className="w-3.5 h-3.5 text-[#00b7ff] shrink-0 mt-0.5" />{b}</li>
            ))}
          </ul>
          <a href="/apps" className="mt-6 inline-block rounded-lg bg-[#00b7ff] px-6 py-2.5 text-sm font-bold text-[#050914] hover:bg-sky-400">GHC Control Panel</a>
        </div>
        {/* CSS panel mock */}
        <div className="rounded-xl border border-white/10 bg-[#0b1020] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-2 bg-[#101d42] px-3 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 flex-1 rounded bg-white/10 px-2 py-0.5 text-[9px] text-white/40">panel.ghc.cloud</span>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex gap-2">{["Instances", "Players", "Console"].map((t) => <span key={t} className="rounded bg-white/10 px-2.5 py-1 text-[9px] font-bold text-[#00b7ff]">{t}</span>)}</div>
            {[["Minecraft — survival", "running", "text-emerald-400"], ["Rust — vanilla", "running", "text-emerald-400"], ["CS2 — match", "stopped", "text-red-400"]].map(([n, s, c]) => (
              <div key={n as string} className="flex items-center justify-between rounded bg-white/5 border border-white/10 px-3 py-2">
                <span className="text-[10px] text-white/80">{n}</span>
                <span className={`text-[9px] font-bold ${c}`}>{s}</span>
              </div>
            ))}
            <div className="rounded bg-black/60 border border-white/10 p-2.5 font-mono text-[8px] text-emerald-400/80 leading-4">
              <p>$ ./start.sh --profile=minecraft</p><p>[OK] 47 players online · TPS 20.0</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cooling stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl">
          {[
            { v: "8%", d: "performance variation during peak usage" },
            { v: "250 W TDP", d: "an optimised thermal envelope supporting CPUs" },
            { v: "1.15", d: "Power Usage Effectiveness (PUE) from water-cooling technology" },
          ].map((s) => (
            <div key={s.v} className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-2xl font-black text-[#00b7ff]">{s.v}</p>
              <p className="mt-1.5 text-[11px] text-white/50 leading-4">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Discover ranges — aligned comparison grid, expands in place */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-14">
          <h2 className="text-xl font-black text-center">Discover GHC dedicated servers</h2>
          <div className="mt-8 overflow-x-auto">
            <div className="min-w-[760px] grid grid-cols-[170px_repeat(4,minmax(0,1fr))] gap-x-3">
              <div />
              {Object.entries(RANGE_META).map(([r, meta]) => {
                const mn = rangeMin[r];
                const active = r === "Game";
                return (
                  <div key={r} className={`rounded-t-xl p-4 flex flex-col bg-white/[0.04] ${active ? "border-2 border-b-0 border-[#00b7ff] bg-[#00b7ff]/10" : ""}`}>
                    <p className="text-lg font-black">{r}</p>
                    <p className="mt-1 text-[11px] leading-4 min-h-[44px] text-white/50">{meta.desc}</p>
                    {mn && (
                      <p className="mt-3 text-[10px] text-white/50">Starting from
                        <span className="block text-xl font-black text-white">{sym(mn.cur)}{mn.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-white/40"> ex. VAT/month</span></span>
                      </p>
                    )}
                    <a href={meta.href} className="mt-3 block rounded-md bg-[#0050d7] py-2 text-center text-xs font-bold text-white hover:bg-[#0043b3]">Discover →</a>
                  </div>
                );
              })}

              {DETAIL.map((sec, si) => {
                const rows = showMatrix ? sec.rows : sec.rows.filter((x) => x.summary);
                if (!rows.length) return null;
                const lastSection = showMatrix ? si === DETAIL.length - 1 : si === DETAIL.findLastIndex((d) => d.rows.some((x) => x.summary));
                return (
                  <div key={sec.title} className="contents">
                    <p className="col-span-5 mt-4 mb-1 text-[11px] font-black text-white border-b border-white/10 pb-1">{sec.title}</p>
                    {rows.map((row, ri) => {
                      const lastRow = lastSection && ri === rows.length - 1;
                      return (
                        <div key={row.label} className="contents">
                          <div className="py-2 pr-2 text-[11px] text-white/40 self-center">{row.label}</div>
                          {Object.keys(RANGE_META).map((r, ci) => {
                            const v = row.vals[ci];
                            const active = r === "Game";
                            return (
                              <div key={r} className={`py-2 px-2 text-center text-[11px] self-center ${active ? `bg-[#00b7ff]/10 border-x-2 border-[#00b7ff] ${lastRow ? "border-b-2 rounded-b-xl pb-3" : ""}` : "bg-white/[0.03]"} ${v === "✓" ? "text-emerald-400 font-bold" : v === "–" ? "text-white/20" : v === "Coming soon" ? "text-white/30" : "text-white font-semibold"}`}>{v}</div>
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
            <button onClick={() => setShowMatrix((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-[#00b7ff] hover:underline">
              {showMatrix ? "View less" : "View more"} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMatrix ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Game plan table */}
      <section id="game-plans" className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black">Explore our selection of Game servers</h2>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-white/5 text-left">
                <th className="px-5 py-3 font-black text-white/40">Name</th>
                <th className="px-4 py-3 font-black text-white/40">Processor</th>
                <th className="px-4 py-3 font-black text-white/40">Memory</th>
                <th className="px-4 py-3 font-black text-white/40">Storage</th>
                <th className="px-4 py-3 font-black text-white/40">Bandwidth</th>
                <th className="px-4 py-3 font-black text-white/40 text-right">Price</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gameRows.slice(0, visible).map(({ p, d, locations }: any) => {
                const cur = d?.currency || p.currency || "USD";
                const isNew = String(p.features?.["release-year"] || "") === "2026" || String(p.features?.["last-generation"]) === "true";
                const spec = p.spec || {};
                const name = p.displayName || (p.invoiceName || p.planCode).split("|")[0].trim();
                return (
                  <tr key={p.planCode} className="hover:bg-white/[0.05] transition-colors">
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black">{name}</span>
                        {isNew && <span className="rounded-full bg-violet-500/20 text-violet-300 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">New</span>}
                      </div>
                      {locations > 1 && <p className="mt-0.5 text-[10px] text-white/30">{locations} locations</p>}
                    </td>
                    <td className="px-4 py-3.5 align-top text-white/60">{spec.cpu || p.description || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-white/60 whitespace-nowrap">{spec.ram || (p.ramGb ? `${p.ramGb} GB` : "—")}</td>
                    <td className="px-4 py-3.5 align-top text-white/60 whitespace-nowrap">{spec.storage || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-white/60 whitespace-nowrap">{spec.bandwidth || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                      <span className="text-sm font-black">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] font-normal text-white/40">/mo</span>
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#00b7ff] px-4 py-2 text-xs font-bold text-[#050914] hover:bg-sky-400 whitespace-nowrap">Configure</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {gameRows.length > visible && (
          <div className="mt-5 text-center">
            <a href="/dedicated-servers/prices?range=game" className="inline-block rounded-lg bg-[#0050d7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0043b3]">Show more servers →</a>
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
