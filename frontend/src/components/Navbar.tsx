"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Server, Menu, X, ChevronDown, LogOut, User, Bell, Mail, CreditCard, FileText, Shield, Globe, Users, Settings, Package, Search } from "lucide-react";
import { useGhcSettings } from "@/lib/ghcSettings";
import ThemeToggle from "@/components/ThemeToggle";
import { useCurrency, CURRENCIES } from "@/components/CurrencyProvider";
import { useI18n } from "@/components/LanguageProvider";
import { Language } from "@/lib/i18n";

interface MegaLink { label: string; href: string; desc?: string }
interface MegaGroup { title: string; items: MegaLink[] }
interface MegaCol { title?: string; items?: MegaLink[]; groups?: MegaGroup[] }
interface MegaEntry {
  label: string;
  href: string;
  cols?: number;
  columns: MegaCol[];
  footerLinks?: MegaLink[];
}

const colGroups = (col: MegaCol): MegaGroup[] =>
  col.groups ?? [{ title: col.title || "", items: col.items || [] }];

const megaMenu: MegaEntry[] = [
  {
    label: "Public Cloud",
    href: "/public-cloud",
    cols: 3,
    columns: [
      { title: "Compute & Containers", items: [
        { label: "Compute", href: "/public-cloud?s=vm", desc: "VM, GPU, and Metal instances" },
        { label: "Containers", href: "/public-cloud?s=k8s", desc: "Managed Kubernetes, registry, and Rancher" },
        { label: "Storage", href: "/public-cloud?s=object", desc: "Object, Block, and File storage" },
        { label: "Network", href: "/public-cloud?s=loadbalancer", desc: "Load Balancer, Floating IPs, Gateway, vRack" },
      ]},
      { title: "Data & Analytics", items: [
        { label: "Databases", href: "/public-cloud?s=db-mysql", desc: "MySQL, PostgreSQL, MongoDB, Redis, Kafka" },
        { label: "Analytics", href: "/public-cloud?s=analytics", desc: "Data ingestion, processing, and visualisation" },
        { label: "Data Platform", href: "/public-cloud?s=dp", desc: "Managed data pipelines" },
      ]},
      { title: "AI, Quantum & Ops", items: [
        { label: "AI & Machine Learning", href: "/public-cloud?s=ai-notebooks", desc: "Notebooks, Training, Deploy, Endpoints" },
        { label: "Quantum", href: "/public-cloud?s=q-notebooks", desc: "Quantum Notebooks and QPUs" },
        { label: "Security & identity", href: "/security", desc: "Access control and protection" },
        { label: "Operations", href: "/operations", desc: "Resource monitoring and management" },
      ]},
    ],
  },
  {
    label: "Private Cloud",
    href: "/private-cloud",
    columns: [
      { title: "Hosted Private Cloud", items: [
        { label: "VMware on GHC", href: "/private-cloud?s=vmware", desc: "vSphere, vSAN and NSX on dedicated hosts" },
        { label: "Nutanix on GHC", href: "/private-cloud?s=nutanix", desc: "HCI private cloud on dedicated hosts" },
        { label: "SAP HANA on GHC", href: "/private-cloud?s=sap-hana", desc: "SAP HANA certified infrastructure" },
        { label: "Dedicated host catalog", href: "/private-cloud#catalog", desc: "370+ hosts across all ranges" },
      ]},
      { title: "Private Cloud Foundations", items: [
        { label: "Network", href: "/network", desc: "Secure and high-performance connectivity" },
        { label: "Storage & Backup", href: "/dedicated-servers/storage", desc: "Backups and business continuity" },
        { label: "Security & Identity", href: "/security", desc: "IAM, secrets, logs and metrics" },
        { label: "Operations", href: "/operations", desc: "Resource monitoring and management" },
      ]},
    ],
  },
  {
    label: "VPS & Dedicated Servers",
    href: "/dedicated-servers",
    cols: 4,
    columns: [
      { title: "VPS & Dedicated", items: [
        { label: "Dedicated servers", href: "/dedicated-servers", desc: "All performance levels. Available in minutes." },
        { label: "VPS", href: "/vps", desc: "The right balance of performance, flexibility and cost control" },
        { label: "Distributions & Licenses", href: "/apps", desc: "Choose an image to deploy on your server" },
      ]},
      { title: "Bare Metal Foundations", items: [
        { label: "Network", href: "/network", desc: "Secure and high-performance connectivity" },
        { label: "Storage & Backup", href: "/dedicated-servers/storage", desc: "Backups and business continuity" },
        { label: "Security & Identities", href: "/security", desc: "Granular control over your environments" },
        { label: "Operations", href: "/operations", desc: "Resource monitoring and management" },
      ]},
      { groups: [
        { title: "Speed up your websites and applications", items: [
          { label: "WordPress", href: "/vps/wordpress" },
          { label: "Drupal", href: "/solutions/drupal" },
          { label: "PrestaShop", href: "/solutions/prestashop" },
          { label: "Magento", href: "/solutions/magento" },
        ]},
        { title: "The ideal foundation for your VMs", items: [
          { label: "Proxmox", href: "/solutions/proxmox" },
          { label: "KVM", href: "/solutions/kvm" },
          { label: "VMware ESXi", href: "/solutions/vmware-esxi" },
          { label: "Microsoft Hyper-V", href: "/solutions/hyper-v" },
        ]},
      ]},
      { groups: [
        { title: "Your data, without data loss", items: [
          { label: "ClickHouse", href: "/solutions/clickhouse" },
          { label: "PostgreSQL", href: "/solutions/postgresql" },
          { label: "Cassandra", href: "/solutions/cassandra" },
          { label: "HBase", href: "/solutions/hbase" },
          { label: "InfluxDB", href: "/solutions/influxdb" },
        ]},
        { title: "The power for your critical workloads", items: [
          { label: "GROMACS", href: "/solutions/gromacs" },
          { label: "NAMD", href: "/solutions/namd" },
        ]},
        { title: "Blockchain infrastructure", items: [
          { label: "Validator Nodes", href: "/solutions/validator-nodes" },
          { label: "RPC Nodes", href: "/solutions/rpc-nodes" },
          { label: "Archive Nodes", href: "/solutions/archive-nodes" },
        ]},
      ]},
    ],
    footerLinks: [
      { label: "Prices", href: "/dedicated-servers" },
      { label: "Guides & Documentation", href: "/kb" },
      { label: "Roadmap & Changelog", href: "/status" },
    ],
  },
  {
    label: "Domain / Hosting",
    href: "/domain",
    columns: [
      { title: "Web Hosting", items: [
        { label: "Agencies", href: "/web-hosting?range=Agency", desc: "Designed for web agencies" },
        { label: "Business", href: "/web-hosting?range=Business", desc: "For professionals" },
        { label: "Eco", href: "/web-hosting?range=Eco", desc: "Accessible prices" },
      ]},
      { title: "Domains and Emails", items: [
        { label: "Domain name", href: "/domain", desc: "Assert your identity" },
        { label: "Email hosting", href: "/web-hosting", desc: "Professional mailboxes" },
      ]},
    ],
  },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/80 px-2 py-1.5 text-xs font-bold text-[#0f172a] hover:border-[#00b7ff]"
      >
        {currency} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-24 overflow-y-auto rounded border border-slate-200 bg-white shadow-xl">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCurrency(c); setOpen(false); }}
                className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${c === currency ? "bg-[#f8fcff] text-[#00b7ff]" : "text-[#0f172a] hover:bg-[#f8fcff]"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative z-50">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-md border border-slate-200 bg-white/80 px-2 py-1.5 text-xs font-bold text-[#0f172a] hover:border-[#00b7ff]">
        {lang.toUpperCase()} <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-24 overflow-y-auto rounded border border-slate-200 bg-white shadow-xl">
            {(["en", "hi"] as Language[]).map((l) => (
              <button key={l} onClick={() => { setLang(l); setOpen(false); }} className={`block w-full px-3 py-1.5 text-left text-xs font-medium ${l === lang ? "bg-[#f8fcff] text-[#00b7ff]" : "text-[#0f172a] hover:bg-[#f8fcff]"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar({ theme = "light" }: { theme?: "light" | "dark" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<number | null>(null);
  const ghc = useGhcSettings();
  const [user, setUser] = useState<UserData | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [domainQuery, setDomainQuery] = useState("");
  const router = useRouter();

  const dark = theme === "dark";
  // Theme-aware token classes
  const navBg = dark ? "border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl" : "border-b border-slate-200 bg-white/95 backdrop-blur";
  const logoBg = dark ? "bg-[#00b7ff]/10 border border-[#00b7ff]/30 text-[#00b7ff]" : "bg-[#0f0c29] text-white";
  const menuText = dark ? "text-slate-700 hover:text-[#00b7ff]" : "text-[#0f172a] hover:text-[#00b7ff]";
  const megaBg = dark ? "border border-white/10 bg-[#0f0f0f]/95 backdrop-blur-xl shadow-2xl" : "border border-slate-200 bg-white shadow-2xl";
  const megaColTitle = dark ? "text-gray-500" : "text-slate-400";
  const megaItemTitle = dark ? "text-white group-hover:text-[#00b7ff]" : "text-[#0f172a] group-hover:text-[#00b7ff]";
  const megaItemDesc = dark ? "text-gray-500" : "text-slate-500";
  const megaFooterBg = dark ? "border-t border-white/10 bg-white/5" : "border-t border-slate-200 bg-[#f8faff]";
  const megaFooterLink = dark ? "text-[#00b7ff]" : "text-[#00b7ff]";
  const profileBtn = dark ? "border border-white/10 bg-white/5 text-white hover:border-[#00b7ff]/30" : "border border-slate-200 bg-[#f8faff] text-[#0f172a] hover:border-[#00b7ff]/30";
  const profileAvatar = dark ? "bg-[#00b7ff]/20 text-[#00b7ff]" : "bg-[#0f0c29] text-white";
  const dropdownBg = dark ? "border border-white/10 bg-[#0f0f0f]/95 backdrop-blur-xl" : "border border-slate-200 bg-white";
  const dropdownHeaderBg = dark ? "bg-white/5 border-b border-white/10" : "bg-[#f8faff] border-b border-slate-200";
  const dropdownItemText = dark ? "text-slate-700 hover:bg-white/5" : "text-[#0f172a] hover:bg-[#f8faff]";
  const dropdownIcon = dark ? "text-[#00b7ff]" : "text-[#00b7ff]";
  const signinText = dark ? "text-slate-700 hover:text-[#00b7ff]" : "text-[#0f172a] hover:text-[#00b7ff]";
  const ctaBtn = dark ? "bg-[#00b7ff] text-white hover:bg-[#0f0c29]" : "bg-[#ff3d00] text-white hover:bg-[#e63700]";
  const mobileBg = dark ? "border-t border-white/10 bg-[#0a0a0a]" : "border-t border-slate-200 bg-white";
  const mobileText = dark ? "text-white" : "text-[#0f172a]";
  const mobileSubText = dark ? "text-slate-500" : "text-slate-600";

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
    const handleStorage = () => {
      try {
        const raw = localStorage.getItem("user");
        if (raw) setUser(JSON.parse(raw));
        else setUser(null);
      } catch { setUser(null); }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    router.push("/");
  };

  const userMenuItems = user?.role === "ADMIN"
    ? [
        { label: "Admin Hub", href: "/admin", icon: Shield },
        { label: "My Profile", href: "/profile", icon: User },
        { label: "My Servers", href: "/dashboard?tab=servers", icon: Server },
        { label: "My bills", href: "/dashboard?tab=invoices", icon: FileText },
        { label: "My orders", href: "/dashboard?tab=invoices", icon: Package },
        { label: "Wallet", href: "/dashboard?tab=wallet", icon: CreditCard },
        { label: "Security", href: "/dashboard?tab=security", icon: Settings },
        { label: "Support", href: "/support", icon: Mail },
      ]
    : [
        { label: "Access my account", href: "/dashboard", icon: User },
        { label: "My Profile", href: "/profile", icon: User },
        { label: "My servers", href: "/dashboard?tab=servers", icon: Server },
        { label: "My bills", href: "/dashboard?tab=invoices", icon: FileText },
        { label: "My offers and services", href: "/dashboard?tab=servers", icon: Package },
        { label: "My orders", href: "/dashboard?tab=invoices", icon: CreditCard },
        { label: "Support", href: "/support", icon: Mail },
      ];

  return (
    <nav className={`sticky top-0 z-50 ${navBg}`}>
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {ghc.logo_url ? (
            <img src={ghc.logo_url} alt={ghc.name} className="h-10 w-auto" style={{ filter: "drop-shadow(0 2px 8px rgba(0,120,200,.25))" }} />
          ) : (
            <>
              <div className={`flex h-9 w-9 items-center justify-center rounded ${logoBg}`}>
                <Server className="h-5 w-5" />
              </div>
              <span className={`text-lg font-bold ${dark ? "text-white" : ""}`}>{ghc.name}</span>
            </>
          )}
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (domainQuery.trim()) router.push(`/domain?q=${encodeURIComponent(domainQuery.trim())}`);
          }}
          className="hidden w-full max-w-[14rem] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 backdrop-blur md:flex lg:max-w-[16rem] xl:max-w-[18rem] mx-2 lg:mx-3"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
            placeholder="Search domain..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </form>

        <div className="hidden items-center gap-0 md:flex">
          {megaMenu.map((item, idx) => {
            const cols = item.cols || 2;
            const widthCls = cols >= 4 ? "w-[1120px]" : cols === 3 ? "w-[880px]" : "w-[640px]";
            const gridCls = cols >= 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
            return (
            <div
              key={item.label}
              className="static"
              onMouseEnter={() => setOpenMega(idx)}
              onMouseLeave={() => setOpenMega(null)}
            >
              <button className={`flex items-center gap-1 px-3 py-5 text-sm font-medium lg:px-4 ${menuText}`}>
                {item.label} <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openMega === idx && (
                <div className={`absolute left-1/2 top-full -translate-x-1/2 ${widthCls} max-w-[calc(100vw-1rem)] rounded-b-lg ${megaBg}`}>
                  <div className={`grid ${gridCls} gap-6 p-6`}>
                    {item.columns.map((col, ci) => (
                      <div key={col.title || `col-${ci}`} className="space-y-6">
                        {colGroups(col).map((grp) => (
                          <div key={grp.title}>
                            <p className={`mb-3 text-xs font-bold uppercase tracking-wide ${megaColTitle}`}>{grp.title}</p>
                            <div className="space-y-3">
                              {grp.items.map((sub) => (
                                <Link key={sub.label} href={sub.href} className="group block">
                                  <p className={`text-sm font-semibold ${megaItemTitle}`}>{sub.label}</p>
                                  {sub.desc && <p className={`text-xs ${megaItemDesc}`}>{sub.desc}</p>}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className={`${megaFooterBg} flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3`}>
                    <Link href={item.href} className={`text-xs font-bold ${megaFooterLink} hover:underline`}>View all {item.label} solutions</Link>
                    {(item.footerLinks || []).map((l) => (
                      <Link key={l.label} href={l.href} className={`text-xs font-bold ${megaFooterLink} hover:underline`}>{l.label}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <CurrencySelector />
          <ThemeToggle className="hidden md:inline-flex" />

          {user ? (
            <div className="relative ml-3">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 rounded-full ${profileBtn} px-3 py-1.5 text-sm font-medium transition-all`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${profileAvatar} text-xs font-bold`}>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className={`max-w-[120px] truncate hidden lg:block ${dark ? "text-white" : ""}`}>{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className={`absolute right-0 top-full z-50 mt-2 w-80 rounded-xl ${dropdownBg} shadow-2xl overflow-hidden`}>
                    {/* User Header */}
                    <div className={`${dropdownHeaderBg} px-5 py-4`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${profileAvatar} text-sm font-bold`}>
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${dark ? "text-white" : "text-[#0f172a]"}`}>{user.name}</p>
                          <p className={`text-xs truncate ${dark ? "text-slate-500" : "text-slate-500"}`}>{user.email}</p>
                        </div>
                      </div>
                      <p className={`text-xs font-mono ${dark ? "text-gray-500" : "text-slate-500"}`}>ID: {user.id?.slice(0, 12)}-GHC</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`text-xs ${dark ? "text-gray-500" : "text-slate-500"}`}>Connection</span>
                        <span className="ml-auto rounded-full bg-[#00ff88]/15 px-2.5 py-0.5 text-xs font-medium text-[#00a832]">Active</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`text-xs ${dark ? "text-gray-500" : "text-slate-500"}`}>Support</span>
                        <span className="ml-auto rounded-full bg-[#e0f0ff] px-2.5 py-0.5 text-xs font-medium text-[#0066cc]">Standard</span>
                      </div>
                    </div>
                    {/* Menu Links */}
                    <div className="py-2">
                      {userMenuItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setProfileOpen(false)}
                          className={`flex items-center gap-3 px-5 py-2.5 text-sm ${dropdownItemText} transition-colors`}
                        >
                          <item.icon className={`h-4 w-4 ${dropdownIcon}`} />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    {/* Logout */}
                    <div className={`px-5 py-3 ${dark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
                      <button
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-3 text-sm font-medium transition-colors ${dark ? "text-slate-700 hover:text-red-400" : "text-[#0f172a] hover:text-red-600"}`}
                      >
                        <LogOut className="h-4 w-4" /> Log out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className={`px-4 py-5 text-sm font-medium ${signinText}`}>Sign in</Link>
              <Link href="/register" className={`ml-2 rounded ${ctaBtn} px-4 py-2 text-sm font-bold`}>Create account</Link>
            </>
          )}
        </div>
        <button className={`md:hidden ${dark ? "text-white" : "text-[#0f172a]"}`} onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {mobileOpen && (
        <div className={`${mobileBg} px-6 py-4 md:hidden`}>
          <div className="flex flex-col gap-3 text-sm font-medium">
            {megaMenu.map((item) => (
              <div key={item.label} className="space-y-2">
                <Link href={item.href} className={`block font-bold ${mobileText}`}>{item.label}</Link>
                {item.columns.flatMap((c) => colGroups(c).flatMap((g) => g.items)).map((sub) => (
                  <Link key={sub.label} href={sub.href} className={`block pl-3 text-sm ${mobileSubText}`}>{sub.label}</Link>
                ))}
              </div>
            ))}
            {user ? (
              <>
                <div className={`pt-3 ${dark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
                  <p className={`font-bold ${mobileText}`}>{user.name}</p>
                  <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>{user.email}</p>
                </div>
                {userMenuItems.map((item) => (
                  <Link key={item.label} href={item.href} className={`flex items-center gap-2 pl-3 text-sm ${mobileText}`}>
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Link>
                ))}
                <button onClick={handleLogout} className="flex items-center gap-2 pl-3 text-sm text-red-600">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={mobileText}>Sign in</Link>
                <Link href="/register" className={dark ? "text-[#00b7ff]" : "text-[#ff3d00]"}>Create account</Link>
              </>
            )}
            <div className="pt-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
