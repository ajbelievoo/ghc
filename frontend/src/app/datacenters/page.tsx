"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from "react-simple-maps";
import topo from "world-atlas/countries-110m.json";
import { Globe, MapPin, Search, ChevronDown, Server, ShieldCheck, Zap, Radio, Plus, Minus, Maximize2, Cpu } from "lucide-react";

type Zone = { name: string; dcs?: string[] };
type Region = {
  continent: "Europe" | "North America" | "Asia Pacific" | "Africa";
  location: string;
  regionName: string;
  type: "1-AZ" | "3-AZ" | "LOCAL-ZONE";
  dcCount: number | null;
  year: number;
  zones: Zone[];
  lat: number;
  lng: number;
};

const REGIONS: Region[] = [
  // ---- Europe ----
  { continent: "Europe", location: "France — Gravelines", regionName: "eu-west-gra", type: "1-AZ", dcCount: 4, year: 2013, lat: 50.99, lng: 2.13, zones: [{ name: "eu-west-gra-a", dcs: ["GRA1", "GRA2", "GRA3", "GRA04"] }] },
  { continent: "Europe", location: "France — Gravelines (snc)", regionName: "eu-west-gra-snc", type: "1-AZ", dcCount: null, year: 2013, lat: 51.09, lng: 2.23, zones: [{ name: "eu-west-gra-snc-a" }] },
  { continent: "Europe", location: "France — Paris", regionName: "eu-west-par", type: "3-AZ", dcCount: 3, year: 2023, lat: 48.85, lng: 2.35, zones: [{ name: "eu-west-par-a", dcs: ["CCH01"] }, { name: "eu-west-par-b", dcs: ["IEB01"] }, { name: "eu-west-par-c", dcs: ["MR901"] }] },
  { continent: "Europe", location: "France — Roubaix", regionName: "eu-west-rbx", type: "1-AZ", dcCount: 9, year: 2007, lat: 50.69, lng: 3.2, zones: [{ name: "eu-west-rbx-a", dcs: ["RBX", "RBX2", "RBX3", "RBX4", "RBX5", "RBX6", "RBX7", "RBX8", "RBX10"] }] },
  { continent: "Europe", location: "France — Roubaix (snc)", regionName: "eu-west-rbx-snc", type: "1-AZ", dcCount: null, year: 2007, lat: 50.79, lng: 3.3, zones: [{ name: "eu-west-rbx-snc-a" }] },
  { continent: "Europe", location: "France — Strasbourg", regionName: "eu-west-sbg", type: "1-AZ", dcCount: 2, year: 2017, lat: 48.57, lng: 7.75, zones: [{ name: "eu-west-sbg-a", dcs: ["SBG3", "SBG5"] }] },
  { continent: "Europe", location: "France — Strasbourg (snc)", regionName: "eu-west-sbg-snc", type: "1-AZ", dcCount: null, year: 2017, lat: 48.67, lng: 7.85, zones: [{ name: "eu-west-sbg-snc-a" }] },
  { continent: "Europe", location: "Germany — Limburg", regionName: "eu-west-lim", type: "1-AZ", dcCount: 3, year: 2017, lat: 50.38, lng: 8.05, zones: [{ name: "eu-west-lim-a", dcs: ["LIM1", "LIM2", "LIM3"] }] },
  { continent: "Europe", location: "Italy — Milan", regionName: "eu-south-mil", type: "3-AZ", dcCount: 3, year: 2025, lat: 45.46, lng: 9.19, zones: [{ name: "eu-south-mil-a", dcs: ["ITZVF01"] }, { name: "eu-south-mil-b", dcs: ["ITBSI01"] }, { name: "eu-south-mil-c", dcs: ["ITMIL01"] }] },
  { continent: "Europe", location: "Poland — Warsaw", regionName: "eu-central-waw", type: "1-AZ", dcCount: 1, year: 2016, lat: 52.23, lng: 21.0, zones: [{ name: "eu-central-waw-a", dcs: ["WAW1"] }] },
  { continent: "Europe", location: "United Kingdom — Erith (London)", regionName: "eu-west-eri", type: "1-AZ", dcCount: 2, year: 2017, lat: 51.48, lng: 0.18, zones: [{ name: "eu-west-eri-a", dcs: ["ERI1", "ERI2"] }] },
  { continent: "Europe", location: "Austria — Vienna", regionName: "eu-west-lz-vie", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 48.2, lng: 16.37, zones: [{ name: "eu-west-lz-vie-a" }] },
  { continent: "Europe", location: "Belgium — Brussels", regionName: "eu-west-lz-bru", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 50.85, lng: 4.35, zones: [{ name: "eu-west-lz-bru-a" }] },
  { continent: "Europe", location: "Bulgaria — Sofia", regionName: "eu-central-lz-sof", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 42.7, lng: 23.32, zones: [{ name: "eu-central-lz-sof-a" }] },
  { continent: "Europe", location: "Czech Republic — Prague", regionName: "eu-central-lz-prg", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 50.08, lng: 14.44, zones: [{ name: "eu-central-lz-prg-a" }] },
  { continent: "Europe", location: "Denmark — Copenhagen", regionName: "eu-north-lz-cph", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 55.68, lng: 12.57, zones: [{ name: "eu-north-lz-cph-a" }] },
  { continent: "Europe", location: "Finland — Helsinki", regionName: "eu-north-lz-hel", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 60.17, lng: 24.94, zones: [{ name: "eu-north-lz-hel-a" }] },
  { continent: "Europe", location: "France — Marseille", regionName: "eu-west-lz-mrs", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 43.3, lng: 5.37, zones: [{ name: "eu-west-lz-mrs-a" }] },
  { continent: "Europe", location: "Ireland — Dublin", regionName: "eu-west-lz-dln", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 53.35, lng: -6.26, zones: [{ name: "eu-west-lz-dln-a" }] },
  { continent: "Europe", location: "Italy — Milan", regionName: "eu-south-lz-mil", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 45.56, lng: 9.09, zones: [{ name: "eu-south-lz-mil-a" }] },
  { continent: "Europe", location: "Luxembourg — Luxembourg", regionName: "eu-west-lz-lux", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 49.61, lng: 6.13, zones: [{ name: "eu-west-lz-lux-a" }] },
  { continent: "Europe", location: "Netherlands — Amsterdam", regionName: "eu-west-lz-ams", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 52.37, lng: 4.9, zones: [{ name: "eu-west-lz-ams-a" }] },
  { continent: "Europe", location: "Norway — Oslo", regionName: "eu-north-lz-osl", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 59.91, lng: 10.75, zones: [{ name: "eu-north-lz-osl-a" }] },
  { continent: "Europe", location: "Portugal — Lisbon", regionName: "eu-south-lz-lis", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 38.72, lng: -9.14, zones: [{ name: "eu-south-lz-lis-a" }] },
  { continent: "Europe", location: "Romania — Bucharest", regionName: "eu-central-lz-buh", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 44.43, lng: 26.1, zones: [{ name: "eu-central-lz-buh-a" }] },
  { continent: "Europe", location: "Spain — Madrid", regionName: "eu-south-lz-mad", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 40.42, lng: -3.7, zones: [{ name: "eu-south-lz-mad-a" }] },
  { continent: "Europe", location: "Sweden — Stockholm", regionName: "eu-north-lz-sto", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 59.33, lng: 18.07, zones: [{ name: "eu-north-lz-sto-a" }] },
  { continent: "Europe", location: "Switzerland — Zurich", regionName: "eu-west-lz-zrh", type: "LOCAL-ZONE", dcCount: null, year: 2024, lat: 47.37, lng: 8.54, zones: [{ name: "eu-west-lz-zrh-a" }] },
  { continent: "Europe", location: "United Kingdom — Manchester", regionName: "eu-west-lz-mnc", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 53.48, lng: -2.24, zones: [{ name: "eu-west-lz-mnc-a" }] },
  // ---- North America ----
  { continent: "North America", location: "Canada — Beauharnois (Montreal)", regionName: "ca-east-bhs", type: "1-AZ", dcCount: 8, year: 2012, lat: 45.32, lng: -73.87, zones: [{ name: "ca-east-bhs-a", dcs: ["BHS1", "BHS2", "BHS3", "BHS4", "BHS5", "BHS6", "BHS7", "BHS8"] }] },
  { continent: "North America", location: "United States — Vint Hill (Virginia)", regionName: "us-east-vin", type: "1-AZ", dcCount: 1, year: 2018, lat: 38.75, lng: -77.67, zones: [{ name: "us-east-vin-a", dcs: ["VIN1"] }] },
  { continent: "North America", location: "United States — Hillsboro (Oregon)", regionName: "us-west-hil", type: "1-AZ", dcCount: 1, year: 2020, lat: 45.52, lng: -122.99, zones: [{ name: "us-west-hil-a", dcs: ["HIL1"] }] },
  // ---- Asia Pacific ----
  { continent: "Asia Pacific", location: "Australia — Sydney", regionName: "ap-southeast-syd", type: "1-AZ", dcCount: 3, year: 2016, lat: -33.87, lng: 151.21, zones: [{ name: "ap-southeast-syd-a", dcs: ["SYD1", "SYD2", "SYD3"] }] },
  { continent: "Asia Pacific", location: "India — Mumbai", regionName: "ap-south-mum", type: "1-AZ", dcCount: 1, year: 2021, lat: 19.08, lng: 72.88, zones: [{ name: "ap-south-mum-a", dcs: ["MUM1"] }] },
  { continent: "Asia Pacific", location: "Singapore — Singapore", regionName: "ap-southeast-sgp", type: "1-AZ", dcCount: 2, year: 2016, lat: 1.35, lng: 103.82, zones: [{ name: "ap-southeast-sgp-a", dcs: ["SGP1", "SGP2"] }] },
  { continent: "Asia Pacific", location: "New Zealand — Auckland", regionName: "ap-south-lz-akl", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: -36.85, lng: 174.76, zones: [{ name: "ap-south-lz-akl-a" }] },
  // ---- Africa ----
  { continent: "Africa", location: "Morocco — Rabat", regionName: "af-north-lz-rba", type: "LOCAL-ZONE", dcCount: null, year: 2025, lat: 34.02, lng: -6.83, zones: [{ name: "af-north-lz-rba-a" }] },
];

