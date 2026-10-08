"use client";

import { useState } from "react";
import {
  Server,
  Globe,
  HardDrive,
  Cloud,
  Shield,
  Network,
  FileText,
  Mail,
  MessageSquare,
  LifeBuoy,
  Map,
  Cpu,
  Layers,
  Activity,
  User,
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Wallet,
  Headphones,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react";
import { useGhcSettings } from "@/lib/ghcSettings";

export interface DashboardSidebarProps {
  activeView: string | null;
  setActiveView: (v: string | null) => void;
  tab: string;
  setTab: (t: any) => void;
  user: any;
  onLogout: () => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}

const MENU = [
  {
    id: "bare-metal",
    icon: Server,
    label: "Bare Metal Cloud",
    defaultOpen: true,
    items: [
      { label: "Dedicated servers", view: "dedicated" },
      { label: "Virtual private servers", view: "vps" },
      { label: "Web hosting", view: "web-hosting" },
    ],
  },
  {
    id: "public-cloud",
    icon: Cloud,
    label: "Public Cloud",
    items: [
      { label: "Compute instances", view: "public-cloud" },
      { label: "Block storage", view: "storage" },
      { label: "Object storage", view: "storage" },
    ],
  },
  {
    id: "private-cloud",
    icon: Cloud,
    label: "Hosted Private Cloud",
    items: [
      { label: "Managed VMware vSphere", view: "private-cloud" },
      { label: "Public VCF as-a-Service", view: "private-cloud" },
      { label: "Licenses", view: "licenses" },
      { label: "SAP Features Hub", view: "private-cloud" },
    ],
  },
  {
    id: "network",
    icon: Network,
    label: "Network",
    defaultOpen: true,
    items: [
      { label: "Public IP addresses", view: "network" },
      { label: "Additional IPs", view: "network" },
      { label: "Load balancer", view: "network" },
      { label: "Network Security Dashboard", view: "network" },
    ],
  },
  {
    id: "storage-backups",
    icon: HardDrive,
    label: "Storage & Backups",
    items: [
      { label: "HA-NAS", view: "storage" },
      { label: "Enterprise File Storage", view: "storage" },
      { label: "Cloud Disk Array", view: "storage" },
      { label: "Backup Agent", view: "storage" },
      { label: "Backup Licenses", view: "storage" },
    ],
  },
  {
    id: "licenses",
    icon: Cpu,
    label: "Licenses",
    items: [
      { label: "SPLA / cPanel / Plesk", view: "licenses" },
      { label: "Windows licences", view: "licenses" },
      { label: "Veeam backup licences", view: "licenses" },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Identity, Security & Ops",
    items: [
      { label: "2FA / Security", tab: "security" },
      { label: "Team access", tab: "security" },
      { label: "Profile", tab: "profile" },
    ],
  },
  {
    id: "web-cloud",
    icon: Globe,
    label: "Web Cloud",
    items: [
      { label: "My Domains", tab: "domains" },
      { label: "Domain search", view: "domain-search" },
      { label: "Email hosting", view: "web-hosting" },
    ],
  },
];

const FOOTER = [
  { icon: LayoutDashboard, label: "Dashboard overview", tab: "overview" },
  { icon: FileText, label: "My support tickets", tab: "support" },
  { icon: Map, label: "Roadmap & Changelog", view: "roadmap" },
  { icon: Activity, label: "Network status", path: "/status" },
  { icon: MessageSquare, label: "Live Chat", tab: "support" },
  { icon: Mail, label: "Create a ticket", tab: "support" },
  { icon: LifeBuoy, label: "Help Centre", path: "/kb" },
  { icon: Wallet, label: "Wallet", tab: "wallet" },
  { icon: User, label: "My profile", tab: "profile" },
  { icon: HelpCircle, label: "AI Assistant", action: "ai" },
];

export default function DashboardSidebar({ activeView, setActiveView, tab, setTab, user, onLogout, mobileOpen, onClose }: DashboardSidebarProps) {
  const [expanded, setExpanded] = useState<string[]>(["bare-metal", "network"]);
  const ghc = useGhcSettings();

  const toggle = (id: string) => {
    setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleItem = (item: any) => {
    if (item.view) { setActiveView(item.view); setTab("overview"); }
    else if (item.tab) { setActiveView(null); setTab(item.tab); }
    else if (item.path) { window.open(item.path, item.path.startsWith("http") ? "_blank" : "_self"); }
    else if (item.action === "ai") { /* AI assistant opens via floating button */ }
    if (mobileOpen && onClose) onClose();
  };

  const isActiveItem = (item: any) => {
    if (item.view) return activeView === item.view;
    if (item.tab) return activeView === null && tab === item.tab;
    return false;
  };

  return (
    <aside className={`ghc-dash-sidebar lg:w-72 lg:static lg:translate-x-0 fixed top-0 left-0 z-50 h-screen bg-[#0a0f1c] text-slate-300 flex flex-col border-r border-white/10 transition-transform duration-300 ${mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full"} overflow-hidden`}>
      {/* subtle aurora background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00b7ff]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#b500ff]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 p-5 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="ghc-logo-chip w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden px-1.5">
              <img src={ghc.logo_url || "/images/ghc-mark.png"} alt={ghc.name} className="w-full h-auto" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">GHC</h1>
              <p className="text-[10px] text-slate-400">Go Host Cloud</p>
            </div>
          </div>
          {mobileOpen && (
            <button onClick={onClose} className="lg:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <button onClick={() => { setActiveView("order"); setTab("overview"); }} className="w-full rounded-xl bg-gradient-to-r from-[#00b7ff] to-[#00f0ff] text-[#0a0f1c] font-bold py-2.5 flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,183,255,0.35)] transition-all">
          <Plus className="w-4 h-4" /> Add a service
        </button>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto py-3 px-3 space-y-2">
        {MENU.map((cat) => {
          const Icon = cat.icon;
          const isOpen = expanded.includes(cat.id) || cat.defaultOpen;
          return (
            <div key={cat.id} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
              <button onClick={() => toggle(cat.id)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[#00f0ff]" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
              </button>
              {isOpen && (
                <div className="pb-2 px-2">
                  {cat.items.map((it) => (
                    <button key={it.label} onClick={() => handleItem(it)} className={`w-full text-left pl-12 pr-3 py-2 text-sm rounded-lg transition-all ${isActiveItem(it) ? "bg-gradient-to-r from-[#00b7ff]/20 to-transparent text-white border-l-2 border-[#00f0ff]" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {user?.role === "ADMIN" && (
          <a href="https://believoo.com/admin/ghc" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">Admin Panel</span>
          </a>
        )}
      </div>

      <div className="relative z-10 border-t border-white/10 p-3 space-y-1 bg-[#0a0f1c]/80 backdrop-blur-sm">
        {FOOTER.map((f) => {
          const Icon = f.icon;
          return (
            <button key={f.label} onClick={() => handleItem(f)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${isActiveItem(f) ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
              <Icon className="w-4 h-4" />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="relative z-10 p-4 border-t border-white/10">
        <button onClick={onLogout} className="w-full rounded-xl border border-white/10 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  );
}
