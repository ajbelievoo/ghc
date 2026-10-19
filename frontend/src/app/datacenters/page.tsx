"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import topo from "world-atlas/countries-110m.json";
import { Globe, MapPin, Search, ChevronDown, Server, ShieldCheck, Zap } from "lucide-react";

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

const FAQS = [
  { q: "What is a geographic zone?", a: "A geographic zone (continent-level area such as Europe, North America or Asia Pacific) groups all of our regions by location. Choosing a zone close to your users reduces latency and helps you meet local data-residency requirements." },
  { q: "What is a 3-AZ region?", a: "A 3-AZ region contains three independent availability zones — physically separate datacentres with isolated power, cooling and networking, connected by a low-latency private backbone. Replicating your workload across all three zones protects you even if an entire datacentre goes offline." },
  { q: "What is an availability zone?", a: "An availability zone (AZ) is one or more datacentres inside a region with independent power, cooling and networking. AZs are close enough for synchronous replication but far enough apart to survive local failures." },
  { q: "What is a Local Zone?", a: "A Local Zone is an edge location that places compute closer to end users in cities without a full region. It is ideal for latency-sensitive workloads such as gaming, streaming and real-time applications." },
  { q: "How do I select a region with AZs or a Local Zone?", a: "During checkout on any VPS or dedicated server, pick the location in the Region step — every available zone and its live stock status is shown on the map. Services already deployed can be replicated to another zone using snapshots or backups." },
  { q: "What is a sovereign cloud region?", a: "Sovereign (snc) regions run under strict European jurisdiction with certified data protection — designed for regulated industries, healthcare and public-sector workloads that must keep data inside specific legal boundaries." },
];

const stats = [
  { n: String(REGIONS.length), l: "locations worldwide" },
  { n: String(REGIONS.filter((r) => r.type !== "LOCAL-ZONE").reduce((a, r) => a + (r.dcCount || 0), 0)), l: "datacentres" },
  { n: String(new Set(REGIONS.map((r) => r.location.split("—")[0].trim())).size), l: "countries" },
  { n: "30+", l: "global network PoPs" },
];

export default function DatacentersPage() {
  const [continent, setContinent] = useState<(typeof CONTINENTS)[number]>("Europe");
  const [query, setQuery] = useState("");
  const [showDc, setShowDc] = useState(true);
  const [showLz, setShowLz] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePin, setActivePin] = useState<string | null>(null);

  const matches = (r: Region) =>
    (r.type === "LOCAL-ZONE" ? showLz : showDc) &&
    (!query || `${r.location} ${r.regionName}`.toLowerCase().includes(query.toLowerCase()));

  const visible = REGIONS.filter(matches);
  const tableRows = visible.filter((r) => r.continent === continent);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#000e9c] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-6 py-16 md:flex-row md:items-center md:py-20">
          <div className="flex-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-300">Infrastructure locations by region</p>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">A global infrastructure,<br />closer to your users</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-sky-100 md:text-base">
              Discover the GHC global infrastructure: regions, availability zones (AZ), datacentres and network presence points (PoP).
              Choose the locations best suited to your performance, resiliency, compliance and sovereignty requirements.
            </p>
            <div className="mt-6 flex flex-wrap gap-6">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-black text-white md:text-3xl">{s.n}</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden flex-1 justify-end md:flex">
            <div className="grid grid-cols-3 gap-3">
              {[Server, Globe, ShieldCheck, Zap, MapPin, NetworkIcon].map((Icon, i) => (
                <div key={i} className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
                  <Icon className="h-8 w-8 text-sky-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Map + filter */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf4f8]">
          <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 175, center: [15, 15] }} height={460} style={{ width: "100%" }}>
            <Geographies geography={topo as never}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography key={geo.rsmKey} geography={geo} fill="#d9e6ee" stroke="#b8cdd9" strokeWidth={0.5} style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } } as never} />
                ))
              }
            </Geographies>
            {visible.map((r) => (
              <Marker key={r.regionName} coordinates={[r.lng, r.lat]}>
                <g
                  onMouseEnter={() => setActivePin(r.regionName)}
                  onMouseLeave={() => setActivePin(null)}
                  className="cursor-pointer"
                >
                  {r.type === "LOCAL-ZONE" ? (
                    <>
                      <circle r={5} fill="#22c55e" fillOpacity={0.25} />
                      <circle r={3.2} fill="#16a34a" stroke="#fff" strokeWidth={1.2} />
                    </>
                  ) : (
                    <>
                      <circle r={r.dcCount && r.dcCount > 3 ? 11 : 7} fill="#0050d7" fillOpacity={0.2} />
                      <circle r={r.dcCount && r.dcCount > 3 ? 7.5 : 4.2} fill="#0050d7" stroke="#fff" strokeWidth={1.4} />
                      {r.dcCount && r.dcCount > 3 ? (
                        <text y={3} textAnchor="middle" fontSize={7.5} fontWeight={800} fill="#fff">{r.dcCount}</text>
                      ) : null}
                    </>
                  )}
                  {activePin === r.regionName && (
                    <g transform="translate(0,-14)">
                      <rect x={-((r.location.length * 3.1) + 14)} y={-16} width={(r.location.length * 6.2) + 28} height={20} rx={4} fill="#0f172a" />
                      <text y={-2.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="#fff">{r.location}</text>
                    </g>
                  )}
                </g>
              </Marker>
            ))}
          </ComposableMap>

          {/* Filter card */}
          <div className="absolute left-4 top-4 w-56 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-500">Filter</p>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, country, region…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Type</p>
            <label className="mb-1 flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input type="checkbox" checked={showDc} onChange={(e) => setShowDc(e.target.checked)} className="h-3.5 w-3.5 accent-[#0050d7]" />
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0050d7]" /> Data centers
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
              <input type="checkbox" checked={showLz} onChange={(e) => setShowLz(e.target.checked)} className="h-3.5 w-3.5 accent-[#16a34a]" />
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#16a34a]" /> Local zones
            </label>
          </div>
        </div>
      </section>

      {/* Region table */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="mb-2 text-2xl font-black">Regions and availability zones by geography</h2>
        <div className="mb-4 flex gap-1 border-b border-slate-200">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => setContinent(c)}
              className={`px-4 py-2.5 text-sm font-bold transition ${continent === c ? "border-b-2 border-[#0050d7] text-[#0050d7]" : "text-slate-500 hover:text-slate-800"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] text-left text-sm">
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
              {tableRows.map((r) => (
                <tr key={r.regionName} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${r.type === "LOCAL-ZONE" ? "bg-[#16a34a]" : "bg-[#0050d7]"}`} />
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

      {/* CTA */}
      <section className="bg-[#000e9c] py-14 text-center text-white">
        <h2 className="text-2xl font-black md:text-3xl">Ready to deploy closer to your users?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-sky-100">Pick any region at checkout — your server is provisioned automatically with live stock and delivery estimates.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/vps" className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0050d7] transition hover:bg-sky-50">Browse VPS plans</Link>
          <Link href="/dedicated-servers" className="rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-white/20">Browse dedicated servers</Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-14">
        <h2 className="mb-6 text-center text-2xl font-black">Your questions answered</h2>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold hover:bg-slate-50">
                {f.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function NetworkIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </svg>
  );
}