const CONTINENTS = ["Europe", "North America", "Asia Pacific", "Africa"] as const;

const ARCS: { from: [number, number]; to: [number, number] }[] = [
  { from: [-73.87, 45.32], to: [3.2, 50.69] },
  { from: [-73.87, 45.32], to: [0.18, 51.48] },
  { from: [-122.99, 45.52], to: [-73.87, 45.32] },
  { from: [-77.67, 38.75], to: [2.13, 50.99] },
  { from: [3.2, 50.69], to: [72.88, 19.08] },
  { from: [72.88, 19.08], to: [103.82, 1.35] },
  { from: [103.82, 1.35], to: [151.21, -33.87] },
  { from: [7.75, 48.57], to: [72.88, 19.08] },
  { from: [-6.83, 34.02], to: [2.13, 50.99] },
  { from: [-122.99, 45.52], to: [151.21, -33.87] },
];

const FAQS = [
  { q: "What is a geographic zone?", a: "A geographic zone (continent-level area such as Europe, North America or Asia Pacific) groups all of our regions by location. Choosing a zone close to your users reduces latency and helps you meet local data-residency requirements." },
  { q: "What is a 3-AZ region?", a: "A 3-AZ region contains three independent availability zones — physically separate datacentres with isolated power, cooling and networking, connected by a low-latency private backbone. Replicating your workload across all three zones protects you even if an entire datacentre goes offline." },
  { q: "What is an availability zone?", a: "An availability zone (AZ) is one or more datacentres inside a region with independent power, cooling and networking. AZs are close enough for synchronous replication but far enough apart to survive local failures." },
  { q: "What is a Local Zone?", a: "A Local Zone is an edge location that places compute closer to end users in cities without a full region. It is ideal for latency-sensitive workloads such as gaming, streaming and real-time applications." },
  { q: "How do I select a region with AZs or a Local Zone?", a: "During checkout on any VPS or dedicated server, pick the location in the Region step — every available zone and its live stock status is shown on the map. Services already deployed can be replicated to another zone using snapshots or backups." },
  { q: "What is a sovereign cloud region?", a: "Sovereign (snc) regions run under strict European jurisdiction with certified data protection — designed for regulated industries, healthcare and public-sector workloads that must keep data inside specific legal boundaries." },
];

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function Stat({ n, l, suffix = "" }: { n: number; l: string; suffix?: string }) {
  const v = useCountUp(n);
  return (
    <div className="anim-fade-up">
      <div className="stat-num text-2xl font-black md:text-3xl">{v}{suffix}</div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400/80">{l}</div>
    </div>
  );
}

