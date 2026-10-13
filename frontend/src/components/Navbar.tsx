"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Server, Menu, X, ChevronDown, ChevronRight, LogOut, User, Bell, Mail, CreditCard, FileText, Shield, Globe, Users, Settings, Package, Search, ShoppingCart } from "lucide-react";
import { api } from "@/lib/api";
import { useGhcSettings } from "@/lib/ghcSettings";
import ThemeToggle from "@/components/ThemeToggle";
import MaintenanceBanner from "@/components/MaintenanceBanner";
import { useCurrency, CURRENCIES } from "@/components/CurrencyProvider";
import { useI18n } from "@/components/LanguageProvider";
import { Language } from "@/lib/i18n";

interface MegaLink { label: string; href: string; desc?: string }
interface MegaGroup { title: string; items: MegaLink[] }
interface MegaCol { title?: string; items?: MegaLink[]; groups?: MegaGroup[] }
interface MegaSubMenu {
  label: string;
  href: string;
  tagline?: string;
  cols?: number;
  columns: MegaCol[];
  footerLinks?: MegaLink[];
}
interface MegaEntry {
  label: string;
  href: string;
  cols?: number;
  columns?: MegaCol[];
  footerLinks?: MegaLink[];
  highlight?: boolean;
  subMenus?: MegaSubMenu[];
}

const colGroups = (col: MegaCol): MegaGroup[] =>
  col.groups ?? [{ title: col.title || "", items: col.items || [] }];

