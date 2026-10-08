"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { useToast } from "@/components/ToastProvider";
import { getCloudCatalog, FALLBACK_CATALOG } from "@/lib/cloudLive";
import {
  ChevronDown, Search, Plus, Cpu, HardDrive, Network, Container, Database,
  Brain, Atom, Layers, FolderOpen, Loader2, Wallet, CreditCard, Server, Check,
} from "lucide-react";

const MARGIN = 1.2;

interface PriceItem { code: string; name: string; hour?: number | null; month?: number | null; hourFmt?: string | null; monthFmt?: string | null; specs?: Record<string, string>; }
interface Leaf { id: string; title: string; desc: string; families?: any[]; items?: PriceItem[]; simpleRows?: { name: string; price: string; note?: string }[]; }

interface TreeLeaf { label: string; leaf: string }
interface TreeNode { label: string; leaf?: string; children?: TreeLeaf[] }

const buildTree = (cd: Record<string, Leaf[]>): TreeNode[] => [
  {
    label: "Instances & Compute",
    children: [
      { label: "Instances", leaf: "instances" },
      { label: "Instance Backup", leaf: "svc:backup" },
      { label: "Volume Management", leaf: "svc:block" },
    ],
  },
  {
    label: "Storage",
    children: [
      { label: "Block Storage", leaf: "svc:block" },
      { label: "Object Storage", leaf: "svc:object" },
      { label: "File Storage", leaf: "svc:file" },
      { label: "Cloud Archive", leaf: "svc:object" },
    ],
  },
  {
    label: "Network",
    children: [
      { label: "Load Balancer", leaf: "svc:loadbalancer" },
      { label: "Floating IPs", leaf: "svc:floatingip" },
      { label: "Gateways", leaf: "svc:gateway" },
      { label: "Private Network (vRack)", leaf: "svc:vrack" },
    ],
  },
  {
    label: "Containers & Orchestration",
    children: [
      { label: "Managed Kubernetes", leaf: "svc:k8s" },
      { label: "Private Registry", leaf: "svc:registry" },
      { label: "Rancher", leaf: "svc:rancher" },
    ],
  },
  { label: "Databases", children: (cd["databases"] || []).map((s) => ({ label: s.title.replace("Managed ", ""), leaf: `svc:${s.id}` })) },
  {
    label: "AI & Machine learning",
    children: [
      { label: "AI Notebooks", leaf: "svc:ai-notebooks" },
      { label: "AI Training", leaf: "svc:ai-training" },
      { label: "AI Deploy", leaf: "svc:ai-deploy" },
      { label: "AI Endpoints", leaf: "svc:ai-endpoints" },
    ],
  },
  { label: "Data Platform", children: [{ label: "Data Platform services", leaf: "svc:dp" }] },
  {
    label: "Quantum computing",
    children: [
      { label: "Quantum Notebooks", leaf: "svc:q-notebooks" },
      { label: "Quantum Processing Units", leaf: "svc:qpu" },
    ],
  },
  { label: "Identity & Security Ops", leaf: "iam" },
];

const DEPLOY_MODES = [
  { id: "1az", tag: "1-AZ", title: "1-AZ Region", desc: "Resilient and low-cost deployment in 1 zone.", recommended: true },
  { id: "3az", tag: "3-AZ", title: "3-AZ Region", desc: "High-resilience, high-availability deployment in 3 zones.", badge: "NEW" },
  { id: "lz", tag: "LZ", title: "Local Zone", desc: "Deploy as close as possible for low latency.", badge: "NEW" },
];

interface RegionDef { code: string; name: string; flag: string; area: string }
const REGIONS: Record<string, RegionDef[]> = {
  "1az": [
    { code: "GRA", name: "Gravelines", flag: "🇫🇷", area: "Europe" },
    { code: "RBX", name: "Roubaix", flag: "🇫🇷", area: "Europe" },
    { code: "SBG", name: "Strasbourg", flag: "🇫🇷", area: "Europe" },
    { code: "WAW", name: "Warsaw", flag: "🇵🇱", area: "Europe" },
    { code: "DE", name: "Frankfurt", flag: "🇩🇪", area: "Europe" },
    { code: "UK", name: "London (Erith)", flag: "🇬🇧", area: "Europe" },
    { code: "BHS", name: "Beauharnois", flag: "🇨🇦", area: "North America" },
    { code: "VIN", name: "Vint Hill", flag: "🇺🇸", area: "North America" },
    { code: "HIL", name: "Hillsboro", flag: "🇺🇸", area: "North America" },
    { code: "SGP", name: "Singapore", flag: "🇸🇬", area: "Asia Pacific" },
    { code: "SYD", name: "Sydney", flag: "🇦🇺", area: "Asia Pacific" },
    { code: "MUM", name: "Mumbai", flag: "🇮🇳", area: "Asia Pacific" },
  ],
  "3az": [
    { code: "EU-WEST-PAR", name: "Paris", flag: "🇫🇷", area: "Europe" },
    { code: "EU-SOUTH-MIL", name: "Milan", flag: "🇮🇹", area: "Europe" },
  ],
  lz: [
    { code: "MAD", name: "Madrid", flag: "🇪🇸", area: "Europe" },
    { code: "BRU", name: "Brussels", flag: "🇧🇪", area: "Europe" },
    { code: "AMS", name: "Amsterdam", flag: "🇳🇱", area: "Europe" },
    { code: "PRG", name: "Prague", flag: "🇨🇿", area: "Europe" },
    { code: "LIS", name: "Lisbon", flag: "🇵🇹", area: "Europe" },
    { code: "ZRH", name: "Zurich", flag: "🇨🇭", area: "Europe" },
  ],
};
const GEO_AREAS = ["All", "Europe", "North America", "Asia Pacific"];

