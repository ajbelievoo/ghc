"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, X, RotateCcw } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const RANGES = ["Advance", "Storage", "Game", "Scale", "High Grade"] as const;
const RANGE_DESC: Record<string, string> = {
  Advance: "Versatile servers for small and medium businesses.",
  Storage: "Servers built for large-capacity storage workloads.",
  Game: "Servers optimised for video games and streaming platforms.",
  Scale: "Servers designed for complex, high-resilience infrastructures.",
  "High Grade": "The most powerful servers, optimised for critical workloads.",
};
const RANGE_HREF: Record<string, string> = {
  Advance: "/dedicated-servers/advance",
  Game: "/dedicated-servers/game",
  Scale: "/dedicated-servers/scale",
  "High Grade": "/dedicated-servers/high-grade",
  Storage: "/dedicated-servers/storage",
};
const REGIONS: { group: string; items: { code: string; label: string }[] }[] = [
  { group: "Asia Pacific", items: [{ code: "syd", label: "Australia - Sydney" }, { code: "ynm", label: "India - Mumbai" }, { code: "sgp", label: "Singapore - Singapore" }] },
  { group: "North America", items: [{ code: "bhs", label: "Canada - East - Beauharnois" }, { code: "ca-east-tor-a", label: "Canada - East - Toronto" }] },
  { group: "Europe", items: [{ code: "gra", label: "France - Gravelines" }, { code: "eu-west-par-a", label: "France - Paris" }, { code: "rbx", label: "France - Roubaix" }, { code: "sbg", label: "France - Strasbourg" }, { code: "fra", label: "Germany - Frankfurt" }, { code: "waw", label: "Poland - Warsaw" }, { code: "lon", label: "United Kingdom - London" }] },
];
const USE_CASES: Record<string, string> = {
  "archive-backup-recovery": "Archiving, Backup & Recovery",
  "artificial-intelligence": "Artificial intelligence",
  bdd: "Database",
  "big-data-analytics": "Big Data & analytics",
  "confidential-computing": "Confidential computing",
  gaming: "Gaming",
  "grid-computing": "Grid computing",
  hosting: "Hosting",
  hpc: "High performance computing",
  "hyperconverged-infrastructure": "Hyper converged infrastructure",
  "multi-az": "3-AZ",
  sds: "Software-Defined Storage",
  vdi: "Virtual Desktop infrastructure",
  "virtualisation-containerisation-orchestration": "Virtualisation, containerization & orchestration",
};
const REGION_SUFFIX: Record<string, string> = { syd: "syd", sgp: "sgp", mum: "ynm" };

function rangeOf(p: any): string {
  const code = String(p.planCode || "").toLowerCase();
  const n = String(p.invoiceName || "").toLowerCase();
  if (/adv.*stor|stor/.test(n.split("|")[0]) && n.startsWith("adv")) return "Storage";
  if (n.startsWith("adv")) return "Advance";
  if (n.startsWith("hgr")) return "High Grade";
  if (n.startsWith("scale")) return "Scale";
  if (n.startsWith("game")) return "Game";
  if (code.includes("stor")) return "Storage";
  return "Other";
}
function baseCode(code: string) { return String(code).replace(/-(syd|mum|sgp)$/i, ""); }
function regionsOf(p: any): string[] {
  const out = new Set<string>((p.regions || []).filter((r: string) => r !== "canada" && !/^eu-west-par-[bc]$/.test(r)));
  const m = String(p.planCode).match(/-(syd|mum|sgp)$/i);
  if (m) out.add(REGION_SUFFIX[m[1].toLowerCase()]);
  return Array.from(out);
}
const fmtGb = (g?: number | null) => (g == null ? "" : g >= 1000 ? `${+(g / 1000).toFixed(2)} TB` : `${g} GB`);
const fmtBw = (m?: number | null) => (m == null ? "" : m >= 1000 ? `${m / 1000} Gbps` : `${m} Mbps`);

type Row = { p: any; d: any; range: string; regions: string[]; usecases: string[]; price: number; cur: string; name: string; isNew: boolean; year: string };

