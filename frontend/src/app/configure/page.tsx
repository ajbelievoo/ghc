"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import {
  Server,
  Cpu,
  HardDrive,
  Wifi,
  ChevronRight,
  Loader2,
  Shield,
  Globe,
  Database,
  Lock,
  ArrowLeft,
} from "lucide-react";

const regionLocations = {
  Europe: ["Germany - Limburg", "France - Gravelines", "France - Strasbourg", "United Kingdom - Erith", "Poland - Warsaw", "Italy - Milan", "France - Roubaix", "Czech republic - Prague", "Spain - Madrid", "Netherlands - Amsterdam", "Belgium - Brussels", "France - Marseille", "Austria - Vienna", "Switzerland - Zurich"],
  "North America": ["Canada East - Beauharnois"],
  "Asia/Oceania": ["Singapore - Singapore", "Australia - Sydney", "India - Mumbai"],
};

const dcMeta: Record<string, { name: string; region: keyof typeof regionLocations }> = {
  GRA: { name: "France - Gravelines", region: "Europe" },
  SBG: { name: "France - Strasbourg", region: "Europe" },
  RBX: { name: "France - Roubaix", region: "Europe" },
  BHS: { name: "Canada East - Beauharnois", region: "North America" },
  WAW: { name: "Poland - Warsaw", region: "Europe" },
  DE: { name: "Germany - Limburg", region: "Europe" },
  ERI: { name: "United Kingdom - Erith", region: "Europe" },
  MIL: { name: "Italy - Milan", region: "Europe" },
  PRG: { name: "Czech republic - Prague", region: "Europe" },
  MAD: { name: "Spain - Madrid", region: "Europe" },
  AMS: { name: "Netherlands - Amsterdam", region: "Europe" },
  BRU: { name: "Belgium - Brussels", region: "Europe" },
  MRS: { name: "France - Marseille", region: "Europe" },
  VIE: { name: "Austria - Vienna", region: "Europe" },
  ZRH: { name: "Switzerland - Zurich", region: "Europe" },
  SGP: { name: "Singapore - Singapore", region: "Asia/Oceania" },
  SYD: { name: "Australia - Sydney", region: "Asia/Oceania" },
  BOM: { name: "India - Mumbai", region: "Asia/Oceania" },
  UK: { name: "United Kingdom - London", region: "Europe" },
  "EU-SOUTH-MIL": { name: "Italy - Milan", region: "Europe" },
  "EU-WEST-RBX": { name: "France - Roubaix", region: "Europe" },
  "EU-CENTRAL-LZ-PRG": { name: "Czech Republic - Prague", region: "Europe" },
  "EU-SOUTH-LZ-MAD": { name: "Spain - Madrid", region: "Europe" },
  "EU-WEST-LZ-AMS": { name: "Netherlands - Amsterdam", region: "Europe" },
  "EU-WEST-LZ-BRU": { name: "Belgium - Brussels", region: "Europe" },
  "EU-WEST-LZ-MRS": { name: "France - Marseille", region: "Europe" },
  "EU-WEST-LZ-VIE": { name: "Austria - Vienna", region: "Europe" },
  "EU-WEST-LZ-ZRH": { name: "Switzerland - Zurich", region: "Europe" },
  YNM: { name: "Canada - Beauharnois", region: "North America" },
  CANADA: { name: "Canada - Beauharnois", region: "North America" },
  bhs1: { name: "Canada - Beauharnois (bhs1)", region: "North America" },
  gra1: { name: "France - Gravelines (gra1)", region: "Europe" },
  gra3: { name: "France - Gravelines (gra3)", region: "Europe" },
  // Dedicated-server DC codes are lowercase; 'ynm' here is Mumbai (NOT the
  // uppercase VPS 'YNM' alias for Beauharnois above).
  fra: { name: "Germany - Frankfurt", region: "Europe" },
  gra: { name: "France - Gravelines", region: "Europe" },
  rbx: { name: "France - Roubaix", region: "Europe" },
  sbg: { name: "France - Strasbourg", region: "Europe" },
  lon: { name: "United Kingdom - London", region: "Europe" },
  eri: { name: "United Kingdom - Erith", region: "Europe" },
  waw: { name: "Poland - Warsaw", region: "Europe" },
  "eu-west-par-a": { name: "France - Paris (zone A)", region: "Europe" },
  "eu-west-par-b": { name: "France - Paris (zone B)", region: "Europe" },
  "eu-west-par-c": { name: "France - Paris (zone C)", region: "Europe" },
  bhs: { name: "Canada - Beauharnois", region: "North America" },
  "ca-east-tor-a": { name: "Canada - Toronto", region: "North America" },
  vin: { name: "US East - Vint Hill", region: "North America" },
  hil: { name: "US West - Hillsboro", region: "North America" },
  sgp: { name: "Singapore - Singapore", region: "Asia/Oceania" },
  syd: { name: "Australia - Sydney", region: "Asia/Oceania" },
  ynm: { name: "India - Mumbai", region: "Asia/Oceania" },
  bom: { name: "India - Mumbai", region: "Asia/Oceania" },
};

function getDcName(code: string) {
  return dcMeta[code]?.name || code;
}
function getDcRegion(code: string): keyof typeof regionLocations {
  return dcMeta[code]?.region || "Europe";
}

// Typical round-trip latency from Indian networks — helps pick a datacenter.
const dcLatency: Record<string, { ms: string; good: boolean }> = {
  "India - Mumbai": { ms: "~10 ms", good: true },
  "Singapore - Singapore": { ms: "~60 ms", good: true },
  "Australia - Sydney": { ms: "~120 ms", good: false },
  "Canada East - Beauharnois": { ms: "~250 ms", good: false },
};
function getDcLatency(code: string) {
  const name = getDcName(code);
  if (dcLatency[name]) return dcLatency[name];
  return getDcRegion(code) === "Europe" ? { ms: "~140 ms", good: false } : { ms: "~250 ms", good: false };
}

// OVH dedicated availability is expressed as a delivery delay ("1H-low",
// "72H", "480H"…). Convert to the same label OVH's configurator shows.
function deliveryLabel(hours?: number | null) {
  if (hours == null) return "Out of stock";
  if (hours <= 1) return "Delivery in ~1 hour";
  if (hours < 24) return `Delivery in ~${hours} hours`;
  const days = Math.round(hours / 24);
  return `Delivery in ${days} day${days > 1 ? "s" : ""}`;
}

const imageFamilies = [
  { name: "Ubuntu", versions: ["26.04", "24.04", "22.04", "20.04"] },
  { name: "Debian", versions: ["13", "12", "11"] },
  { name: "Fedora", versions: ["44"] },
  { name: "AlmaLinux", versions: ["10", "9"] },
  { name: "Rocky Linux", versions: ["10", "9"] },
  { name: "CloudLinux", versions: ["9"] },
  { name: "FreeBSD", versions: ["15-ufs"] },
  { name: "Windows Server", versions: ["2025"], price: 6.75 },
];

const appImages = [
  { name: "Plesk", base: "Debian", versions: ["Web Admin", "Web Pro", "Web Host"], subVersions: ["Debian 12"], price: 11.85 },
  { name: "cPanel", base: "AlmaLinux", versions: ["1 account", "5 accounts", "30 accounts", "100 accounts", "250 accounts"], subVersions: ["cPanel (AlmaLinux 9)"], price: 15.75 },
  { name: "Docker", base: "Debian", versions: ["Debian 12"], subVersions: [], price: 0 },
  { name: "n8n", base: "Debian", versions: ["Debian 12"], subVersions: [], price: 0 },
];

function getFlag(location: string) {
  const flags: Record<string, string> = {
    "Germany": "🇩🇪", "France": "🇫🇷", "United Kingdom": "🇬🇧", "UK": "🇬🇧", "Poland": "🇵🇱",
    "Italy": "🇮🇹", "Czech republic": "🇨🇿", "Czech": "🇨🇿", "Spain": "🇪🇸", "Netherlands": "🇳🇱",
    "Belgium": "🇧🇪", "Austria": "🇦🇹", "Switzerland": "🇨🇭", "Canada": "🇨🇦", "Singapore": "🇸🇬",
    "Australia": "🇦🇺", "India": "🇮🇳",
  };
  for (const key of Object.keys(flags)) {
    if (location.toLowerCase().includes(key.toLowerCase())) return flags[key];
  }
  return "🏳️";
}

function fmtCurrency(v?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  if (typeof v !== "number") return `${sym}0.00`;
  return `${sym}${v.toFixed(2)}`;
}

