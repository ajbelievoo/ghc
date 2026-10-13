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

const MATRIX: { label: string; vals: Record<string, string> }[] = [
  { label: "CPU cores", vals: { Game: "From 8 – 16 cores", Advance: "From 6 – 16 cores", Scale: "From 16 – 384 cores", "High Grade": "From 16 – 192 cores" } },
  { label: "RAM", vals: { Game: "DDR5 ECC, 5600 MT/s", Advance: "From 64 GB – 256 GB", Scale: "From 128 GB – 2 TB", "High Grade": "From 128 GB – 2 TB" } },
  { label: "Storage", vals: { Game: "NVMe Gen4, 2 disks", Advance: "NVMe Gen4 / SATA", Scale: "NVMe Gen4/Gen5, up to 26 disks", "High Grade": "NVMe, SAS, up to 36 disks" } },
  { label: "Public bandwidth", vals: { Game: "1 Gbps", Advance: "500 Mbps – 1 Gbps", Scale: "1 – 25 Gbps", "High Grade": "1 – 25 Gbps" } },
  { label: "Game anti-DDoS", vals: { Game: "✓ game profiles", Advance: "✓", Scale: "✓", "High Grade": "✓" } },
  { label: "vRack private network", vals: { Game: "1 Gbps", Advance: "25 Gbps", Scale: "50 Gbps", "High Grade": "50 Gbps" } },
  { label: "SLA", vals: { Game: "99.90%", Advance: "99.95%", Scale: "99.99%", "High Grade": "99.99%" } },
];

export default function GameRangePage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(8);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const { gameRows, regionCount, rangeMin } = useMemo(() => {
    const regs = new Set<string>();
    const gameRows: { p: any; d: any }[] = [];
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      const r = rangeOf(p);
      if (d && RANGE_META[r]) {
        const cur = d.currency || p.currency || "USD";
        if (!rangeMin[r] || d.monthlyPrice < rangeMin[r].price) rangeMin[r] = { price: d.monthlyPrice, cur };
      }
      if (r === "Game" && d) {
        gameRows.push({ p, d });
        (p.regions || []).forEach((x: string) => regs.add(x));
      }
    }
    gameRows.sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
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

      {/* Discover ranges (dark) */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <h2 className="text-xl font-black text-center">Discover GHC dedicated servers</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(RANGE_META).map(([r, meta]) => {
              const mn = rangeMin[r];
              const active = r === "Game";
              return (
                <a key={r} href={meta.href} className={`rounded-2xl border-2 p-5 transition-all ${active ? "border-[#00b7ff] bg-[#00b7ff]/10 shadow-md" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                  <p className="text-sm font-black">{r}</p>
                  <p className="mt-1 text-[11px] text-white/50 leading-4 h-9">{meta.desc}</p>
                  {mn && <p className="mt-3 text-xs text-white/50">Starting from <span className="text-base font-black">{sym(mn.cur)}{mn.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span><span className="text-[10px] text-white/40">/mo</span></p>}
                  <span className={`mt-3 inline-block w-full text-center rounded-lg py-2 text-xs font-bold ${active ? "bg-[#00b7ff] text-[#050914]" : "bg-white/10 text-white"}`}>Discover →</span>
                </a>
              );
            })}
          </div>
          {/* Matrix */}
          <div className="mt-8 rounded-2xl border border-white/10 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="bg-white/5">
                  <th className="text-left px-4 py-3 font-black text-white/40 w-36"></th>
                  {Object.keys(RANGE_META).map((r) => (
                    <th key={r} className={`px-4 py-3 text-center font-black ${r === "Game" ? "text-[#00b7ff] bg-[#00b7ff]/10" : "text-white"}`}>{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MATRIX.map((row) => (
                  <tr key={row.label} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-2.5 font-bold text-white/50">{row.label}</td>
                    {Object.keys(RANGE_META).map((r) => (
                      <td key={r} className={`px-4 py-2.5 text-center text-white/60 ${r === "Game" ? "bg-[#00b7ff]/5 font-semibold text-white" : ""}`}>{row.vals[r]}</td>
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

      {/* Game plan table */}
      <section id="game-plans" className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black">Explore our selection of Game servers</h2>
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="divide-y divide-white/5">
            {gameRows.slice(0, visible).map(({ p, d }) => {
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
                    <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#00b7ff] px-4 py-2 text-xs font-bold text-[#050914] hover:bg-sky-400">Order</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {gameRows.length > visible && (
          <div className="mt-5 text-center">
            <button onClick={() => setVisible((v) => v + 10)} className="inline-block rounded-lg bg-white/10 px-6 py-2.5 text-xs font-bold hover:bg-white/20">Show more servers ({gameRows.length - visible})</button>
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
