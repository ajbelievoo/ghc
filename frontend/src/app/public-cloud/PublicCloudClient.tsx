"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { getCloudCatalog, FALLBACK_CATALOG } from "@/lib/cloudLive";
import {
  Search, ChevronDown, Cpu, Zap, Network, HardDrive, Container, Database, Brain, Atom,
} from "lucide-react";

const MARGIN = 1.2;

interface PriceItem {
  code: string; name: string; hour?: number | null; month?: number | null;
  hourFmt?: string | null; monthFmt?: string | null; specs?: Record<string, string>;
}
interface Family { id: string; tag: string; name: string; desc: string; items: PriceItem[] }
interface Leaf {
  id: string; title: string; desc: string;
  families?: Family[]; items?: PriceItem[];
  simpleRows?: { name: string; price: string; note?: string }[];
}
/* ── Sidebar tree (mirrors the public-cloud pricing IA) ── */
interface TreeLeaf { label: string; leaf: string }
interface TreeNode { label: string; leaf?: string; children?: TreeLeaf[] }
const buildTree = (cd: Record<string, Leaf[]>): TreeNode[] => [
  { label: "Overview", leaf: "overview" },
  {
    label: "Compute",
    children: [
      { label: "Virtual Machine Instances", leaf: "vm" },
      { label: "Cloud GPU", leaf: "gpu" },
      { label: "Metal Instances", leaf: "metal" },
      { label: "Instance Backup", leaf: "backup" },
      { label: "Private Image Catalog", leaf: "private-images" },
      { label: "Public Image Catalog", leaf: "public-images" },
    ],
  },
  {
    label: "Network",
    children: [
      { label: "Load Balancer", leaf: "loadbalancer" },
      { label: "Floating IP", leaf: "floatingip" },
      { label: "Gateway", leaf: "gateway" },
      { label: "Private Network (vRack)", leaf: "vrack" },
    ],
  },
  {
    label: "Storage",
    children: [
      { label: "Block Storage", leaf: "block" },
      { label: "File Storage", leaf: "file" },
      { label: "Local Storage", leaf: "local" },
      { label: "Object Storage", leaf: "object" },
    ],
  },
  {
    label: "Containers & Orchestration",
    children: [
      { label: "Managed Kubernetes", leaf: "k8s" },
      { label: "Managed Private Registry", leaf: "registry" },
      { label: "Managed Rancher", leaf: "rancher" },
    ],
  },
  {
    label: "Databases",
    children: (cd["databases"] || []).map((s) => ({ label: s.title, leaf: s.id })),
  },
  { label: "Analytics", leaf: "analytics" },
  {
    label: "Data Platform",
    children: [{ label: "Data Platform services", leaf: "dp" }],
  },
  {
    label: "AI & Machine learning",
    children: [
      { label: "AI Notebooks", leaf: "ai-notebooks" },
      { label: "AI Training", leaf: "ai-training" },
      { label: "AI Deploy", leaf: "ai-deploy" },
      { label: "AI Endpoints", leaf: "ai-endpoints" },
    ],
  },
  {
    label: "Quantum computing",
    children: [
      { label: "Quantum Notebooks", leaf: "q-notebooks" },
      { label: "Quantum Processing Units", leaf: "qpu" },
    ],
  },
  { label: "Pricing model", leaf: "pricing" },
];