const megaMenu: MegaEntry[] = [
  {
    label: "Cloud",
    href: "/public-cloud",
    subMenus: [
      {
        label: "Public Cloud",
        href: "/public-cloud",
        tagline: "On-demand compute, storage, network, data & AI",
        cols: 4,
        columns: [
      { groups: [
        { title: "Compute", items: [
          { label: "Virtual Machine Instances", href: "/public-cloud?s=vm" },
          { label: "Cloud GPU", href: "/public-cloud?s=gpu" },
          { label: "Metal Instances", href: "/public-cloud?s=metal" },
          { label: "Instance Backup", href: "/public-cloud?s=backup" },
          { label: "Image Catalogs", href: "/public-cloud?s=public-images" },
        ]},
        { title: "Containers & Orchestration", items: [
          { label: "Managed Kubernetes", href: "/public-cloud?s=k8s" },
          { label: "Managed Private Registry", href: "/public-cloud?s=registry" },
          { label: "Managed Rancher", href: "/public-cloud?s=rancher" },
        ]},
      ]},
      { groups: [
        { title: "Storage", items: [
          { label: "Block Storage", href: "/public-cloud?s=block" },
          { label: "Object Storage", href: "/public-cloud?s=object" },
          { label: "File Storage", href: "/public-cloud?s=file" },
          { label: "Local Storage", href: "/public-cloud?s=local" },
        ]},
        { title: "Network", items: [
          { label: "Load Balancer", href: "/public-cloud?s=loadbalancer" },
          { label: "Floating IP", href: "/public-cloud?s=floatingip" },
          { label: "Gateway", href: "/public-cloud?s=gateway" },
          { label: "Private Network (vRack)", href: "/public-cloud?s=vrack" },
        ]},
      ]},
      { groups: [
        { title: "Databases", items: [
          { label: "MySQL", href: "/public-cloud?s=db-mysql" },
          { label: "PostgreSQL", href: "/public-cloud?s=db-postgresql" },
          { label: "MongoDB", href: "/public-cloud?s=db-mongodb" },
          { label: "Redis™*", href: "/public-cloud?s=db-redis" },
          { label: "Kafka", href: "/public-cloud?s=db-kafka" },
          { label: "All databases", href: "/public-cloud?s=db-mysql" },
        ]},
        { title: "Data & Analytics", items: [
          { label: "Analytics", href: "/public-cloud?s=analytics" },
          { label: "Data Platform", href: "/public-cloud?s=dp" },
        ]},
      ]},
      { groups: [
        { title: "AI & Machine Learning", items: [
          { label: "AI Notebooks", href: "/public-cloud?s=ai-notebooks" },
          { label: "AI Training", href: "/public-cloud?s=ai-training" },
          { label: "AI Deploy", href: "/public-cloud?s=ai-deploy" },
          { label: "AI Endpoints", href: "/public-cloud?s=ai-endpoints" },
        ]},
        { title: "Quantum", items: [
          { label: "Quantum Notebooks", href: "/public-cloud?s=q-notebooks" },
          { label: "Quantum Processing Units", href: "/public-cloud?s=qpu" },
        ]},
        { title: "Management", items: [
          { label: "Pricing model", href: "/public-cloud?s=pricing" },
          { label: "Security & identity", href: "/security" },
          { label: "Operations", href: "/operations" },
          { label: "OpenStack Horizon", href: "/products/horizon" },
        ]},
      ]},
        ],
        footerLinks: [
          { label: "Prices", href: "/public-cloud?s=pricing" },
          { label: "Guides & Documentation", href: "/kb" },
          { label: "Roadmap & Changelog", href: "/status" },
        ],
      },
      {
        label: "Private Cloud",
        href: "/private-cloud",
        tagline: "Dedicated infrastructure, cloud flexibility",
        cols: 2,
        columns: [
      { title: "Hosted Private Cloud", items: [
        { label: "VMware on GHC", href: "/private-cloud?s=vmware", desc: "vSphere, vSAN and NSX on dedicated hosts" },
        { label: "Nutanix on GHC", href: "/private-cloud?s=nutanix", desc: "HCI private cloud on dedicated hosts" },
        { label: "SAP HANA on GHC", href: "/private-cloud?s=sap-hana", desc: "SAP HANA certified infrastructure" },
        { label: "SecNumCloud — Trusted Cloud", href: "/products/secnumcloud", desc: "Sovereign infrastructure for regulated workloads" },
        { label: "Bare Metal Cloud", href: "/products/bare-metal-cloud", desc: "Dedicated hardware, cloud agility" },
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
        { label: "Eco servers", href: "/dedicated-servers/eco", desc: "Budget bare metal for labs and small projects" },
        { label: "Rise servers", href: "/dedicated-servers/rise", desc: "Entry-level enterprise bare metal" },
        { label: "Distributions & Licenses", href: "/apps", desc: "Choose an image to deploy on your server" },
      ]},
      { title: "Bare Metal Foundations", items: [
        { label: "Network", href: "/network", desc: "Secure and high-performance connectivity" },
        { label: "Anti-DDoS Protection", href: "/products/anti-ddos", desc: "Always-on attack mitigation, free with every server" },
        { label: "Failover & Additional IPs", href: "/products/ip-failover", desc: "Moveable IPs for high availability" },
        { label: "vRack Private Network", href: "/products/vrack", desc: "Isolated L2 network across your services" },
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
    label: "Metal",
    href: "/metal/vps",
    highlight: true,
    subMenus: [
      {
        label: "Dedicated servers",
        href: "/dedicated-servers",
        tagline: "Maximum performance, no compromise",
        columns: [
          { title: "Our server ranges", items: [
            { label: "Kimsufi (T1/T2)", href: "/dedicated-servers/eco", desc: "The best value, without compromise" },
            { label: "Advance (T3)", href: "/dedicated-servers/advance", desc: "Versatility for SMEs" },
            { label: "Game (T3)", href: "/dedicated-servers/game", desc: "Performance and security for your games" },
            { label: "Scale (T4)", href: "/dedicated-servers/scale", desc: "Power for heavy workloads" },
            { label: "High Grade (T5)", href: "/dedicated-servers/high-grade", desc: "The most powerful for critical loads" },
          ]},
          { title: "Deployment mode", items: [
            { label: "Wholesale", href: "/dedicated-servers", desc: "Complete server racks" },
            { label: "Reseller", href: "/dedicated-servers", desc: "Our infrastructure, your added value" },
          ]},
          { title: "Uses", items: [
            { label: "AZ and resilience", href: "/dedicated-servers", desc: "Business continuity with high availability" },
            { label: "Grid computing", href: "/dedicated-servers/scale", desc: "Compute-intensive models for critical issues" },
            { label: "Virtualisation and containerisation", href: "/solutions/proxmox", desc: "Cloud-native flexibility on physical servers" },
            { label: "Website and business application", href: "/metal/vps", desc: "Scalability and security for your web applications" },
            { label: "All uses", href: "/dedicated-servers" },
          ]},
        ],
        footerLinks: [
          { label: "Prices", href: "/dedicated-servers" },
          { label: "OS & licences", href: "/apps" },
          { label: "Documentation", href: "/kb" },
          { label: "Roadmap & Changelog", href: "/status" },
        ],
      },
      {
        label: "VPS",
        href: "/metal/vps",
        tagline: "Scalability at the best price",
        columns: [
          { title: "Metal VPS", items: [
            { label: "VPS 2027", href: "/metal/vps", desc: "Virtually isolated CPU, RAM, and storage Reliable performance at lower prices" },
            { label: "n8n VPS", href: "/metal/vps?s=n8n", desc: "Automate everything. Maintain control." },
            { label: "Plesk VPS", href: "/metal/vps?s=plesk", desc: "Web hosting made simple A unified interface" },
            { label: "cPanel VPS", href: "/metal/vps?s=cpanel", desc: "Centralised web hosting. Unified management." },
            { label: "WordPress VPS", href: "/metal/vps?s=wordpress", desc: "Customisable and scalable server. Unlimited traffic." },
            { label: "Apps, OS, and Panels", href: "/apps", desc: "Available OS and software" },
          ]},
          { title: "Who is it for?", items: [
            { label: "Agency / Multisites", href: "/metal/vps#usecases" },
            { label: "Developers", href: "/metal/vps#usecases" },
            { label: "Resellers", href: "/metal/vps#usecases" },
            { label: "All uses", href: "/metal/vps#usecases" },
          ]},
          { title: "Partners", items: [
            { label: "Become a GHC Partner", href: "/register" },
            { label: "Compliance & Certifications", href: "/security" },
            { label: "GHC Community", href: "/kb" },
          ]},
        ],
        footerLinks: [
          { label: "Documentation", href: "/kb" },
          { label: "Roadmap & Changelog", href: "/status" },
        ],
      },
    ],
  },
  {
    label: "Storage & Security",
    href: "/network",
    cols: 3,
    columns: [
      { groups: [
        { title: "Storage & Backup", items: [
          { label: "Object Storage", href: "/products/object-storage" },
          { label: "Block Storage", href: "/products/block-storage" },
          { label: "Enterprise File Storage", href: "/products/enterprise-file-storage" },
          { label: "Cold Archive", href: "/products/cold-archive" },
          { label: "Managed Veeam Backup", href: "/products/veeam-backup" },
          { label: "NAS-HA", href: "/products/nas-ha" },
        ]},
      ]},
      { groups: [
        { title: "Security & Identity", items: [
          { label: "Anti-DDoS Protection", href: "/products/anti-ddos" },
          { label: "SSL Certificates", href: "/products/ssl-certificates" },
          { label: "Key Management Service", href: "/products/kms" },
          { label: "Identity & Access", href: "/products/iam" },
          { label: "Security overview", href: "/security" },
        ]},
        { title: "Observability", items: [
          { label: "Logs Data Platform", href: "/products/logs-data-platform" },
          { label: "Metrics Platform", href: "/products/metrics" },
          { label: "Operations", href: "/operations" },
        ]},
      ]},
      { groups: [
        { title: "Network", items: [
          { label: "Load Balancer", href: "/products/load-balancer" },
          { label: "Content Delivery Network", href: "/products/cdn" },
          { label: "Anycast DNS", href: "/products/anycast-dns" },
          { label: "vRack Private Network", href: "/products/vrack" },
          { label: "Failover & Additional IPs", href: "/products/ip-failover" },
          { label: "GHC Connect", href: "/products/ovh-connect" },
          { label: "Bring Your Own IP", href: "/products/byoip" },
        ]},
        { title: "Telecom", items: [
          { label: "SMS Gateway", href: "/products/sms" },
          { label: "VoIP Telephony", href: "/products/voip" },
          { label: "Internet Connectivity", href: "/products/internet-connectivity" },
        ]},
      ]},
    ],
    footerLinks: [
      { label: "All network products", href: "/network" },
      { label: "Guides & Documentation", href: "/kb" },
    ],
  },
  {
    label: "Domain / Hosting",
    href: "/domain",
    subMenus: [
      {
        label: "Domain name",
        href: "/domain",
        tagline: "Assert and secure your identity",
        cols: 3,
        columns: [
          { title: "Domain name", items: [
            { label: "Search for a domain name", href: "/domain", desc: "Your online presence begins here" },
            { label: "Renew your domain name", href: "/dashboard?tab=domains", desc: "Manual or automatic renewal to keep your services active" },
            { label: "Transfer your domain name to GHC", href: "/domain#transfer", desc: "Already got a domain name? Transfer it to GHC" },
            { label: "Domain name dispute", href: "/domain-dispute", desc: "Recover or defend a domain name" },
          ]},
          { title: "Catalogue", items: [
            { label: "See the 900+ domain extensions", href: "/domain#tlds", desc: "A vast catalogue to assert your identity" },
            { label: "Domain privacy (WHOIS)", href: "/products/anycast-dns", desc: "Keep your details private with Anycast DNS included" },
            { label: "Email hosting", href: "/email-hosting", desc: "Professional mailboxes on your domain" },
          ]},
          { title: "Partners", items: [
            { label: "Become a GHC Partner", href: "/register" },
            { label: "Marketplace for hosting", href: "/marketplace" },
            { label: "Compliance & Certifications", href: "/security" },
            { label: "GHC Community", href: "/kb" },
          ]},
        ],
        footerLinks: [
          { label: "Domain prices", href: "/domain" },
          { label: "Guides & Documentation", href: "/kb" },
        ],
      },
      {
        label: "Web hosting",
        href: "/web-hosting",
        tagline: "Comprehensive packs adapted to all your web projects",
        cols: 3,
        columns: [
          { title: "Web hosting", items: [
            { label: "Eco — For accessible prices", href: "/web-hosting/eco", desc: "Everything you need to launch your website(s) at a lower cost" },
            { label: "Business — For professionals", href: "/web-hosting/business", desc: "Performance and flexibility for business websites" },
            { label: "Agencies — For web agencies", href: "/web-hosting/agency", desc: "Efficiently manage various client websites on a single hosting plan" },
            { label: "Compare our web hosting plans", href: "/web-hosting", desc: "Choose the solution that best suits your needs" },
            { label: "Managed hosting for WordPress", href: "/web-hosting/wordpress", desc: "Spend less time managing your WordPress sites" },
          ]},
          { groups: [
            { title: "Additional products", items: [
              { label: "Video", href: "/web-hosting/video", desc: "Stream videos without slowing down your websites" },
              { label: "Additional databases", href: "/web-hosting", desc: "SQL and NoSQL services, guaranteed resources" },
              { label: "SSL Certificates", href: "/products/ssl-certificates", desc: "Enhance the security of your website" },
              { label: "CDN option", href: "/products/cdn", desc: "Improve page loading speed and ensure security against attacks" },
            ]},
          ]},
          { groups: [
            { title: "Uses", items: [
              { label: "How do I create a website?", href: "/kb", desc: "Complete guide to launching your website" },
              { label: "Host your WordPress website", href: "/web-hosting/wordpress", desc: "Choose the best hosting plan for a WordPress blog" },
              { label: "Create your website in 1 click", href: "/web-hosting", desc: "Turnkey solution to get started" },
              { label: "Create an online store", href: "/solutions/prestashop", desc: "Quickly and efficiently sell online" },
            ]},
            { title: "Partners", items: [
              { label: "Become a GHC Partner", href: "/register" },
              { label: "Compliance & Certifications", href: "/security" },
              { label: "GHC Community", href: "/kb" },
            ]},
          ]},
        ],
        footerLinks: [
          { label: "Hosting prices", href: "/web-hosting" },
          { label: "Email hosting", href: "/email-hosting" },
          { label: "Guides & Documentation", href: "/kb" },
        ],
      },
    ],
  },
];

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

function CurrencySelector({ mobileOnly }: { mobileOnly?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative z-50 ${mobileOnly ? "" : "hidden sm:block"}`}>
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

function LanguageSelector({ mobileOnly }: { mobileOnly?: boolean }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <div className={`relative z-50 ${mobileOnly ? "" : "hidden sm:block"}`}>
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

function CartButton({ dark }: { dark: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => api.cart.list().then((d) => { if (alive) setCount((d.items || []).length); }).catch(() => {});
    load();
    const onUpdate = () => load();
    window.addEventListener("ghc:cart-updated", onUpdate);
    return () => { alive = false; window.removeEventListener("ghc:cart-updated", onUpdate); };
  }, []);
  return (
    <Link href="/cart" aria-label="Cart" className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full ${dark ? "text-white hover:bg-white/10" : "text-[#0f172a] hover:bg-slate-100"}`}>
      <ShoppingCart className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00b7ff] px-1 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function NotifButton({ dark }: { dark: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    const load = () => api.auth.notificationsList().then((d) => { if (alive && Array.isArray(d)) setItems(d); }).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const unread = items.filter((n) => !n.isRead).length;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Notifications" className={`relative inline-flex h-8 w-8 items-center justify-center rounded-full ${dark ? "text-white hover:bg-white/10" : "text-[#0f172a] hover:bg-slate-100"}`}>
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3d00] px-1 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className={`absolute right-0 top-10 w-80 rounded-xl shadow-2xl z-50 overflow-hidden ${dark ? "border border-white/10 bg-[#0f0f0f]" : "border border-slate-200 bg-white"}`}>
          <div className={`px-4 py-3 text-sm font-bold ${dark ? "text-white border-b border-white/10" : "text-[#0f172a] border-b border-slate-200"}`}>Notifications</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-500">No notifications yet.</p>}
            {items.slice(0, 10).map((n) => (
              <button
                key={n.id}
                onClick={async () => {
                  try { await api.auth.markNotificationRead(n.id); } catch {}
                  setOpen(false);
                  window.location.href = n.link || "/dashboard";
                }}
                className={`block w-full text-left px-4 py-3 border-b last:border-0 ${dark ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-[#f8faff]"}`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#00b7ff]" />}
                  <div className={n.isRead ? "pl-4" : ""}>
                    <p className={`text-xs font-semibold ${dark ? "text-white" : "text-[#0f172a]"}`}>{n.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Link href="/dashboard" onClick={() => setOpen(false)} className={`block px-4 py-2.5 text-center text-xs font-bold text-[#00b7ff] ${dark ? "border-t border-white/10 hover:bg-white/5" : "border-t border-slate-200 hover:bg-[#f8faff]"}`}>View all in dashboard</Link>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ theme = "light" }: { theme?: "light" | "dark" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMega, setOpenMega] = useState<number | null>(null);
  const [subIdx, setSubIdx] = useState(0);
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

  const renderMegaColumns = (columns: MegaCol[], gridCls: string) => (
    <div className={`grid ${gridCls} gap-6 p-6`}>
      {columns.map((col, ci) => (
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
  );

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
      <MaintenanceBanner />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {ghc.logo_url ? (
            <>
              <img src={ghc.logo_url} alt={ghc.name} className="h-10 w-auto" style={{ filter: "drop-shadow(0 2px 8px rgba(0,120,200,.25))" }} />
              <span className="hidden sm:flex flex-col leading-tight">
                <span className={`text-lg font-black tracking-tight ${dark ? "text-white" : "text-[#0f172a]"}`}>{ghc.name}</span>
                <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${dark ? "text-[#00b7ff]" : "text-[#0050d7]"}`}>{ghc.tagline}</span>
              </span>
            </>
          ) : (
            <>
              <div className={`flex h-9 w-9 items-center justify-center rounded ${logoBg}`}>
                <Server className="h-5 w-5" />
              </div>
              <span className="flex flex-col leading-tight">
                <span className={`text-lg font-bold ${dark ? "text-white" : ""}`}>{ghc.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#00b7ff]">{ghc.tagline}</span>
              </span>
            </>
          )}
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (domainQuery.trim()) router.push(`/domain?q=${encodeURIComponent(domainQuery.trim())}`);
          }}
          className="mx-1.5 hidden w-full max-w-[7.5rem] items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 backdrop-blur md:flex lg:max-w-[9rem] xl:max-w-[10.5rem]"
        >
          <Search className="h-3 w-3 shrink-0 text-slate-400" />
          <input
            value={domainQuery}
            onChange={(e) => setDomainQuery(e.target.value)}
            placeholder="Domain..."
            className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
        </form>

        <div className="hidden items-center gap-0 md:flex">
          {megaMenu.map((item, idx) => {
            const cols = item.cols || 2;
            const widthCls = cols >= 6 ? "w-[1280px]" : cols >= 4 ? "w-[1120px]" : cols === 3 ? "w-[880px]" : "w-[640px]";
            const gridCls = cols >= 6 ? "grid-cols-6" : cols >= 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
            return (
            <div
              key={item.label}
              className="static"
              onMouseEnter={() => { setOpenMega(idx); setSubIdx(0); }}
              onMouseLeave={() => setOpenMega(null)}
            >
              <button className={`flex items-center gap-1 px-3 py-5 text-sm font-medium lg:px-4 ${item.highlight ? "font-bold text-[#ff3d00] hover:text-[#e63700]" : menuText}`}>
                {item.label}
                {item.highlight && <span className="rounded-full bg-[#ff3d00] px-1.5 py-px text-[9px] font-black uppercase tracking-wide text-white">New</span>}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {openMega === idx && item.subMenus ? (
                <div className={`absolute left-1/2 top-full -translate-x-1/2 w-[1120px] max-w-[calc(100vw-1rem)] rounded-b-lg ${megaBg} flex`}>
                  <div className={`w-52 shrink-0 py-3 ${dark ? "border-r border-white/10 bg-white/5" : "border-r border-slate-200 bg-[#f8faff]"} rounded-bl-lg`}>
                    {item.subMenus.map((s, si) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        onMouseEnter={() => setSubIdx(si)}
                        className={`flex items-center justify-between px-5 py-3.5 text-sm font-bold ${subIdx === si ? "text-[#00b7ff]" : dark ? "text-slate-700 hover:text-[#00b7ff]" : "text-[#0f172a] hover:text-[#00b7ff]"}`}
                      >
                        {s.label}
                        <ChevronRight className={`h-4 w-4 ${subIdx === si ? "text-[#00b7ff]" : "text-slate-400"}`} />
                      </Link>
                    ))}
                  </div>
                  {(() => {
                    const sub = (item.subMenus || [])[subIdx] || (item.subMenus || [])[0];
                    return (
                      <div className="min-w-0 flex-1">
                        {sub.tagline && <p className={`px-6 pt-5 text-sm font-black ${dark ? "text-white" : "text-[#0f172a]"}`}>{sub.tagline}</p>}
                        {renderMegaColumns(sub.columns, sub.cols === 2 ? "grid-cols-2" : sub.cols && sub.cols >= 4 ? "grid-cols-4" : "grid-cols-3")}
                        <div className={`${megaFooterBg} flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3 rounded-br-lg`}>
                          <Link href={sub.href} className={`text-xs font-bold ${megaFooterLink} hover:underline`}>View all {sub.label} solutions</Link>
                          {(sub.footerLinks || []).map((l) => (
                            <Link key={l.label} href={l.href} className={`text-xs font-bold ${megaFooterLink} hover:underline`}>{l.label}</Link>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : openMega === idx && (
                <div className={`absolute left-1/2 top-full -translate-x-1/2 ${widthCls} max-w-[calc(100vw-1rem)] rounded-b-lg ${megaBg}`}>
                  {renderMegaColumns(item.columns || [], gridCls)}
                  <div className={`${megaFooterBg} flex flex-wrap items-center gap-x-6 gap-y-1 px-6 py-3 rounded-b-lg`}>
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
          {user && <NotifButton dark={dark} />}
          {user && <CartButton dark={dark} />}

          {user ? (
            <div className="relative ml-1.5">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-1 rounded-full ${profileBtn} px-1.5 py-1 text-xs font-medium transition-all`}
              >
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${profileAvatar} text-[10px] font-bold`}>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <ChevronDown className="h-3 w-3" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className={`absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl ${dropdownBg} shadow-2xl overflow-hidden`}>
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
        <div
          className={`${mobileBg} px-6 py-4 md:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto`}
          onClick={(e) => { if ((e.target as HTMLElement).closest("a")) setMobileOpen(false); }}
        >
          <div className="flex flex-col gap-1 text-sm font-medium">
            {megaMenu.map((item) => (
              <details key={item.label} className="group">
                <summary className={`flex cursor-pointer items-center justify-between py-2.5 font-bold ${item.highlight ? "text-[#ff3d00]" : mobileText} list-none`}>
                  {item.label}
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-1 pb-2">
                  <Link href={item.href} className={`block pl-3 py-1 text-sm font-semibold ${dark ? "text-[#00b7ff]" : "text-[#ff3d00]"}`}>View all {item.label}</Link>
                  {item.subMenus ? item.subMenus.map((s) => (
                    <div key={s.label}>
                      <Link href={s.href} className={`block pl-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wide ${dark ? "text-gray-400" : "text-slate-400"}`}>{s.label}</Link>
                      {s.columns.flatMap((c) => colGroups(c).flatMap((g) => g.items)).map((sub) => (
                        <Link key={sub.label} href={sub.href} className={`block pl-5 py-1 text-sm ${mobileSubText}`}>{sub.label}</Link>
                      ))}
                    </div>
                  )) : (item.columns || []).flatMap((c) => colGroups(c).flatMap((g) => g.items)).map((sub) => (
                    <Link key={sub.label} href={sub.href} className={`block pl-3 py-1 text-sm ${mobileSubText}`}>{sub.label}</Link>
                  ))}
                </div>
              </details>
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
            <div className={`flex items-center gap-3 pt-3 ${dark ? "border-t border-white/10" : "border-t border-slate-200"}`}>
              <ThemeToggle />
              <LanguageSelector mobileOnly />
              <CurrencySelector mobileOnly />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
