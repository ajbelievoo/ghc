"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import topo from "world-atlas/countries-110m.json";
import { Globe, MapPin, Search, ChevronDown, Server, ShieldCheck, Zap, Radio } from "lucide-react";

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

// Backbone arcs between major hubs (network traffic animation)
const ARCS: { from: [number, number]; to: [number, number] }[] = [
  { from: [-73.87, 45.32], to: [3.2, 50.69] },      // BHS -> Roubaix
  { from: [-73.87, 45.32], to: [0.18, 51.48] },    // BHS -> London
  { from: [-122.99, 45.52], to: [-73.87, 45.32] }, // Hillsboro -> BHS
  { from: [-77.67, 38.75], to: [2.13, 50.99] },    // Vint Hill -> Gravelines
  { from: [3.2, 50.69], to: [72.88, 19.08] },      // Roubaix -> Mumbai
  { from: [72.88, 19.08], to: [103.82, 1.35] },    // Mumbai -> Singapore
  { from: [103.82, 1.35], to: [151.21, -33.87] },  // Singapore -> Sydney
  { from: [7.75, 48.57], to: [72.88, 19.08] },     // Strasbourg -> Mumbai
  { from: [-6.83, 34.02], to: [2.13, 50.99] },     // Rabat -> Gravelines
  { from: [-122.99, 45.52], to: [151.21, -33.87] },// Hillsboro -> Sydney
];

const FAQS = [
  { q: "What is a geographic zone?", a: "A geographic zone (continent-level area such as Europe, North America or Asia Pacific) groups all of our regions by location. Choosing a zone close to your users reduces latency and helps you meet local data-residency requirements." },
  { q: "What is a 3-AZ region?", a: "A 3-AZ region contains three independent availability zones — physically separate datacentres with isolated power, cooling and networking, connected by a low-latency private backbone. Replicating your workload across all three zones protects you even if an entire datacentre goes offline." },
  { q: "What is an availability zone?", a: "An availability zone (AZ) is one or more datacentres inside a region with independent power, cooling and networking. AZs are close enough for synchronous replication but far enough apart to survive local failures." },
  { q: "What is a Local Zone?", a: "A Local Zone is an edge location that places compute closer to end users in cities without a full region. It is ideal for latency-sensitive workloads such as gaming, streaming and real-time applications." },
  { q: "How do I select a region with AZs or a Local Zone?", a: "During checkout on any VPS or dedicated server, pick the location in the Region step — every available zone and its live stock status is shown on the map. Services already deployed can be replicated to another zone using snapshots or backups." },
  { q: "What is a sovereign cloud region?", a: "Sovereign (snc) regions run under strict European jurisdiction with certified data protection — designed for regulated industries, healthcare and public-sector workloads that must keep data inside specific legal boundaries." },
];

