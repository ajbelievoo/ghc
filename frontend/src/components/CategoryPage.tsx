"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Check, Loader2, ShoppingCart, ChevronDown, ChevronUp,
  List, LayoutGrid, RefreshCw, ArrowUpDown, Search,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  const formatted = typeof value === "number" ? `${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : "";
  return typeof value === "number" ? `${sym}${formatted}` : "Contact us";
}

interface CategoryDef {
  key: string; label: string;
  heroTitle: string; heroSubtitle: string; heroBullets: string[];
}

const categoryMap: Record<string, CategoryDef> = {
  VPS: { key: "VPS", label: "VPS", heroTitle: "Virtual Private Servers (VPS)", heroSubtitle: "A simple, powerful cloud platform tailored to your needs", heroBullets: ["More resources, still at the best price","Enhanced security, anti-DDoS and backup included","Unlimited bandwidth, up to 1.5Gbps"] },
  DEDICATED: { key: "DEDICATED", label: "Dedicated servers", heroTitle: "GHC Full Dedicated Server Range", heroSubtitle: "Select the specifications you require and complete your server order in a few clicks.", heroBullets: ["Bare metal performance","DDoS protection included","Custom RAID and IPMI"] },
  WEB_HOSTING: { key: "WEB_HOSTING", label: "Web Hosting", heroTitle: "Web Hosting Solutions", heroSubtitle: "Reliable cPanel, Plesk and CMS hosting for every project", heroBullets: ["Free SSL certificate","Daily backups included","cPanel / Plesk control panels"] },
  CDN: { key: "CDN", label: "CDN & Security", heroTitle: "CDN & Security Solutions", heroSubtitle: "Global edge acceleration and DDoS protection", heroBullets: ["Global edge nodes","DDoS mitigation","HTTP/3 and real-time analytics"] },
  PUBLIC_CLOUD: { key: "PUBLIC_CLOUD", label: "Public Cloud", heroTitle: "Public Cloud", heroSubtitle: "Scalable cloud instances, storage and Kubernetes", heroBullets: ["Pay-as-you-go billing","Auto-scaling","Object storage and managed databases"] },
  PRIVATE_CLOUD: { key: "PRIVATE_CLOUD", label: "Private Cloud", heroTitle: "Private Cloud", heroSubtitle: "Dedicated private cloud infrastructure", heroBullets: ["Dedicated hosts","VMware / Nutanix ready","ISO 27001 compliant"] },
};

const subCategoryHero: Record<string, { title: string; subtitle: string; bullets: string[] }> = {
  "vps-2027": { title: "Virtual Private Servers (VPS)", subtitle: "A simple, powerful cloud platform tailored to your needs", bullets: ["More resources, still at the best price","Enhanced security, anti-DDoS and backup included","Unlimited bandwidth, up to 1.5Gbps"] },
  "plesk": { title: "GHC Plesk VPS Offer", subtitle: "Efficiently manage websites, domains, and emails with Plesk's user-friendly control panel using high-performance GHC VPS.", bullets: ["Plesk Obsidian control panel pre-installed","Manage multiple websites from one interface","Automated backups and security tools"] },
  "n8n": { title: "VPS n8n: a solution for your workflow automations", subtitle: "Transform your business operations with n8n, the flexible workflow automation tool. Seamlessly connect integrations and streamline complex processes with ease.", bullets: ["n8n pre-installed and ready to use","Automate workflows without coding","Connect 400+ integrations"] },
  "cpanel": { title: "Discover our cPanel-compatible VPSs", subtitle: "Centralised multi-site management, reliable, scalable web hosting, and transparent and predictable pricing.", bullets: ["cPanel & WHM pre-installed","Manage multiple websites easily","Automatic SSL and backups"] },
  "wordpress": { title: "Explore GHC VPS servers, compatible with WordPress", subtitle: "Performance at a competitive price. A customisable and scalable VPS, compatible with WordPress. Up to 3 Gbps unlimited bandwidth and traffic.", bullets: ["WordPress pre-installed","Scalable resources as you grow","Up to 3 Gbps unlimited bandwidth"] },
};


interface Plan {
  planCode: string; invoiceName: string; description?: string;
  family?: string; category: string;
  cpuCores?: number; ramGb?: number; diskGb?: number;
  diskType?: string; bandwidthMbps?: number;
  metadata?: any;
  durations?: { durationLabel: string; interval: number; intervalUnit: string; finalPrice: number; monthlyPrice: number; rawPrice: number; currency?: string }[];
}

const CPU_KB: Record<string, { cores: number; threads: number; base: string }> = {
  "AMD EPYC 4244P": { cores: 6, threads: 12, base: "3.4 GHz" },
  "AMD EPYC 4245P": { cores: 8, threads: 16, base: "4.1 GHz" },
  "AMD EPYC 4344P": { cores: 16, threads: 32, base: "3.8 GHz" },
  "AMD EPYC 4354P": { cores: 16, threads: 32, base: "3.5 GHz" },
  "AMD EPYC 4364P": { cores: 24, threads: 48, base: "3.5 GHz" },
  "AMD EPYC 9124":  { cores: 16, threads: 32, base: "3.0 GHz" },
  "AMD EPYC 9254":  { cores: 24, threads: 48, base: "2.9 GHz" },
  "AMD EPYC 9334":  { cores: 32, threads: 64, base: "2.7 GHz" },
  "AMD EPYC 9354":  { cores: 32, threads: 64, base: "3.25 GHz" },
  "AMD EPYC 9454":  { cores: 48, threads: 96, base: "2.75 GHz" },
  "AMD EPYC 9554":  { cores: 64, threads: 128, base: "3.1 GHz" },
  "AMD EPYC 9654":  { cores: 96, threads: 192, base: "2.4 GHz" },
  "AMD EPYC 9754":  { cores: 128, threads: 256, base: "2.25 GHz" },
};

/* ─── Dedicated Server Specs Database (fallback when API has no technical blobs) ─── */
const DEDICATED_SPECS_DB: Record<string, { ram: string; storage: string; bandwidth: string }> = {
  // ADVANCE
  "ADVANCE-1":      { ram: "64 GB DDR5",  storage: "2x 960 GB NVMe SSD",         bandwidth: "500 Mbps" },
  "ADVANCE-2":      { ram: "128 GB DDR5", storage: "2x 1.92 TB NVMe SSD",        bandwidth: "1 Gbps" },
  "ADVANCE-3":      { ram: "256 GB DDR5", storage: "2x 1.92 TB NVMe SSD",        bandwidth: "1 Gbps" },
  "ADVANCE-4":      { ram: "512 GB DDR5", storage: "2x 3.84 TB NVMe SSD",        bandwidth: "1 Gbps" },
  "ADVANCE-5":      { ram: "576 GB DDR5", storage: "2x 3.84 TB NVMe SSD",        bandwidth: "1 Gbps" },
  "ADVANCE-STOR":   { ram: "128 GB DDR4", storage: "12x 4 TB SAS HDD",           bandwidth: "1 Gbps" },
  // GAME
  "GAME-1":         { ram: "64 GB DDR5",  storage: "2x 960 GB NVMe SSD",         bandwidth: "1 Gbps" },
  "GAME-2":         { ram: "128 GB DDR5", storage: "2x 960 GB NVMe SSD",         bandwidth: "1 Gbps" },
  // SCALE
  "SCALE-a1":       { ram: "128 GB DDR5", storage: "2x 480 GB SSD + 2x 3.84 TB NVMe", bandwidth: "2x 10 Gbps" },
  "SCALE-a2":       { ram: "256 GB DDR5", storage: "2x 480 GB SSD + 2x 3.84 TB NVMe", bandwidth: "2x 10 Gbps" },
  "SCALE-a3":       { ram: "384 GB DDR5", storage: "2x 480 GB SSD + 2x 3.84 TB NVMe", bandwidth: "2x 10 Gbps" },
  "SCALE-a4":       { ram: "512 GB DDR5", storage: "2x 480 GB SSD + 2x 3.84 TB NVMe", bandwidth: "2x 10 Gbps" },
  "SCALE-a5":       { ram: "768 GB DDR5", storage: "2x 480 GB SSD + 2x 3.84 TB NVMe", bandwidth: "2x 10 Gbps" },
  // High Grade – HCI
  "HGR-HCI-a1":     { ram: "256 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-a2":     { ram: "512 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-a3":     { ram: "768 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-a4":     { ram: "1 TB DDR5",   storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-1":      { ram: "256 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-2":      { ram: "512 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-3":      { ram: "768 GB DDR5", storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  "HGR-HCI-4":      { ram: "1 TB DDR5",   storage: "2x 960 GB NVMe + 4x 3.84 TB NVMe", bandwidth: "10 Gbps" },
  // High Grade – AI
  "HGR-AI-2":       { ram: "512 GB DDR5", storage: "2x 960 GB NVMe + 2x 7.68 TB NVMe", bandwidth: "10 Gbps" },
  // High Grade – SAP
  "HGR-SAP-1":      { ram: "512 GB DDR5", storage: "2x 960 GB NVMe SSD",         bandwidth: "10 Gbps" },
  "HGR-SAP-2":      { ram: "1 TB DDR5",   storage: "2x 960 GB NVMe SSD",         bandwidth: "10 Gbps" },
  "HGR-SAP-3":      { ram: "2 TB DDR5",   storage: "2x 960 GB NVMe SSD",         bandwidth: "10 Gbps" },
  // High Grade – SDS
  "HGR-SDS-1":      { ram: "128 GB DDR4", storage: "8x 4 TB SAS HDD",            bandwidth: "1 Gbps" },
  "HGR-SDS-2":      { ram: "256 GB DDR4", storage: "12x 4 TB SAS HDD",           bandwidth: "1 Gbps" },
  // High Grade – STOR
  "HGR-STOR-1":     { ram: "64 GB DDR4",  storage: "4x 16 TB SATA HDD",          bandwidth: "1 Gbps" },
  "HGR-STOR-2":     { ram: "128 GB DDR4", storage: "8x 16 TB SATA HDD",          bandwidth: "1 Gbps" },
};

function getSpecsFromDb(name: string) {
  const base = name.split("|")[0].trim();
  return DEDICATED_SPECS_DB[base] || null;
}

function parseCpuModel(name: string): string | null {
  const m = name.match(/\|\s*(AMD|Intel)[^|]+/);
  return m ? m[0].replace("| ", "").trim() : null;
}

function planRange(p: Plan, category: string): string | null {
  const name = p.invoiceName || "";
  if (category === "WEB_HOSTING") {
    if (p.planCode.startsWith("sql_included")) return null;
    if (p.planCode.includes("2014") || name.includes("2014 offer")) return null;
    if (p.planCode.startsWith("hosting-")) {
      const base = p.planCode.replace(/^hosting-/, "").replace(/-\d+$/, "");
      const parts = base.split("-").filter(Boolean);
      const labels: Record<string, string> = {
        starter: "Starter", perso: "Perso", pro: "Pro", startup: "Startup",
        performance: "Performance", agency: "Agency",
        "agency-plus": "Agency Plus", "agency-max": "Agency Max",
      };
      const key = parts.join("-");
      return labels[key] || parts.map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(" ");
    }
    return name.split(" ")[0];
  }
  if (category === "VPS") {
    const m = p.planCode.match(/^vps-([a-z0-9]+)/);
    if (m) {
      const key = m[1];
      if (key === "le") return "VLE";
      const labels: Record<string, string> = { "2027": "VPS 2027", starter: "Starter", value: "Value", essential: "Essential", comfort: "Comfort", elite: "Elite" };
      return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }
    return "VPS";
  }
  if (category === "DEDICATED") {
    const m = name.match(/^([A-Za-z]+(?:-[A-Za-z]+)?)-/);
    if (m) {
      const key = m[1];
      const lk = key.toLowerCase();
      // map HGR-* generically
      if (lk.startsWith("hgr-")) {
        const sub = key.split("-")[1];
        return `High Grade ${sub}`;
      }
      if (lk.startsWith("scale-gpu")) return "Scale GPU";
      if (lk.startsWith("scale")) return "Scale";
      if (lk.startsWith("advance")) return "Advance";
      if (lk === "game") return "Game";
      if (lk === "stor") return "Storage";
      return key;
    }
  }
  const m = name.match(/^([A-Z]+)-\d+/);
  if (m) return m[1];
  const first = name.split("|")[0].trim();
  return first || "Other";
}

function getCpuInfo(name: string, dbCores?: number) {
  const model = parseCpuModel(name);
  if (!model) return dbCores ? `${dbCores} vCores` : "-";
  const kb = CPU_KB[model];
  if (kb) return `${model}  (${kb.cores}c/${kb.threads}t, ${kb.base})`;
  return model;
}

function getRamInfo(plan: Plan) {
  if (plan.ramGb) return `${plan.ramGb} GB`;
  const meta = plan.metadata || {};
  const ram = meta?.product?.blobs?.technical?.memory?.size || meta?.blobs?.technical?.memory?.size;
  if (ram) return `${ram} GB`;
  const db = getSpecsFromDb(plan.invoiceName);
  if (db) return db.ram;
  return "-";
}

function getStorageInfo(plan: Plan) {
  if (plan.diskGb) return `${plan.diskGb} GB ${plan.diskType || "SSD"}`;
  const meta = plan.metadata || {};
  const disks = meta?.product?.blobs?.technical?.storage?.disks || meta?.blobs?.technical?.storage?.disks;
  if (disks?.length) return disks.map((d: any) => `${d.number || 1}x ${d.capacity}GB ${d.technology || ""}`).join(", ");
  const db = getSpecsFromDb(plan.invoiceName);
  if (db) return db.storage;
  return "-";
}

function getBandwidthInfo(plan: Plan) {
  if (plan.bandwidthMbps) return `${plan.bandwidthMbps} Mbps`;
  const meta = plan.metadata || {};
  const t = meta?.product?.blobs?.technical || meta?.blobs?.technical || {};
  const pub = t.network?.public?.bandwidth || t.bandwidth?.level;
  if (pub) return `${pub} Mbps`;
  const db = getSpecsFromDb(plan.invoiceName);
  if (db) return db.bandwidth;
  return "-";
}

function getTechBlob(plan: Plan) {
  const meta = plan.metadata || {};
  return meta?.product?.blobs?.technical || meta?.blobs?.technical || {};
}

function hasRealSpecs(plan: Plan) {
  if (plan.cpuCores || plan.ramGb || plan.diskGb || plan.bandwidthMbps) return true;
  if (Object.keys(getTechBlob(plan)).length > 0) return true;
  if (getSpecsFromDb(plan.invoiceName)) return true;
  return false;
}

function GeometricBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="triangles" width="100" height="100" patternUnits="userSpaceOnUse">
            <polygon points="50,0 100,100 0,100" fill="none" stroke="white" strokeWidth="0.5"/>
            <polygon points="50,0 100,0 100,50" fill="none" stroke="white" strokeWidth="0.5"/>
            <polygon points="0,0 50,0 0,50" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#triangles)" />
      </svg>
    </div>
  );
}

interface DropdownProps {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}

function Dropdown({ label, options, value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded border border-slate-200 px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8faff]">
        {label} {selected?.value ? `(${selected.label})` : ""} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-48 rounded border border-slate-200 bg-white py-1 shadow-lg">
          <button onClick={() => { onChange(""); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-xs hover:bg-[#f8faff] ${!value ? "bg-slate-100 text-[#00b7ff] font-bold" : "text-[#0f172a]"}`}>All</button>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} className={`block w-full px-3 py-2 text-left text-xs hover:bg-[#f8faff] ${value === o.value ? "bg-slate-100 text-[#00b7ff] font-bold" : "text-[#0f172a]"}`}>{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
interface SubTab {
  key: string;
  label: string;
}

export default function CategoryPage({ categoryKey, subCategory, subTabs, onSubTabChange, initialPlans }: { categoryKey: string; subCategory?: string; subTabs?: SubTab[]; onSubTabChange?: (key: string) => void; initialPlans?: Plan[] }) {
  const cat = categoryMap[categoryKey] || categoryMap.VPS;
  const isDedicated = categoryKey === "DEDICATED";

  const cleanPlans = (list: Plan[]) => {
    const filtered = list.filter((p) => planRange(p, categoryKey) !== null);
    // Deduplicate by invoiceName, preferring base planCode without region suffix
    const map = new Map<string, Plan>();
    filtered.forEach((p) => {
      const existing = map.get(p.invoiceName);
      if (!existing) { map.set(p.invoiceName, p); return; }
      const isRegional = /-(mum|sgp|syd)$/.test(p.planCode);
      const existingIsRegional = /-(mum|sgp|syd)$/.test(existing.planCode);
      if (!isRegional && existingIsRegional) map.set(p.invoiceName, p);
    });
    return Array.from(map.values());
  };

  const [plans, setPlans] = useState<Plan[]>(initialPlans ? cleanPlans(initialPlans) : []);
  const [loading, setLoading] = useState(!initialPlans);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const { currency } = useCurrency();

  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "card">(isDedicated ? "table" : "card");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "name">("price_asc");

  const [filterRange, setFilterRange] = useState("");
  const [filterCpu, setFilterCpu] = useState("");
  const [filterRam, setFilterRam] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialPlans) {
      setPlans(cleanPlans(initialPlans));
      setLoading(false);
      // still refetch client-side with the chosen currency
    }
    let alive = true;
    setLoading(true);
    api.server.plans(categoryKey).then((data: Plan[]) => {
      if (!alive) return;
      setPlans(cleanPlans(data || []));
    }).catch(() => {
      if (!alive) return;
      setPlans([]);
    }).finally(() => alive && setLoading(false));
    const onCurrency = () => {
      if (!alive) return;
      api.server.plans(categoryKey).then((data: Plan[]) => {
        if (!alive) return;
        setPlans(cleanPlans(data || []));
      });
    };
    window.addEventListener("currencychange", onCurrency);
    return () => { alive = false; window.removeEventListener("currencychange", onCurrency); };
  }, [categoryKey, initialPlans, currency]);

  const allRanges = useMemo(() => {
    const s = new Set<string>();
    plans.forEach(p => {
      const r = planRange(p, categoryKey);
      if (r) s.add(r);
    });
    return Array.from(s).sort();
  }, [plans, categoryKey]);

  const allCpuBrands = useMemo(() => {
    const s = new Set<string>();
    plans.forEach(p => {
      const m = parseCpuModel(p.invoiceName);
      if (m) { if (m.includes("AMD")) s.add("AMD"); if (m.includes("Intel")) s.add("Intel"); }
    });
    return Array.from(s).sort();
  }, [plans]);

  const allRamOptions = useMemo(() => {
    const s = new Set<string>();
    plans.forEach(p => { if (p.ramGb) s.add(String(p.ramGb)); });
    return Array.from(s).sort((a, b) => Number(a) - Number(b));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    let list = [...plans];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.invoiceName.toLowerCase().includes(q) || p.planCode.toLowerCase().includes(q));
    }
    if (filterRange) list = list.filter(p => planRange(p, categoryKey) === filterRange);
    if (filterCpu) {
      list = list.filter(p => { const m = parseCpuModel(p.invoiceName); return m ? m.includes(filterCpu) : false; });
    }
    if (filterRam) list = list.filter(p => String(p.ramGb) === filterRam);
    if (filterMinPrice) { const min = Number(filterMinPrice); list = list.filter(p => (p.durations?.[0]?.finalPrice || 0) >= min); }
    if (filterMaxPrice) { const max = Number(filterMaxPrice); list = list.filter(p => (p.durations?.[0]?.finalPrice || 0) <= max); }
    list.sort((a, b) => {
      if (sortBy === "price_asc") return (a.durations?.[0]?.finalPrice || 0) - (b.durations?.[0]?.finalPrice || 0);
      if (sortBy === "price_desc") return (b.durations?.[0]?.finalPrice || 0) - (a.durations?.[0]?.finalPrice || 0);
      if (sortBy === "name") return a.invoiceName.localeCompare(b.invoiceName);
      return 0;
    });
    return list;
  }, [plans, searchQuery, filterRange, filterCpu, filterRam, filterMinPrice, filterMaxPrice, sortBy]);

  const groupedByRange = useMemo(() => {
    const map: Record<string, Plan[]> = {};
    filteredPlans.forEach(p => {
      const r = planRange(p, categoryKey);
      if (r) {
        if (!map[r]) map[r] = [];
        map[r].push(p);
      }
    });
    return map;
  }, [filteredPlans, categoryKey]);

  const router = useRouter();
  const configurePlan = (planCode: string) => {
    const sub = subCategory ? `&subCategory=${encodeURIComponent(subCategory)}` : "";
    router.push(`/configure?category=${categoryKey}&plan=${encodeURIComponent(planCode)}${sub}`);
  };

  const handleSync = async () => {
    setSyncing(true); setSyncMessage("");
    try {
      const res = await api.admin.syncProviderPlans();
      setSyncMessage(`Synced ${res.synced || 0} plans. Refreshing...`);
      const data = await api.server.plans(categoryKey);
      setPlans(data || []);
    } catch (e: any) {
      setSyncMessage("Sync failed: " + (e.message || "Unknown"));
    } finally { setSyncing(false); }
  };

  const clearFilters = () => {
    setFilterRange(""); setFilterCpu(""); setFilterRam("");
    setFilterMinPrice(""); setFilterMaxPrice(""); setSearchQuery("");
    setSortBy("price_asc");
  };

  const missingSpecsCount = plans.filter(p => !hasRealSpecs(p)).length;
  const activeFilterCount = [filterRange, filterCpu, filterRam, filterMinPrice, filterMaxPrice].filter(Boolean).length;

  const renderCard = (plan: Plan) => {
    const cheapest = (plan.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
    return (
      <div key={plan.planCode} className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#00b7ff] hover:shadow-xl">
        <div className="border-b border-slate-200 p-6">
          <h3 className="text-lg font-bold text-[#0f172a]">{plan.invoiceName || plan.planCode}</h3>
        </div>
        <div className="border-b border-slate-200 p-6">
          <p className="text-xs font-medium text-slate-500">From</p>
          <p className="text-3xl font-black text-[#00b7ff]">{money(cheapest?.monthlyPrice, cheapest?.currency)}</p>
          <p className="text-xs text-slate-500">ex. taxes/month</p>
          <button onClick={() => configurePlan(plan.planCode)} className="mt-4 inline-flex items-center gap-2 rounded bg-[#ff3d00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">
            <ShoppingCart className="h-4 w-4" /> Configure
          </button>
        </div>
        <div className="flex-1 bg-[#f8faff] p-6">
          <div className="space-y-2 text-sm">
            {(() => {
              const cpu = getCpuInfo(plan.invoiceName, plan.cpuCores);
              const ram = getRamInfo(plan);
              const storage = getStorageInfo(plan);
              const bw = getBandwidthInfo(plan);
              const hide = (v: string) => !v || v === "-" || v === "0" || v === "0 GB" || v === "0 Mbps";
              return (
                <>
                  {!hide(cpu) && <div className="flex items-start gap-2"><span className="font-semibold text-[#0f172a] w-20 shrink-0">CPU:</span><span className="text-slate-600">{cpu}</span></div>}
                  {!hide(ram) && <div className="flex items-start gap-2"><span className="font-semibold text-[#0f172a] w-20 shrink-0">RAM:</span><span className="text-slate-600">{ram}</span></div>}
                  {!hide(storage) && <div className="flex items-start gap-2"><span className="font-semibold text-[#0f172a] w-20 shrink-0">Storage:</span><span className="text-slate-600">{storage}</span></div>}
                  {!hide(bw) && <div className="flex items-start gap-2"><span className="font-semibold text-[#0f172a] w-20 shrink-0">Bandwidth:</span><span className="text-slate-600">{bw}</span></div>}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  const renderTableRow = (plan: Plan) => {
    const cheapest = (plan.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
    const isExpanded = expandedPlan === plan.planCode;
    return (
      <>
        <tr className="border-b border-slate-200 hover:bg-[#f8faff] transition">
          <td className="px-3 py-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setExpandedPlan(isExpanded ? null : plan.planCode)} className="text-[#00b7ff] p-1 hover:bg-slate-100 rounded">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <span className="font-bold text-sm text-[#0f172a]">{plan.invoiceName || plan.planCode}</span>
            </div>
          </td>
          <td className="px-3 py-3 text-sm text-[#0f172a]">{getCpuInfo(plan.invoiceName, plan.cpuCores)}</td>
          <td className="px-3 py-3 text-sm text-[#0f172a]">{getRamInfo(plan)}</td>
          <td className="px-3 py-3 text-sm text-[#0f172a]">{getStorageInfo(plan)}</td>
          <td className="px-3 py-3 text-sm text-[#0f172a]">{getBandwidthInfo(plan)}</td>
          <td className="px-3 py-3"><div><p className="text-base font-black text-[#00b7ff]">{money(cheapest?.monthlyPrice, cheapest?.currency)}</p><p className="text-[10px] text-slate-500">ex. taxes/month</p></div></td>
          <td className="px-3 py-3 text-center"><input type="checkbox" className="h-4 w-4 rounded border-slate-200" onChange={() => {}} /></td>
          <td className="px-3 py-3"><button onClick={() => configurePlan(plan.planCode)} className="rounded bg-[#0f0c29] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#302b63]">Configure</button></td>
        </tr>
        {isExpanded && (
          <tr className="bg-[#f8faff]">
            <td colSpan={8} className="px-6 py-5">
              <div className="grid gap-4 md:grid-cols-3 text-sm">
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Processor</p>
                  <p className="font-semibold text-[#0f172a]">{getCpuInfo(plan.invoiceName, plan.cpuCores)}</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Memory</p>
                  <p className="font-semibold text-[#0f172a]">{getRamInfo(plan)}</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Storage</p>
                  <p className="font-semibold text-[#0f172a]">{getStorageInfo(plan)}</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Network</p>
                  <p className="font-semibold text-[#0f172a]">{getBandwidthInfo(plan)}</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Plan Code</p>
                  <p className="font-semibold text-[#0f172a]">{plan.planCode}</p>
                </div>
                <div className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Family</p>
                  <p className="font-semibold text-[#0f172a]">{plan.family || "Dedicated"}</p>
                </div>
              </div>
              <div className="mt-4">
                <button onClick={() => configurePlan(plan.planCode)} className="inline-flex items-center gap-2 rounded bg-[#ff3d00] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">
                  <ShoppingCart className="h-4 w-4" /> Configure this server
                </button>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <GeometricBg />
        <div className="relative mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="max-w-2xl">
            {(() => {
              const sub = subCategory && subCategoryHero[subCategory];
              const heroTitle = sub ? sub.title : cat.heroTitle;
              const heroSubtitle = sub ? sub.subtitle : cat.heroSubtitle;
              const heroBullets = sub ? sub.bullets : cat.heroBullets;
              return (
                <>
                  <h1 className="text-3xl font-black leading-tight md:text-4xl">{heroTitle}</h1>
                  <p className="mt-3 text-lg text-slate-200">{heroSubtitle}</p>
                  {heroBullets.length > 0 && (
                    <ul className="mt-5 space-y-2">{heroBullets.map((b, i) => <li key={i} className="flex items-center gap-2 text-sm text-slate-200"><Check className="h-4 w-4 shrink-0" />{b}</li>)}</ul>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Sub-category tabs */}
      {subTabs && subTabs.length > 0 && (
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex gap-1 overflow-x-auto">
              {subTabs.map((t) => {
                const isActive = subCategory === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onSubTabChange && onSubTabChange(t.key)}
                    className={`whitespace-nowrap px-4 py-3 text-sm font-bold transition border-b-2 ${
                      isActive
                        ? "border-[#00b7ff] text-[#00b7ff]"
                        : "border-transparent text-[#0f172a] hover:text-[#00b7ff] hover:bg-[#f8faff]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {subCategory === "os" && subTabs ? (
        <VpsOsTab />
      ) : (
      <div>
      {/* Info row */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr_240px]">
          {/* Ranges */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#0f172a]">Ranges</h3>
            <div className="max-h-[320px] overflow-y-auto rounded border border-slate-200 space-y-0">
              {allRanges.length === 0 && !loading && <p className="text-sm text-slate-500 p-3">No ranges found.</p>}
              <button onClick={() => setFilterRange("")} className={`block w-full text-left px-3 py-2 text-sm font-medium transition ${!filterRange ? "bg-slate-100 text-[#00b7ff] border-l-2 border-[#00b7ff]" : "text-[#0f172a] hover:bg-[#f8faff]"}`}>All ranges</button>
              {allRanges.map(r => (
                <button key={r} onClick={() => setFilterRange(filterRange === r ? "" : r)} className={`block w-full text-left px-3 py-2 text-sm font-medium transition border-t border-[#f0f0f0] ${filterRange === r ? "bg-slate-100 text-[#00b7ff] border-l-2 border-[#00b7ff]" : "text-[#0f172a] hover:bg-[#f8faff]"}`}>{r}</button>
              ))}
            </div>
            <div className="mt-6 space-y-2 text-xs text-slate-500">
              <p className="font-bold text-[#0f172a]">Apps, OS, and Panels</p>
              <p>cPanel, Plesk, WordPress, Docker</p>
            </div>
            <div className="mt-4 space-y-1 text-xs">
              <span className="block text-slate-400 cursor-default">Documentation</span>
              <span className="block text-slate-400 cursor-default">Roadmap &amp; Changelog</span>
            </div>
          </div>

          {/* Use cases */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#0f172a]">Use cases</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Agency / WebStudio", desc: "Host your clients with isolated environments", filter: "ADVANCE" },
                { label: "Developers", desc: "Test and deploy with root access", filter: "SCALE" },
                { label: "Resellers", desc: "Resell with your own branding", filter: "" },
                { label: "All uses", desc: "Gaming, VPN, apps and more", filter: "GAME" },
              ].map((uc) => (
                <button
                  key={uc.label}
                  onClick={() => {
                    if (uc.filter) {
                      setFilterRange(uc.filter);
                    } else {
                      setFilterRange("");
                    }
                    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-left rounded-lg border border-slate-200 bg-[#f8faff] p-4 hover:border-[#00b7ff] hover:shadow-md transition cursor-pointer"
                >
                  <p className="text-sm font-bold text-[#0f172a]">{uc.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{uc.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-[#0f172a]">Resources</h3>
            <div className="space-y-4">
              <Link href="/support" className="group block rounded-lg border border-slate-200 bg-[#f8faff] p-4 hover:border-[#00b7ff] transition">
                <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#00b7ff]">Become a Partner</p>
                <p className="mt-1 text-xs text-slate-500">Join our reseller program</p>
              </Link>
              <Link href="/network" className="group block rounded-lg border border-slate-200 bg-[#f8faff] p-4 hover:border-[#00b7ff] transition">
                <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#00b7ff]">Compliance & Certifications</p>
                <p className="mt-1 text-xs text-slate-500">ISO 27001, SOC 2</p>
              </Link>
              <Link href="/support" className="group block rounded-lg border border-slate-200 bg-[#f8faff] p-4 hover:border-[#00b7ff] transition">
                <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#00b7ff]">GHC Community</p>
                <p className="mt-1 text-xs text-slate-500">Get help from experts</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Plans section */}
      <section id="plans" className="mx-auto max-w-7xl px-6 pb-16">
        {/* Search + filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search servers..." className="w-full rounded border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#00b7ff]" />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded bg-[#ff3d00] px-3 py-2 text-xs font-bold text-[#0f172a] hover:bg-[#e63700]">
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setSortBy(prev => prev === "price_asc" ? "price_desc" : "price_asc")} className="flex items-center gap-1 rounded border border-slate-200 px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-[#f8faff]">
              <ArrowUpDown className="h-3 w-3" />{sortBy === "price_asc" ? "Price: Low to High" : sortBy === "price_desc" ? "Price: High to Low" : "Name"}
            </button>
            <button onClick={() => setViewMode("table")} className={`rounded p-2 ${viewMode === "table" ? "bg-[#0f0c29] text-white" : "text-slate-400 hover:text-[#0f172a]"}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode("card")} className={`rounded p-2 ${viewMode === "card" ? "bg-[#0f0c29] text-white" : "text-slate-400 hover:text-[#0f172a]"}`}><LayoutGrid className="h-4 w-4" /></button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {filterRange && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#00b7ff]">Range: {filterRange} <button onClick={() => setFilterRange("")} className="font-bold">×</button></span>}
            {filterCpu && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#00b7ff]">CPU: {filterCpu} <button onClick={() => setFilterCpu("")} className="font-bold">×</button></span>}
            {filterRam && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#00b7ff]">RAM: {filterRam}GB <button onClick={() => setFilterRam("")} className="font-bold">×</button></span>}
            {(filterMinPrice || filterMaxPrice) && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-[#00b7ff]">Price: {filterMinPrice || 0}-{filterMaxPrice || "∞"} <button onClick={() => { setFilterMinPrice(""); setFilterMaxPrice(""); }} className="font-bold">×</button></span>}
          </div>
        )}

        {/* More filters bar for dedicated */}
        {isDedicated && (
          <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
            <Dropdown label="Range" options={allRanges.map(r => ({ label: r, value: r }))} value={filterRange} onChange={setFilterRange} />
            <Dropdown label="CPU" options={allCpuBrands.map(c => ({ label: c, value: c }))} value={filterCpu} onChange={setFilterCpu} />
            <Dropdown label="RAM" options={allRamOptions.map(r => ({ label: `${r} GB`, value: r }))} value={filterRam} onChange={setFilterRam} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Min {getCurrencySymbol(currency)}</span>
              <input type="number" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} placeholder="0" className="w-20 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none" />
              <span className="text-xs text-slate-500">Max {getCurrencySymbol(currency)}</span>
              <input type="number" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} placeholder="∞" className="w-20 rounded border border-slate-200 px-2 py-1.5 text-xs outline-none" />
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-3 text-sm text-slate-500">
          Showing <span className="font-bold text-[#0f172a]">{filteredPlans.length}</span> of <span className="font-bold text-[#0f172a]">{plans.length}</span> plans
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded border border-slate-200 py-16"><Loader2 className="h-6 w-6 animate-spin text-[#00b7ff]" /></div>
        ) : filteredPlans.length === 0 ? (
          <div className="rounded border border-slate-200 bg-[#f8faff] p-10 text-center">
            <p className="font-bold text-[#0f172a]">No plans match your filters</p>
            <button onClick={clearFilters} className="mt-4 rounded bg-[#0f0c29] px-5 py-2 text-sm font-bold text-white">Clear all filters</button>
            {plans.length === 0 && (
              <>
                <p className="mt-2 text-sm text-slate-500">No plans in database. Sync product catalog first.</p>
                <button onClick={handleSync} disabled={syncing} className="mt-4 inline-flex items-center gap-2 rounded bg-[#ff3d00] px-5 py-2 text-sm font-bold text-[#0f172a] disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sync Catalog
                </button>
              </>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="space-y-8">
            {Object.entries(groupedByRange).map(([range, rangePlans]) => (
              <div key={range}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-lg font-bold text-[#0f172a]">{range}</h3>
                  <span className="rounded bg-[#00a2bf] px-2 py-0.5 text-[10px] font-bold text-[#0f172a]">NEW</span>
                  <span className="text-xs text-slate-500">({rangePlans.length} servers)</span>
                </div>
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f8faff]">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3 font-bold text-[#0f172a]">Name</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]">CPU</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]">RAM</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]">Storage</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]">Bandwidth</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]">Price ex. taxes/month</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a] text-center">Compare</th>
                        <th className="px-3 py-3 font-bold text-[#0f172a]"></th>
                      </tr>
                    </thead>
                    <tbody>{rangePlans.map((plan) => renderTableRow(plan))}</tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => renderCard(plan))}
          </div>
        )}
      </section>

      </div>
      )}
      <Footer />
    </div>
  );
}

function VpsOsTab() {
  const osList = [
    { family: "Linux/UNIX", systems: [{ name: "Fedora", versions: ["Fedora 42"] }] },
    { family: "AlmaLinux", systems: [{ name: "AlmaLinux", versions: ["AlmaLinux 8", "AlmaLinux 9", "AlmaLinux 10"] }] },
    { family: "CloudLinux", systems: [{ name: "CloudLinux", versions: ["CloudLinux 9"] }] },
    { family: "Debian", systems: [{ name: "Debian", versions: ["Debian 11", "Debian 12", "Debian 13"] }] },
    { family: "Rocky Linux", systems: [{ name: "Rocky Linux", versions: ["Rocky Linux 9", "Rocky Linux 10"] }] },
    { family: "Ubuntu", systems: [{ name: "Ubuntu", versions: ["Ubuntu 20.04", "Ubuntu 22.04", "Ubuntu 24.04", "Ubuntu 26.04"] }] },
    { family: "FreeBSD", systems: [{ name: "FreeBSD", versions: ["FreeBSD 15 UFS"] }] },
    { family: "Windows Server", systems: [{ name: "Windows Server", versions: ["Windows Server 2025"] }] },
  ];
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="text-2xl font-black text-[#0f172a] mb-2">Operating systems</h2>
        <p className="text-sm text-slate-500 mb-8">Choose the operating system for your VPS.</p>
        <div className="space-y-8">
          {osList.map((group) => (
            <div key={group.family}>
              <h3 className="text-lg font-bold text-[#0f172a] mb-4 border-b border-slate-200 pb-2">{group.family}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-4 font-medium">OS Type</th>
                      <th className="py-2 pr-4 font-medium">Family</th>
                      <th className="py-2 pr-4 font-medium">Version</th>
                      <th className="py-2 pr-4 font-medium">Options</th>
                      <th className="py-2 font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.systems.map((sys) =>
                      sys.versions.map((ver, idx) => (
                        <tr key={`${sys.name}-${ver}`} className="border-b border-[#f0f0f0] hover:bg-[#f8faff]">
                          <td className="py-3 pr-4 text-[#0f172a]">{idx === 0 ? "Unix/Linux" : ""}</td>
                          <td className="py-3 pr-4 text-[#0f172a]">{sys.name}</td>
                          <td className="py-3 pr-4 text-[#0f172a]">{ver}</td>
                          <td className="py-3 pr-4 text-[#0f172a]">Included</td>
                          <td className="py-3 text-[#0f172a]">{sys.name.includes("Windows") ? "$6.75/mo" : "Included"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