function ConfigurePageContent() {
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const params = useSearchParams();
  const category = params.get("category") || "VPS";
  const planCode = params.get("plan") || "";
  const subCategory = params.get("subCategory") || "";
  const brand = params.get("brand") || "";

  const subCategoryApps: Record<string, { name: string; icon: string; description: string }> = {
    "plesk": { name: "Plesk Obsidian", icon: "🎛️", description: "Plesk control panel pre-installed. Manage websites, domains, and emails easily." },
    "n8n": { name: "n8n Automation", icon: "⚡", description: "n8n workflow automation pre-installed. Connect 400+ integrations." },
    "cpanel": { name: "cPanel & WHM", icon: "🌐", description: "cPanel & WHM pre-installed. Manage multiple websites with ease." },
    "wordpress": { name: "WordPress", icon: "📝", description: "WordPress pre-installed. Ready to launch your website." },
  };

  const [plans, setPlans] = useState<any[]>([]);
  const [gateways, setGateways] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [durationLabel, setDurationLabel] = useState("1_month");
  const [datacenter, setDatacenter] = useState("");
  const [image, setImage] = useState("ubuntu22.04");
  const [imageVersion, setImageVersion] = useState("26.04");
  const [quantity, setQuantity] = useState(1);
  const [region, setRegion] = useState<keyof typeof regionLocations>("Asia/Oceania");
  const [showUnavailable, setShowUnavailable] = useState(true); // default ON — unavailable DCs stay visible as pre-book cards
  const [manualPayment, setManualPayment] = useState<{ id: string; amount: number; currency: string; instructions: string } | null>(null);
  const [gateway, setGateway] = useState("");
  const [backup, setBackup] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [storage, setStorage] = useState(false);
  const [storageOpt, setStorageOpt] = useState("");
  const [licenseSel, setLicenseSel] = useState("");
  const [dedHw, setDedHw] = useState<Record<string, string>>({});
  const [dedLic, setDedLic] = useState<string[]>([]);
  const [dedBwTraffic, setDedBwTraffic] = useState<Record<number, string>>({});
  const [providerConfig, setOvhConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [imageTab, setImageTab] = useState<"dist" | "app">("dist");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [draftBanner, setDraftBanner] = useState<any>(null);
  const draftRef = useRef<any>(null);

  // ---- saved configurations: one draft per plan (configure → abandon → resume) ----
  const DRAFT_PREFIX = "ghc-cart-draft:";
  const DRAFT_INDEX = "ghc-cart-drafts";
  const draftKeyFor = (code: string) => `${DRAFT_PREFIX}${code}`;
  const readDraftFor = (code: string) => { try { return JSON.parse(localStorage.getItem(draftKeyFor(code)) || "null"); } catch { return null; } };
  const readDraftIndex = (): string[] => { try { return JSON.parse(localStorage.getItem(DRAFT_INDEX) || "[]"); } catch { return []; } };
  const writeDraftIndex = (codes: string[]) => { try { localStorage.setItem(DRAFT_INDEX, JSON.stringify(codes)); } catch {} };
  const freshEnough = (d: any) => d && (!d.savedAt || Date.now() - d.savedAt <= 30 * 864e5);

  useEffect(() => {
    // migrate legacy single-slot draft once
    try {
      const legacy = JSON.parse(localStorage.getItem("ghc-cart-draft") || "null");
      if (legacy?.planCode) {
        localStorage.setItem(draftKeyFor(legacy.planCode), JSON.stringify(legacy));
        writeDraftIndex(Array.from(new Set([legacy.planCode, ...readDraftIndex()])));
      }
      localStorage.removeItem("ghc-cart-draft");
    } catch {}
    const d = readDraftFor(planCode);
    if (d?.planCode && freshEnough(d)) {
      // same plan — restore selections silently
      draftRef.current = d;
      if (d.durationLabel) setDurationLabel(d.durationLabel);
      if (d.datacenter) setDatacenter(d.datacenter);
      if (d.image) setImage(d.image);
      if (d.imageVersion) setImageVersion(d.imageVersion);
      if (d.imageTab) setImageTab(d.imageTab);
      if (d.region) setRegion(d.region);
      if (d.gateway) setGateway(d.gateway);
      if (d.quantity) setQuantity(d.quantity);
      if (typeof d.backup === "boolean") setBackup(d.backup);
      if (typeof d.snapshot === "boolean") setSnapshot(d.snapshot);
      if (typeof d.storage === "boolean") setStorage(d.storage);
      if (d.selectedApp) setSelectedApp(d.selectedApp);
      if (d.couponCode) setCouponCode(d.couponCode);
    } else {
      // another plan has a saved config — offer resume (most recent first)
      const others = readDraftIndex()
        .map((code) => readDraftFor(code))
        .filter((x) => x?.planCode && x.planCode !== planCode && freshEnough(x))
        .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      if (others[0]) setDraftBanner(others[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // save draft whenever selection changes (after first paint)
  useEffect(() => {
    if (loading || !planCode) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKeyFor(planCode), JSON.stringify({
          planCode, category, subCategory, brand, durationLabel, datacenter, image, imageVersion, imageTab,
          region, gateway, quantity, backup, snapshot, storage, selectedApp, couponCode, savedAt: Date.now(),
        }));
        const idx = readDraftIndex();
        if (!idx.includes(planCode)) writeDraftIndex([...idx, planCode]);
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [planCode, category, subCategory, durationLabel, datacenter, image, imageVersion, imageTab, region, gateway, quantity, backup, snapshot, storage, selectedApp, couponCode, loading]);
  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKeyFor(planCode));
      writeDraftIndex(readDraftIndex().filter((c) => c !== planCode));
    } catch {}
  };

  useEffect(() => {
    let alive = true;
    const load = () => {
      setLoading(true);
      Promise.all([
        brand === "metal"
          ? (category === "DEDICATED" ? api.server.metalDedicatedPlans() : api.server.metalVpsPlans())
          : api.server.plans(category),
        api.server.gateways(),
        localStorage.getItem("token") ? api.auth.me().catch(() => null) : Promise.resolve(null),
      ])
        .then(([p, g, me]: any[]) => {
          if (!alive) return;
          setPlans(p || []);
          const active = (g || []).filter((x: any) => x.isActive).map((x: any) => x.name);
          setGateways(active);
          if (active[0]) setGateway(active[0]);
          if (me?.user) setUser(me.user);
        })
        .finally(() => alive && setLoading(false));
    };
    load();
    const onCurrency = () => { if (alive) load(); };
    window.addEventListener("currencychange", onCurrency);
    return () => { alive = false; window.removeEventListener("currencychange", onCurrency); };
  }, [category, currency, brand]);

  const basePlan = useMemo(() => plans.find((p: any) => p.planCode === planCode) || (!planCode ? plans[0] : undefined), [plans, planCode]);
  const selectedVariantCode = providerConfig?.dcVariants?.[datacenter]?.planCode;
  const plan = plans.find((p: any) => p.planCode === selectedVariantCode) || basePlan;
  const planCurrency = plan?.currency || plan?.durations?.[0]?.currency || currency || "USD";
  const durations = (plan?.durations || [])
    .filter((d: any) => d.intervalUnit === "month")
    .sort((a: any, b: any) => a.interval - b.interval)
    .map((d: any) => ({ durationLabel: d.durationLabel, finalPrice: d.finalPrice, monthlyPrice: d.monthlyPrice, originalPrice: d.rawPrice || d.finalPrice }));
  const selectedDuration = durations.find((d: any) => d.durationLabel === durationLabel) || durations[0] || { durationLabel: "1_month", finalPrice: 0, originalPrice: 0 };
  const isDed = (plan?.category || category) === "DEDICATED";
  // Real paid add-ons from the OVH catalog (plan_configuration.options) —
  // monthly sell prices already carry this channel's margin. For dedicated,
  // the selected DC's regional variant supplies the option set (APAC sibling
  // plans can offer different RAM/disk upgrades than the base plan).
  const dcVariants: Record<string, any> = providerConfig?.dcVariants || {};
  const cfgOptions: any[] = (isDed && dcVariants[datacenter]?.options) || providerConfig?.options || [];
  const optFamily = (f: string) => cfgOptions.find((o: any) => o.family === f);
  const snapshotOpt = optFamily("snapshot")?.choices?.[0];
  const premiumBackupOpt = (optFamily("automatedBackup")?.choices || []).find((c: any) => /-7-|premium/i.test(c.code)) || optFamily("automatedBackup")?.choices?.slice(-1)[0];
  const diskOpts = optFamily("additionalDisk")?.choices || [];
  const durationMonths = Math.max(1, parseInt(selectedDuration?.durationLabel) || 1);
  // cPanel/Plesk app images require a license add-on at OVH — auto-include it.
  const appLicenseFamily = imageTab === "app" && /cpanel|plesk/i.test(selectedApp || "") ? (selectedApp.match(/cpanel/i) ? "cpanel" : "plesk") : null;
  const licenseOpts = appLicenseFamily ? (optFamily(appLicenseFamily)?.choices || []) : [];
  const licenseOpt = licenseOpts.find((c: any) => c.code === licenseSel) || licenseOpts[0];
  const optionsMonthly =
    (snapshot && snapshotOpt ? snapshotOpt.monthlyPrice : 0) +
    (backup && premiumBackupOpt ? premiumBackupOpt.monthlyPrice : 0) +
    (storage && storageOpt ? (diskOpts.find((d: any) => d.code === storageOpt)?.monthlyPrice || 0) : 0) +
    (licenseOpt?.monthlyPrice || 0);
  const optionsTotal = parseFloat((optionsMonthly * durationMonths * quantity).toFixed(2));
  // Dedicated: OVH sells APAC locations as sibling planCodes (-mum/-sgp/-syd)
  // with their own price. dcVariants[dc] = {planCode, prices:{label: monthly}}
  // — selecting such a DC swaps the order to that planCode and reprices it.
  const dcMonthlyPrice = (dc: string) => dcVariants[dc]?.prices?.[selectedDuration?.durationLabel] ?? selectedDuration?.monthlyPrice;
  const effectivePlanCode = (datacenter && dcVariants[datacenter]?.planCode) || plan?.planCode;
  const planPeriodTotal = dcVariants[datacenter]?.totals?.[selectedDuration.durationLabel] ?? selectedDuration.finalPrice ?? 0;
  const setupPrice = dcVariants[datacenter]?.setupPrices?.[selectedDuration.durationLabel] || 0;
  const dedicatedSpec = dcVariants[datacenter]?.spec || plan?.spec || {};
  // Dedicated hardware upgrades (OVH parity): every addonFamily with >1 choice
  // is selectable — memory/storage/bandwidth/vrack. RAM+storage also drive the
  // live per-combo stock check, so an upgrade can change DC availability.
  const dedHwFamOrder = ["memory", "storage", "bandwidth", "vrack", "system-storage"];
  const dedHwFams = (isDed ? cfgOptions.filter((o: any) => !/license/i.test(o.family || "")) : [])
    .sort((a: any, b: any) => dedHwFamOrder.indexOf(a.family) - dedHwFamOrder.indexOf(b.family));
  const dedLicFams = isDed ? cfgOptions.filter((o: any) => /license/i.test(o.family || "")) : [];
  const dedSelCode = (fam: string) => {
    const f = dedHwFams.find((o: any) => o.family === fam);
    if (!f) return "";
    const code = dedHw[fam];
    return f.choices?.some((c: any) => c.code === code) ? code : (f.includedCode || f.choices?.[0]?.code || "");
  };
  const dedSelKey = (fam: string) => {
    const f = dedHwFams.find((o: any) => o.family === fam);
    return f?.choices?.find((x: any) => x.code === dedSelCode(fam))?.stockKey || "";
  };
  const dedPricingMode = dcVariants[datacenter]?.pricingModes?.[selectedDuration.durationLabel] || "default";
  const dedChoiceTotal = (c: any) => (!c || c.included ? 0 :
    (dedPricingMode !== "default" && c.modes?.[dedPricingMode] != null ? c.modes[dedPricingMode] : (c.monthlyPrice || 0) * durationMonths));
  const dedHwRows = dedHwFams.map((f: any) => {
    const c = f.choices?.find((x: any) => x.code === dedSelCode(f.family));
    return { family: f.family, label: c?.label || "", code: c?.code || "", monthly: c?.monthlyPrice || 0, included: !!c?.included, total: dedChoiceTotal(c) };
  });
  const dedLicRows = dedLicFams.flatMap((f: any) =>
    (f.choices || []).filter((c: any) => dedLic.includes(c.code)).map((c: any) => ({ family: f.family, label: c.label, code: c.code, monthly: c.monthlyPrice || 0, included: !!c.included, total: dedChoiceTotal(c) })));
  // OVH-style helpers: bandwidth codes are speed+traffic combos
  // (traffic-25tb-1000 / traffic-unlimited-2000 / bandwidth-3000) — group them
  // into one card per speed with an inner traffic dropdown; licenses group
  // into product checkboxes (Windows Server / SQL Server / Plesk / cPanel)
  // each with an edition dropdown.
  const bwParse = (code: string, label: string) => {
    const tm = String(code).match(/traffic-(unlimited|\d+tb)-(\d+)/i);
    if (tm) {
      const mbps = parseInt(tm[2]);
      const unl = tm[1].toLowerCase() === "unlimited";
      return { speed: mbps >= 1000 ? `${mbps / 1000} Gbit/s` : `${mbps} Mbit/s`, speedMbps: mbps, traffic: unl ? "unmetered" : `${parseInt(tm[1])} TB`, trafficRank: unl ? 1e9 : parseInt(tm[1]) };
    }
    const bm = String(code).match(/bandwidth-(\d+)/i);
    if (bm) {
      const mbps = parseInt(bm[1]);
      return { speed: mbps >= 1000 ? `${mbps / 1000} Gbit/s` : `${mbps} Mbit/s`, speedMbps: mbps, traffic: "unmetered", trafficRank: 1e9 };
    }
    return { speed: label || code, speedMbps: 0, traffic: label || code, trafficRank: 0 };
  };
  const dedBwGroups = (f: any) => {
    const g: Record<number, any> = {};
    for (const c of f.choices || []) {
      const p = bwParse(c.code, c.label);
      (g[p.speedMbps] ||= { speed: p.speed, mbps: p.speedMbps, items: [] }).items.push({ ...c, ...p });
    }
    const arr = Object.values(g).sort((a: any, b: any) => a.mbps - b.mbps);
    arr.forEach((gr: any) => gr.items.sort((a: any, b: any) => a.trafficRank - b.trafficRank || a.monthlyPrice - b.monthlyPrice));
    return arr;
  };
  const dedBwCodeFor = (g: any) => (dedBwTraffic[g.mbps] && g.items.some((i: any) => i.code === dedBwTraffic[g.mbps])) ? dedBwTraffic[g.mbps] : g.items[0]?.code;
  const licProduct = (code: string, label: string) => {
    if (/^windows-server/i.test(code)) return "Windows Server";
    if (/^sql-server|^mssql/i.test(code)) return "SQL Server";
    if (/^plesk/i.test(code)) return "Plesk";
    if (/^cpanel/i.test(code)) return "cPanel";
    if (/backup/i.test(code)) return "Backup Agent";
    return String(label || code).split(" ")[0] || code;
  };
  const dedLicGroups = dedLicFams.map((f: any) => {
    const groups: Record<string, any[]> = {};
    for (const c of f.choices || []) {
      const p = licProduct(c.code, c.label);
      const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const optLabel = String(c.label || "").replace(new RegExp(`^${esc}\\s*-\\s*|^${esc}\\s*`, "i"), "") || c.label;
      (groups[p] ||= []).push({ ...c, optLabel });
    }
    return { family: f.family, groups: Object.entries(groups) };
  });
  const dedLicSet = (product: string, code: string | null) => {
    setDedLic((cur) => {
      const others = cur.filter((x) => licProduct(x, "") !== product);
      return code ? [...others, code] : others;
    });
  };
  const dedOptionsTotal = dedHwRows.reduce((t: number, r: any) => t + r.total, 0) + dedLicRows.reduce((t: number, r: any) => t + r.total, 0);
  const subtotal = parseFloat(((planPeriodTotal + setupPrice) * quantity + optionsTotal + dedOptionsTotal).toFixed(2));
  const discount = couponResult ? parseFloat((couponResult.discount || 0).toFixed(2)) : 0;
  const requiredConfigs = providerConfig?.requiredConfiguration || providerConfig?.configurations || [];
  const findConfigValues = (names: string[]) => {
    const entry = requiredConfigs.find((cfg: any) =>
      names.some((name) => `${cfg.name || cfg.label || cfg.type || cfg.key || ""}`.toLowerCase().includes(name))
    );
    const rawValues = entry?.values || entry?.allowedValues || entry?.enum || entry?.choices || [];
    return Array.isArray(rawValues) ? rawValues.map((v: any) => typeof v === "string" ? v : v.value || v.name || v.label).filter(Boolean) : [];
  };
  // Prefer the fine-grained *_datacenter config (real DC codes: GRA, SGP, SYD…)
  // over the coarse "region" config (canada/europe) — OVH lists actual DCs.
  const dcConfigEntry =
    requiredConfigs.find((cfg: any) =>
      ["datacenter", "location", "zone", "district"].some((n) =>
        `${cfg.name || cfg.label || cfg.type || cfg.key || ""}`.toLowerCase().includes(n))
    ) ||
    requiredConfigs.find((cfg: any) =>
      ["region", "country"].some((n) =>
        `${cfg.name || cfg.label || cfg.type || cfg.key || ""}`.toLowerCase().includes(n))
    );
  // Live stock: backend attaches availability + availableValues (Linux in-stock DCs)
  // + availableWindowsValues when the OVH order-rule probe succeeds. OVH stocks
  // Linux and Windows separately — e.g. VPS-2 Europe is Windows-only right now —
  // so filter by the selected image's OS family, exactly like OVH's configurator.
  const isWindowsImage = /windows/i.test(image || "") || /windows/i.test(selectedApp || "");
  const dcStockKnown = !!dcConfigEntry?.availability;
  const stockValues: any[] = dcStockKnown
    ? (isWindowsImage ? (dcConfigEntry?.availableWindowsValues || []) : (dcConfigEntry?.availableValues || []))
    : [];
  const dcAllOutOfStock = dcStockKnown && !stockValues.length;
  const dcRawValues = (dcStockKnown
    ? stockValues
    : dcConfigEntry?.values || dcConfigEntry?.allowedValues || dcConfigEntry?.enum || dcConfigEntry?.choices || []) as any[];
  const providerDatacenters: string[] = Array.isArray(dcRawValues)
    ? dcRawValues.map((v: any) => (typeof v === "string" ? v : v.value || v.name || v.label)).filter(Boolean)
    : [];
  const providerImages = (isDed && dcVariants[datacenter]?.osValues) || findConfigValues(["image", "os", "template", "distribution"]);
  // Group catalog OS values OVH-style: distro family cards each holding a
  // version dropdown (Ubuntu → 26.04/24.04/22.04), and app cards grouped by
  // application ("Debian 12 - Docker" → Docker, "AlmaLinux 8 - cPanel" → cPanel).
  const KNOWN_IMG_APPS = ["cpanel", "plesk", "docker", "n8n", "wordpress", "prestashop", "cyberpanel", "virtualmin", "directadmin", "webmin", "hestia", "cloudpanel", "litespeed", "gitlab", "nextcloud", "moodle", "magento", "drupal", "joomla", "ghost", "discourse", "openvpn", "wireguard", "woocommerce", "nodejs", "node.js"];
  type ImgCard = { family: string; options: { label: string; value: string }[] };
  const imageCards = (() => {
    const dist: Record<string, ImgCard> = {};
    const app: Record<string, ImgCard> = {};
    for (const v of providerImages) {
      const s = String(v);
      if (s === "none_64.en") {
        dist["No preinstalled OS"] = { family: "No preinstalled OS", options: [{ label: "Install your OS after delivery", value: s }] };
        continue;
      }
      const appM = s.match(/^(.*?)\s*-\s*(.+)$/);
      if (appM && KNOWN_IMG_APPS.includes(appM[2].trim().toLowerCase())) {
        const fam = appM[2].trim();
        (app[fam] ||= { family: fam, options: [] }).options.push({ label: appM[1].trim(), value: s });
        continue;
      }
      const dm = s.match(/^([A-Za-z][A-Za-z .]*?)[\s-]+(\d[\d.\w-]*.*)$/);
      const fam = dm ? dm[1].trim() : s;
      const ver = dm ? dm[2].replace(/\s*-\s*UEFI$/i, " (UEFI)").trim() : "";
      (dist[fam] ||= { family: fam, options: [] }).options.push({ label: ver || s, value: s });
    }
    const orderDist = ["Ubuntu", "Debian", "Fedora", "AlmaLinux", "Rocky Linux", "CloudLinux", "FreeBSD", "Windows Server", "Windows", "CentOS", "openSUSE", "Arch Linux", "Gentoo", "Alpine", "Oracle Linux"];
    const sortOpts = (c: ImgCard): ImgCard => ({ ...c, options: [...c.options].sort((a, b) => b.label.localeCompare(a.label, undefined, { numeric: true })) });
    const distCards = Object.values(dist).map(sortOpts).sort((a, b) => {
      const ia = orderDist.indexOf(a.family), ib = orderDist.indexOf(b.family);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.family.localeCompare(b.family);
    });
    const appCards = Object.values(app).map(sortOpts).sort((a, b) => a.family.localeCompare(b.family));
    return { distCards, appCards };
  })();
  const shownImageCards = imageTab === "app" ? imageCards.appCards : imageCards.distCards;
  const durationTitle = (l: string) => l === "1_month" ? "No commitment" : `${parseInt(l)} months`;
  const durationText = durationLabel === "1_month" ? "1 month" : `${parseInt(durationLabel)} months`;
  const monthlyBase = durations.find((d: any) => d.durationLabel === "1_month")?.monthlyPrice || 0;
  const savePct = (d: any) => (monthlyBase && d.monthlyPrice && d.monthlyPrice < monthlyBase)
    ? Math.round((1 - d.monthlyPrice / monthlyBase) * 100) : 0;
  const commitmentDiscount = savePct(selectedDuration) > 0 ? `Save ${savePct(selectedDuration)}% per month` : "";
  // Show all provider locations; fallback to raw code if no friendly meta exists.
  // Collapse duplicate codes that resolve to the same city (BHS & YNM are both Beauharnois).
  const seenDcCities = new Set<string>();
  const displayedLocations = providerDatacenters.filter((dc: string) => {
    const city = (getDcName(dc).split(" - ").pop() || dc).toLowerCase();
    if (seenDcCities.has(city)) return false;
    seenDcCities.add(city);
    return true;
  });
  // Full DC universe for grayed-out cards (toggle ON): catalog values ∪ live
  // rule-endpoint DCs (auto-includes new OVH locations) ∪ backend extras (BOM).
  const dcCityKey = (dc: string) => (getDcName(dc).split(" - ").pop() || dc).toLowerCase();
  const allCatalogRaw = (
    dcConfigEntry?.allDatacenters ||
    [...(dcConfigEntry?.values || []), ...Object.keys(dcConfigEntry?.availability || {})] ||
    dcConfigEntry?.allowedValues || dcConfigEntry?.enum || dcConfigEntry?.choices || []
  ) as any[];
  const seenAllDcCities = new Set<string>();
  const allCatalogLocations = (Array.isArray(allCatalogRaw) ? allCatalogRaw : [])
    .map((v: any) => (typeof v === "string" ? v : v.value || v.name || v.label))
    .filter(Boolean)
    .filter((dc: string) => {
      if (seenAllDcCities.has(dcCityKey(dc))) return false;
      seenAllDcCities.add(dcCityKey(dc));
      return true;
    });
  // Dedicated: the in-stock list depends on the selected RAM+storage combo —
  // dcVariants[dc].stock["ram-..|softraid-.."] is this DC's regional plan
  // checked against the exact hardware being ordered.
  const dedStockFor = (dc: string) => {
    const m = dedSelKey("memory"), s = dedSelKey("storage");
    return ((m && s) ? dcVariants[dc]?.stock?.[`${m}|${s}`] : undefined)
      || dcConfigEntry?.availability?.[dc] || null;
  };
  const activeLocations = isDed && Object.keys(dcVariants).length
    ? allCatalogLocations.filter((dc) => dedStockFor(dc)?.status === "available")
    : displayedLocations;
  // Tabs always come from the full DC universe so every region stays clickable.
  // Card list per region: available DCs normally; unavailable grayed when the
  // toggle is ON — or whenever the region has zero in-stock DCs anyway.
  const tabSourceLocations = allCatalogLocations.length ? allCatalogLocations : activeLocations;
  const regionHasAvail = (r: string) => activeLocations.some((dc) => getDcRegion(dc) === r);
  const cardsForRegion = (r: string) =>
    (showUnavailable ? allCatalogLocations : activeLocations).filter(
      (dc) => getDcRegion(dc) === r
    );
  // Sibling plans actually orderable right now (per selected OS family) —
  // shown on every plan's configure page as quick-switch chips.
  const siblingStock = providerConfig?.siblingsAvailability || {};
  const stockKeyForOs = isWindowsImage ? "windows" : "linux";
  const inStockSiblingPlans = (plans || []).filter(
    (p: any) => p.planCode && p.planCode !== plan?.planCode && siblingStock[p.planCode]?.[stockKeyForOs]
  );
  // Pre-booking (stock waitlist): out-of-stock DCs become payable reservations.
  // preorderSelected = the chosen DC exists in the DC universe but isn't in the
  // live in-stock list for the selected OS family.
  const preorderCfg = providerConfig?.preorder;
  const preorderEnabled = !!preorderCfg?.enabled && dcStockKnown;
  const canPrebookDc = (dc: string) => preorderEnabled && (!isDed || dedStockFor(dc)?.status === "unavailable");
  const preorderSelected = !!(
    datacenter && canPrebookDc(datacenter) && !activeLocations.includes(datacenter)
  );
  const canOrder = !configLoading && providerConfig?.available && (!isDed || (
    !!dcVariants[datacenter]?.totals?.[selectedDuration.durationLabel] &&
    (activeLocations.includes(datacenter) || preorderSelected) &&
    providerImages.includes(imageTab === "app" ? selectedApp : image)
  ));
  // Same math as backend: flat fee is stored in INR, % applies to the
  // discounted plan price, and the fee is taxed like any other charge.
  const preorderFee = preorderSelected
    ? preorderCfg?.feeType === "flat"
      ? Number(preorderCfg?.displayFeeValue ?? preorderCfg?.feeValue ?? 0)
      : parseFloat(((planPeriodTotal * (Number(preorderCfg?.feeValue || 0) / 100)) || 0).toFixed(2))
    : 0;
  const preorderFeeDisplay = fmtCurrency(preorderFee, planCurrency);
  const taxable = Math.max(0, subtotal - discount) + (preorderFee || 0);
  const taxRate = 0.18;
  const tax = parseFloat((taxable * taxRate).toFixed(2));
  const total = parseFloat((taxable + tax).toFixed(2));

  useEffect(() => {
    setCouponResult(null);
    if (isDed) setQuantity(1);
  }, [effectivePlanCode, durationLabel, currency, isDed]);

  useEffect(() => {
    if (durations[0] && !durations.find((d: any) => d.durationLabel === durationLabel)) {
      setDurationLabel(durations[0].durationLabel);
    }
  }, [durations, durationLabel]);

  useEffect(() => {
    if (!basePlan?.planCode) return;
    let alive = true;
    setConfigLoading(true);
    setOvhConfig(null);
    api.server.planConfiguration({ planCode: basePlan.planCode, category: basePlan.category || category, brand })
      .then((data: any) => {
        if (!alive) return;
        setOvhConfig(data);
        setDatacenter(draftRef.current?.datacenter || "");
        draftRef.current = null;
      })
      .catch((e: any) => {
        if (!alive) return;
        setOvhConfig({ available: false, reason: e.message, requiredConfiguration: [], options: [] });
      })
      .finally(() => alive && setConfigLoading(false));
    return () => { alive = false; };
  }, [basePlan?.planCode, basePlan?.category, category, brand, currency]);

  // Stable signature — displayedLocations is a fresh array every render, so a
  // raw array dep would refire on EVERY render and undo manual region clicks.
  const displayedSig = activeLocations.join(",");
  useEffect(() => {
    // Only re-evaluate when the available set itself changes (config load / OS
    // switch) — NOT on manual region-tab clicks, otherwise a click on a region
    // with zero available DCs instantly snaps back to the first stocked region.
    if (activeLocations.length > 0) {
      setDatacenter((dc) => dc || activeLocations[0]);
      setRegion((r) =>
        !r || !activeLocations.some((dc) => getDcRegion(dc) === r)
          ? getDcRegion(activeLocations[0])
          : r
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedSig]);

  useEffect(() => {
    // Hardware selections belong to the plan — reset when the product (or its
    // regional variant) changes so stale addon codes can't leak across plans.
    setDedHw({});
    setDedLic([]);
    setDedBwTraffic({});
  }, [effectivePlanCode]);

  useEffect(() => {
    // Default to Ubuntu's newest version (like OVH), else first distro card.
    if (imageCards.distCards.length > 0 && (!image || (isDed && !providerImages.includes(image)))) {
      const ub = imageCards.distCards.find((c) => c.family === "Ubuntu") || imageCards.distCards[0];
      setImage(ub.options[0].value);
    }
    if (imageTab === "app" && imageCards.appCards.length > 0 && !selectedApp) {
      setSelectedApp(imageCards.appCards[0].options[0].value);
    }
  }, [providerImages, image, imageTab, selectedApp]);

  const startPayment = async () => {
    if (!user) {
      localStorage.setItem("pendingCheckout", window.location.pathname + window.location.search);
      window.location.href = "/login";
      return;
    }
    if (!plan || !selectedDuration) { showToast("Plan pricing is not available", "error"); return; }
    if (!canOrder) { showToast("Please select an available location or pre-booking and a valid image", "error"); return; }
    setPaying(true);
    try {
      const osValue = imageTab === "app" ? selectedApp : image;
      const configuration: any = {};
      if (osValue) configuration.os = osValue;
      if (datacenter) configuration.datacenter = datacenter;
      if (brand === "metal") configuration._brand = "metal";
      if (preorderSelected) configuration._preorder = true;
      const selOpts: string[] = [];
      if (snapshot && snapshotOpt) selOpts.push(snapshotOpt.code);
      if (backup && premiumBackupOpt) selOpts.push(premiumBackupOpt.code);
      if (storage && storageOpt) selOpts.push(storageOpt);
      if (licenseOpt) selOpts.push(licenseOpt.code);
      if (isDed) {
        for (const f of dedHwFams) {
          const c = dedSelCode(f.family);
          if (c && c !== f.includedCode) selOpts.push(c);
        }
        selOpts.push(...dedLic);
      }
      if (selOpts.length) configuration._options = selOpts;

      if (!gateway) { showToast("No payment gateway is configured. Please contact support or set up a gateway in admin.", "error"); setPaying(false); return; }

      if (gateway === "wallet") {
        const res = await api.billing.payWithWallet({
          planCode: effectivePlanCode,
          durationLabel: selectedDuration.durationLabel,
          category: plan.category || category,
          configuration,
          couponCode: couponResult?.code,
        });
        if (res.subscription) {
          clearDraft();
          window.location.href = "/dashboard";
        } else {
          showToast(res.message || "Order placed", res.order?.status === "FAILED" ? "error" : "success");
          if (res.order?.status !== "FAILED") { clearDraft(); window.location.href = "/dashboard"; }
        }
        return;
      }

      const res = await api.payments.createCheckoutSession({
        type: "ORDER",
        amount: total,
        gateway,
        planCode: effectivePlanCode,
        durationLabel: selectedDuration.durationLabel,
        category: plan.category || category,
        configuration,
        couponCode: couponResult?.code,
      });
      if (res.checkoutUrl) { clearDraft(); window.location.href = res.checkoutUrl; }
      else if (res.manual) setManualPayment({ id: res.id, amount: res.amount, currency: res.currency, instructions: res.instructions });
      else showToast("Payment gateway did not return checkout URL", "error");
    } catch (e: any) {
      showToast("Payment failed: " + e.message, "error");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#00b7ff]" /></div>;
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-white p-10 text-[#0f172a]">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#00b7ff]"><ArrowLeft className="h-4 w-4" /> Back to plans</Link>
        <div className="mx-auto mt-20 max-w-xl rounded border border-slate-200 p-10 text-center">
          <h1 className="text-2xl font-black">Plan not found</h1>
          <p className="mt-2 text-sm text-slate-500">Please select another plan from the catalog.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center gap-2 px-6 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#00b7ff]">🏠</Link><span className="text-slate-300">›</span>
          <Link
            href={brand === "metal" ? (isDed ? "/metal/dedicated" : "/metal/vps") : (isDed ? "/dedicated-servers" : "/vps")}
            className="hover:text-[#00b7ff]"
          >{brand === "metal" ? (isDed ? "Metal Dedicated" : "Metal VPS") : (isDed ? "Dedicated servers" : "VPS")}</Link><span className="text-slate-300">›</span>
          <span className="text-[#0f172a]">Configurator</span>
        </div>
      </div>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-black"><Server className="h-5 w-5 text-[#00b7ff]" /> GHC</Link>
          <div className="flex items-center gap-5 text-sm font-bold">
            <Link href="/">Plans</Link>
            {user ? <Link href="/dashboard">My customer account</Link> : <Link href="/login">Sign in</Link>}
          </div>
        </div>
      </nav>
      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#00b7ff]">{category} Configurator</p>
          <h1 className="mt-1 text-3xl font-black">
            Configure your {brand === "metal" ? "Metal " : ""}{(plan?.category || category) === "DEDICATED" ? "Dedicated Server" : "Virtual Private Server"}
            {brand === "metal" && <span className="ml-2 rounded-full bg-[#ff3d00] px-2 py-0.5 align-middle text-[10px] font-black uppercase tracking-wide text-white">Metal</span>}
          </h1>

          {draftBanner && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800">
                You have a saved configuration for <b>{draftBanner.planCode}</b>
                {draftBanner.savedAt ? ` (${new Date(draftBanner.savedAt).toLocaleDateString()})` : ""}
              </p>
              <div className="flex shrink-0 items-center gap-3">
                <button
                  onClick={() => {
                    const q = new URLSearchParams({ category: draftBanner.category || "VPS", plan: draftBanner.planCode });
                    if (draftBanner.subCategory) q.set("subCategory", draftBanner.subCategory);
                    if (draftBanner.brand) q.set("brand", draftBanner.brand);
                    window.location.href = `/configure?${q.toString()}`;
                  }}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600"
                >
                  Resume
                </button>
                <button onClick={() => {
                  try {
                    localStorage.removeItem(draftKeyFor(draftBanner.planCode));
                    writeDraftIndex(readDraftIndex().filter((c) => c !== draftBanner.planCode));
                  } catch {}
                  setDraftBanner(null);
                }} className="text-xs text-amber-600 hover:text-amber-800">Discard</button>
              </div>
            </div>
          )}

          {subCategory && subCategoryApps[subCategory] && (
            <div className="mt-4 rounded-lg border border-[#00b7ff] bg-slate-100 p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{subCategoryApps[subCategory].icon}</span>
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">{subCategoryApps[subCategory].name} included</p>
                  <p className="text-xs text-slate-600">{subCategoryApps[subCategory].description}</p>
                </div>
              </div>
            </div>
          )}

          <section className="mt-8">
            <h2 className="mb-1 text-lg font-black">Commitment period</h2>
            <p className="mb-4 max-w-3xl text-xs leading-5 text-slate-600">Choose a commitment duration to get a discount on the monthly price. Your subscription auto-renews for the same duration unless you disable it before expiry from your GHC dashboard.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {durations.map((d: any) => {
                const active = durationLabel === d.durationLabel;
                const save = savePct(d) > 0 ? `Save ${savePct(d)}% per month` : "";
                return (
                  <label key={d.durationLabel} onClick={() => setDurationLabel(d.durationLabel)} className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition ${active ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-[#00b7ff]" : "border-slate-400"}`}>
                      {active && <span className="h-2 w-2 rounded-full bg-[#00b7ff]" />}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-[#0f172a]">{durationTitle(d.durationLabel)}</p>
                      <p className="mt-1 text-sm font-black text-[#0f172a]">{fmtCurrency(d.monthlyPrice, planCurrency)}</p>
                      <p className="text-[10px] text-slate-400">/month</p>
                      {save && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-[#e0006d]"><span className="text-[10px]">🏷️</span>{save}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black">Select the number of {isDed ? "servers" : "VPS"}</h2>
            <div className="flex max-w-xl items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <span className="text-sm font-bold text-[#0f172a]">Number of {isDed ? "servers" : "VPS"}</span>
              <div className="flex items-center rounded border border-slate-200">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-lg text-[#0f172a] hover:bg-[#f8faff]">−</button>
                <span className="w-10 text-center text-sm font-black">{quantity}</span>
                <button disabled={isDed} onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-lg text-[#0f172a] hover:bg-[#f8faff] disabled:opacity-30">+</button>
              </div>
            </div>
            {isDed && <p className="mt-2 text-xs text-slate-500">One dedicated server per order.</p>}
          </section>

          <section className="mt-8">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-black">Select the location of your {isDed ? "server" : "VPS"}</h2>
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-500">
                Show unavailable locations
                <button
                  type="button"
                  role="switch"
                  aria-checked={showUnavailable}
                  onClick={() => setShowUnavailable(!showUnavailable)}
                  className={`relative h-5 w-9 rounded-full transition ${showUnavailable ? "bg-[#00b7ff]" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${showUnavailable ? "left-4.5" : "left-0.5"}`} style={showUnavailable ? { left: "1.125rem" } : { left: "0.125rem" }} />
                </button>
              </label>
            </div>
            <p className="mb-3 text-xs text-slate-600">You can host your {isDed ? "server" : "VPS"} in one of our datacenters in our worldwide network.</p>
            <div className="mb-4 flex gap-1 border-b border-slate-200">
              {(Object.keys(regionLocations) as (keyof typeof regionLocations)[]).filter((r) => tabSourceLocations.some((dc) => getDcRegion(dc) === r)).map((r) => (
                <button key={r} onClick={() => setRegion(r)} className={`px-4 py-2 text-xs font-bold transition ${region === r ? "border-b-2 border-[#00b7ff] text-[#00b7ff]" : "text-slate-500 hover:text-[#0f172a]"}`}>{r}</button>
              ))}
            </div>
            {configLoading ? (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-500">Checking availability...</div>
            ) : !providerConfig?.available ? (
              <div className="rounded border border-cyan-200 bg-cyan-50 p-5">
                <p className="font-black text-[#0f172a]">This plan is temporarily unavailable.</p>
                <p className="mt-1 text-sm text-slate-600">{providerConfig?.reason || "Configuration not available."}</p>
              </div>
            ) : cardsForRegion(region).length > 0 ? (
              <div className="space-y-2">
                {cardsForRegion(region).map((dc: string) => {
                  const name = getDcName(dc);
                  const dcAvail = activeLocations.includes(dc);
                  if (!dcAvail) {
                    // Pre-booking enabled → the card stays selectable and flips
                    // the checkout into "reserve now, activate on restock" mode.
                    if (canPrebookDc(dc)) {
                      const sel = datacenter === dc;
                      return (
                        <label key={dc} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${sel ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 opacity-70 hover:border-amber-300 hover:opacity-100"}`}>
                          <input type="radio" name="dc" checked={sel} onChange={() => setDatacenter(dc)} className="h-4 w-4 accent-amber-500" />
                          <span className="text-lg grayscale">{getFlag(name)}</span>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-600">{name}</p>
                            <p className="text-[10px] text-slate-400">⊘ Out of stock</p>
                          </div>
                          <div className="text-right">
                            {isDed && <p className="mb-1 text-xs font-bold">{fmtCurrency(dcMonthlyPrice(dc), planCurrency)}/month</p>}
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">⏳ Pre-book</span>
                            <p className="mt-0.5 text-[9px] text-slate-400">activates on restock</p>
                          </div>
                        </label>
                      );
                    }
                    return (
                      <div key={dc} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 opacity-60">
                        <input type="radio" name="dc" disabled className="h-4 w-4" />
                        <span className="text-lg grayscale">{getFlag(name)}</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-500">{name}</p>
                          <p className="text-[10px] text-slate-400">{isDed && dcConfigEntry?.availability?.[dc]?.status === "unknown" ? "Stock check temporarily unavailable — retry shortly" : "⊘ Out of stock"}</p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Unavailable</span>
                      </div>
                    );
                  }
                  const sel = datacenter === dc;
                  const dcInfo = (isDed ? dedStockFor(dc) : dcConfigEntry?.availability?.[dc]) || {};
                  return (
                    <label key={dc} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${sel ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                      <input type="radio" name="dc" checked={sel} onChange={() => setDatacenter(dc)} className="h-4 w-4 accent-[#00b7ff]" />
                      <span className="text-lg">{getFlag(name)}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#0f172a]">{name}</p>
                        {isDed ? (
                          <p className="text-[10px] text-green-600">� {deliveryLabel(dcInfo.deliveryHours)}</p>
                        ) : (
                          <p className="text-[10px] text-green-600">�🟢 Available now <span className="text-slate-400">• {getDcLatency(dc).ms} from India</span></p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#0f172a]">{fmtCurrency(dcMonthlyPrice(dc), planCurrency)}</p>
                        <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : dcAllOutOfStock ? (
              <div className="rounded border border-amber-200 bg-amber-50 p-5">
                <p className="font-black text-[#0f172a]">This plan is temporarily out of stock.</p>
                <p className="mt-1 text-sm text-slate-600">All datacenter locations are currently unavailable for this plan. Please check back later or choose a different plan.</p>
              </div>
            ) : (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-600">No datacenter selection required.</div>
            )}
            {dcConfigEntry && !activeLocations.some((dc) => getDcRegion(dc) === region) && (
              <div className="mt-4 rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">{isDed ? "Server" : "VPS"} temporarily unavailable</p>
                    <p className="mt-1 text-xs text-slate-600">No confirmed stock in {region} for this configuration. {preorderEnabled ? "Select a pre-bookable location to join the queue." : "Please check back later."}</p>
                  </div>
                </div>
              </div>
            )}
            {(inStockSiblingPlans.length > 0 || Object.keys(siblingStock).length > 0) && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Plans in stock right now:</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {inStockSiblingPlans.map((p: any) => {
                    const q = new URLSearchParams({ category: category || "VPS", plan: p.planCode, durationLabel });
                    if (brand) q.set("brand", brand);
                    return (
                      <Link key={p.planCode} href={`/configure?${q.toString()}`} className="rounded-full border border-[#00b7ff]/60 bg-white px-3 py-1.5 text-xs font-bold text-[#0f172a] transition hover:border-[#00b7ff] hover:bg-[#00b7ff]/10">
                        {p.displayName || p.invoiceName || p.planCode}
                      </Link>
                    );
                  })}
                  {inStockSiblingPlans.length === 0 && (
                    <span className="text-xs text-slate-500">
                      No other plans in stock for the selected OS right now —{" "}
                      <Link href={brand === "metal" ? "/metal/vps" : "/vps"} className="font-bold text-[#00b7ff] hover:underline">
                        browse all {brand === "metal" ? "Metal " : ""}VPS plans →
                      </Link>
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">ℹ️</span>
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">Other locations?</p>
                  <p className="text-xs text-slate-600">Alternative solution: pick a dedicated server, available now and still at the best price, suited to your needs.</p>
                  <Link href={brand === "metal" ? "/metal/dedicated" : "/dedicated-servers"} className="mt-2 inline-flex items-center gap-1 rounded bg-[#00b7ff] px-4 py-2 text-xs font-bold text-[#0f172a] hover:bg-[#0f0c29] hover:text-white">Browse dedicated servers →</Link>
                </div>
              </div>
            </div>
          </section>

          {isDed && dedHwFams.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-1 text-lg font-black">Configure your server</h2>
              <p className="mb-4 text-xs text-slate-600">Upgrade the included hardware — prices follow the selected location and commitment. Stock is re-checked per configuration.</p>
              {dedHwFams.map((f: any) => {
                const title = { memory: "Memory", storage: "Storage", bandwidth: "Public bandwidth", vrack: "Private bandwidth", "system-storage": "System storage" }[f.family as string] || f.family;
                const selCode = dedSelCode(f.family);
                return (
                  <div key={f.family} className="mb-5">
                    <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-slate-700">{title}</h3>
                    <div className="space-y-2">
                      {f.family === "bandwidth" ? (
                        // OVH parity: one card per speed, inner traffic dropdown
                        dedBwGroups(f).map((g: any) => {
                          const tCode = dedBwCodeFor(g);
                          const tChoice = g.items.find((i: any) => i.code === tCode) || g.items[0];
                          const active = g.items.some((i: any) => i.code === selCode);
                          return (
                            <label key={g.mbps} onClick={() => tCode && setDedHw({ ...dedHw, [f.family]: tCode })} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 transition ${active ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                              <input type="radio" name={`ded-${f.family}`} checked={active} readOnly className="h-4 w-4 accent-[#00b7ff]" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-[#0f172a]">{g.speed}</p>
                                <p className="text-[10px] text-slate-400">Select the traffic associated with your public bandwidth.</p>
                                <select
                                  value={tCode}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => { setDedBwTraffic({ ...dedBwTraffic, [g.mbps]: e.target.value }); setDedHw({ ...dedHw, [f.family]: e.target.value }); }}
                                  className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                                >
                                  {g.items.map((i: any) => <option key={i.code} value={i.code}>{i.traffic}</option>)}
                                </select>
                              </div>
                              <span className={`text-sm font-black ${tChoice?.included ? "text-slate-500" : "text-[#00b7ff]"}`}>{tChoice?.included ? "Included" : `+${fmtCurrency(tChoice?.monthlyPrice || 0, planCurrency)}/mo`}</span>
                            </label>
                          );
                        })
                      ) : f.selectable === false ? (
                        // Single mandatory choice (e.g. 25Gbps vRack) — fixed card
                        <div className="flex items-center gap-3 rounded-lg border-2 border-[#00b7ff] bg-slate-100 p-3.5">
                          <span className="inline-block h-4 w-4 rounded-full border-[5px] border-[#00b7ff] bg-white" />
                          <span className="flex-1 text-sm font-bold text-[#0f172a]">{f.choices[0]?.label}</span>
                          <span className="text-sm font-black text-slate-500">Included</span>
                        </div>
                      ) : (
                        f.choices.map((c: any) => {
                          const sel = selCode === c.code;
                          return (
                            <label key={c.code} onClick={() => setDedHw({ ...dedHw, [f.family]: c.code })} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3.5 transition ${sel ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                              <input type="radio" name={`ded-${f.family}`} checked={sel} readOnly className="h-4 w-4 accent-[#00b7ff]" />
                              <span className="flex-1 text-sm font-bold text-[#0f172a]">{c.label}</span>
                              <span className={`text-sm font-black ${c.included ? "text-slate-500" : "text-[#00b7ff]"}`}>{c.included ? "Included" : `+${fmtCurrency(c.monthlyPrice, planCurrency)}/mo`}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
              {dedLicGroups.length > 0 && <h3 className="mb-2 mt-6 text-sm font-black uppercase tracking-wide text-slate-700">Add options</h3>}
              {dedLicGroups.map((g: any) => (
                <div key={g.family} className="mb-5">
                  <p className="mb-2 text-xs font-bold text-slate-600">{g.family === "distribution-license" ? "Operating system" : g.family === "application-license" ? "Applications and licenses" : g.family}</p>
                  <div className="space-y-2">
                    {g.groups.map(([product, items]: any) => {
                      const selCode = items.find((i: any) => dedLic.includes(i.code))?.code;
                      const selChoice = items.find((i: any) => i.code === selCode);
                      const shown = selChoice || items[0];
                      return (
                        <div key={product} className={`flex items-center gap-3 rounded-lg border p-3 transition ${selCode ? "border-[#00b7ff] bg-slate-100" : "border-slate-200"}`}>
                          <input type="checkbox" checked={!!selCode} onChange={(e) => dedLicSet(product, e.target.checked ? shown.code : null)} className="h-4 w-4 accent-[#00b7ff]" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-[#0f172a]">{product}</p>
                            <select
                              disabled={!selCode}
                              value={selCode || shown.code}
                              onChange={(e) => dedLicSet(product, e.target.value)}
                              className="mt-1.5 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs disabled:opacity-50"
                            >
                              {items.map((i: any) => <option key={i.code} value={i.code}>{i.optLabel}</option>)}
                            </select>
                          </div>
                          <span className={`text-sm font-black ${selCode ? "text-[#00b7ff]" : "text-slate-400"}`}>{shown?.monthlyPrice ? `+${fmtCurrency(shown.monthlyPrice, planCurrency)}/mo` : "Free"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black">Choose your image</h2>
            {configLoading ? (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-500">Loading available images...</div>
            ) : providerImages.length === 0 ? (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-600">No image selection required.</div>
            ) : (
              <>
                <div className="mb-4 flex gap-4 border-b border-slate-200 text-sm font-bold">
                  <button onClick={() => setImageTab("dist")} className={`px-1 py-2 transition ${imageTab === "dist" ? "border-b-2 border-[#00b7ff] text-[#00b7ff]" : "text-slate-500 hover:text-[#0f172a]"}`}>Distribution only</button>
                  <button onClick={() => setImageTab("app")} className={`px-1 py-2 transition ${imageTab === "app" ? "border-b-2 border-[#00b7ff] text-[#00b7ff]" : "text-slate-500 hover:text-[#0f172a]"}`}>Distribution with application</button>
                </div>
                {shownImageCards.length === 0 ? (
                  <div className="rounded border border-slate-200 p-5 text-sm text-slate-600">
                    {imageTab === "app" ? "No pre-installed applications for this plan." : "No images available."}
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {shownImageCards.map((card) => {
                      const curValue = imageTab === "app" ? selectedApp : image;
                      const sel = card.options.some((o) => o.value === curValue);
                      const ddValue = sel ? curValue : card.options[0].value;
                      const pick = (v: string) => {
                        if (imageTab === "app") { setSelectedApp(v); setImage(""); }
                        else { setImage(v); setSelectedApp(""); }
                      };
                      return (
                        <div key={card.family} className={`rounded-lg border p-4 transition ${sel ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input type="radio" name="osfam" checked={sel} onChange={() => pick(ddValue)} className="h-4 w-4 accent-[#00b7ff]" />
                            <span className="text-sm font-bold text-[#0f172a]">{card.family}</span>
                          </label>
                          <select
                            value={ddValue}
                            onChange={(e) => pick(e.target.value)}
                            className="mt-2.5 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#00b7ff]"
                          >
                            {card.options.map((o) => (
                              <option key={o.value} value={o.value}>{imageTab === "app" ? o.label : `Version ${o.label}`}</option>
                            ))}
                          </select>
                          {imageTab === "app" && /cpanel|plesk/i.test(card.family) && (() => {
                            const licFamily = /cpanel/i.test(card.family) ? "cpanel" : "plesk";
                            const licOpts = optFamily(licFamily)?.choices || [];
                            if (!licOpts.length) return null;
                            return (
                              <select
                                value={licOpts.some((c: any) => c.code === licenseSel) ? licenseSel : licOpts[0].code}
                                onChange={(e) => setLicenseSel(e.target.value)}
                                className="mt-2 w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#00b7ff]"
                              >
                                {licOpts.map((c: any) => (
                                  <option key={c.code} value={c.code}>{c.label} — {fmtCurrency(c.monthlyPrice, c.currency)}/mo</option>
                                ))}
                              </select>
                            );
                          })()}
                          {imageTab === "dist" && <p className="mt-1.5 text-xs font-bold text-slate-400">Free</p>}
                          {imageTab === "app" && /cpanel|plesk/i.test(card.family) && (() => {
                            const licFamily = /cpanel/i.test(card.family) ? "cpanel" : "plesk";
                            const licOpts = optFamily(licFamily)?.choices || [];
                            const shown = licOpts.find((c: any) => c.code === (sel ? licenseSel : "")) || licOpts[0];
                            return shown ? <p className="mt-1.5 text-xs font-bold text-[#e0006d]">{fmtCurrency(shown.monthlyPrice, shown.currency)}/mo license</p> : null;
                          })()}
                          {imageTab === "app" && !/cpanel|plesk/i.test(card.family) && <p className="mt-1.5 text-xs font-bold text-slate-400">Free</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black">Your storage type</h2>
            <p className="mb-3 text-xs text-slate-600">The storage type is included with your VPS plan.</p>
            <div className="rounded-lg border border-[#00b7ff] bg-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#00b7ff] text-[10px] font-bold text-[#00b7ff]">✓</span>
                  <p className="text-sm font-bold text-[#0f172a]">Local storage <span className="text-xs font-normal text-slate-500">High performance</span></p>
                </div>
                <span className="rounded bg-[#00b7ff] px-3 py-1 text-xs font-bold text-[#0f172a]">Included</span>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black">Choose your options</h2>
            <div className="mb-4 rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/10 p-4">
              <p className="text-sm font-bold text-[#0f172a]">You get automatic backup as an included feature with your VPS purchase!</p>
              <p className="text-xs text-slate-600">As a result, your data is effortlessly protected every day and can be readily restored should any issues occur.</p>
            </div>
            <div className="space-y-3">
              {premiumBackupOpt && (
                <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                  <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">Premium automatic backup</p>
                    <p className="text-xs text-slate-500">Your custom backup, with a rolling 7-day restore.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency(premiumBackupOpt.monthlyPrice, planCurrency)}</p>
                    <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                  </div>
                </label>
              )}
              {snapshotOpt && (
                <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                  <input type="checkbox" checked={snapshot} onChange={(e) => setSnapshot(e.target.checked)} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">Snapshot backup</p>
                    <p className="text-xs text-slate-500">Create an image of your server whenever you want. Easy to use, it allows you to quickly restore and secure your VPS before making any changes.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency(snapshotOpt.monthlyPrice, planCurrency)}</p>
                    <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                  </div>
                </label>
              )}
              {diskOpts.length > 0 && (
                <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                  <input type="checkbox" checked={storage} onChange={(e) => { setStorage(e.target.checked); if (e.target.checked && !storageOpt) setStorageOpt(diskOpts[0].code); }} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a]">Additional storage</p>
                    <p className="text-xs text-slate-500">Increase the available storage space on your VPS with our highly resilient additional disks.</p>
                    {storage && (
                      <select
                        value={storageOpt || diskOpts[0].code}
                        onChange={(e) => setStorageOpt(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 w-full max-w-[260px] rounded border border-slate-200 p-1 text-xs"
                      >
                        {diskOpts.map((d: any) => (
                          <option key={d.code} value={d.code}>{d.label} — {fmtCurrency(d.monthlyPrice, planCurrency)}/mo</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency((diskOpts.find((d: any) => d.code === (storageOpt || diskOpts[0].code))?.monthlyPrice) || 0, planCurrency)}</p>
                    <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                  </div>
                </label>
              )}
            </div>
          </section>

          {/* Bottom nav */}
          <div className="mt-8 flex items-center justify-between">
            <Link href={isDed ? (brand === "metal" ? "/metal/dedicated" : "/dedicated-servers") : (brand === "metal" ? "/metal/vps" : "/vps")} className="text-xs font-bold text-[#00b7ff] hover:underline">← Back</Link>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-bold text-[#00b7ff] hover:underline">Back to top ↑</button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-slate-200 bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-slate-500">{plan.category || category}</p>
                <ChevronRight className="h-4 w-4 rotate-90 text-slate-400" />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <h3 className="text-base font-bold">{plan.displayName || plan.invoiceName || plan.planCode}</h3>
                <div className="text-right">
                  {!isDed && selectedDuration?.originalPrice && selectedDuration.originalPrice !== selectedDuration.finalPrice && (
                    <p className="text-xs text-slate-400 line-through">{fmtCurrency(selectedDuration.originalPrice, planCurrency)}</p>
                  )}
                  <p className="text-sm font-black text-[#e0006d]">{fmtCurrency(planPeriodTotal / durationMonths, planCurrency)}/month</p>
                </div>
              </div>
            </div>
            {/* Specs */}
            <div className="space-y-3 p-4 text-xs">
              {isDed ? <div className="flex items-center justify-between gap-3"><span className="text-slate-600">Processor</span><b className="text-right text-[#0f172a]">{dedicatedSpec.cpu}</b></div> : plan.cpuCores && <div className="flex items-center justify-between"><span className="text-slate-600">Processor</span><b className="text-[#0f172a]">{plan.cpuCores} vCore{plan.cpuCores > 1 ? "s" : ""}</b></div>}
              {plan.ramGb && <div className="flex items-center justify-between"><span className="text-slate-600">Memory</span><b className="text-[#0f172a]">{isDed ? (dedHwRows.find((r: any) => r.family === "memory")?.label || dedicatedSpec.ram) : `${plan.ramGb} GB RAM`}</b></div>}
              {plan.diskGb && <div className="flex items-center justify-between"><span className="text-slate-600">Storage</span><b className="text-[#0f172a]">{isDed ? (dedHwRows.find((r: any) => r.family === "storage")?.label || dedicatedSpec.storage) : `${plan.diskGb} GB ${plan.diskType || "SSD NVMe"}`}</b></div>}
              {plan.bandwidthMbps && <div className="flex items-center justify-between"><span className="text-slate-600">Public bandwidth</span><b className="text-[#0f172a]">{isDed ? (dedHwRows.find((r: any) => r.family === "bandwidth")?.label || dedicatedSpec.bandwidth) : `${plan.bandwidthMbps} Mbps unlimited`}</b></div>}
              {isDed && dedicatedSpec.privBw && <div className="flex items-center justify-between"><span className="text-slate-600">Private bandwidth</span><b>{dedicatedSpec.privBw / 1000} Gbps</b></div>}
              <div className="flex items-center justify-between"><span className="text-slate-600">Commitment</span><div className="text-right"><b className="text-[#0f172a]">{durationText}</b>{commitmentDiscount && <p className="text-[10px] font-bold text-[#e0006d]">{commitmentDiscount}</p>}</div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Datacenter location</span><div className="text-right"><b className="text-[#0f172a]">{quantity}× {datacenter ? getDcName(datacenter) : "Select"}</b>{preorderSelected && <p className="text-[10px] font-bold text-amber-600">⏳ PRE-BOOKING — activates on restock</p>}</div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Image</span><div className="text-right"><b className="text-[#0f172a]">{imageTab === "app" ? selectedApp : image === "none_64.en" ? "No preinstalled OS" : image}</b><p className="text-[10px] font-bold text-[#0f172a]">{licenseOpt ? "License billed below" : "Included"}</p></div></div>
              {isDed && <div className="flex items-center justify-between"><span className="text-slate-600">Installation fee (once)</span><b>{fmtCurrency(setupPrice, planCurrency)}</b></div>}
              {isDed && dedHwRows.filter((r: any) => !r.included && r.total > 0).map((r: any) => (
                <div key={r.family} className="flex items-center justify-between"><span className="text-slate-600">Upgrade</span><div className="text-right"><b className="text-[#0f172a]">{r.label}</b><p className="text-[10px] font-bold text-[#00b7ff]">+{fmtCurrency(r.monthly, planCurrency)}/mo</p></div></div>
              ))}
              {isDed && dedLicRows.map((r: any) => (
                <div key={r.code} className="flex items-center justify-between"><span className="text-slate-600">License</span><div className="text-right"><b className="text-[#0f172a]">{r.label}</b><p className="text-[10px] font-bold text-[#e0006d]">{fmtCurrency(r.monthly, planCurrency)}/mo</p></div></div>
              ))}
              {!isDed && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><b className="text-[#0f172a]">Local Storage - {plan.invoiceName || plan.planCode}</b></div>}
              {backup && premiumBackupOpt && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">Premium automatic backup</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(premiumBackupOpt.monthlyPrice, planCurrency)}/mo</p></div></div>}
              {snapshot && snapshotOpt && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">Snapshot backup</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(snapshotOpt.monthlyPrice, planCurrency)}/mo</p></div></div>}
              {storage && storageOpt && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">{diskOpts.find((d: any) => d.code === storageOpt)?.label || "Additional storage"}</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(diskOpts.find((d: any) => d.code === storageOpt)?.monthlyPrice || 0, planCurrency)}/mo</p></div></div>}
              {licenseOpt && <div className="flex items-center justify-between"><span className="text-slate-600">License</span><div className="text-right"><b className="text-[#0f172a]">{licenseOpt.label}</b><p className="text-[10px] font-bold text-[#e0006d]">{fmtCurrency(licenseOpt.monthlyPrice, planCurrency)}/mo</p></div></div>}
            </div>
            {/* Total */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-black text-[#0f172a]">Total</p>
                  <p className="text-[10px] text-slate-500">{isDed ? "Due now, including installation and taxes" : selectedDuration?.durationLabel === "1_month" ? "including taxes/month" : `including taxes for ${selectedDuration?.durationLabel.replace("_", " ")}`}</p>
                </div>
                <p className="text-xl font-black text-[#0f172a]">{fmtCurrency(total, planCurrency)}</p>
              </div>
              <div className="mt-2 space-y-1 border-t border-dashed border-slate-200 pt-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmtCurrency(subtotal, planCurrency)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold"><span>Coupon {couponResult?.code} ({couponResult?.discountType === "percent" ? `${couponResult?.discountValue}%` : "fixed"} off)</span><span>-{fmtCurrency(discount, planCurrency)}</span></div>
                )}
                {preorderSelected && preorderFee > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold"><span>Priority booking fee{preorderCfg?.feeType === "percent" ? ` (${preorderCfg?.feeValue}%)` : ""}</span><span>{preorderFeeDisplay}</span></div>
                )}
                <div className="flex justify-between"><span>GST ({(taxRate*100).toFixed(0)}%)</span><span>{fmtCurrency(tax, planCurrency)}</span></div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                    placeholder="Coupon code"
                    className="flex-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs uppercase outline-none focus:border-[#00b7ff]"
                  />
                  {couponResult ? (
                    <button type="button" onClick={() => { setCouponResult(null); setCouponCode(""); }} className="rounded border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100">Remove</button>
                  ) : (
                    <button
                      type="button"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={async () => {
                        setCouponLoading(true); setCouponError("");
                        try {
                          const r = await api.coupons.validate({ code: couponCode.trim(), planCode: effectivePlanCode, durationLabel: selectedDuration.durationLabel });
                          setCouponResult(r);
                          showToast(`Coupon applied — ${r.discountType === "percent" ? r.discountValue + "%" : "₹" + r.discount} off`, "success");
                        } catch (e: any) { setCouponError(e.message || "Invalid coupon"); }
                        finally { setCouponLoading(false); }
                      }}
                      className="rounded bg-[#0f0c29] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50"
                    >{couponLoading ? "…" : "Apply"}</button>
                  )}
                </div>
                {couponError && <p className="text-[11px] font-semibold text-red-500">{couponError}</p>}
              </div>
              {!user && <p className="mt-3 rounded bg-[#fff4ef] p-2 text-[10px] font-bold text-[#ff3d00]">Sign in or create account before payment.</p>}
              {preorderSelected && (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800">
                  <p className="font-bold">⏳ Pre-booking — {getDcName(datacenter)}</p>
                  <p className="mt-0.5">Pay now to join the queue. Your {isDed ? "server" : "VPS"} is ordered automatically when a stock check confirms availability, with first-come priority. Delivery time starts after the provider accepts the order. Full wallet refund if unfulfilled for {preorderCfg?.refundDays || 30} days.</p>
                </div>
              )}
              <button onClick={startPayment} disabled={paying || !canOrder || ((providerDatacenters.length > 0 || (preorderEnabled && allCatalogLocations.length > 0)) && !datacenter)} className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#302b63] disabled:opacity-50">
                {preorderSelected ? "Pre-book now →" : "Continue order →"}
              </button>
              {user && (
                <button
                  onClick={async () => {
                    const osValue = imageTab === "app" ? selectedApp : image;
                    const configuration: any = {};
                    if (osValue) configuration.os = osValue;
                    if (datacenter) configuration.datacenter = datacenter;
                    if (brand === "metal") configuration._brand = "metal";
                    if (preorderSelected) configuration._preorder = true;
                    const selOpts: string[] = [];
                    if (snapshot && snapshotOpt) selOpts.push(snapshotOpt.code);
                    if (backup && premiumBackupOpt) selOpts.push(premiumBackupOpt.code);
                    if (storage && storageOpt) selOpts.push(storageOpt);
                    if (licenseOpt) selOpts.push(licenseOpt.code);
                    if (isDed) {
                      for (const f of dedHwFams) {
                        const c = dedSelCode(f.family);
                        if (c && c !== f.includedCode) selOpts.push(c);
                      }
                      selOpts.push(...dedLic);
                    }
                    if (selOpts.length) configuration._options = selOpts;
                    try {
                      await api.cart.add({
                        planCode: effectivePlanCode,
                        durationLabel: selectedDuration?.durationLabel,
                        displayName: plan.invoiceName || plan.planCode,
                        category: plan.category || category,
                        unitPrice: planPeriodTotal / durationMonths,
                        configuration,
                      });
                      showToast("Added to cart", "success");
                      window.dispatchEvent(new CustomEvent("ghc:cart-updated"));
                    } catch (e: any) {
                      showToast(e.message || "Could not add to cart", "error");
                    }
                  }}
                  disabled={!canOrder}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-[#0f172a] hover:border-[#00b7ff] hover:text-[#00b7ff] disabled:opacity-50"
                >
                  Add to cart
                </button>
              )}
              {providerDatacenters.length > 0 && !datacenter && <p className="mt-2 text-center text-[10px] text-slate-500">Select a datacenter to continue</p>}
              <p className="mt-2 text-center text-[10px] text-slate-400">
                ⏱ Estimated provisioning: {
                  isDed ? (preorderSelected ? "Waiting for stock" : deliveryLabel(dcConfigEntry?.availability?.[datacenter]?.deliveryHours))
                  : (plan?.category || category) === "WEB_HOSTING" ? "a few minutes after payment"
                  : (plan?.category || category) === "DOMAINS" ? "minutes after payment"
                  : "usually a few minutes"
                }
              </p>
              {user && plan?.planCode && (
                <button
                  type="button"
                  onClick={async () => {
                    const cur = (selectedDuration?.monthlyPrice || 0).toFixed(2);
                    const v = prompt(`Get notified when ${plan.invoiceName || plan.planCode} drops to a monthly price at or below your target.\n\nCurrent: ${fmtCurrency(selectedDuration?.monthlyPrice, planCurrency)}/mo`, cur);
                    if (v === null) return;
                    const t = parseFloat(v);
                    if (!t || t <= 0) { showToast("Enter a valid target price", "error"); return; }
                    try {
                      await api.auth.createPriceAlert({ planCode: plan.planCode, targetPrice: t, currency: planCurrency });
                      showToast("Price alert saved — we'll notify you on a drop", "success");
                    } catch (e: any) { showToast(e.message || "Could not save alert", "error"); }
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-500 hover:border-[#00b7ff]/40 hover:text-[#00b7ff]"
                >
                  🔔 Alert me on price drop
                </button>
              )}

              {manualPayment && (
                <div className="mt-4 rounded-xl border border-dashed border-[#00b7ff] bg-[#f8fcff] p-4 text-sm">
                  <p className="font-bold text-[#0f172a]">Manual payment instructions</p>
                  <p className="mt-1 text-slate-600">{manualPayment.instructions}</p>
                  <p className="mt-2 text-xs text-slate-500">Amount: <b>{fmtCurrency(manualPayment.amount, manualPayment.currency)}</b></p>
                  <p className="mt-1 text-xs text-slate-500">Reference: <b className="font-mono">{manualPayment.id.slice(0,8).toUpperCase()}</b></p>
                  <p className="mt-2 text-[10px] text-slate-400">Your order is saved. Complete the payment and share the reference with support to activate the service.</p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function ConfigureFallback() {
  return (
    <div className="min-h-screen bg-[#f8fcff]">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-black"><Server className="h-5 w-5 text-[#00b7ff]" /> GHC</Link>
          <div className="flex items-center gap-5 text-sm font-bold text-[#0f172a]">
            <Link href="/">Plans</Link>
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </nav>
      <main className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#00b7ff]" />
          <p className="mt-4 text-sm text-slate-500">Loading plan configurator...</p>
        </div>
      </main>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<ConfigureFallback />}>
      <ConfigurePageContent />
    </Suspense>
  );
}