const dcTotal = REGIONS.filter((r) => r.type !== "LOCAL-ZONE").reduce((a, r) => a + (r.dcCount || 0), 0);
const countryTotal = new Set(REGIONS.map((r) => r.location.split("—")[0].trim())).size;

export default function DatacentersPage() {
  const [continent, setContinent] = useState<(typeof CONTINENTS)[number]>("Europe");
  const [query, setQuery] = useState("");
  const [showDc, setShowDc] = useState(true);
  const [showLz, setShowLz] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);
  const [tableKey, setTableKey] = useState(0);
  const [pos, setPos] = useState<{ c: [number, number]; z: number }>({ c: [15, 15], z: 1 });

  const matches = (r: Region) =>
    (r.type === "LOCAL-ZONE" ? showLz : showDc) &&
    (!query || `${r.location} ${r.regionName}`.toLowerCase().includes(query.toLowerCase()));

  const visible = useMemo(() => REGIONS.filter(matches), [showDc, showLz, query]);
  const tableRows = visible.filter((r) => r.continent === continent);

  const zoomTo = (z: number) => setPos((p) => ({ ...p, z: Math.min(8, Math.max(0.9, z)) }));

  return (
    <div className="min-h-screen bg-[#070714] text-slate-200">
      <style>{CSS}</style>
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="hero-anim relative overflow-hidden text-white">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="hero-grid" />
        <div className="stars" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-16 md:flex-row md:items-center md:py-24">
          <div className="flex-1">
            <p className="anim-fade-up mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
              <span className="live-dot" /> Live global backbone — infrastructure locations
            </p>
            <h1 className="anim-fade-up delay-1 text-4xl font-black leading-tight md:text-6xl">
              A global infrastructure,<br />
              <span className="hero-shimmer">closer to your users</span>
            </h1>
            <p className="anim-fade-up delay-2 mt-5 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
              Regions, availability zones (AZ), datacentres and network presence points (PoP) across four continents.
              Pick the location closest to your users for the lowest latency and rock-solid resiliency.
            </p>
            <div className="mt-8 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
              <Stat n={REGIONS.length} l="locations worldwide" />
              <Stat n={dcTotal} l="datacentres" />
              <Stat n={countryTotal} l="countries" />
              <Stat n={30} l="network PoPs" suffix="+" />
            </div>
          </div>
          {/* animated server-rack panel */}
          <div className="anim-fade-up delay-3 hidden flex-1 justify-end md:flex">
            <div className="rack-frame w-full max-w-sm rounded-2xl border border-cyan-400/20 bg-[#0c0c24]/80 p-5 backdrop-blur">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-cyan-300"><Cpu className="h-3.5 w-3.5" /> Backbone status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400"><span className="live-dot" /> ALL SYSTEMS UP</span>
              </div>
              {["eu-west-rbx", "ca-east-bhs", "ap-south-mum", "ap-southeast-sgp", "us-east-vin"].map((code, i) => (
                <div key={code} className="rack-row mb-2 flex items-center justify-between rounded-lg border border-white/5 bg-white/[.03] px-3 py-2" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
                  <span className="font-mono text-xs text-slate-300">{code}</span>
                  <span className="flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((led) => (
                      <span key={led} className="led" style={{ animationDelay: `${(i * 4 + led) * 0.17}s` }} />
                    ))}
                    <span className="ml-1.5 text-[10px] font-bold text-emerald-400">ONLINE</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MAP ============ */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="map-frame relative overflow-hidden rounded-2xl border border-cyan-400/20 shadow-[0_0_60px_-15px_rgba(0,240,255,.25)]">
          <div className="scanline" />
          <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 175, center: [15, 15] }} height={480} style={{ width: "100%" }}>
            <defs>
              <radialGradient id="oceanGrad" cx="50%" cy="40%" r="80%">
                <stop offset="0%" stopColor="#0d0d28" />
                <stop offset="100%" stopColor="#08081a" />
              </radialGradient>
            </defs>
            <rect x={-200} y={-200} width={1400} height={900} fill="url(#oceanGrad)" />
            <ZoomableGroup
              center={pos.c}
              zoom={pos.z}
              minZoom={0.9}
              maxZoom={8}
              onMoveEnd={(p) => setPos({ c: (p.coordinates || pos.c) as [number, number], z: p.zoom || pos.z })}
            >
              <Geographies geography={topo as never}>
                {({ geographies }) =>
                  geographies.map((geo, gi) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#171738"
                      stroke="#2c2c5c"
                      strokeWidth={0.6}
                      className="country-fade"
                      style={{ animationDelay: `${(gi % 40) * 0.02}s`, default: { outline: "none" }, hover: { outline: "none", fill: "#1e1e4a" }, pressed: { outline: "none" } } as never}
                    />
                  ))
                }
              </Geographies>

              {/* backbone arcs — base line + traveling packets */}
              {ARCS.map((a, i) => (
                <g key={i}>
                  <Line from={a.from} to={a.to} stroke="#00b7ff" strokeWidth={1} strokeOpacity={0.28} strokeLinecap="round" />
                  <Line
                    from={a.from}
                    to={a.to}
                    stroke="#4ff2ff"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeDasharray="0.1 26"
                    className="packet"
                    style={{ animationDelay: `${i * 0.42}s`, filter: "drop-shadow(0 0 3px #00f0ff)" }}
                  />
                </g>
              ))}

              {visible.map((r, i) => {
                const isLz = r.type === "LOCAL-ZONE";
                const c = isLz ? "#34d399" : "#00f0ff";
                const big = !isLz && (r.dcCount || 0) > 3;
                return (
                  <Marker key={r.regionName} coordinates={[r.lng, r.lat]}>
                    <g
                      className="pin-enter"
                      style={{ animationDelay: `${0.4 + i * 0.03}s` }}
                      onMouseEnter={() => setActivePin(r.regionName)}
                      onMouseLeave={() => setActivePin(null)}
                    >
                      <circle r={5} fill="none" stroke={c} strokeWidth={0.9} className="ripple" style={{ animationDelay: `${(i % 6) * 0.4}s` }} />
                      <circle r={5} fill="none" stroke={c} strokeWidth={0.9} className="ripple" style={{ animationDelay: `${(i % 6) * 0.4 + 1}s` }} />
                      <circle
                        r={big ? 7.5 : isLz ? 3.6 : 4.6}
                        fill={c}
                        stroke="#070714"
                        strokeWidth={1.4}
                        className="pin-core"
                        style={{ filter: `drop-shadow(0 0 6px ${c})` }}
                      />
                      {big ? (
                        <text y={3.2} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#070714" className="pointer-events-none">{r.dcCount}</text>
                      ) : null}
                      {activePin === r.regionName && (
                        <g transform="translate(0,-17)" className="tip-pop">
                          <rect x={-(r.location.length * 3.1 + 16)} y={-18} width={r.location.length * 6.2 + 32} height={22} rx={5} fill="#0c0c24" stroke={c} strokeOpacity={0.5} />
                          <text y={-3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#e0f9ff">{r.location}</text>
                        </g>
                      )}
                    </g>
                  </Marker>
                );
              })}
            </ZoomableGroup>
          </ComposableMap>

          {/* zoom controls */}
          <div className="absolute right-4 top-16 flex flex-col gap-1.5">
            <button onClick={() => zoomTo(pos.z * 1.6)} className="zoom-btn" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <button onClick={() => zoomTo(pos.z / 1.6)} className="zoom-btn" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <button onClick={() => setPos({ c: [15, 15], z: 1 })} className="zoom-btn" aria-label="Reset view"><Maximize2 className="h-3.5 w-3.5" /></button>
          </div>

          {/* filter card */}
          <div className="anim-fade-up delay-2 absolute left-4 top-4 w-56 rounded-xl border border-white/10 bg-[#0c0c24]/85 p-4 shadow-2xl backdrop-blur-md">
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Filter</p>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 transition focus-within:border-cyan-400/60 focus-within:ring-2 focus-within:ring-cyan-400/20">
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, country, region…"
                className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</p>
            <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-300 transition hover:text-white">
              <input type="checkbox" checked={showDc} onChange={(e) => setShowDc(e.target.checked)} className="h-3.5 w-3.5 accent-cyan-400" />
              <span className="legend-dot inline-block h-2.5 w-2.5 rounded-full bg-cyan-400" /> Data centers
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-300 transition hover:text-white">
              <input type="checkbox" checked={showLz} onChange={(e) => setShowLz(e.target.checked)} className="h-3.5 w-3.5 accent-emerald-400" />
              <span className="legend-dot inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" style={{ animationDelay: "0.6s" }} /> Local zones
            </label>
          </div>

          {/* live badge */}
          <div className="anim-fade-up delay-3 absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-[#0c0c24]/85 px-3 py-1.5 text-[11px] font-bold text-emerald-300 shadow backdrop-blur-md">
            <span className="live-dot" /> {visible.length} locations online
          </div>
        </div>

        {/* live feed ticker */}
        <div className="ticker mt-4 overflow-hidden rounded-xl border border-white/5 bg-[#0c0c24]/70 py-2.5">
          <div className="ticker-track flex gap-8 whitespace-nowrap px-4">
            {[...REGIONS, ...REGIONS].map((r, i) => (
              <span key={i} className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${r.type === "LOCAL-ZONE" ? "bg-emerald-400" : "bg-cyan-400"}`} />
                {r.regionName} <span className="text-emerald-400/80">● up</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TABLE ============ */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="anim-fade-up mb-2 text-2xl font-black text-white">Regions and availability zones by geography</h2>
        <div className="mb-4 flex gap-1 border-b border-white/10">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => { setContinent(c); setTableKey((k) => k + 1); }}
              className={`tab-btn relative px-4 py-2.5 text-sm font-bold transition ${continent === c ? "text-cyan-300" : "text-slate-500 hover:text-slate-300"}`}
            >
              {c}
              {continent === c && <span className="tab-underline" />}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0c0c24]/60 shadow-[0_0_40px_-18px_rgba(0,240,255,.3)]">
          <table className="w-full min-w-[900px] text-left text-sm" key={tableKey}>
            <thead>
              <tr className="border-b border-white/10 bg-white/[.03] text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Region name</th>
                <th className="px-4 py-3">Region type</th>
                <th className="px-4 py-3">Datacentres</th>
                <th className="px-4 py-3">Opening year</th>
                <th className="px-4 py-3">Availability zones</th>
                <th className="px-4 py-3">DC codes</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr key={r.regionName} className="row-anim border-b border-white/5 last:border-0 hover:bg-cyan-400/[.06]" style={{ animationDelay: `${i * 0.035}s` }}>
                  <td className="px-4 py-3 font-semibold text-slate-100">
                    <span className={`legend-dot mr-2 inline-block h-2.5 w-2.5 rounded-full ${r.type === "LOCAL-ZONE" ? "bg-emerald-400" : "bg-cyan-400"}`} />
                    {r.location} {r.type === "LOCAL-ZONE" && <span className="text-xs font-bold text-slate-500">(lz)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-cyan-300/90">{r.regionName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${r.type === "LOCAL-ZONE" ? "bg-emerald-400/10 text-emerald-300" : r.type === "3-AZ" ? "bg-violet-400/10 text-violet-300" : "bg-cyan-400/10 text-cyan-300"}`}>{r.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{r.dcCount ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400">{r.year}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.zones.map((z) => z.name).join(", ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{r.zones.flatMap((z) => z.dcs || []).join(", ") || "—"}</td>
                </tr>
              ))}
              {!tableRows.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No locations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Data centres (cyan) host full regions with 1-AZ or 3-AZ resilience. Local zones (green) are edge locations for low-latency workloads. All locations are covered by our global backbone and always-on Anti-DDoS protection.
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-anim relative overflow-hidden py-16 text-center text-white">
        <div className="orb orb-2" style={{ opacity: 0.5 }} />
        <div className="hero-grid" />
        <h2 className="relative text-2xl font-black md:text-4xl">Ready to deploy closer to <span className="hero-shimmer">your users</span>?</h2>
        <p className="relative mx-auto mt-3 max-w-lg text-sm text-slate-300">Pick any region at checkout — your server is provisioned automatically with live stock and delivery estimates.</p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/vps" className="btn-glow rounded-xl bg-cyan-400 px-7 py-3 text-sm font-bold text-[#070714] transition hover:bg-cyan-300">Browse VPS plans</Link>
          <Link href="/dedicated-servers" className="btn-glow rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-7 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20">Browse dedicated servers</Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-2xl font-black text-white">Your questions answered</h2>
        <div className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#0c0c24]/60">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-slate-200 transition hover:bg-cyan-400/[.05]">
                {f.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-cyan-400/70 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`faq-body ${openFaq === i ? "faq-open" : ""}`}>
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

const CSS = `
@keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pinIn { 0% { opacity: 0; transform: scale(0); } 70% { opacity: 1; transform: scale(1.3); } 100% { opacity: 1; transform: scale(1); } }
@keyframes rippleOut { 0% { r: 5; opacity: 0.85; } 100% { r: 24; opacity: 0; } }
@keyframes packetMove { to { stroke-dashoffset: -26.1; } }
@keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.7); } }
@keyframes orbDrift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(34px,-22px) scale(1.15); } 100% { transform: translate(0,0) scale(1); } }
@keyframes scanMove { 0% { left: -15%; } 100% { left: 110%; } }
@keyframes shimmerTxt { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rowIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tipIn { from { opacity: 0; transform: translateY(4px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes countryIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes heroBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
@keyframes ledBlink { 0%,60%,100% { opacity: 1; } 30% { opacity: 0.15; } }
@keyframes rackIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tickScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes twinkle { 0%,100% { opacity: .12; } 50% { opacity: .55; } }

.anim-fade-up { animation: fadeUp 0.7s cubic-bezier(.2,.7,.3,1) both; }
.delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }

.hero-anim { background: linear-gradient(120deg, #070714 0%, #0b1140 50%, #070714 100%); background-size: 220% 220%; animation: heroBg 10s ease-in-out infinite; }
.hero-shimmer { background: linear-gradient(90deg, #00f0ff, #fff, #00b7ff, #00f0ff); background-size: 220% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmerTxt 3.4s linear infinite; }
.hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,240,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,.06) 1px, transparent 1px); background-size: 44px 44px; mask-image: radial-gradient(ellipse at 30% 40%, #000 25%, transparent 75%); pointer-events: none; }
.stars { position: absolute; inset: 0; background-image: radial-gradient(1.2px 1.2px at 12% 22%, #4ff2ff 50%, transparent), radial-gradient(1.4px 1.4px at 34% 68%, #7dd3fc 50%, transparent), radial-gradient(1px 1px at 56% 18%, #4ff2ff 50%, transparent), radial-gradient(1.6px 1.6px at 72% 46%, #67e8f9 50%, transparent), radial-gradient(1.1px 1.1px at 88% 26%, #4ff2ff 50%, transparent), radial-gradient(1.3px 1.3px at 46% 82%, #7dd3fc 50%, transparent), radial-gradient(1px 1px at 22% 78%, #4ff2ff 50%, transparent), radial-gradient(1.5px 1.5px at 82% 74%, #67e8f9 50%, transparent); animation: twinkle 3.6s ease-in-out infinite; pointer-events: none; }
.orb { position: absolute; border-radius: 9999px; filter: blur(70px); pointer-events: none; animation: orbDrift 11s ease-in-out infinite; }
.orb-1 { width: 360px; height: 360px; background: #00b7ff; opacity: 0.16; top: -90px; right: 6%; }
.orb-2 { width: 280px; height: 280px; background: #6366f1; opacity: 0.15; bottom: -80px; left: 10%; animation-delay: 2.5s; }
.orb-3 { width: 200px; height: 200px; background: #00f0ff; opacity: 0.1; top: 34%; left: 46%; animation-delay: 5s; }

.live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: #34d399; box-shadow: 0 0 8px #34d399; animation: pulseDot 1.6s ease-in-out infinite; }
.stat-num { color: #00f0ff; text-shadow: 0 0 22px rgba(0,240,255,.55); }

.rack-frame { box-shadow: 0 0 50px -14px rgba(0,240,255,.35), inset 0 0 30px rgba(0,240,255,.04); }
.rack-row { animation: rackIn .5s cubic-bezier(.2,.8,.3,1) both; }
.led { display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #34d399; box-shadow: 0 0 6px #34d399; animation: ledBlink 1.8s ease-in-out infinite; }

.map-frame { background: radial-gradient(ellipse at 50% 30%, #0d0d28, #08081a 80%); }
.scanline { position: absolute; top: 0; bottom: 0; width: 110px; background: linear-gradient(90deg, transparent, rgba(0,240,255,.06), transparent); animation: scanMove 8s linear infinite; pointer-events: none; z-index: 2; }
.country-fade { animation: countryIn 0.9s ease both; }
.pin-enter { animation: pinIn 0.5s cubic-bezier(.2,.9,.3,1.4) both; cursor: pointer; }
.pin-core { transition: transform 0.2s; transform-origin: center; transform-box: fill-box; }
g.pin-enter:hover .pin-core { transform: scale(1.4); }
.ripple { animation: rippleOut 2.6s ease-out infinite; transform-origin: center; transform-box: fill-box; }
.packet { animation: packetMove 1.5s linear infinite; }
.tip-pop { animation: tipIn 0.18s ease-out both; pointer-events: none; }
.legend-dot { animation: pulseDot 2s ease-in-out infinite; box-shadow: 0 0 6px currentColor; }
.zoom-btn { display: flex; height: 34px; width: 34px; align-items: center; justify-content: center; rounded: 8px; border-radius: 8px; border: 1px solid rgba(255,255,255,.12); background: rgba(12,12,36,.85); color: #7dd3fc; backdrop-filter: blur(6px); transition: all .2s; }
.zoom-btn:hover { border-color: rgba(0,240,255,.6); color: #00f0ff; box-shadow: 0 0 14px rgba(0,240,255,.35); }

.ticker { mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
.ticker-track { animation: tickScroll 40s linear infinite; width: max-content; }
.ticker:hover .ticker-track { animation-play-state: paused; }

.tab-btn:hover { color: #67e8f9; }
.tab-underline { position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; background: linear-gradient(90deg,#00f0ff,#00b7ff); border-radius: 2px; box-shadow: 0 0 10px rgba(0,240,255,.7); animation: rowIn 0.3s ease both; }
.row-anim { animation: rowIn 0.4s ease both; transition: background 0.2s; }

.btn-glow { position: relative; transition: transform .2s, box-shadow .3s; }
.btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 34px -6px rgba(0,240,255,.55); }
.cta-anim { background: linear-gradient(120deg,#070714,#0b1140,#070714); background-size: 200% 200%; animation: heroBg 9s ease-in-out infinite; }

.faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
.faq-body > p { overflow: hidden; }
.faq-open { grid-template-rows: 1fr; }
`;