function useCountUp(target: number, duration = 1200) {
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
      <div className="stat-num text-2xl font-black text-white md:text-3xl">{v}{suffix}</div>
      <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">{l}</div>
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

  const matches = (r: Region) =>
    (r.type === "LOCAL-ZONE" ? showLz : showDc) &&
    (!query || `${r.location} ${r.regionName}`.toLowerCase().includes(query.toLowerCase()));

  const visible = useMemo(() => REGIONS.filter(matches), [showDc, showLz, query]);
  const tableRows = visible.filter((r) => r.continent === continent);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <style>{CSS}</style>
      <Navbar />

      {/* ============ HERO ============ */}
      <section className="hero-anim relative overflow-hidden bg-[#000e9c] text-white">
        {/* floating glow orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        {/* grid overlay */}
        <div className="hero-grid" />

        <div className="relative mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-16 md:flex-row md:items-center md:py-20">
          <div className="flex-1">
            <p className="anim-fade-up mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-300">
              <span className="live-dot" /> Infrastructure locations by region
            </p>
            <h1 className="anim-fade-up delay-1 text-3xl font-black leading-tight md:text-5xl">
              A global infrastructure,<br />
              <span className="hero-shimmer">closer to your users</span>
            </h1>
            <p className="anim-fade-up delay-2 mt-4 max-w-xl text-sm leading-relaxed text-sky-100 md:text-base">
              Discover the GHC global infrastructure: regions, availability zones (AZ), datacentres and network presence points (PoP).
              Choose the locations best suited to your performance, resiliency, compliance and sovereignty requirements.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              <Stat n={REGIONS.length} l="locations worldwide" />
              <Stat n={dcTotal} l="datacentres" />
              <Stat n={countryTotal} l="countries" />
              <Stat n={30} l="network PoPs" suffix="+" />
            </div>
          </div>
          <div className="hidden flex-1 justify-end md:flex">
            <div className="grid grid-cols-3 gap-3">
              {[Server, Globe, ShieldCheck, Zap, MapPin, Radio].map((Icon, i) => (
                <div key={i} className={`hero-tile delay-${(i % 3) + 1} flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20`} style={{ animationDelay: `${0.15 * i}s` }}>
                  <Icon className="h-8 w-8 text-sky-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MAP ============ */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="map-frame relative overflow-hidden rounded-2xl border border-slate-200">
          {/* scanline sweep */}
          <div className="scanline" />
          <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 175, center: [15, 15] }} height={460} style={{ width: "100%" }}>
            <defs>
              <linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8f4fa" />
                <stop offset="100%" stopColor="#dcedf5" />
              </linearGradient>
            </defs>
            <rect x={-200} y={-200} width={1400} height={900} fill="url(#oceanGrad)" />
            <Geographies geography={topo as never}>
              {({ geographies }) =>
                geographies.map((geo, gi) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#cfe0ea"
                    stroke="#aec9d8"
                    strokeWidth={0.5}
                    className="country-fade"
                    style={{ animationDelay: `${(gi % 40) * 0.02}s`, default: { outline: "none" }, hover: { outline: "none", fill: "#c3d9e6" }, pressed: { outline: "none" } } as never}
                  />
                ))
              }
            </Geographies>

            {/* Animated backbone arcs */}
            {ARCS.map((a, i) => (
              <Line
                key={i}
                from={a.from}
                to={a.to}
                stroke="#0050d7"
                strokeWidth={1.2}
                strokeLinecap="round"
                strokeDasharray="4 6"
                className="arc-flow"
                style={{ animationDelay: `${i * 0.35}s`, opacity: 0.55 }}
              />
            ))}

            {/* Region markers */}
            {visible.map((r, i) => {
              const isLz = r.type === "LOCAL-ZONE";
              const c = isLz ? "#16a34a" : "#0050d7";
              const big = !isLz && (r.dcCount || 0) > 3;
              return (
                <Marker key={r.regionName} coordinates={[r.lng, r.lat]}>
                  <g
                    className="pin-enter"
                    style={{ animationDelay: `${0.4 + i * 0.03}s` }}
                    onMouseEnter={() => setActivePin(r.regionName)}
                    onMouseLeave={() => setActivePin(null)}
                  >
                    {/* ripple waves */}
                    <circle r={4} fill="none" stroke={c} strokeWidth={1} className="ripple" style={{ animationDelay: `${(i % 6) * 0.4}s` }} />
                    <circle r={4} fill="none" stroke={c} strokeWidth={1} className="ripple" style={{ animationDelay: `${(i % 6) * 0.4 + 0.9}s` }} />
                    {/* core dot */}
                    <circle
                      r={big ? 7.5 : isLz ? 3.6 : 4.6}
                      fill={c}
                      stroke="#fff"
                      strokeWidth={1.4}
                      className="pin-core"
                      style={{ filter: `drop-shadow(0 0 5px ${c}aa)` }}
                    />
                    {big ? (
                      <text y={3.2} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#fff" className="pointer-events-none">{r.dcCount}</text>
                    ) : null}
                    {activePin === r.regionName && (
                      <g transform="translate(0,-16)" className="tip-pop">
                        <rect x={-(r.location.length * 3.1 + 14)} y={-17} width={r.location.length * 6.2 + 28} height={21} rx={5} fill="#0f172a" />
                        <text y={-3} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">{r.location}</text>
                      </g>
                    )}
                  </g>
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Filter card */}
          <div className="anim-fade-up delay-2 absolute left-4 top-4 w-56 rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-xl backdrop-blur-sm">
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Filter</p>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 transition focus-within:border-[#0050d7] focus-within:ring-2 focus-within:ring-[#0050d7]/20">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, country, region…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</p>
            <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 transition hover:text-slate-900">
              <input type="checkbox" checked={showDc} onChange={(e) => setShowDc(e.target.checked)} className="h-3.5 w-3.5 accent-[#0050d7]" />
              <span className="legend-dot inline-block h-2.5 w-2.5 rounded-full bg-[#0050d7]" /> Data centers
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 transition hover:text-slate-900">
              <input type="checkbox" checked={showLz} onChange={(e) => setShowLz(e.target.checked)} className="h-3.5 w-3.5 accent-[#16a34a]" />
              <span className="legend-dot inline-block h-2.5 w-2.5 rounded-full bg-[#16a34a]" style={{ animationDelay: "0.6s" }} /> Local zones
            </label>
          </div>

          {/* live badge */}
          <div className="anim-fade-up delay-3 absolute right-4 top-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow backdrop-blur-sm">
            <span className="live-dot" /> {visible.length} locations online
          </div>
        </div>
      </section>

      {/* ============ TABLE ============ */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="anim-fade-up mb-2 text-2xl font-black">Regions and availability zones by geography</h2>
        <div className="mb-4 flex gap-1 border-b border-slate-200">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => { setContinent(c); setTableKey((k) => k + 1); }}
              className={`tab-btn relative px-4 py-2.5 text-sm font-bold transition ${continent === c ? "text-[#0050d7]" : "text-slate-500 hover:text-slate-800"}`}
            >
              {c}
              {continent === c && <span className="tab-underline" />}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm" key={tableKey}>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
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
                <tr key={r.regionName} className="row-anim border-b border-slate-100 last:border-0 hover:bg-sky-50/60" style={{ animationDelay: `${i * 0.035}s` }}>
                  <td className="px-4 py-3 font-semibold">
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${r.type === "LOCAL-ZONE" ? "bg-[#16a34a] legend-dot" : "bg-[#0050d7] legend-dot"}`} />
                    {r.location} {r.type === "LOCAL-ZONE" && <span className="text-xs font-bold text-slate-400">(lz)</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.regionName}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${r.type === "LOCAL-ZONE" ? "bg-emerald-50 text-emerald-700" : r.type === "3-AZ" ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>{r.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.dcCount ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.year}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.zones.map((z) => z.name).join(", ")}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.zones.flatMap((z) => z.dcs || []).join(", ") || "—"}</td>
                </tr>
              ))}
              {!tableRows.length && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No locations match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Data centres (blue) host full regions with 1-AZ or 3-AZ resilience. Local zones (green) are edge locations for low-latency workloads. All locations are covered by our global backbone and always-on Anti-DDoS protection.
        </p>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-anim relative overflow-hidden bg-[#000e9c] py-14 text-center text-white">
        <div className="orb orb-2" style={{ opacity: 0.5 }} />
        <h2 className="relative text-2xl font-black md:text-3xl">Ready to deploy closer to your users?</h2>
        <p className="relative mx-auto mt-3 max-w-lg text-sm text-sky-100">Pick any region at checkout — your server is provisioned automatically with live stock and delivery estimates.</p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/vps" className="btn-glow rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0050d7] transition hover:bg-sky-50">Browse VPS plans</Link>
          <Link href="/dedicated-servers" className="btn-glow rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20">Browse dedicated servers</Link>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-2xl font-black">Your questions answered</h2>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold transition hover:bg-sky-50/50">
                {f.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`faq-body ${openFaq === i ? "faq-open" : ""}`}>
                <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>
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
@keyframes rippleOut { 0% { r: 4; opacity: 0.8; } 100% { r: 22; opacity: 0; } }
@keyframes dashMove { to { stroke-dashoffset: -40; } }
@keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.75); } }
@keyframes floatTile { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes orbDrift { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.15); } 100% { transform: translate(0,0) scale(1); } }
@keyframes scanMove { 0% { left: -15%; } 100% { left: 110%; } }
@keyframes shimmerTxt { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
@keyframes rowIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes tipIn { from { opacity: 0; transform: translateY(4px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes countryIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes heroBg { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.anim-fade-up { animation: fadeUp 0.7s cubic-bezier(.2,.7,.3,1) both; }
.delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }

.hero-anim { background: linear-gradient(120deg, #000e9c 0%, #0033c8 45%, #000e9c 100%); background-size: 220% 220%; animation: heroBg 9s ease-in-out infinite; }
.hero-shimmer { background: linear-gradient(90deg, #7dd3fc, #fff, #7dd3fc); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmerTxt 3.2s linear infinite; }
.hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 44px 44px; mask-image: radial-gradient(ellipse at 30% 40%, #000 30%, transparent 75%); }
.orb { position: absolute; border-radius: 9999px; filter: blur(60px); pointer-events: none; animation: orbDrift 10s ease-in-out infinite; }
.orb-1 { width: 340px; height: 340px; background: #38bdf8; opacity: 0.22; top: -80px; right: 8%; }
.orb-2 { width: 260px; height: 260px; background: #818cf8; opacity: 0.2; bottom: -70px; left: 12%; animation-delay: 2.5s; }
.orb-3 { width: 180px; height: 180px; background: #22d3ee; opacity: 0.16; top: 30%; left: 45%; animation-delay: 5s; }
.hero-tile { animation: fadeUp 0.6s both, floatTile 4s ease-in-out infinite; animation-delay: inherit, 1s; }

.live-dot { display: inline-block; width: 8px; height: 8px; border-radius: 9999px; background: #34d399; box-shadow: 0 0 0 0 rgba(52,211,153,.6); animation: pulseDot 1.6s ease-in-out infinite; }
.stat-num { text-shadow: 0 0 18px rgba(125,211,252,.5); }

.map-frame { background: linear-gradient(180deg,#eaf4f8,#e2eef6); box-shadow: 0 10px 40px -12px rgba(0,80,215,.18); }
.scanline { position: absolute; top: 0; bottom: 0; width: 90px; background: linear-gradient(90deg, transparent, rgba(0,80,215,.07), transparent); animation: scanMove 7s linear infinite; pointer-events: none; z-index: 2; }
.country-fade { animation: countryIn 0.8s ease both; }
.pin-enter { animation: pinIn 0.5s cubic-bezier(.2,.9,.3,1.4) both; cursor: pointer; }
.pin-core { transition: transform 0.2s; transform-origin: center; transform-box: fill-box; }
g.pin-enter:hover .pin-core { transform: scale(1.35); }
.ripple { animation: rippleOut 2.4s ease-out infinite; transform-origin: center; transform-box: fill-box; }
.arc-flow { animation: dashMove 1.6s linear infinite; }
.tip-pop { animation: tipIn 0.18s ease-out both; pointer-events: none; }
.legend-dot { box-shadow: 0 0 0 0 rgba(0,80,215,.4); animation: pulseDot 2s ease-in-out infinite; }

.tab-btn:hover { color: #0050d7; }
.tab-underline { position: absolute; left: 12px; right: 12px; bottom: -1px; height: 2px; background: #0050d7; border-radius: 2px; animation: rowIn 0.3s ease both; }
.row-anim { animation: rowIn 0.4s ease both; transition: background 0.2s; }

.btn-glow { position: relative; transition: transform 0.2s, box-shadow 0.3s; }
.btn-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 30px -6px rgba(56,189,248,.6); }
.cta-anim { background: linear-gradient(120deg,#000e9c,#0029a8,#000e9c); background-size: 200% 200%; animation: heroBg 8s ease-in-out infinite; }

.faq-body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s ease; }
.faq-body > p { overflow: hidden; }
.faq-open { grid-template-rows: 1fr; }
`;