function Dropdown({ label, count, children }: { label: string; count?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-bold ${open || count ? "border-[#0050d7] bg-sky-50 text-[#0050d7]" : "border-[#0050d7]/40 text-[#0f2a6b] bg-white"}`}>
        {label}{count ? ` (${count})` : ""} <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="absolute left-0 top-full z-40 mt-1 min-w-[220px] max-h-80 overflow-auto rounded border border-sky-200 bg-white p-3 shadow-lg text-xs">{children}</div>}
    </div>
  );
}
function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex items-center gap-2 py-1 cursor-pointer text-[#0f2a6b] font-medium">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-[#0050d7]" /> {label}
    </label>
  );
}
function Slider({ label, min, max, value, onChange, fmt }: { label: string; min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; fmt: (n: number) => string }) {
  return (
    <div className="py-1.5 min-w-[200px]">
      <p className="font-bold text-[#0f2a6b] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value[0]} onChange={(e) => onChange([Math.min(+e.target.value, value[1]), value[1]])} className="flex-1 accent-[#0050d7]" />
        <input type="range" min={min} max={max} value={value[1]} onChange={(e) => onChange([value[0], Math.max(+e.target.value, value[0])])} className="flex-1 accent-[#0050d7]" />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500"><span>{fmt(value[0])}</span><span>{fmt(value[1])}</span></div>
    </div>
  );
}

export default function DedicatedRangeList({ plans }: { plans: any[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { currency } = useCurrency();
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const rows: Row[] = useMemo(() => {
    const groups = new Map<string, Row>();
    for (const p of plans) {
      if (p.isActive === false) continue;
      const range = rangeOf(p);
      if (range === "Other") continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      if (!d) continue;
      const key = baseCode(p.planCode);
      const regs = regionsOf(p);
      const ucs = String(p.features?.["baremetal-server-usecases"] || "").split(",").filter(Boolean);
      const year = String(p.features?.["release-year"] || (String(p.planCode).match(/^(\d{2})/)?.[1] ? "20" + String(p.planCode).slice(0, 2) : ""));
      const prev = groups.get(key);
      if (!prev) {
        groups.set(key, {
          p, d, range, regions: regs, usecases: ucs, price: d.monthlyPrice, cur: d.currency || p.currency || "USD",
          name: p.displayName || String(p.invoiceName || p.planCode).split("|")[0].trim(),
          isNew: year === "2026", year,
        });
      } else {
        regs.forEach((r) => { if (!prev.regions.includes(r)) prev.regions.push(r); });
        const isBase = baseCode(p.planCode) === p.planCode;
        if (isBase || d.monthlyPrice < prev.price) { if (isBase) { prev.p = p; prev.d = d; } prev.price = Math.min(prev.price, d.monthlyPrice); }
      }
    }
    return Array.from(groups.values());
  }, [plans]);

  const priceBounds = useMemo<[number, number]>(() => {
    const ps = rows.map((r) => r.price);
    return ps.length ? [Math.floor(Math.min(...ps)), Math.ceil(Math.max(...ps))] : [0, 1];
  }, [rows]);

  const initialRange = (params.get("range") || "").toLowerCase();
  const [ranges, setRanges] = useState<string[]>(() => RANGES.filter((r) => r.toLowerCase().replace(" ", "-") === initialRange || r.toLowerCase() === initialRange) as string[]);
  const [regionSel, setRegionSel] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sockets, setSockets] = useState<number[]>([]);
  const [storageTypes, setStorageTypes] = useState<string[]>([]);
  const [gpuOnly, setGpuOnly] = useState(false);
  const initialUseCases = (params.get("use_cases") || params.get("usecase") || "").split(",").map((u) => u.trim()).filter((u) => u && u in USE_CASES);
  const [useCases, setUseCases] = useState<string[]>(initialUseCases);
  const [price, setPrice] = useState<[number, number]>(priceBounds);
  const [minPub, setMinPub] = useState(0);
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [compare, setCompare] = useState<string[]>([]);
  const [more, setMore] = useState<Record<string, number>>({});
  useEffect(() => { setPrice(priceBounds); }, [priceBounds]);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const reset = () => { setRanges([]); setRegionSel([]); setBrands([]); setSockets([]); setStorageTypes([]); setGpuOnly(false); setUseCases([]); setPrice(priceBounds); setMinPub(0); };

  const filtered = useMemo(() => {
    const list = rows.filter((r) => {
      const s = r.p.spec || {};
      if (ranges.length && !ranges.includes(r.range)) return false;
      if (regionSel.length && !regionSel.some((x) => r.regions.includes(x) || (x === "eu-west-par-a" && r.regions.some((y) => y.startsWith("eu-west-par"))))) return false;
      if (brands.length && !brands.includes(String(s.cpuBrand || "").toUpperCase())) return false;
      if (sockets.length && !sockets.includes(s.sockets || 1)) return false;
      if (storageTypes.length && !storageTypes.some((t) => (s.storageTypes || []).includes(t))) return false;
      if (gpuOnly && !/gpu/i.test(r.name + r.p.planCode)) return false;
      if (useCases.length && !useCases.some((u) => r.usecases.includes(u))) return false;
      if (r.price < price[0] || r.price > price[1]) return false;
      if (minPub && (s.pubBwMax || 0) < minPub) return false;
      return true;
    });
    return list.sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
  }, [rows, ranges, regionSel, brands, sockets, storageTypes, gpuOnly, useCases, price, minPub, sort]);

  const chips: { label: string; clear: () => void }[] = [
    ...ranges.map((r) => ({ label: r, clear: () => setRanges(ranges.filter((x) => x !== r)) })),
    ...regionSel.map((r) => ({ label: REGIONS.flatMap((g) => g.items).find((i) => i.code === r)?.label || r, clear: () => setRegionSel(regionSel.filter((x) => x !== r)) })),
    ...brands.map((b) => ({ label: b, clear: () => setBrands(brands.filter((x) => x !== b)) })),
    ...storageTypes.map((t) => ({ label: t, clear: () => setStorageTypes(storageTypes.filter((x) => x !== t)) })),
    ...useCases.map((u) => ({ label: USE_CASES[u] || u, clear: () => setUseCases(useCases.filter((x) => x !== u)) })),
  ];

  const maxPriceLabel = (n: number) => `${sym(rows[0]?.cur || "USD")}${n.toLocaleString("en-IN")}`;
  const configure = (p: any) => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`);

  const renderRow = (r: Row) => {
    const s = r.p.spec || {};
    const k = r.p.planCode;
    const ramTxt = s.ramMin && s.ramMax && s.ramMin !== s.ramMax ? `${fmtGb(s.ramMin)} to ${fmtGb(s.ramMax)}` : s.ram || "—";
    const stoTxt = s.storageMin ? (s.storageMax && s.storageMax !== s.storageMin ? `${s.storageMin} – ${s.storageMax}` : s.storageMin) : s.storage || "—";
    return (
      <div key={k} className="border-t border-slate-200">
        <div className="grid grid-cols-[1.1fr_1.6fr_1fr_1.4fr_1.5fr_1.1fr_60px_110px] gap-3 px-4 py-3 items-center text-[11px] hover:bg-sky-50/40">
          <button onClick={() => setExpanded((e) => ({ ...e, [k]: !e[k] }))} className="flex items-center gap-1.5 text-left font-black text-[#0f2a6b] text-xs">
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded[k] ? "rotate-90" : ""}`} />
            <span>{r.name}</span>
            {r.year && <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${r.isNew ? "bg-cyan-300 text-[#0f2a6b]" : "bg-sky-100 text-[#0f2a6b]"}`}>{r.year}</span>}
          </button>
          <div className="text-slate-600 leading-4">
            <span className="text-slate-400">CPU: </span><b className="text-[#0f2a6b]">{s.cpuBrand ? `${s.cpuBrand} ${s.cpuModel}` : (r.p.description || "—")}</b>
            {s.cores && <><br /><b className="text-slate-700">{s.cores} c / {s.threads} t</b></>}
            {s.freq && <><br /><b className="text-slate-700">{s.freq} GHz / {s.boost} GHz</b></>}
          </div>
          <div className="font-bold text-[#0f2a6b]">{ramTxt}</div>
          <div className="font-bold text-[#0f2a6b]">{stoTxt}</div>
          <div className="text-slate-600 leading-4">
            <span className="text-slate-400">Public: </span><b className="text-[#0f2a6b]">{s.pubBwMin ? (s.pubBwMax && s.pubBwMax !== s.pubBwMin ? `${fmtBw(s.pubBwMin)} - ${fmtBw(s.pubBwMax)}` : fmtBw(s.pubBwMin)) : "—"}</b>
            {s.privBw ? <><br /><span className="text-slate-400">Private: </span><b className="text-[#0f2a6b]">{fmtBw(s.privBw)}</b></> : null}
          </div>
          <div>
            <p className="text-sm font-black text-[#0f2a6b]">{sym(r.cur)}{r.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            <p className="text-[9px] text-slate-400">ex. VAT/month (from)</p>
          </div>
          <input type="checkbox" checked={compare.includes(k)} onChange={() => toggle(compare, k, setCompare)} className="accent-[#0050d7] justify-self-center" aria-label="Compare" />
          <button onClick={() => configure(r.p)} className="rounded bg-[#0050d7] px-3 py-2 text-xs font-bold text-white hover:bg-[#0043b3]">Configure</button>
        </div>
        {expanded[k] && (
          <div className="bg-slate-50 px-6 py-3 text-[11px] text-slate-600 grid sm:grid-cols-3 gap-3">
            <div><p className="font-black text-[#0f2a6b]">Locations</p><p>{r.regions.map((c) => REGIONS.flatMap((g) => g.items).find((i) => i.code === c)?.label || c.toUpperCase()).join(", ") || "—"}</p></div>
            <div><p className="font-black text-[#0f2a6b]">Use cases</p><p>{r.usecases.map((u) => USE_CASES[u] || u).join(", ") || "—"}</p></div>
            <div><p className="font-black text-[#0f2a6b]">Plan code</p><p className="font-mono">{k}</p></div>
          </div>
        )}
      </div>
    );
  };

  const header = (
    <div className="grid grid-cols-[1.1fr_1.6fr_1fr_1.4fr_1.5fr_1.1fr_60px_110px] gap-3 px-4 py-2.5 bg-slate-50 text-[11px] font-black text-slate-500">
      <span>Name</span><span>CPU</span><span>RAM</span><span>Storage</span><span>Bandwidth</span><span>Price ex. VAT/month</span><span className="text-center">Compare</span><span />
    </div>
  );

  const showSections = ranges.length === 0;
  const sections = (showSections ? [...RANGES] : (ranges as string[])).map((r) => ({ r, list: filtered.filter((x) => x.range === r) })).filter((s) => s.list.length);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />
      <div className="bg-gradient-to-br from-[#00185e] to-[#0050d7] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <p className="text-[11px] text-white/70"><a href="/dedicated-servers" className="hover:underline">Dedicated Servers</a> | GHC Full Dedicated Server Range</p>
          <h1 className="mt-4 text-3xl md:text-4xl font-black">GHC Full Dedicated Server Range</h1>
          <p className="mt-2 text-sm text-white/80 max-w-md">Select the specifications you require and complete your server order in a few clicks.</p>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2">
          <Dropdown label="Region" count={regionSel.length}>
            {REGIONS.map((g) => (
              <div key={g.group} className="mb-2"><p className="font-black text-[#0f2a6b]">{g.group}</p>
                {g.items.map((i) => <Check key={i.code} checked={regionSel.includes(i.code)} onChange={() => toggle(regionSel, i.code, setRegionSel)} label={i.label} />)}
              </div>
            ))}
          </Dropdown>
          <Dropdown label="Range" count={ranges.length}>
            {RANGES.map((r) => <Check key={r} checked={ranges.includes(r)} onChange={() => toggle(ranges, r, setRanges)} label={r} />)}
          </Dropdown>
          <Dropdown label="Hardware" count={brands.length + sockets.length + storageTypes.length + (gpuOnly ? 1 : 0)}>
            <p className="font-black text-[#0f2a6b]">Processor</p>
            <div className="grid grid-cols-2 gap-x-6">
              <div><p className="text-slate-400 mt-1">Brand</p>{["AMD", "INTEL"].map((b) => <Check key={b} checked={brands.includes(b)} onChange={() => toggle(brands, b, setBrands)} label={b} />)}</div>
              <div><p className="text-slate-400 mt-1">Sockets</p>{[1, 2].map((n) => <Check key={n} checked={sockets.includes(n)} onChange={() => toggle(sockets, n, setSockets)} label={`${n} CPU`} />)}</div>
            </div>
            <p className="font-black text-[#0f2a6b] mt-3">Storage type</p>
            <div className="grid grid-cols-2 gap-x-6">{["NVMe", "SAS", "SSD", "HDD"].map((t) => <Check key={t} checked={storageTypes.includes(t)} onChange={() => toggle(storageTypes, t, setStorageTypes)} label={t} />)}</div>
            <p className="font-black text-[#0f2a6b] mt-3">Graphic card</p>
            <Check checked={gpuOnly} onChange={() => setGpuOnly((g) => !g)} label="Only servers with GPU" />
          </Dropdown>
          <Dropdown label="Network" count={minPub ? 1 : 0}>
            <p className="font-black text-[#0f2a6b] mb-1">Minimum public bandwidth</p>
            {[0, 1000, 3000, 5000, 10000, 25000].map((m) => (
              <label key={m} className="flex items-center gap-2 py-1 cursor-pointer text-[#0f2a6b] font-medium"><input type="radio" name="pub" checked={minPub === m} onChange={() => setMinPub(m)} className="accent-[#0050d7]" />{m ? `≥ ${fmtBw(m)}` : "Any"}</label>
            ))}
          </Dropdown>
          <Dropdown label="Price" count={price[0] !== priceBounds[0] || price[1] !== priceBounds[1] ? 1 : 0}>
            <Slider label="Monthly price" min={priceBounds[0]} max={priceBounds[1]} value={price} onChange={setPrice} fmt={maxPriceLabel} />
          </Dropdown>
          <Dropdown label="Use Cases" count={useCases.length}>
            {Object.entries(USE_CASES).map(([k, v]) => <Check key={k} checked={useCases.includes(k)} onChange={() => toggle(useCases, k, setUseCases)} label={v} />)}
          </Dropdown>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="rounded border border-[#0050d7]/40 bg-white px-2 py-1.5 text-xs font-bold text-[#0f2a6b]">
              <option value="asc">Ascending price</option>
              <option value="desc">Descending price</option>
            </select>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-bold text-[#0f2a6b]">{c.label}<button onClick={c.clear} aria-label="remove"><X className="w-3 h-3" /></button></span>
            ))}
            <button onClick={reset} className="inline-flex items-center gap-1 text-xs font-bold text-[#0050d7] hover:underline"><RotateCcw className="w-3 h-3" /> Reset</button>
          </div>
        )}
      </div>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {!showSections && (
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-black text-[#0f2a6b]">Results <span className="text-sm font-normal text-slate-500">({filtered.length} server(s))</span></h2>
            <button onClick={() => setExpanded(filtered.every((x) => expanded[x.p.planCode]) ? {} : Object.fromEntries(filtered.map((x) => [x.p.planCode, true])))} className="text-xs font-bold text-[#0050d7]">Open all</button>
          </div>
        )}
        {sections.length === 0 && <p className="py-20 text-center text-slate-400">No servers match these filters.</p>}
        <div className="overflow-x-auto">
          <div className="min-w-[980px] space-y-10">
            {sections.map(({ r, list }) => {
              const limit = showSections ? (more[r] ?? 4) : list.length;
              return (
                <section key={r}>
                  {showSections && (
                    <div className="mb-2">
                      <h3 className="text-xl font-black text-[#0f2a6b]">{r} <span className="text-xs font-normal text-slate-500">({list.length} server(s))</span></h3>
                      <p className="text-xs text-slate-500">{RANGE_DESC[r]} <a href={RANGE_HREF[r]} className="text-[#0050d7] font-bold">Discover the {r} range →</a></p>
                    </div>
                  )}
                  <div className="rounded border border-slate-200 bg-white overflow-hidden">
                    {header}
                    {list.slice(0, limit).map(renderRow)}
                  </div>
                  {showSections && list.length > limit && (
                    <div className="mt-3 text-center"><button onClick={() => setMore((m) => ({ ...m, [r]: list.length }))} className="text-xs font-bold text-[#0050d7] inline-flex items-center gap-1">Show more servers <ChevronDown className="w-3.5 h-3.5" /></button></div>
                  )}
                  {showSections && limit > 4 && list.length > 4 && limit >= list.length && (
                    <div className="mt-3 text-center"><button onClick={() => setMore((m) => ({ ...m, [r]: 4 }))} className="text-xs font-bold text-[#0050d7]">Show less servers</button></div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>

      {compare.length > 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-full bg-[#0f2a6b] text-white px-5 py-2.5 text-xs font-bold shadow-xl flex items-center gap-3">
          {compare.length} servers selected <button onClick={() => setCompare([])} className="underline">Clear</button>
        </div>
      )}
      <Footer />
    </div>
  );
}