export default function PublicCloudClient({ initialPlans }: { initialPlans?: any[] }) {
  const { currency } = useCurrency();
  const [catalogData, setCatalogData] = useState<Record<string, Leaf[]>>(FALLBACK_CATALOG);
  const [live, setLive] = useState(false);
  const [active, setActive] = useState("vm");
  const [open, setOpen] = useState<Record<string, boolean>>({ Compute: true });
  const [os, setOs] = useState<"linux" | "windows">("linux");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let on = true;
    getCloudCatalog().then((d) => { if (on) { setCatalogData(d); setLive(true); } });
    return () => { on = false; };
  }, []);

  const tree = useMemo(() => buildTree(catalogData), [catalogData]);
  const { leafSection, leafTitle } = useMemo(() => {
    const sec: Record<string, string> = {};
    const ttl: Record<string, string> = {};
    tree.forEach((n) => {
      const leaves = [...(n.leaf ? [{ label: n.label, leaf: n.leaf }] : []), ...(n.children || [])];
      leaves.forEach((c) => {
        const group = Object.keys(catalogData).find((g) => (catalogData[g] || []).some((s) => s.id === c.leaf));
        if (group) sec[c.leaf] = group;
        ttl[c.leaf] = c.label;
      });
    });
    return { leafSection: sec, leafTitle: ttl };
  }, [tree, catalogData]);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s) select(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (leaf: string) => {
    setActive(leaf);
    const parent = tree.find((n) => (n.children || []).some((c) => c.leaf === leaf));
    if (parent) setOpen((o) => ({ ...o, [parent.label]: true }));
    window.history.replaceState(null, "", `?s=${leaf}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cur = (currency || "INR").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const rate = cur === "INR" ? 1 : cur === "USD" ? 1 / 83.5 : cur === "EUR" ? 1 / 90 : 1;

  const fmt = (v?: number | null) => {
    if (typeof v !== "number") return "—";
    const p = v * MARGIN * rate;
    const dec = p >= 100 ? 0 : p >= 1 ? 2 : p >= 0.01 ? 4 : 6;
    return `${sym}${p.toLocaleString("en-IN", { maximumFractionDigits: dec })}`;
  };

  const matchSearch = (i: PriceItem) =>
    !search || i.code.toLowerCase().includes(search.toLowerCase()) || (i.name || "").toLowerCase().includes(search.toLowerCase());

  const renderFamilyTable = (fam: Family) => {
    const items = fam.items.filter(matchSearch);
    if (!items.length) return null;
    const hasGpu = items.some((i) => i.specs?.gpu);
    return (
      <div key={fam.id} className="mb-10">
        <h3 className="text-xl font-black text-[#0f172a] mb-1">{fam.name}</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-3xl">{fam.desc}</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faff]">
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Memory</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">vCore</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Storage</th>
                {hasGpu && <th className="px-4 py-3 text-xs font-bold text-slate-500">GPU</th>}
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Public network</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Private network</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Price<br /><span className="font-medium">(excl. tax/hour)</span></th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Price<br /><span className="font-medium">(excl. tax/month)</span></th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.code} className="border-b border-slate-100 hover:bg-[#f8faff] transition">
                  <td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{i.code}</td>
                  <td className="px-4 py-3 text-sm text-[#0f172a]">{i.specs?.memory || "—"}</td>
                  <td className="px-4 py-3 text-sm text-[#0f172a]">{i.specs?.vcore || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{i.specs?.storage || "—"}{i.specs?.["nvme-disks"] ? ` + ${i.specs["nvme-disks"]} NVMe` : ""}</td>
                  {hasGpu && <td className="px-4 py-3 text-xs text-[#0f172a]">{i.specs?.gpu || "—"}</td>}
                  <td className="px-4 py-3 text-xs text-slate-500">{i.specs?.["public-network"] || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{i.specs?.["private-network"] || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#0f172a]">{fmt(i.hour)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">~{fmt(i.month)}</td>
                  <td className="px-4 py-3"><Link href={`/dashboard?view=public-cloud&launch=${i.code}`} className="rounded bg-[#ff3d00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63700] whitespace-nowrap">Launch</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderItemTable = (sec: Leaf) => {
    const items = (sec.items || []).filter(matchSearch);
    return (
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 bg-[#f8faff]">
              <th className="px-4 py-3 text-xs font-bold text-slate-500">Name</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500">Price / hour</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500">~Price / month</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.code} className="border-b border-slate-100 hover:bg-[#f8faff] transition">
                <td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{i.name !== i.code ? i.name : i.code}</td>
                <td className="px-4 py-3 text-sm font-bold text-[#0f172a]">{i.hourFmt ? fmt(i.hour) : "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{i.monthFmt ? `~${fmt(i.month)}` : "—"}</td>
                <td className="px-4 py-3"><Link href={`/dashboard?view=public-cloud&launch=svc-${sec.id}`} className="rounded bg-[#ff3d00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63700] whitespace-nowrap">Enable</Link></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">No items found.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSimple = (sec: Leaf) => (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left min-w-[500px]">
        <thead><tr className="border-b border-slate-200 bg-[#f8faff]"><th className="px-4 py-3 text-xs font-bold text-slate-500">Name</th><th className="px-4 py-3 text-xs font-bold text-slate-500">Price</th><th className="px-4 py-3 text-xs font-bold text-slate-500">Notes</th></tr></thead>
        <tbody>
          {(sec.simpleRows || []).map((r) => (
            <tr key={r.name} className="border-b border-slate-100"><td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{r.name}</td><td className="px-4 py-3 text-sm text-[#0f172a]">{r.price}</td><td className="px-4 py-3 text-xs text-slate-500">{r.note}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const findLeaf = (id: string): Leaf | undefined =>
    Object.values(catalogData).flat().find((s) => s.id === id);

  const leaf = findLeaf(active);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-[#fff200] via-[#efffb0] to-[#9ff5e8] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-3 flex flex-wrap items-center justify-center gap-3 text-center">
          <p className="text-sm font-bold text-[#0f172a]">Public Cloud free trial: launch your first project today — instances are billed per hour.</p>
          <Link href="/register" className="rounded bg-[#00b7ff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#009fe0]">Get started</Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-8 md:grid md:grid-cols-[260px_1fr] md:gap-10">
        {/* Tree sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full rounded border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#00b7ff]" />
            </div>
            <nav className="space-y-0.5 text-[15px]">
              {tree.map((n) =>
                n.children ? (
                  <div key={n.label}>
                    <button onClick={() => setOpen((o) => ({ ...o, [n.label]: !o[n.label] }))} className="flex w-full items-center justify-between rounded px-2 py-2 font-medium text-slate-700 hover:bg-[#f8faff] transition">
                      {n.label}
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open[n.label] ? "rotate-180" : ""}`} />
                    </button>
                    {open[n.label] && (
                      <div className="ml-3 border-l border-slate-200 pl-3 mb-1">
                        {n.children.map((c) => (
                          <button key={c.leaf} onClick={() => select(c.leaf)} className={`block w-full rounded px-3 py-1.5 text-left text-sm transition ${active === c.leaf ? "bg-[#e8f6ff] text-[#00b7ff] font-bold" : "text-slate-600 hover:bg-[#f8faff] hover:text-[#00b7ff]"}`}>{c.label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button key={n.label} onClick={() => select(n.leaf!)} className={`block w-full rounded px-2 py-2 text-left transition ${active === n.leaf ? "bg-[#e8f6ff] text-[#00b7ff] font-bold" : "text-slate-700 hover:bg-[#f8faff]"}`}>{n.label}</button>
                )
              )}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {/* Filters row */}
          <div className="mb-6 flex flex-wrap items-center gap-4 text-xs border-b border-slate-100 pb-4">
            <span className="flex items-center gap-1.5 text-slate-500"><span className="font-bold uppercase">Locations</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">All regions ▾</span></span>
            <span className="flex items-center gap-1.5 text-slate-500"><span className="font-bold uppercase">Savings Plan</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">None ▾</span></span>
            <span className="flex items-center gap-2 text-slate-500"><span className="font-bold uppercase">Operating system</span>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={os === "linux"} onChange={() => setOs("linux")} className="accent-[#00b7ff]" />Linux</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="radio" checked={os === "windows"} onChange={() => setOs("windows")} className="accent-[#00b7ff]" />Windows</label>
              {os === "windows" && <span className="text-slate-400">Windows licence billed additionally per hour.</span>}
            </span>
          </div>

          {active === "overview" && (
            <div>
              <h1 className="text-3xl font-black mb-2">Public Cloud — pay as you go</h1>
              <p className="text-slate-500 mb-8 max-w-2xl">Create a project for free and launch resources on demand. Transparent hourly pricing across compute, storage, network, databases and AI.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Cpu, t: "Virtual Machine Instances", d: "B3, C3, R3, D2, I1 flavors — per-hour billing.", leaf: "vm" },
                  { icon: Zap, t: "Cloud GPU", d: "V100, L4, A10, L40S, A100, H100, H200 GPUs.", leaf: "gpu" },
                  { icon: HardDrive, t: "Storage", d: "Block, file, local and S3-compatible object storage.", leaf: "object" },
                  { icon: Network, t: "Network", d: "Load balancer, floating IPs, gateway and vRack.", leaf: "loadbalancer" },
                  { icon: Container, t: "Containers", d: "Managed Kubernetes (free control plane), registry, Rancher.", leaf: "k8s" },
                  { icon: Database, t: "Databases", d: "MySQL, PostgreSQL, MongoDB, Redis, Kafka, OpenSearch…", leaf: "db-mysql" },
                  { icon: Brain, t: "AI & ML", d: "Notebooks, training jobs, model deployment, AI endpoints.", leaf: "ai-notebooks" },
                  { icon: Atom, t: "Quantum", d: "Quantum notebooks and real QPU access.", leaf: "q-notebooks" },
                ].map((c) => (
                  <button key={c.t} onClick={() => select(c.leaf)} className="text-left rounded-xl border border-slate-200 p-5 hover:border-[#00b7ff] hover:shadow-md transition">
                    <c.icon className="h-6 w-6 text-[#00b7ff] mb-2" />
                    <p className="font-bold text-[#0f172a]">{c.t}</p>
                    <p className="mt-1 text-xs text-slate-500">{c.d}</p>
                  </button>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-[#e8f6ff] border border-[#00b7ff]/30 p-6 text-center">
                <p className="font-bold text-[#0f172a]">Get up to 30% off your instances and managed services with 12 &amp; 24-month Savings Plans.</p>
                <Link href="/support" className="mt-3 inline-block rounded bg-[#00b7ff] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#009fe0]">Discover Savings Plans</Link>
              </div>
            </div>
          )}

          {active === "pricing" && (
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black mb-4">Pricing model</h1>
              <div className="space-y-4 text-sm text-slate-600 leading-6">
                <p><b className="text-[#0f172a]">Pay-as-you-go.</b> Instances and managed services are billed per hour (or per second for AI workloads) and only while running. You can stop a resource at any time to stop its billing.</p>
                <p><b className="text-[#0f172a]">Free project.</b> Creating a Public Cloud project is free. You only pay for the resources you launch inside it.</p>
                <p><b className="text-[#0f172a]">Monthly cap.</b> Hourly-billed resources are capped at the monthly price shown — you never pay more than the monthly rate.</p>
                <p><b className="text-[#0f172a]">Savings Plans.</b> Commit to 12 or 24 months of usage and save up to 30% on instances and managed services.</p>
                <p><b className="text-[#0f172a]">No hidden fees.</b> Inbound traffic and private network (vRack) traffic are free. Public outbound traffic is billed per GB where applicable.</p>
                <p><b className="text-[#0f172a]">Taxes.</b> All prices shown exclude VAT/GST, which is applied at checkout based on your billing country.</p>
              </div>
            </div>
          )}

          {leaf && active !== "overview" && active !== "pricing" && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Public Cloud ▸ {leafSection[active] ? leafSection[active][0].toUpperCase() + leafSection[active].slice(1).replace("-", " ") : ""} ▸ {leafTitle[active]}</p>
              <h1 className="text-3xl font-black mb-2">{leaf.title}</h1>
              <p className="text-slate-500 mb-6 max-w-3xl">{leaf.desc}</p>
              {leaf.families ? leaf.families.map(renderFamilyTable) : leaf.items ? renderItemTable(leaf) : renderSimple(leaf)}
            </div>
          )}
        </div>
      </div>

      {/* Create project CTA */}
      <section className="border-t border-slate-200 bg-[#f8faff]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <h2 className="text-2xl font-black md:text-3xl">Create a Public Cloud project</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">A project is free to create. Add a payment method, launch instances and pay only for what you use — per hour.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard?view=public-cloud" className="rounded bg-[#ff3d00] px-8 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Create your project — free</Link>
            <Link href="/support" className="rounded border border-slate-300 bg-white px-8 py-3 text-sm font-bold text-[#0f172a] hover:border-[#00b7ff]">Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
