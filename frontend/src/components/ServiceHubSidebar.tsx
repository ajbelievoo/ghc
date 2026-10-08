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
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  LayoutDashboard,
  Wallet,
  Headphones,
  HelpCircle,
} from "lucide-react";

interface ServiceHubSidebarProps {
  open: boolean;
  onClose: () => void;
  onSelectView: (view: string) => void;
  onSelectTab: (tab: string) => void;
  isAdmin?: boolean;
}

const HUB = [
  {
    id: "bare-metal",
    icon: Server,
    label: "Bare Metal Cloud",
    items: [
      { label: "Dedicated servers", view: "dedicated" },
      { label: "Virtual private servers", view: "vps" },
      { label: "Web hosting", view: "web-hosting" },
      { label: "Order a server", view: "vps" },
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
    items: [
      { label: "Public IP addresses", view: "network" },
      { label: "Additional IPs", view: "network" },
      { label: "Network status", tab: "status" },
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
      { label: "Veeam backup licences", view: "storage" },
    ],
  },
  {
    id: "security",
    icon: Shield,
    label: "Identity, Security & Operations",
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
      { label: "Domain search", tab: "domain-search" },
      { label: "Email hosting", view: "web-hosting" },
    ],
  },
];

const FOOTER = [
  { icon: LayoutDashboard, label: "Dashboard overview", tab: "overview" },
  { icon: FileText, label: "My support tickets", tab: "support" },
  { icon: Map, label: "Roadmap & Changelog", view: "roadmap" },
  { icon: Activity, label: "Network status", tab: "status" },
  { icon: MessageSquare, label: "Live Chat", tab: "ai" },
  { icon: Mail, label: "Create a ticket", tab: "support" },
  { icon: LifeBuoy, label: "Help Centre", tab: "kb" },
  { icon: Wallet, label: "Wallet", tab: "wallet" },
  { icon: User, label: "My profile", tab: "profile" },
  { icon: HelpCircle, label: "AI Assistant", tab: "ai" },
];

export default function ServiceHubSidebar({ open, onClose, onSelectView, onSelectTab, isAdmin }: ServiceHubSidebarProps) {
  const [expanded, setExpanded] = useState<string[]>(["bare-metal"]);

  const toggle = (id: string) => {
    setExpanded((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleClick = (item: any) => {
    if (item.view) onSelectView(item.view);
    else if (item.tab) onSelectTab(item.tab);
    else if (item.path?.startsWith("http")) {
      window.open(item.path, "_blank", "noopener,noreferrer");
      onClose();
      return;
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-full max-w-md h-full bg-[#0f0c29] text-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00b7ff]/20 border border-[#00b7ff]/40 flex items-center justify-center">
              <Server className="w-4 h-4 text-[#00b7ff]" />
            </div>
            <h2 className="text-lg font-bold">Service Hub</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-4 border-b border-white/10">
          <button onClick={() => { onSelectView("vps"); onClose(); }} className="w-full rounded-lg bg-[#00b7ff] text-[#0f172a] font-semibold py-2.5 flex items-center justify-center gap-2 hover:bg-[#33c4ff] transition-all">
            <Plus className="w-4 h-4" /> Add a service
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {HUB.map((cat) => {
            const Icon = cat.icon;
            const isOpen = expanded.includes(cat.id);
            return (
              <div key={cat.id} className="border-b border-white/5 last:border-0">
                <button onClick={() => toggle(cat.id)} className="w-full flex items-center justify-between px-6 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#00b7ff]" />
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="pb-2">
                    {cat.items.map((it) => (
                      <button key={it.label} onClick={() => handleClick(it)} className="w-full text-left pl-14 pr-6 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                        {it.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {isAdmin && (
            <div className="border-b border-white/5">
              <button onClick={() => window.open("https://believoo.com/admin/ghc", "_blank")} className="w-full flex items-center gap-3 px-6 py-3 hover:bg-white/5 transition-colors text-[#00ff88]">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">Admin Panel</span>
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 py-4 bg-[#001a66]">
          {FOOTER.map((f) => {
            const Icon = f.icon;
            return (
              <button key={f.label} onClick={() => handleClick(f)} className="w-full flex items-center gap-3 px-6 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                <Icon className="w-4 h-4" />
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <button onClick={onClose} className="w-full rounded-lg border border-white/20 py-2.5 text-sm text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Minimise
          </button>
        </div>
      </div>
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    </div>
  );
}

function ChevronLeft(props: any) {
  return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
}
