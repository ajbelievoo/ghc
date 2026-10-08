"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { useToast } from "@/components/ToastProvider";
import NetworkHub from "@/components/NetworkHub";
import RoadmapHub from "@/components/RoadmapHub";
import OrderHub from "@/components/OrderHub";
import DomainHub from "@/components/DomainHub";
import { Server, Globe, HardDrive, Cloud, Shield, Network, FileText, Cpu, Activity, ArrowLeft, Download, Search, Filter, MoreHorizontal, Plus, CheckCircle, XCircle, X, Loader2 } from "lucide-react";

interface ProductHubProps {
  view: string;
  servers: any[];
  myDomains: any[];
  invoices: any[];
  wallet: any;
  user?: any;
  onBack?: () => void;
  onTab?: (tab: string) => void;
  onSelectView?: (view: string) => void;
  setSelectedServer?: (id: string | null) => void;
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-[#00ff88]/10 text-[#00ff88]",
  PROVISIONED: "bg-[#00b7ff]/10 text-[#00b7ff]",
  SUSPENDED: "bg-red-500/10 text-red-600",
  PENDING: "bg-yellow-500/10 text-yellow-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default function ProductHub({ view, servers, myDomains, invoices, wallet, user, onBack, onTab, onSelectView, setSelectedServer }: ProductHubProps) {
  const router = useRouter();
  const { currency } = useCurrency();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [orderModal, setOrderModal] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredServers = servers.filter((s) => {
    const q = search.toLowerCase();
    const cat = s.category?.toLowerCase() || "";
    const name = (s.displayName || s.name || "").toLowerCase();
    if (view === "vps") return (cat === "vps" || s.planCode?.toLowerCase().includes("vps")) && (name.includes(q) || cat.includes(q));
    if (view === "dedicated") return (cat === "dedicated" || s.planCode?.toLowerCase().includes("dedicated") || cat === "bare_metal") && (name.includes(q) || cat.includes(q));
    if (view === "web-hosting") return (cat === "web_hosting" || cat === "webhosting") && (name.includes(q) || cat.includes(q));
    return name.includes(q) || cat.includes(q);
  });

  const HERO: Record<string, any> = {
    vps: {
      title: "Virtual Private Servers",
      subtitle: "A simple, powerful cloud platform tailored to your needs",
      icon: Cloud,
      features: ["More resources, still at the best price", "Enhanced security, anti-DDoS and backup included", "Unlimited bandwidth, up to 1.5Gbps"],
      cta: "Order a VPS",
      orderPath: "#",
      orderView: "order-VPS",
    },
    dedicated: {
      title: "Dedicated Servers",
      subtitle: "Powerful bare-metal servers with no noisy neighbours",
      icon: Server,
      features: ["100% dedicated resources", "Anti-DDoS protection included", "Full root access with IPMI/KVM"],
      cta: "Order a Dedicated Server",
      orderPath: "#",
      orderView: "order-DEDICATED",
    },
    "web-hosting": {
      title: "Web Hosting",
      subtitle: "Reliable hosting for your websites and applications",
      icon: Globe,
      features: ["cPanel / Plesk ready", "Free SSL certificates", "Daily backups"],
      cta: "Order Web Hosting",
      orderPath: "#",
      orderView: "order-WEB_HOSTING",
    },
    network: {
      title: "Network",
      subtitle: "Manage public and private IP addresses, network services and security",
      icon: Network,
      features: ["Public IP addresses", "Additional IPv4/IPv6", "Reverse DNS management", "Load balancer & firewall"],
      cta: "Order an IP",
      orderPath: "#",
    },
    storage: {
      title: "Storage & Backups",
      subtitle: "Keep your data safe and scalable with managed storage and backup solutions",
      icon: HardDrive,
      features: ["HA-NAS managed storage", "Cloud Disk Array", "Backup Agent for bare metal", "Enterprise backup licenses"],
      cta: "Order Storage",
      orderPath: "#",
    },
    licenses: {
      title: "Licences",
      subtitle: "Manage licences for cPanel, Plesk, Windows and backup software",
      icon: Cpu,
      features: ["SPLA licences", "cPanel / Plesk", "Windows Server licences", "Veeam backup licences"],
      cta: "Add a Licence",
      orderPath: "#",
    },
    "private-cloud": {
      title: "Hosted Private Cloud",
      subtitle: "Managed VMware, vSphere and VCF as-a-Service",
      icon: Cloud,
      features: ["Managed VMware vSphere", "Public VCF as-a-Service", "SAP Features Hub", "Veeam backup integration"],
      cta: "Order Private Cloud",
      orderPath: "#",
    },
    "bare-metal": {
      title: "Bare Metal Cloud",
      subtitle: "Dedicated and virtual servers with full control",
      icon: Server,
      features: ["Dedicated servers", "Virtual private servers", "Managed Bare Metal", "Licenses"],
      cta: "Order a Server",
      orderPath: "/vps",
    },
    "public-cloud": {
      title: "Public Cloud",
      subtitle: "Compute, storage and network instances on demand",
      icon: Cloud,
      features: ["Compute instances", "Block storage", "Object storage", "Private network"],
      cta: "Order Public Cloud",
      orderPath: "#",
      orderView: "order-PUBLIC_CLOUD",
    },
  };

  const hero = HERO[view] || HERO["bare-metal"];
  const Icon = hero.icon;

  const onOrder = () => {
    if (hero.orderView) {
      onSelectView?.(hero.orderView);
    } else if (hero.orderPath.startsWith("#")) {
      setOrderModal(hero.title);
    } else {
      router.push(hero.orderPath);
    }
  };

  const submitOrderRequest = async () => {
    if (!orderModal || !user) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("name", user.name || "Customer");
      form.append("email", user.email);
      form.append("category", "Sales");
      form.append("subject", `Order request: ${orderModal}`);
      form.append("message", `Customer wants to order ${orderModal}. Notes: ${orderNotes}`);
      await api.support.createTicket(form);
      showToast("Order request sent to sales team", "success");
      setOrderModal(null);
      setOrderNotes("");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const requestQuote = (product: string) => setOrderModal(product);

  const renderEmpty = (msg: string) => (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-12 text-center">
      <Icon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-600 font-medium mb-1">{msg}</p>
      <p className="text-sm text-slate-500 mb-4">Order your first {hero.title} or contact support to configure a custom solution.</p>
      <div className="flex justify-center gap-3">
        <button onClick={onOrder} className="rounded-lg bg-[#00b7ff] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#009fe0] transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> {hero.cta}</button>
        {onTab && <button onClick={() => onTab("support")} className="rounded-lg border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-200 transition-all">Contact Sales</button>}
      </div>
    </div>
  );

  const renderTable = (data: any[], columns: any[], actions?: (row: any) => React.ReactNode) => (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter..." className="w-full rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
        </div>
        <button onClick={onOrder} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-semibold hover:bg-[#009fe0] transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Order</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-5 py-3 text-xs font-semibold text-slate-500">Name</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">IP Address</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Model / Plan</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Region</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Status</th><th className="px-5 py-3 text-xs font-semibold text-slate-500"></th></tr></thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-[#00b7ff]/5 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-[#0f172a]">{s.displayName || s.name || s.planCode}</td>
                <td className="px-5 py-4 text-xs font-mono text-slate-500">{s.ipAddress || s.providerResourceId || "—"}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{s.planCode}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{s.datacenter || s.region || "—"}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusColor[s.status] || statusColor.PENDING}`}>{s.status}</span></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedServer?.(s.id)} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1.5 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Manage</button>
                    {actions?.(s)}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No services found. {search ? "Try a different filter." : ""}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#b500ff]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={onBack} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"><ArrowLeft className="w-4 h-4" /></button>
              <Icon className="w-8 h-8 text-[#00b7ff]" />
              <h2 className="text-2xl font-bold">{hero.title}</h2>
            </div>
            <p className="text-slate-200 max-w-2xl">{hero.subtitle}</p>
            <ul className="mt-4 space-y-1.5">
              {hero.features.map((f: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-100"><CheckCircle className="w-4 h-4 text-[#00ff88]" /> {f}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <button onClick={onOrder} className="rounded-lg bg-[#00b7ff] text-[#0f172a] px-6 py-3 font-semibold hover:bg-[#33c4ff] transition-all flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> {hero.cta}</button>
          </div>
        </div>
      </div>

      {(view === "vps" || view === "dedicated" || view === "web-hosting" || view === "bare-metal" || view === "public-cloud") && (
        renderTable(filteredServers, [])
      )}

      {view === "network" && (
        <NetworkHub servers={servers} user={user} onManageServer={setSelectedServer} />
      )}

      {view === "storage" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "HA-NAS", desc: "Managed storage based on OpenZFS file system. Centralised storage spaces to store or back up your data.", cta: "Order a HA-NAS" },
            { title: "Enterprise File Storage", desc: "High-performance file storage for enterprise workloads.", cta: "Order Enterprise File Storage" },
            { title: "Cloud Disk Array", desc: "Next-generation scalable storage powered by CEPH.", cta: "Order Cloud Disk Array" },
            { title: "Backup Agent", desc: "Automatic daily remote backups with centralised monitoring.", cta: "Back up a Bare Metal server", tag: "New" },
            { title: "Backup Licenses", desc: "Veeam Backup & Replication licences for enterprise workloads.", cta: "Configure my offer", tag: "New" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                {item.tag && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#00b7ff]/10 text-[#00b7ff]">New</span>}
              </div>
              <p className="text-sm text-slate-500 mb-6 flex-1">{item.desc}</p>
              <div className="flex gap-3">
                <button onClick={() => requestQuote(item.title)} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-semibold hover:bg-[#009fe0] transition-all">{item.cta}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "licenses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "cPanel VPS", desc: "VPS with cPanel & WHM pre-installed", href: "/vps/cpanel" },
              { title: "Plesk VPS", desc: "VPS with Plesk Obsidian pre-installed", href: "/vps/plesk" },
              { title: "WordPress VPS", desc: "VPS with WordPress pre-installed", href: "/vps/wordpress" },
              { title: "Windows Server", desc: "Windows Server 2025 licence on VPS/dedicated", href: null },
            ].map((l) => (
              <div key={l.title} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5 flex flex-col">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-1">{l.title}</h3>
                <p className="text-xs text-slate-500 mb-4 flex-1">{l.desc}</p>
                {l.href
                  ? <button onClick={() => router.push(l.href!)} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-xs font-semibold hover:bg-[#009fe0] transition-all self-start">Order</button>
                  : <button onClick={() => requestQuote(l.title)} className="rounded-lg border border-[#00b7ff]/40 text-[#00b7ff] px-4 py-2 text-xs font-semibold hover:bg-[#00b7ff]/10 transition-all self-start">Request</button>}
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between"><h3 className="font-semibold text-[#0f172a]">Manage my licences</h3><button onClick={() => requestQuote("SPLA / cPanel / Plesk / Windows License")} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-semibold hover:bg-[#009fe0] transition-all">Order</button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-5 py-3 text-xs font-semibold text-slate-500">Name</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Licence ID</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">IP</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Service</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Renewal</th></tr></thead>
                <tbody>
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">No licences yet. Order a licensed VPS above or contact support for SPLA / Windows / Veeam licences.</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === "private-cloud" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-8 text-center">
            <Cloud className="w-16 h-16 text-[#00b7ff] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#0f172a] mb-2">Our managed virtualisation solution</h3>
            <p className="text-sm text-slate-500 max-w-2xl mx-auto mb-6">VMware on GHC. We manage the maintenance of your hardware and software infrastructure, including vSphere, vCenter and vROps.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => requestQuote("Hosted Private Cloud")} className="rounded-lg bg-[#00b7ff] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#009fe0] transition-all">Order</button>
              <button onClick={() => requestQuote("Hosted Private Cloud - Get started")} className="rounded-lg border border-slate-200 bg-slate-100 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-200 transition-all">Get started</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "Managed VMware vSphere", desc: "Discover everything you can do in the VMware Control Panel" },
              { title: "Public VCF as-a-Service", desc: "Deploy and manage virtual datacentres with a simple, unified interface." },
              { title: "SAP Features Hub", desc: "Explore our range of optional SAP features to make your SAP deployments easier." },
              { title: "Veeam Enterprise", desc: "Deploy your Veeam Backup & Replication platform with Enterprise Plus licences." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                <h4 className="text-sm font-semibold text-[#00b7ff] mb-1">Tutorial</h4>
                <h3 className="text-base font-semibold text-[#0f172a] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 mb-3">{item.desc}</p>
                <button onClick={() => requestQuote(item.title)} className="text-sm text-[#00b7ff] hover:underline flex items-center gap-1">Find out more <ArrowLeft className="w-3 h-3 rotate-180" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "roadmap" && <RoadmapHub onBack={onBack} />}

      {(view === "order" || view.startsWith("order-")) && (
        <OrderHub
          category={view === "order" ? undefined : view.replace("order-", "")}
          user={user}
          onBack={onBack}
          onComplete={() => { showToast("Order placed", "success"); if (onBack) onBack(); }}
        />
      )}

      {view === "domain-search" && (
        <DomainHub
          user={user}
          onBack={onBack}
          onComplete={() => { showToast("Domain registered", "success"); if (onBack) onBack(); }}
        />
      )}

      {(view !== "vps" && view !== "dedicated" && view !== "web-hosting" && view !== "bare-metal" && view !== "public-cloud" && view !== "network" && view !== "storage" && view !== "licenses" && view !== "private-cloud" && view !== "roadmap" && view !== "domain-search" && view !== "order" && !view.startsWith("order-")) && (
        <div className="text-center p-12">
          <h3 className="text-lg font-semibold text-[#0f172a]">Coming soon</h3>
          <p className="text-sm text-slate-500 mt-2">This section is being configured.</p>
        </div>
      )}

      {orderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0f172a]">Request {orderModal}</h3>
              <button onClick={() => setOrderModal(null)} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Our sales team will configure this for you. Add any notes (quantity, region, use case).</p>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Example: 2x HA-NAS 500GB in Singapore..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none min-h-[100px] mb-4" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setOrderModal(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button onClick={submitOrderRequest} disabled={submitting} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-semibold hover:bg-[#009fe0] disabled:opacity-50 flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