const MODEL_FILTERS = ["All types", "General Purpose", "Compute", "RAM", "Discovery", "IOPS", "GPU", "Metal"];

const DISTROS = [
  { id: "almalinux", label: "almalinux", color: "#1e88e5", versions: ["AlmaLinux 8", "AlmaLinux 9", "AlmaLinux 10 - UEFI"] },
  { id: "cloudlinux", label: "cloudlinux", color: "#37474f", versions: ["CloudLinux 8", "CloudLinux 9"] },
  { id: "debian", label: "debian", color: "#a80030", versions: ["Debian 11", "Debian 12", "Debian 13"] },
  { id: "fedora", label: "fedora", color: "#51a2da", versions: ["Fedora 40", "Fedora 41"] },
  { id: "freebsd", label: "freebsd", color: "#ab2b28", versions: ["FreeBSD 14.1"] },
  { id: "rockylinux", label: "rockylinux", color: "#10b981", versions: ["Rocky Linux 8", "Rocky Linux 9"] },
  { id: "ubuntu", label: "ubuntu", color: "#e95420", versions: ["Ubuntu 22.04 LTS", "Ubuntu 24.04 LTS"] },
];

export default function PublicCloudPanel({ wallet, user, onTab, launch }: { wallet?: any; user?: any; onTab?: (t: string) => void; launch?: string | null }) {
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const [catData, setCatData] = useState<Record<string, Leaf[]>>(FALLBACK_CATALOG as any);
  const [active, setActive] = useState("instances");
  const [open, setOpen] = useState<Record<string, boolean>>({ "Instances & Compute": true });
  const [wizard, setWizard] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [deployMode, setDeployMode] = useState("1az");
  const [geo, setGeo] = useState("All");
  const [azChoice, setAzChoice] = useState<"auto" | "manual">("auto");
  const [az, setAz] = useState("a");
  const [inclUnavailable, setInclUnavailable] = useState(false);
  const [region, setRegion] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState<PriceItem | null>(null);
  const [modelFamily, setModelFamily] = useState("");
  const [storage, setStorage] = useState(50);
  const [launching, setLaunching] = useState(false);
  const [projectState, setProjectState] = useState<"unknown" | "active" | "pending">("unknown");
  const [distro, setDistro] = useState("almalinux");
  const [imageVersion, setImageVersion] = useState(DISTROS[0].versions[2]);
  const [sshKeyName, setSshKeyName] = useState("");
  const [sshKey, setSshKey] = useState("");
  const [sshValidated, setSshValidated] = useState(false);
  const [backup, setBackup] = useState(true);
  const [rotation, setRotation] = useState<"7" | "14">("7");
  const [remoteBackup, setRemoteBackup] = useState(false);
  const [vlanId, setVlanId] = useState("1");
  const [cidr, setCidr] = useState("10.1.0.0/16");
  const [dhcp, setDhcp] = useState(true);
  const [gatewayOn, setGatewayOn] = useState(false);
  const [publicIp, setPublicIp] = useState<"basic" | "floating" | "none">("basic");
  const [flexible, setFlexible] = useState(false);
  const [postScript, setPostScript] = useState(false);
  const [script, setScript] = useState("");
  const [numInstances, setNumInstances] = useState(1);

  const cur = (wallet?.currency || currency || "INR").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const rate = cur === "INR" ? 1 : cur === "USD" ? 1 / 83.5 : cur === "EUR" ? 1 / 90 : 1;
  const fmt = (v?: number | null) => {
    if (typeof v !== "number") return "—";
    const p = v * MARGIN * rate;
    const dec = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
    return `${sym}${p.toLocaleString("en-IN", { maximumFractionDigits: dec })}`;
  };

  useEffect(() => {
    let on = true;
    getCloudCatalog().then((d) => { if (on) setCatData(d); });
    return () => { on = false; };
  }, []);

  const tree = useMemo(() => buildTree(catData), [catData]);
  const leafLookup = useMemo(() => {
    const m: Record<string, Leaf> = {};
    Object.values(catData).flat().forEach((s) => { m[s.id] = s; });
    return m;
  }, [catData]);

  // All VM + GPU + Metal flavors flattened for the model table
  const allFlavors = useMemo(() => {
    const out: (PriceItem & { fam: string; famName: string })[] = [];
    (catData["compute"] || []).forEach((sec) => {
      (sec.families || []).forEach((f: any) => {
        f.items.forEach((i: PriceItem) => out.push({ ...i, fam: f.tag, famName: f.name }));
      });
    });
    return out;
  }, [catData]);

  const typeMap: Record<string, (f: any) => boolean> = {
    "General Purpose": (f) => f.fam.startsWith("B"),
    Compute: (f) => f.fam.startsWith("C"),
    RAM: (f) => f.fam.startsWith("R"),
    Discovery: (f) => f.fam === "D2",
    IOPS: (f) => f.fam === "I1",
    GPU: (f) => !!f.specs?.gpu || ["T1", "T1 LE", "T2", "T2 LE", "L4", "RTX", "A10", "L40S", "A100", "H100", "H200"].includes(f.fam),
    Metal: (f) => f.fam === "BM",
  };
  const filteredFlavors = allFlavors.filter((f) => {
    if (typeFilter !== "All types" && !(typeMap[typeFilter]?.(f) ?? true)) return false;
    if (search && !f.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (launch) {
      const leafId = launch.replace(/^svc[:-]/, "");
      if (launch.startsWith("svc") && leafLookup[leafId]) {
        setActive(`svc:${leafId}`);
      } else {
        const flav = allFlavors.find((f) => f.code === launch);
        setWizard(true); setActive("instances");
        if (flav) { setModel(flav); setModelFamily(flav.famName); setName(`${flav.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}`); }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launch]);

  const select = (leaf: string) => {
    setActive(leaf);
    setWizard(leaf === "instances" ? wizard : false);
    const parent = tree.find((n) => (n.children || []).some((c) => c.leaf === leaf));
    if (parent) setOpen((o) => ({ ...o, [parent.label]: true }));
  };

  const balance = wallet?.balance ?? 0;
  const needAmount = model ? (model.hour || 0) * MARGIN * rate * 24 * numInstances : 0;
  const hasFunds = balance >= needAmount || !model;

  const pickModel = (f: PriceItem & { fam?: string; famName?: string }) => {
    setModel(f);
    setModelFamily(f.famName || "");
    if (!name) setName(`${f.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, "_")}`);
  };

  const doLaunch = async () => {
    if (!model || !region) return;
    if (balance < needAmount) {
      showToast(`Insufficient balance — add at least ${fmt((model.hour || 0) * 24)} to launch`, "error");
      onTab?.("wallet");
      return;
    }
    setLaunching(true);
    try {
      const res = await api.payments.createCheckoutSession({
        type: "ORDER", amount: 0, gateway: "wallet", planCode: "project",
        durationLabel: "monthly", category: "PUBLIC_CLOUD", currency: cur,
        configuration: {
          instance_name: name || model.code, region, deploy_mode: deployMode,
          flavor: model.code, count: numInstances, storage_gb: storage,
          image: imageVersion, ssh_key_name: sshValidated ? sshKeyName : undefined,
          backup: backup ? `rotation-${rotation}` : "off", remote_backup: remoteBackup,
          vlan_id: vlanId, cidr, dhcp, gateway: gatewayOn ? "s" : "none",
          public_ip: publicIp, flexible, post_script: postScript ? script : undefined,
          billing: "hourly",
        } as any,
      });
      if (res.paid || res.checkoutUrl === undefined) {
        showToast("Instance launch request received — provisioning your project", "success");
        setProjectState("pending");
        setWizard(false);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (e: any) {
      showToast(e.message || "Could not launch — project activation is being verified", "error");
      setProjectState("pending");
    } finally { setLaunching(false); }
  };

  const enableService = async (sec: Leaf, item?: PriceItem) => {
    setLaunching(true);
    try {
      const res = await api.payments.createCheckoutSession({
        type: "ORDER", amount: 0, gateway: "wallet", planCode: "project",
        durationLabel: "monthly", category: "PUBLIC_CLOUD", currency: cur,
        configuration: { service: sec.id, item: item?.code, billing: "hourly" } as any,
      });
      if (res.checkoutUrl) window.location.href = res.checkoutUrl;
      else showToast(`${sec.title} activation requested`, "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLaunching(false); }
  };

  const sec = active.startsWith("svc:") ? leafLookup[active.slice(4)] : undefined;

  const th = "px-4 py-3 text-xs font-bold text-slate-500";
  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#00b7ff]";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[230px_1fr] gap-6">
      {/* Inner tree */}
      <aside className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-3 self-start sticky top-4 max-h-[80vh] overflow-y-auto">
        <nav className="space-y-0.5 text-[13px]">
          {tree.map((n) =>
            n.children ? (
              <div key={n.label}>
                <button onClick={() => setOpen((o) => ({ ...o, [n.label]: !o[n.label] }))} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 font-semibold text-slate-600 hover:bg-slate-100 transition">
                  {n.label}
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open[n.label] ? "rotate-180" : ""}`} />
                </button>
                {open[n.label] && (
                  <div className="mb-1">
                    {n.children.map((c) => (
                      <button key={c.leaf + c.label} onClick={() => select(c.leaf)} className={`block w-full rounded-lg px-3 py-1.5 text-left transition ${active === c.leaf ? "bg-[#e8f6ff] text-[#00b7ff] font-bold" : "text-slate-500 hover:bg-slate-100 hover:text-[#0f172a]"}`}>{c.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button key={n.label} onClick={() => select(n.leaf!)} className={`block w-full rounded-lg px-2.5 py-2 text-left font-semibold transition ${active === n.leaf ? "bg-[#e8f6ff] text-[#00b7ff]" : "text-slate-600 hover:bg-slate-100"}`}>{n.label}</button>
            )
          )}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        {active === "instances" && !wizard && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-[#0f172a]">Instances</h2>
                <p className="text-sm text-slate-500">Instances are billed per hour while running.</p>
              </div>
              <button onClick={() => setWizard(true)} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#009fe0] transition flex items-center gap-2"><Plus className="w-4 h-4" /> Create an instance</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-10 text-center">
              <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-[#0f172a]">No instances yet</p>
              <p className="text-sm text-slate-500 mt-1">Launch your first instance — you only pay for the hours it runs.</p>
            </div>
            {projectState === "pending" && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Your project activation is being verified. Instances will be provisioned automatically once the project is active.
              </div>
            )}
          </div>
        )}

        {active === "instances" && wizard && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-6 min-w-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0f172a]">Create an instance</h2>
                <button onClick={() => setWizard(false)} className="text-sm text-slate-500 hover:text-[#00b7ff]">Cancel</button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-3">Instance name</p>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. web-server-01" className={inputCls} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-1">Select a region</p>
                <p className="text-xs text-slate-500 mb-4">Filter a deployment mode</p>
                <div className="grid sm:grid-cols-3 gap-3 mb-5">
                  {DEPLOY_MODES.map((m) => (
                    <button key={m.id} onClick={() => { setDeployMode(m.id); setRegion(""); }} className={`text-left rounded-xl border-2 p-4 transition relative ${deployMode === m.id ? "border-[#00b7ff] bg-[#e8f6ff]" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold mb-2 ${m.badge === "NEW" ? "bg-[#00ff88]/20 text-emerald-600" : "bg-[#00b7ff]/15 text-[#00b7ff]"}`}>{m.badge === "NEW" ? "NEW" : m.tag}</span>
                      <p className="text-sm font-bold text-[#0f172a]">{m.title}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1.5">Select a geographic area</p>
                  <select value={geo} onChange={(e) => setGeo(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 outline-none">
                    {GEO_AREAS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 mb-4">
                  {REGIONS[deployMode].filter((r) => geo === "All" || r.area === geo).map((r) => (
                    <button key={r.code} onClick={() => setRegion(r.code)} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-sm transition ${region === r.code ? "border-[#00b7ff] bg-[#e8f6ff] font-bold" : "border-slate-200 hover:border-slate-300"}`}>
                      <span>{r.flag}</span>
                      <span className="flex-1 text-left"><span className="block font-semibold text-[#0f172a]">{r.name}</span><span className="block text-[10px] text-slate-400">{r.code}</span></span>
                      <span className="rounded bg-[#00b7ff]/15 text-[#00b7ff] px-1.5 py-0.5 text-[9px] font-bold">{DEPLOY_MODES.find(m => m.id === deployMode)?.tag}</span>
                    </button>
                  ))}
                </div>
                {region && (
                  <div>
                    <p className="text-xs font-bold text-[#0f172a] mb-2">Choose your Availability Zone</p>
                    <p className="text-[11px] text-slate-500 mb-2">A default Availability Zone has been selected. You can customise this choice.</p>
                    <label className="flex items-center gap-2 text-sm mb-1 cursor-pointer"><input type="radio" checked={azChoice === "auto"} onChange={() => setAzChoice("auto")} className="accent-[#00b7ff]" />Choose for me</label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" checked={azChoice === "manual"} onChange={() => setAzChoice("manual")} className="accent-[#00b7ff]" />I choose my availability zone
                      {azChoice === "manual" && (
                        <select value={az} onChange={(e) => setAz(e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs">
                          {["a", "b", "c"].map((z) => <option key={z}>{region}-{z.toUpperCase()}</option>)}
                        </select>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <p className="font-bold text-[#0f172a]">Select a model</p>
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer order-last">
                    <input type="checkbox" checked={inclUnavailable} onChange={(e) => setInclUnavailable(e.target.checked)} className="accent-[#00b7ff] w-3.5 h-3.5" />Include unavailable
                  </label>
                </div>
                <div className="flex flex-wrap items-end gap-4 mb-4">
                  <div><p className="text-[11px] text-slate-500 mb-1">Instance model</p>
                    <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 outline-none w-44"><option>Best Sellers <span className="text-emerald-600">New</span></option><option>All models</option></select></div>
                  <div><p className="text-[11px] text-slate-500 mb-1">Type</p>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 outline-none w-44">
                      {MODEL_FILTERS.map((t) => <option key={t}>{t}</option>)}
                    </select></div>
                  <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs w-40 outline-none focus:border-[#00b7ff]" />
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left min-w-[720px]">
                    <thead className="sticky top-0 bg-[#f8faff]">
                      <tr className="border-b border-slate-200">
                        <th className={th}></th><th className={th}>Name</th><th className={th}>Memory</th><th className={th}>vCore</th><th className={th}>Storage</th><th className={th}>GPU</th><th className={th}>Deployment</th><th className={th}>₹/hour</th><th className={th}>~₹/month</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlavors.map((f) => (
                        <tr key={f.code} onClick={() => pickModel(f)} className={`border-b border-slate-100 cursor-pointer transition ${model?.code === f.code ? "bg-[#e8f6ff]" : "hover:bg-[#f8faff]"}`}>
                          <td className="px-4 py-2.5"><span className={`inline-block w-4 h-4 rounded-full border-2 ${model?.code === f.code ? "border-[#00b7ff] bg-[#00b7ff]" : "border-slate-300"}`} /></td>
                          <td className="px-4 py-2.5 text-sm font-bold text-[#00b7ff]">{f.code}</td>
                          <td className="px-4 py-2.5 text-sm">{f.specs?.memory || "—"}</td>
                          <td className="px-4 py-2.5 text-sm">{f.specs?.vcore || "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.specs?.storage || "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-500">{f.specs?.gpu || "—"}</td>
                          <td className="px-4 py-2.5"><span className="rounded bg-[#00b7ff]/15 text-[#00b7ff] px-1.5 py-0.5 text-[9px] font-bold">{DEPLOY_MODES.find(m => m.id === deployMode)?.tag}</span></td>
                          <td className="px-4 py-2.5 text-sm font-bold">{fmt(f.hour)}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-500">~{fmt(f.month)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storage */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-3">Storage</p>
                <div className="rounded-xl border-2 border-[#00b7ff] bg-[#f8faff] p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">Local Storage — Low Latency <span className="ml-1 rounded bg-[#00b7ff]/15 text-[#00b7ff] px-1.5 py-0.5 text-[10px] font-bold">System</span></p>
                    <p className="text-xs text-slate-500 mt-1">{storage} GB NVMe</p>
                    <input type="range" min={10} max={400} step={10} value={storage} onChange={(e) => setStorage(+e.target.value)} className="w-48 accent-[#00b7ff] mt-2" />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#0f172a]">{fmt((leafLookup["local"]?.items?.[0]?.hour || 0) * storage)} / hour</p>
                    <p className="text-xs text-slate-500">~{fmt((leafLookup["local"]?.items?.[0]?.hour || 0) * storage * 730)} / month</p>
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-3">Select an image</p>
                <p className="text-xs text-slate-500 mb-2">Distribution type</p>
                <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 mb-4 outline-none"><option>Unix distributions</option><option>Windows</option><option>Application images</option></select>
                <p className="text-[11px] text-slate-400 mb-3">To use the images, you will need to accept the supplier's user licence agreement.</p>
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  {DISTROS.map((d) => (
                    <button key={d.id} onClick={() => { setDistro(d.id); setImageVersion(d.versions[d.versions.length - 1]); }} className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${distro === d.id ? "border-[#00b7ff] bg-[#e8f6ff]" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className={`inline-block w-4 h-4 rounded-full border-2 shrink-0 ${distro === d.id ? "border-[#00b7ff] bg-[#00b7ff]" : "border-slate-300"}`} />
                      <span className="w-6 h-6 rounded flex items-center justify-center text-[11px] font-black text-white shrink-0" style={{ background: d.color }}>{d.label[0].toUpperCase()}</span>
                      <span className="text-sm font-semibold text-[#0f172a]">{d.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mb-2">Image version</p>
                <select value={imageVersion} onChange={(e) => setImageVersion(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 outline-none">
                  {(DISTROS.find((d) => d.id === distro)?.versions || []).map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>

              {/* SSH key */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-3">Select an SSH key</p>
                {!sshValidated && <p className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2.5 mb-4">You do not have an SSH key, so you will not be able to connect to your server. Create a key to access your server.</p>}
                <p className="text-xs text-slate-500 mb-2">SSH key name</p>
                <input value={sshKeyName} onChange={(e) => setSshKeyName(e.target.value)} className={`${inputCls} mb-3`} placeholder="my-key" />
                <p className="text-xs text-slate-500 mb-2">Enter your SSH key</p>
                <textarea value={sshKey} onChange={(e) => setSshKey(e.target.value)} rows={4} className={`${inputCls} font-mono text-xs`} placeholder="ssh-rsa AAAA..." />
                <p className="text-[10px] text-slate-400 mt-2">The SSH keys accepted are RSA, ECDSA and ED25519. Your SSH key will be available across all regions and datacentres in your project.</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setSshKey(""); setSshKeyName(""); setSshValidated(false); }} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={() => { if (sshKey.trim() && sshKeyName.trim()) { setSshValidated(true); showToast("SSH key saved", "success"); } else showToast("Enter key name and key", "error"); }} disabled={!sshKey.trim() || !sshKeyName.trim()} className="rounded-lg bg-[#00b7ff] px-5 py-2 text-sm font-bold text-white hover:bg-[#009fe0] disabled:opacity-40">{sshValidated ? "Key added ✓" : "Validate key"}</button>
                </div>
              </div>

              {/* Backup settings */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-1">Backup settings</p>
                <p className="text-xs text-slate-500 mb-4">This feature allows you to automatically back up your instance, as often as you like.</p>
                <label className="flex items-center gap-3 mb-2 cursor-pointer">
                  <button type="button" onClick={() => setBackup(!backup)} className={`w-10 h-5 rounded-full relative transition ${backup ? "bg-[#00b7ff]" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${backup ? "left-5" : "left-0.5"}`} /></button>
                  <span className="text-sm text-[#0f172a]">Automatic Instance Backup (Local)</span>
                  <span className="rounded bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">Recommended</span>
                </label>
                <p className="text-xs text-slate-500 mb-4">Each backup will be billed at: {fmt(0.9775)} ex. VAT/month/GB</p>
                {backup && (
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
                    {[{ id: "7" as const, t: "Rotation 7", d: "A backup is taken every day between 22:00 and 06:00 (UTC), and the rotation maintains a log of the 7 latest entries." }, { id: "14" as const, t: "Rotation 14", d: "A backup is taken every day between 22:00 and 06:00 (UTC), and the rotation maintains a log of the 14 latest entries." }, { id: "custom", t: "Custom", d: "Choose the scheduling yourself (UNIX Cron format), the number of rotations, and the maximum executions.", soon: true }].map((r) => (
                      <button key={r.id} disabled={r.soon} onClick={() => setRotation(r.id as any)} className={`text-left rounded-xl border-2 p-4 transition relative ${rotation === r.id ? "border-[#00b7ff] bg-[#e8f6ff]" : "border-slate-200"} ${r.soon ? "opacity-50" : "hover:border-slate-300"}`}>
                        <span className={`inline-block w-4 h-4 rounded-full border-2 mb-2 ${rotation === r.id ? "border-[#00b7ff] bg-[#00b7ff]" : "border-slate-300"}`} />
                        <p className="text-sm font-bold text-[#0f172a]">{r.t} {r.soon && <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[9px]">Coming soon</span>}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{r.d}</p>
                      </button>
                    ))}
                  </div>
                )}
                <label className="flex items-center gap-3 cursor-pointer opacity-60">
                  <span className="w-10 h-5 rounded-full bg-slate-300 relative"><span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow" /></span>
                  <span className="text-sm text-slate-500">Add a remote backup (Optional)</span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">Coming soon</span>
                </label>
              </div>

              {/* Network settings */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-1">Network settings</p>
                <p className="text-xs text-slate-500 mb-1">Private network</p>
                <p className="text-xs text-slate-500 mb-4">Instances are in a private network. Internet or SSH access requires a Floating IP, a Gateway or an SSH-Proxy.<br />Your private network will be created at the end of the configuration process. You can edit it.</p>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div><p className="text-xs text-slate-500 mb-1.5">Private network name</p><input defaultValue={`pn-${region || "REG"}-${new Date().getFullYear()}`} className={inputCls} /></div>
                  <div><p className="text-xs text-slate-500 mb-1.5">VLAN ID</p><input value={vlanId} onChange={(e) => setVlanId(e.target.value)} className={inputCls} /></div>
                </div>
                <p className="text-xs text-slate-500 mb-1.5">CIDR</p>
                <input value={cidr} onChange={(e) => setCidr(e.target.value)} className={`${inputCls} mb-3`} />
                <label className="flex items-center gap-2 mb-4 text-sm text-[#0f172a] cursor-pointer"><input type="checkbox" checked={dhcp} onChange={(e) => setDhcp(e.target.checked)} className="accent-[#00b7ff] w-4 h-4" />DHCP enabled</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <button type="button" onClick={() => setGatewayOn(!gatewayOn)} className={`w-10 h-5 rounded-full relative transition ${gatewayOn ? "bg-[#00b7ff]" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${gatewayOn ? "left-5" : "left-0.5"}`} /></button>
                  <span className="text-sm text-[#0f172a]">Assign a gateway - Size S — {fmt(leafLookup["gateway"]?.items?.[0]?.hour)} / hour</span>
                </label>
              </div>

              {/* Public connectivity */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-1">Assign public connectivity</p>
                <p className="text-xs text-slate-500 mb-4">By assigning a public IP address, you can access your instance from outside the private network.</p>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked={publicIp === "basic"} onChange={() => setPublicIp("basic")} className="accent-[#00b7ff] w-4 h-4 mt-0.5" />
                    <span><span className="text-sm font-semibold text-[#0f172a]">Basic Public IP (linked to the instance)</span> — {fmt(leafLookup["floatingip"]?.items?.find(i => i.code === "publicip.ip")?.hour)} / hour<br /><span className="text-xs text-slate-500">A basic public IP is an IP address that only lasts as long as the lifetime of the resource.</span></span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked={publicIp === "floating"} onChange={() => setPublicIp("floating")} className="accent-[#00b7ff] w-4 h-4 mt-0.5" />
                    <span><span className="text-sm font-semibold text-[#0f172a]">Assign a Floating IP (Reusable)</span><br /><span className="text-xs text-slate-500">By selecting this option, we will assign you an S sized gateway.</span></span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="radio" checked={publicIp === "none"} onChange={() => setPublicIp("none")} className="accent-[#00b7ff] w-4 h-4 mt-0.5" />
                    <span className="text-sm font-semibold text-[#0f172a]">No public IP</span>
                  </label>
                </div>
              </div>

              {/* Advanced */}
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <p className="font-bold text-[#0f172a] mb-3">Advanced settings</p>
                <p className="text-sm font-semibold text-[#0f172a] mb-1">Flexible instance</p>
                <p className="text-xs text-slate-500 mb-2">The Flex option opts for 50GB storage, providing faster snapshots and the ability to downgrade later on.</p>
                <label className="flex items-center gap-2 mb-5 cursor-pointer"><input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} className="accent-[#00b7ff] w-4 h-4" /><span className="text-sm text-[#0f172a]">Flexible instance</span></label>
                <p className="text-sm font-semibold text-[#0f172a] mb-1">Post-installation script</p>
                <p className="text-xs text-slate-500 mb-2">Enter your post-installation script</p>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <button type="button" onClick={() => setPostScript(!postScript)} className={`w-10 h-5 rounded-full relative transition ${postScript ? "bg-[#00b7ff]" : "bg-slate-300"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${postScript ? "left-5" : "left-0.5"}`} /></button>
                  <span className="text-sm text-[#0f172a]">Add a post-installation script</span>
                </label>
                {postScript && <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={3} className={`${inputCls} font-mono text-xs`} placeholder="#!/bin/bash&#10;apt-get update && apt-get install -y nginx" />}
              </div>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-5 self-start sticky top-4">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Instance</p>
              <p className="text-sm font-bold text-[#0f172a] mb-4 truncate">{name || (model ? `${model.code}-auto` : "—")}</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Number of instances</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setNumInstances(Math.max(1, numInstances - 1))} className="w-7 h-7 rounded border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">−</button>
                    <span className="w-8 text-center font-bold text-[#0f172a]">{numInstances}</span>
                    <button onClick={() => setNumInstances(Math.min(10, numInstances + 1))} className="w-7 h-7 rounded border border-slate-300 text-slate-600 font-bold hover:bg-slate-50">+</button>
                  </div>
                </div>
                <div><p className="text-xs text-slate-500">Location</p><p className="font-semibold text-[#0f172a]">{region ? `${REGIONS[deployMode].find(r => r.code === region)?.name || region} (${region})` : "—"}</p></div>
                <div>
                  <p className="text-xs text-slate-500">Server model</p>
                  <p className="font-semibold text-[#0f172a]">{model?.code || "—"}</p>
                  {model && <p className="text-[11px] text-slate-500 mt-0.5">{model.specs?.memory} RAM · {model.specs?.vcore} vCPU · {model.specs?.storage}{model.specs?.gpu ? ` · ${model.specs.gpu}` : ""}</p>}
                </div>
                <div><p className="text-xs text-slate-500">Storage</p><p className="font-semibold text-[#0f172a]">Local Storage — Low latency</p><p className="text-[11px] text-slate-500">1x {storage} GB NVMe{flexible ? " · Flex" : ""}</p></div>
                <div><p className="text-xs text-slate-500">Image</p><p className="font-semibold text-[#0f172a]">{imageVersion}</p></div>
                {backup && <div><p className="text-xs text-slate-500">Backup</p><p className="font-semibold text-[#0f172a]">Automatic backup (local) — Rotation {rotation}</p></div>}
                <div><p className="text-xs text-slate-500">Private network</p><p className="font-semibold text-[#0f172a]">pn-{region || "REG"} · VLAN {vlanId}{gatewayOn ? " + gateway" : ""}</p></div>
                <div><p className="text-xs text-slate-500">Public network</p><p className="font-semibold text-[#0f172a]">{publicIp === "basic" ? "Basic Public IP" : publicIp === "floating" ? "Floating IP" : "Private only"}</p></div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total</p>
                  <div className="flex justify-between"><span className="text-slate-500">Estimated price per hour</span><span className="font-bold text-[#0f172a]">{model ? fmt((model.hour || 0) * numInstances + (publicIp === "basic" ? (leafLookup["floatingip"]?.items?.find(i => i.code === "publicip.ip")?.hour || 0) : 0) + (gatewayOn ? (leafLookup["gateway"]?.items?.[0]?.hour || 0) : 0)) : "—"}</span></div>
                  <div className="flex justify-between mt-1"><span className="text-slate-500">Estimated monthly</span><span className="font-semibold text-[#0f172a]">{model ? fmt((model.month || 0) * numInstances) : "—"}</span></div>
                  <div className="flex justify-between mt-2 text-xs"><span className="text-slate-500">Wallet balance</span><span className={balance < needAmount && model ? "text-red-500 font-bold" : "text-emerald-600 font-bold"}>{sym}{balance.toFixed(2)}</span></div>
                </div>
              </div>
              {model && balance < needAmount && (
                <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                  Low balance — top up your wallet to launch ({fmt((model.hour || 0) * 24)} covers ~24h).
                </div>
              )}
              <button
                onClick={model && balance < needAmount ? () => onTab?.("wallet") : doLaunch}
                disabled={!model || !region || launching}
                className="mt-5 w-full rounded-lg bg-[#00b7ff] py-3 text-sm font-bold text-white hover:bg-[#009fe0] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : model && balance < needAmount ? <><CreditCard className="w-4 h-4" /> Add funds to launch</> : "Configure your instance"}
              </button>
              <p className="mt-3 text-[10px] text-slate-400 text-center">Excluding taxes. Billed per hour while running.</p>
            </aside>
          </div>
        )}

        {sec && (
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">{sec.title}</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5 max-w-2xl">{sec.desc}</p>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className={th}>Name</th><th className={th}>Price / hour</th><th className={th}>~Price / month</th><th className={th}></th></tr></thead>
                <tbody>
                  {(sec.items || []).slice(0, 40).map((i) => (
                    <tr key={i.code} className="border-b border-slate-100 hover:bg-[#f8faff] transition">
                      <td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{i.name !== i.code ? i.name : i.code}</td>
                      <td className="px-4 py-3 text-sm font-bold text-[#0f172a]">{fmt(i.hour)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">~{fmt(i.month)}</td>
                      <td className="px-4 py-3"><button onClick={() => enableService(sec, i)} disabled={launching} className="rounded bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#009fe0] disabled:opacity-40">Enable</button></td>
                    </tr>
                  ))}
                  {(sec.simpleRows || []).map((r) => (
                    <tr key={r.name} className="border-b border-slate-100"><td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{r.name}</td><td className="px-4 py-3 text-sm text-[#0f172a]" colSpan={2}>{r.price}</td><td className="px-4 py-3"><button onClick={() => enableService(sec)} disabled={launching} className="rounded bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#009fe0] disabled:opacity-40">Enable</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">Billed per hour inside your project while the resource exists.</p>
          </div>
        )}

        {active === "iam" && (
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">Identity & Security Ops</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Manage project access, users and security policies.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[{ t: "Project users", d: "Add team members with scoped access to this project." }, { t: "API tokens", d: "Create tokens for automation and CLI access." }, { t: "SSH keys", d: "Manage public keys injected into new instances." }, { t: "Security groups", d: "Firewall rules applied to instance ports." }].map((c) => (
                <div key={c.t} className="rounded-xl border border-slate-200 bg-white/60 p-5">
                  <p className="font-bold text-[#0f172a] text-sm">{c.t}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.d}</p>
                  <button onClick={() => onTab?.("profile")} className="mt-3 text-xs font-bold text-[#00b7ff] hover:underline">Manage →</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
