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
};

function getDcName(code: string) {
  return dcMeta[code]?.name || code;
}
function getDcRegion(code: string): keyof typeof regionLocations {
  return dcMeta[code]?.region || "Europe";
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
  const [showUnavailable, setShowUnavailable] = useState(false);
  const [manualPayment, setManualPayment] = useState<{ id: string; amount: number; currency: string; instructions: string } | null>(null);
  const [gateway, setGateway] = useState("");
  const [backup, setBackup] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [storage, setStorage] = useState(false);
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

  // ---- cart draft persistence (configure → abandon → resume) ----
  const DRAFT_KEY = "ghc-cart-draft";
  const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch { return null; } };
  useEffect(() => {
    const d = readDraft();
    if (!d?.planCode) return;
    if (d.savedAt && Date.now() - d.savedAt > 30 * 864e5) { clearDraft(); return; } // stale draft
    if (d.planCode === planCode && d.category === category) {
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
      setDraftBanner(d); // different plan — offer resume
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // save draft whenever selection changes (after first paint)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          planCode, category, subCategory, durationLabel, datacenter, image, imageVersion, imageTab,
          region, gateway, quantity, backup, snapshot, storage, selectedApp, couponCode, savedAt: Date.now(),
        }));
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [planCode, category, subCategory, durationLabel, datacenter, image, imageVersion, imageTab, region, gateway, quantity, backup, snapshot, storage, selectedApp, couponCode, loading]);
  const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch {} };

  useEffect(() => {
    let alive = true;
    const load = () => {
      setLoading(true);
      Promise.all([
        api.server.plans(category),
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
  }, [category, currency]);

  const plan = useMemo(() => plans.find((p: any) => p.planCode === planCode) || plans[0], [plans, planCode]);
  const planCurrency = plan?.currency || plan?.durations?.[0]?.currency || currency || "USD";
  const durations = (plan?.durations || [])
    .filter((d: any) => ["1_month", "3_month", "6_month", "12_month"].includes(d.durationLabel))
    .map((d: any) => ({ durationLabel: d.durationLabel, finalPrice: d.finalPrice, monthlyPrice: d.monthlyPrice, originalPrice: d.rawPrice || d.finalPrice }));
  const selectedDuration = durations.find((d: any) => d.durationLabel === durationLabel) || durations[0] || { durationLabel: "1_month", finalPrice: 0, originalPrice: 0 };
  const optionsTotal = 0;
  const subtotal = parseFloat((((selectedDuration?.finalPrice || 0) + optionsTotal) * quantity).toFixed(2));
  const discount = couponResult ? parseFloat((couponResult.discount || 0).toFixed(2)) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxRate = 0.18;
  const tax = parseFloat((taxable * taxRate).toFixed(2));
  const total = parseFloat((taxable + tax).toFixed(2));
  const requiredConfigs = providerConfig?.requiredConfiguration || providerConfig?.configurations || [];
  const findConfigValues = (names: string[]) => {
    const entry = requiredConfigs.find((cfg: any) =>
      names.some((name) => `${cfg.name || cfg.label || cfg.type || cfg.key || ""}`.toLowerCase().includes(name))
    );
    const rawValues = entry?.values || entry?.allowedValues || entry?.enum || entry?.choices || [];
    return Array.isArray(rawValues) ? rawValues.map((v: any) => typeof v === "string" ? v : v.value || v.name || v.label).filter(Boolean) : [];
  };
  const providerDatacenters = findConfigValues(["datacenter", "location", "zone", "region", "district", "country"]);
  const providerImages = findConfigValues(["image", "os", "template", "distribution"]);
  const durationTitle = (l: string) => l === "1_month" ? "No commitment" : `${parseInt(l)} months`;
  const durationText = durationLabel === "1_month" ? "1 month" : `${parseInt(durationLabel)} months`;
  const monthlyBase = durations.find((d: any) => d.durationLabel === "1_month")?.monthlyPrice || 0;
  const savePct = (d: any) => (monthlyBase && d.monthlyPrice && d.monthlyPrice < monthlyBase)
    ? Math.round((1 - d.monthlyPrice / monthlyBase) * 100) : 0;
  const commitmentDiscount = savePct(selectedDuration) > 0 ? `Save ${savePct(selectedDuration)}% per month` : "";
  // Show all provider locations; fallback to raw code if no friendly meta exists
  const displayedLocations = providerDatacenters;

  useEffect(() => {
    if (durations[0] && !durations.find((d: any) => d.durationLabel === durationLabel)) {
      setDurationLabel(durations[0].durationLabel);
    }
  }, [durations, durationLabel]);

  useEffect(() => {
    if (!plan?.planCode || !durationLabel) return;
    let alive = true;
    setConfigLoading(true);
    api.server.planConfiguration({ planCode: plan.planCode, category: plan.category || category, durationLabel })
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
  }, [plan?.planCode, plan?.category, category, durationLabel]);

  useEffect(() => {
    if (displayedLocations.length > 0) {
      if (!datacenter) setDatacenter(displayedLocations[0]);
      if (!region || !displayedLocations.some((dc) => getDcRegion(dc) === region)) {
        setRegion(getDcRegion(displayedLocations[0]));
      }
    }
  }, [displayedLocations, datacenter, region]);

  useEffect(() => {
    if (providerImages.length > 0 && !image) {
      const base = providerImages.find((i: string) => !i.includes("-")) || providerImages[0];
      setImage(base);
    }
    const app = providerImages.find((i: string) => imageTab === "app" ? i.includes("-") : false);
    if (imageTab === "app" && app && !selectedApp) setSelectedApp(app);
  }, [providerImages, image, imageTab, selectedApp]);

  const startPayment = async () => {
    if (!user) {
      localStorage.setItem("pendingCheckout", window.location.pathname + window.location.search);
      window.location.href = "/login";
      return;
    }
    if (!plan || !selectedDuration) { showToast("Plan pricing is not available", "error"); return; }
    if (!providerConfig?.available) { showToast("This plan is not currently available", "error"); return; }
    setPaying(true);
    try {
      const osValue = imageTab === "app" ? selectedApp : image;
      const configuration: any = {};
      if (osValue) configuration.os = osValue;
      if (datacenter) configuration.datacenter = datacenter;

      if (!gateway) { showToast("No payment gateway is configured. Please contact support or set up a gateway in admin.", "error"); setPaying(false); return; }

      if (gateway === "wallet") {
        const res = await api.billing.payWithWallet({
          planCode: plan.planCode,
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
        planCode: plan.planCode,
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
          <Link href="/vps" className="hover:text-[#00b7ff]">VPS</Link><span className="text-slate-300">›</span>
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
          <h1 className="mt-1 text-3xl font-black">Configure your Virtual Private Server</h1>

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
                    window.location.href = `/configure?${q.toString()}`;
                  }}
                  className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-white hover:bg-amber-600"
                >
                  Resume
                </button>
                <button onClick={() => { clearDraft(); setDraftBanner(null); }} className="text-xs text-amber-600 hover:text-amber-800">Discard</button>
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
            <h2 className="mb-3 text-lg font-black">Select the number of VPS</h2>
            <div className="flex max-w-xl items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <span className="text-sm font-bold text-[#0f172a]">Number of VPS</span>
              <div className="flex items-center rounded border border-slate-200">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1 text-lg text-[#0f172a] hover:bg-[#f8faff]">−</button>
                <span className="w-10 text-center text-sm font-black">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1 text-lg text-[#0f172a] hover:bg-[#f8faff]">+</button>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-black">Select the location of your VPS</h2>
            </div>
            <p className="mb-3 text-xs text-slate-600">You can host your VPS in one of our datacenters in our worldwide network.</p>
            <div className="mb-4 flex gap-1 border-b border-slate-200">
              {(Object.keys(regionLocations) as (keyof typeof regionLocations)[]).filter((r) => displayedLocations.some((dc) => getDcRegion(dc) === r)).map((r) => (
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
            ) : displayedLocations.length > 0 ? (
              <div className="space-y-2">
                {displayedLocations.filter((dc) => getDcRegion(dc) === region).map((dc: string) => {
                  const sel = datacenter === dc;
                  const name = getDcName(dc);
                  return (
                    <label key={dc} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${sel ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                      <input type="radio" name="dc" checked={sel} onChange={() => setDatacenter(dc)} className="h-4 w-4 accent-[#00b7ff]" />
                      <span className="text-lg">{getFlag(name)}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[#0f172a]">{name}</p>
                        <p className="text-[10px] text-green-600">🟢 Available now</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#0f172a]">{fmtCurrency(selectedDuration?.monthlyPrice, planCurrency)}</p>
                        <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-600">No datacenter selection required.</div>
            )}
            <div className="mt-4 rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">ℹ️</span>
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">Other locations?</p>
                  <p className="text-xs text-slate-600">Alternative solution: pick a dedicated server, available now and still at the best price, suited to your needs.</p>
                  <Link href="/dedicated-servers" className="mt-2 inline-flex items-center gap-1 rounded bg-[#00b7ff] px-4 py-2 text-xs font-bold text-[#0f172a] hover:bg-[#0f0c29] hover:text-white">See available servers →</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-lg font-black">Choose your image</h2>
            {configLoading ? (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-500">Loading available images...</div>
            ) : providerImages.length === 0 ? (
              <div className="rounded border border-slate-200 p-5 text-sm text-slate-600">No image selection required.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {providerImages.filter((i: string) => imageTab === "app" ? i.includes("-") : !i.includes("-")).map((i: string) => (
                  <label key={i} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${image === i || selectedApp === i ? "border-[#00b7ff] bg-slate-100" : "border-slate-200 hover:border-[#00b7ff]"}`}>
                    <input
                      type="radio"
                      name="os"
                      checked={imageTab === "app" ? selectedApp === i : image === i}
                      onChange={() => {
                        if (imageTab === "app") { setSelectedApp(i); setImage(""); }
                        else { setImage(i); setSelectedApp(""); }
                      }}
                      className="mt-0.5 h-4 w-4 accent-[#00b7ff]"
                    />
                    <span className="text-sm font-bold text-[#0f172a]">{i}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-4 border-b border-slate-200 text-sm font-bold">
              <button onClick={() => setImageTab("dist")} className={`px-1 py-2 transition ${imageTab === "dist" ? "border-b-2 border-[#00b7ff] text-[#00b7ff]" : "text-slate-500 hover:text-[#0f172a]"}`}>Distribution only</button>
              <button onClick={() => setImageTab("app")} className={`px-1 py-2 transition ${imageTab === "app" ? "border-b-2 border-[#00b7ff] text-[#00b7ff]" : "text-slate-500 hover:text-[#0f172a]"}`}>Distribution with application</button>
            </div>
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
              <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#0f172a]">Premium automatic backup</p>
                  <p className="text-xs text-slate-500">Your custom backup, with a rolling 7-day restore.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency(0, planCurrency)}</p>
                  <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                <input type="checkbox" checked={snapshot} onChange={(e) => setSnapshot(e.target.checked)} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#0f172a]">Snapshot backup</p>
                  <p className="text-xs text-slate-500">Create an image of your server whenever you want. Easy to use, it allows you to quickly restore and secure your VPS before making any changes.</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency(0, planCurrency)}</p>
                  <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#00b7ff]">
                <input type="checkbox" checked={storage} onChange={(e) => setStorage(e.target.checked)} className="mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#0f172a]">Additional storage</p>
                  <p className="text-xs text-slate-500">Increase the available storage space on your VPS with our highly resilient additional disks.</p>
                  {storage && (
                    <select className="mt-2 w-full max-w-[120px] rounded border border-slate-200 p-1 text-xs">
                      {["50 GB", "100 GB", "200 GB", "500 GB"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#00b7ff]">{fmtCurrency(0, planCurrency)}</p>
                  <p className="text-[10px] text-slate-400">ex. taxes/month</p>
                </div>
              </label>
            </div>
          </section>

          {/* Bottom nav */}
          <div className="mt-8 flex items-center justify-between">
            <Link href="/vps" className="text-xs font-bold text-[#00b7ff] hover:underline">← Back</Link>
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
                <h3 className="text-base font-bold">{plan.invoiceName || plan.planCode}</h3>
                <div className="text-right">
                  {selectedDuration?.originalPrice && selectedDuration.originalPrice !== selectedDuration.finalPrice && (
                    <p className="text-xs text-slate-400 line-through">{fmtCurrency(selectedDuration.originalPrice, planCurrency)}</p>
                  )}
                  <p className="text-sm font-black text-[#e0006d]">{fmtCurrency(selectedDuration?.finalPrice, planCurrency)}</p>
                </div>
              </div>
            </div>
            {/* Specs */}
            <div className="space-y-3 p-4 text-xs">
              {plan.cpuCores && <div className="flex items-center justify-between"><span className="text-slate-600">Processor</span><b className="text-[#0f172a]">{plan.cpuCores} vCore{plan.cpuCores > 1 ? "s" : ""}</b></div>}
              {plan.ramGb && <div className="flex items-center justify-between"><span className="text-slate-600">Memory</span><b className="text-[#0f172a]">{plan.ramGb} GB RAM</b></div>}
              {plan.diskGb && <div className="flex items-center justify-between"><span className="text-slate-600">Storage</span><b className="text-[#0f172a]">{plan.diskGb} GB {plan.diskType || "SSD NVMe"}</b></div>}
              {plan.bandwidthMbps && <div className="flex items-center justify-between"><span className="text-slate-600">Public bandwidth</span><b className="text-[#0f172a]">{plan.bandwidthMbps} Mbps unlimited</b></div>}
              <div className="flex items-center justify-between"><span className="text-slate-600">Commitment</span><div className="text-right"><b className="text-[#0f172a]">{durationText}</b>{commitmentDiscount && <p className="text-[10px] font-bold text-[#e0006d]">{commitmentDiscount}</p>}</div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Datacenter location</span><div className="text-right"><b className="text-[#0f172a]">{quantity}× {datacenter || "Select"}</b></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Image</span><div className="text-right"><b className="text-[#0f172a]">{image} {imageVersion}</b><p className="text-[10px] font-bold text-[#0f172a]">Free</p></div></div>
              <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><b className="text-[#0f172a]">Local Storage - {plan.invoiceName || plan.planCode}</b></div>
              {backup && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">Premium automatic backup</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(1.24, planCurrency)}</p></div></div>}
              {snapshot && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">Snapshot backup</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(0.34, planCurrency)}</p></div></div>}
              {storage && <div className="flex items-center justify-between"><span className="text-slate-600">Option</span><div className="text-right"><b className="text-[#0f172a]">Additional storage - 50 GB</b><p className="text-[10px] font-bold text-[#00b7ff]">{fmtCurrency(2.42, planCurrency)}</p></div></div>}
            </div>
            {/* Total */}
            <div className="border-t border-slate-200 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-black text-[#0f172a]">Total</p>
                  <p className="text-[10px] text-slate-500">{selectedDuration?.durationLabel === "1_month" ? "including taxes/month" : `including taxes for ${selectedDuration?.durationLabel.replace("_", " ")}`}</p>
                </div>
                <p className="text-xl font-black text-[#0f172a]">{fmtCurrency(total, planCurrency)}</p>
              </div>
              <div className="mt-2 space-y-1 border-t border-dashed border-slate-200 pt-2 text-xs text-slate-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{fmtCurrency(subtotal, planCurrency)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold"><span>Coupon {couponResult?.code} ({couponResult?.discountType === "percent" ? `${couponResult?.discountValue}%` : "fixed"} off)</span><span>-{fmtCurrency(discount, planCurrency)}</span></div>
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
                          const r = await api.coupons.validate({ code: couponCode.trim(), planCode: plan.planCode, durationLabel: selectedDuration.durationLabel });
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
              <button onClick={startPayment} disabled={paying || !providerConfig?.available || (providerDatacenters.length > 0 && !datacenter)} className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#302b63] disabled:opacity-50">
                Continue order →
              </button>
              {providerDatacenters.length > 0 && !datacenter && <p className="mt-2 text-center text-[10px] text-slate-500">Select a datacenter to continue</p>}

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
