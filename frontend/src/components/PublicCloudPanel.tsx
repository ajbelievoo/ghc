"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { useToast } from "@/components/ToastProvider";
import { getCloudCatalog, FALLBACK_CATALOG } from "@/lib/cloudLive";
import {
  ChevronDown, Search, Plus, Cpu, HardDrive, Network, Container, Database,
  Brain, Atom, Layers, FolderOpen, Loader2, Wallet, CreditCard, Server, Check,
  RefreshCw, Play, Power, Trash2, KeyRound, Globe2,
} from "lucide-react";

const MARGIN = 1.2;

interface PriceItem { code: string; name: string; hour?: number | null; month?: number | null; hourFmt?: string | null; monthFmt?: string | null; specs?: Record<string, string>; }
interface Leaf { id: string; title: string; desc: string; families?: any[]; items?: PriceItem[]; simpleRows?: { name: string; price: string; note?: string }[]; }

interface TreeLeaf { label: string; leaf: string; badge?: string }
interface TreeNode { label: string; leaf?: string; children?: TreeLeaf[] }

const buildTree = (cd: Record<string, Leaf[]>): TreeNode[] => [
  { label: "Compute",
    children: [
      { label: "Instances", leaf: "instances" },
      { label: "Instance Backup", leaf: "svc:backup" },
      { label: "Workflow Management", leaf: "svc:block" },
      { label: "SSH Keys", leaf: "svc:sshkeys" },
    ],
  },
  {
    label: "Storage",
    children: [
      { label: "Block Storage", leaf: "svc:block" },
      { label: "File Storage", leaf: "svc:file", badge: "NEW" },
      { label: "Volume Snapshot", leaf: "svc:block" },
      { label: "Volume Backup", leaf: "svc:backup" },
      { label: "Object Storage", leaf: "svc:object" },
      { label: "Cloud Archive", leaf: "svc:object" },
    ],
  },
  {
    label: "Network",
    children: [
      { label: "Private Network", leaf: "svc:vrack" },
      { label: "Load Balancer", leaf: "svc:loadbalancer", badge: "NEW" },
      { label: "Public IPs", leaf: "svc:floatingip", badge: "NEW" },
      { label: "Gateway", leaf: "svc:gateway" },
    ],
  },
  {
    label: "Containers & Orchestration",
    children: [
      { label: "Managed Rancher Service", leaf: "svc:rancher", badge: "NEW" },
      { label: "Managed Kubernetes Service", leaf: "svc:k8s" },
      { label: "Managed Private Registry", leaf: "svc:registry" },
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

const DISTROS: { id: string; label: string; versions: { v: string; off?: boolean }[] }[] = [
  { id: "almalinux", label: "almalinux", versions: ["AlmaLinux 10 - UEFI", "AlmaLinux 10", "AlmaLinux 9 - UEFI", "AlmaLinux 9", "AlmaLinux 8 - UEFI", "AlmaLinux 8"].map(v => ({ v })) },
  { id: "cloudlinux", label: "cloudlinux", versions: ["CloudLinux 9.6", "CloudLinux 9", "CloudLinux 8.10"].map(v => ({ v })) },
  { id: "debian", label: "debian", versions: ["Debian 13 - UEFI", "Debian 13", "Debian 12 - UEFI", "Debian 12", "Debian 11"].map(v => ({ v })) },
  { id: "fedora", label: "fedora", versions: ["Fedora 44 - UEFI", "Fedora 44", "Fedora 43 - UEFI", "Fedora 43"].map(v => ({ v })) },
  { id: "freebsd", label: "freebsd", versions: [{ v: "FreeBSD-15-zfs - UEFI" }, { v: "FreeBSD-15-ufs - UEFI" }, { v: "FreeBSD-14.5-zfs - UEFI", off: true }, { v: "FreeBSD-14.5-ufs - UEFI", off: true }, { v: "FreeBSD-14.3 - UEFI" }] },
  { id: "rockylinux", label: "rockylinux", versions: ["Rocky Linux 9 - UEFI", "Rocky Linux 9", "Rocky Linux 8 - UEFI", "Rocky Linux 8"].map(v => ({ v })) },
  { id: "ubuntu", label: "ubuntu", versions: ["Ubuntu 26.04 - UEFI", "Ubuntu 26.04", "Ubuntu 24.04 - UEFI", "Ubuntu 24.04", "Ubuntu 22.04 - UEFI", "Ubuntu 22.04"].map(v => ({ v })) },
];

export default function PublicCloudPanel({ wallet, user, onTab, launch }: { wallet?: any; user?: any; onTab?: (t: string) => void; launch?: string | null }) {
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const [catData, setCatData] = useState<Record<string, Leaf[]>>(FALLBACK_CATALOG as any);
  const [active, setActive] = useState("instances");
  const [open, setOpen] = useState<Record<string, boolean>>({ Compute: true });
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
  const [imageVersion, setImageVersion] = useState(DISTROS[0].versions[0].v);
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
  const [instances, setInstances] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [sshKeys, setSshKeys] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [floatingIps, setFloatingIps] = useState<any[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [volForm, setVolForm] = useState({ name: "", size_gb: 50, region: "GRA" });
  const [cForm, setCForm] = useState({ name: "", region: "GRA" });
  const [fipRegion, setFipRegion] = useState("GRA");

  const cur = (wallet?.currency || currency || "INR").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const rate = cur === "INR" ? 1 : cur === "USD" ? 1 / 83.5 : cur === "EUR" ? 1 / 90 : 1;
  const fmt = (v?: number | null) => {
    if (typeof v !== "number") return "—";
    const p = v * MARGIN * rate;
    const dec = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
    return `${sym}${p.toLocaleString("en-IN", { maximumFractionDigits: dec })}`;
  };
  // For values already margin-applied by the backend (instance/volume prices)
  const fmtNoMargin = (v?: number | null) => {
    if (typeof v !== "number") return "—";
    const p = v * rate;
    const dec = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
    return `${sym}${p.toLocaleString("en-IN", { maximumFractionDigits: dec })}`;
  };

  useEffect(() => {
    let on = true;
    getCloudCatalog().then((d) => { if (on) setCatData(d); });
    api.cloud.project().then((p) => { if (on) setProject(p); }).catch(() => {});
    api.cloud.instances().then((l) => { if (on) setInstances(Array.isArray(l) ? l : []); }).catch(() => {});
    return () => { on = false; };
  }, []);

  // Poll instance status every 15s while the panel is open
  useEffect(() => {
    const t = setInterval(() => {
      api.cloud.instances().then((l) => setInstances(Array.isArray(l) ? l : [])).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, []);

  // Load per-section resources lazily
  useEffect(() => {
    if (active === "svc:block") api.cloud.volumes().then((v) => setVolumes(Array.isArray(v) ? v : [])).catch(() => {});
    if (active === "svc:floatingip") api.cloud.floatingIps().then((v) => setFloatingIps(Array.isArray(v) ? v : [])).catch(() => {});
    if (active === "svc:object") api.cloud.containers().then((v) => setContainers(Array.isArray(v) ? v : [])).catch(() => {});
    if (active === "svc:sshkeys") api.cloud.sshKeys().then((v) => setSshKeys(Array.isArray(v) ? v : [])).catch(() => {});
  }, [active]);

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
      await api.cloud.createInstance({
        instance_name: name || model.code, region, deploy_mode: deployMode,
        flavor: model.code, count: numInstances, storage_gb: storage,
        image: imageVersion, ssh_key_name: sshValidated ? sshKeyName : undefined,
        public_ip: publicIp,
        network: { vlan_id: vlanId, cidr, dhcp, gateway: gatewayOn ? "s" : "none" },
        post_script: postScript ? script : undefined, flexible,
      });
      showToast("Instance launched — provisioning started", "success");
      setWizard(false);
      setActive("instances");
      refreshInstances();
    } catch (e: any) {
      const msg = e.message || "Launch failed";
      if (/activation|pending|409/i.test(msg)) {
        showToast("Cloud project activation in progress — retry in a few minutes", "error");
        setProjectState("pending");
      } else if (/balance|402/i.test(msg)) {
        showToast(msg, "error");
        onTab?.("wallet");
      } else {
        showToast(msg, "error");
      }
    } finally { setLaunching(false); }
  };

  const refreshInstances = async () => {
    try {
      const list = await api.cloud.instances();
      setInstances(Array.isArray(list) ? list : []);
    } catch { /* keep list */ }
  };

  const instAction = async (id: string, action: string) => {
    try {
      await api.cloud.instanceAction(id, action);
      showToast(`Instance ${action} requested`, "success");
      refreshInstances();
    } catch (e: any) { showToast(e.message || `Could not ${action}`, "error"); }
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
                      <button key={c.leaf + c.label} onClick={() => select(c.leaf)} className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left transition ${active === c.leaf ? "bg-[#e8f6ff] text-[#00b7ff] font-bold" : "text-slate-500 hover:bg-slate-100 hover:text-[#0f172a]"}`}><span>{c.label}</span>{c.badge && <span className="rounded bg-emerald-100 text-emerald-600 px-1.5 py-0.5 text-[9px] font-bold">{c.badge}</span>}</button>
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
                <p className="text-sm text-slate-500">Instances are billed per hour while running{project?.status === "ACTIVE" ? "" : " — project activating"}.</p>
              </div>
              <button onClick={() => setWizard(true)} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2.5 text-sm font-bold hover:bg-[#009fe0] transition flex items-center gap-2"><Plus className="w-4 h-4" /> Create an instance</button>
            </div>
            {project?.status !== "ACTIVE" && (
              <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Your cloud project is being activated upstream. New instances will provision automatically once active.
              </div>
            )}
            {instances.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-10 text-center">
                <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-[#0f172a]">No instances yet</p>
                <p className="text-sm text-slate-500 mt-1">Launch your first instance — you only pay for the hours it runs.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50/60">
                    <tr>
                      <th className={th}>Name</th><th className={th}>Model</th><th className={th}>Region</th>
                      <th className={th}>Public IP</th><th className={th}>Status</th><th className={th}>Price</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {instances.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#0f172a]">{i.name}</p>
                          <p className="text-[11px] text-slate-400">{i.image || "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">{i.flavor}</td>
                        <td className="px-4 py-3 text-sm">{i.region}</td>
                        <td className="px-4 py-3 text-sm font-mono">{i.public_ip || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            i.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" :
                            i.status === "BUILDING" || i.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                            i.status === "SUSPENDED" ? "bg-orange-100 text-orange-700" :
                            i.status === "STOPPED" ? "bg-slate-200 text-slate-600" : "bg-red-100 text-red-700"}`}>
                            {(i.status === "BUILDING" || i.status === "PENDING") && <Loader2 className="w-3 h-3 animate-spin" />}
                            {i.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold">{fmtNoMargin(i.hourly)}/hr</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {i.status === "ACTIVE" && (
                              <>
                                <button title="Reboot" onClick={() => instAction(i.id, "reboot")} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#00b7ff]"><RefreshCw className="w-4 h-4" /></button>
                                <button title="Stop" onClick={() => instAction(i.id, "stop")} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600"><Power className="w-4 h-4" /></button>
                                <button title="Reinstall" onClick={() => { if (confirm(`Reinstall ${i.name}? All data on the system disk is wiped.`)) instAction(i.id, "reinstall"); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-violet-600"><HardDrive className="w-4 h-4" /></button>
                              </>
                            )}
                            {(i.status === "STOPPED" || i.status === "SUSPENDED") && (
                              <button title="Start" onClick={() => instAction(i.id, "start")} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600"><Play className="w-4 h-4" /></button>
                            )}
                            <button title="Delete" onClick={() => { if (confirm(`Delete instance ${i.name}? Billing stops immediately.`)) instAction(i.id, "delete"); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 mb-4 outline-none">
                  <option>Unix distributions</option>
                  <option>Distributions + Apps</option>
                  <option>Windows distributions</option>
                  <option disabled>Backups — Unavailable</option>
                </select>
                <p className="text-[11px] text-slate-400 mb-3">To use the images, you will need to accept the supplier's user licence agreement.</p>
                <div className="grid sm:grid-cols-3 gap-3 mb-4">
                  {DISTROS.map((d) => (
                    <button key={d.id} onClick={() => { setDistro(d.id); setImageVersion(d.versions[0].v); }} className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition ${distro === d.id ? "border-[#00b7ff] bg-[#e8f6ff]" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className={`inline-block w-4 h-4 rounded-full border-2 shrink-0 ${distro === d.id ? "border-[#00b7ff] bg-[#00b7ff]" : "border-slate-300"}`} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/distros/${d.id}.svg`} alt={d.label} className="w-6 h-6 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-sm font-semibold text-[#0f172a]">{d.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mb-2">Image version</p>
                <select value={imageVersion} onChange={(e) => setImageVersion(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 outline-none">
                  {(DISTROS.find((d) => d.id === distro)?.versions || []).map((ver) => <option key={ver.v} value={ver.v} disabled={ver.off}>{ver.v}{ver.off ? " — Version unavailable" : ""}</option>)}
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

        {active === "svc:sshkeys" && (
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">SSH Keys</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Public keys injected into new instances at launch.</p>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5 mb-5">
              <p className="text-sm font-bold text-[#0f172a] mb-3">Add a key</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <input value={sshKeyName} onChange={(e) => setSshKeyName(e.target.value)} placeholder="Key name (e.g. my-laptop)" className={inputCls} />
                <select value={region || "GRA"} onChange={(e) => setRegion(e.target.value)} className={inputCls}>
                  {["GRA","RBX","SBG","DE","UK","WAW","BHS","SGP","SYD"].map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <textarea value={sshKey} onChange={(e) => setSshKey(e.target.value)} rows={3} placeholder="ssh-ed25519 AAAA... or ssh-rsa AAAA..." className={`${inputCls} font-mono text-xs mb-3`} />
              <button onClick={async () => {
                try {
                  await api.cloud.createSshKey({ name: sshKeyName, public_key: sshKey, region });
                  showToast("SSH key added", "success");
                  setSshKey(""); setSshKeyName("");
                  api.cloud.sshKeys().then((v) => setSshKeys(Array.isArray(v) ? v : []));
                } catch (e: any) { showToast(e.message, "error"); }
              }} disabled={!sshKeyName || !sshKey} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-bold hover:bg-[#009fe0] disabled:opacity-40 flex items-center gap-2"><KeyRound className="w-4 h-4" /> Add key</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className={th}>Name</th><th className={th}>Fingerprint</th><th className={th}>Region</th><th className={th}></th></tr></thead>
                <tbody>
                  {sshKeys.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No keys yet — add one above</td></tr>}
                  {sshKeys.map((k) => (
                    <tr key={k.id} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-sm font-semibold">{k.name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{k.fingerprint}</td>
                      <td className="px-4 py-3 text-sm">{k.region || "all"}</td>
                      <td className="px-4 py-3 text-right"><button onClick={async () => { await api.cloud.deleteSshKey(k.id); setSshKeys((p) => p.filter((x) => x.id !== k.id)); }} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {sec && (
          <div>
            <h2 className="text-xl font-bold text-[#0f172a]">{sec.title}</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5 max-w-2xl">{sec.desc}</p>

            {/* --- Managed resources --- */}
            {active === "svc:block" && (
              <div className="mb-6">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 mb-4">
                  <p className="text-sm font-bold mb-3">Create a volume</p>
                  <div className="grid sm:grid-cols-4 gap-3">
                    <input value={volForm.name} onChange={(e) => setVolForm({ ...volForm, name: e.target.value })} placeholder="Volume name" className={inputCls} />
                    <input type="number" value={volForm.size_gb} onChange={(e) => setVolForm({ ...volForm, size_gb: +e.target.value })} placeholder="Size GB" className={inputCls} />
                    <select value={volForm.region} onChange={(e) => setVolForm({ ...volForm, region: e.target.value })} className={inputCls}>
                      {["GRA","RBX","SBG","DE","UK","WAW","BHS","SGP","SYD"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <button onClick={async () => {
                      try {
                        await api.cloud.createVolume({ ...volForm, hourly_price: (sec.items?.[0]?.hour || 0) * volForm.size_gb });
                        showToast("Volume creation started", "success");
                        api.cloud.volumes().then((v) => setVolumes(Array.isArray(v) ? v : []));
                      } catch (e: any) { showToast(e.message, "error"); }
                    }} disabled={!volForm.name} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-bold hover:bg-[#009fe0] disabled:opacity-40">Create</button>
                  </div>
                </div>
                {volumes.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
                    <table className="w-full text-left"><thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className={th}>Your volumes</th><th className={th}>Size</th><th className={th}>Region</th><th className={th}>Status</th><th className={th}>Attached to</th><th className={`${th} text-right`}>Actions</th></tr></thead>
                    <tbody>{volumes.map((v) => <tr key={v.id} className="border-b border-slate-100"><td className="px-4 py-3 text-sm font-semibold">{v.name}</td><td className="px-4 py-3 text-sm">{v.size_gb} GB</td><td className="px-4 py-3 text-sm">{v.region}</td><td className="px-4 py-3 text-sm">{v.status}</td><td className="px-4 py-3 text-xs font-mono text-slate-500">{v.attached_to || "—"}</td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                      {!v.attached_to && instances.filter((i) => i.status === "ACTIVE").length > 0 && (
                        <button onClick={async () => {
                          const active = instances.filter((i) => i.status === "ACTIVE" && i.upstream_instance_id);
                          const target = active[0];
                          if (!target) return showToast("No running instance to attach to", "error");
                          try { await api.cloud.volumeAction(v.id, { action: "attach", instance_id: target.upstream_instance_id }); showToast("Attach requested", "success"); api.cloud.volumes().then((x) => setVolumes(Array.isArray(x) ? x : [])); } catch (e: any) { showToast(e.message, "error"); }
                        }} className="rounded px-2 py-1 text-[11px] font-bold text-[#00b7ff] hover:bg-[#e8f6ff]">Attach</button>
                      )}
                      {v.attached_to && <button onClick={async () => { try { await api.cloud.volumeAction(v.id, { action: "detach" }); showToast("Detach requested", "success"); api.cloud.volumes().then((x) => setVolumes(Array.isArray(x) ? x : [])); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded px-2 py-1 text-[11px] font-bold text-amber-600 hover:bg-amber-50">Detach</button>}
                      <button onClick={async () => { if (!confirm(`Delete volume ${v.name}? Data is lost.`)) return; try { await api.cloud.deleteVolume(v.id); setVolumes((p) => p.filter((x) => x.id !== v.id)); showToast("Volume deleted", "success"); } catch (e: any) { showToast(e.message, "error"); } }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div></td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )}

            {active === "svc:floatingip" && (
              <div className="mb-6">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 mb-4">
                  <p className="text-sm font-bold mb-3">Reserve a Floating IP</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <select value={fipRegion} onChange={(e) => setFipRegion(e.target.value)} className={inputCls}>
                      {["GRA","RBX","SBG","DE","UK","WAW","BHS","SGP","SYD"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <p className="self-center text-xs text-slate-500">{fmt(sec.items?.find((i) => i.code === "floatingip.floatingip")?.hour)}/hr while reserved</p>
                    <button onClick={async () => {
                      try {
                        await api.cloud.createFloatingIp({ region: fipRegion, hourly_price: sec.items?.find((i) => i.code === "floatingip.floatingip")?.hour || 0 });
                        showToast("Floating IP requested", "success");
                        api.cloud.floatingIps().then((v) => setFloatingIps(Array.isArray(v) ? v : []));
                      } catch (e: any) { showToast(e.message, "error"); }
                    }} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-bold hover:bg-[#009fe0] flex items-center justify-center gap-2"><Globe2 className="w-4 h-4" /> Reserve</button>
                  </div>
                </div>
                {floatingIps.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
                    <table className="w-full text-left"><thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className={th}>Your IPs</th><th className={th}>Region</th><th className={th}>Status</th><th className={th}>Attached to</th><th className={`${th} text-right`}></th></tr></thead>
                    <tbody>{floatingIps.map((f) => <tr key={f.id} className="border-b border-slate-100"><td className="px-4 py-3 text-sm font-mono font-semibold">{f.ip || "assigning…"}</td><td className="px-4 py-3 text-sm">{f.region}</td><td className="px-4 py-3 text-sm">{f.status}</td><td className="px-4 py-3 text-xs font-mono text-slate-500">{f.attached_to || "—"}</td><td className="px-4 py-3 text-right"><button onClick={async () => { if (!confirm(`Release floating IP ${f.ip || f.id}?`)) return; try { await api.cloud.deleteFloatingIp(f.id); setFloatingIps((p) => p.filter((x) => x.id !== f.id)); showToast("IP released", "success"); } catch (e: any) { showToast(e.message, "error"); } }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button></td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )}

            {active === "svc:object" && (
              <div className="mb-6">
                <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 mb-4">
                  <p className="text-sm font-bold mb-3">Create a container</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} placeholder="Container name" className={inputCls} />
                    <select value={cForm.region} onChange={(e) => setCForm({ ...cForm, region: e.target.value })} className={inputCls}>
                      {["GRA","RBX","SBG","DE","UK","WAW","BHS","SGP","SYD"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                    <button onClick={async () => {
                      try {
                        await api.cloud.createContainer({ name: cForm.name, region: cForm.region, container_type: "standard" });
                        showToast("Container creation started", "success");
                        api.cloud.containers().then((v) => setContainers(Array.isArray(v) ? v : []));
                      } catch (e: any) { showToast(e.message, "error"); }
                    }} disabled={!cForm.name} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-bold hover:bg-[#009fe0] disabled:opacity-40">Create</button>
                  </div>
                </div>
                {containers.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden mb-4">
                    <table className="w-full text-left"><thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className={th}>Your containers</th><th className={th}>Region</th><th className={th}>Used</th><th className={th}>Status</th></tr></thead>
                    <tbody>{containers.map((c) => <tr key={c.id} className="border-b border-slate-100"><td className="px-4 py-3 text-sm font-semibold">{c.name}</td><td className="px-4 py-3 text-sm">{c.region}</td><td className="px-4 py-3 text-sm">{(c.stored_bytes / 1e9).toFixed(2)} GB · {c.objects} objects</td><td className="px-4 py-3 text-sm">{c.status}</td><td className="px-4 py-3 text-right"><button onClick={async () => { if (!confirm(`Delete container ${c.name} and all its objects?`)) return; try { await api.cloud.deleteContainer(c.id); setContainers((p) => p.filter((x) => x.id !== c.id)); showToast("Container deleted", "success"); } catch (e: any) { showToast(e.message, "error"); } }} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button></td></tr>)}</tbody></table>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available plans</p>
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
