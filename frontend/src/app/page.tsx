"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Server, Search, ChevronRight, Check, Globe, Shield, Zap,
  Loader2, Database, Network, Monitor, ArrowRight, Star,
  X, Headphones, Lock, Rocket, Plus, Quote, BadgeCheck,
  Cloud, MapPin, Cpu, HardDrive, Wifi, Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useGhcSettings } from "@/lib/ghcSettings";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const stats = [
  { value: 99.99, suffix: "%", label: "Uptime SLA", dec: true },
  { value: 7, suffix: "-Day", label: "Money-Back Guarantee" },
  { value: 15, suffix: "+", label: "Global Locations" },
  { value: 24, suffix: "/7", label: "Expert Support" },
];

const marqueeItems = ["VPS Servers", "Dedicated Servers", "Web Hosting", "Cloud Instances", "Domain Names", "CDN & Security", "Object Storage", "Managed Kubernetes"];

const productDefs = [
  {
    key: "VPS",
    title: "Public Cloud",
    subtitle: "Scalable cloud instances",
    desc: "Launch virtual servers in minutes with predictable monthly billing, NVMe storage and unlimited traffic.",
    icon: Cloud,
    badge: "Best value",
    badgeClass: "bg-lime-400 text-[#0f172a]",
    fallbackPrice: "Pay-as-you-go",
    cta: "Get started",
    href: "/vps",
  },
  {
    key: "DEDICATED",
    title: "Dedicated Servers",
    subtitle: "Bare metal power",
    desc: "Step up from VPS with single-tenancy resources and bare-metal performance.",
    icon: Server,
    badge: null,
    badgeClass: "",
    fallbackPrice: "From $109.53 ex. taxes/month",
    cta: "Shop dedicated",
    href: "/dedicated-servers",
  },
  {
    key: "WEB_HOSTING",
    title: "Web Hosting",
    subtitle: "All-in-one",
    desc: "cPanel, Plesk, SSL, databases, email and 1-click installs for every project.",
    icon: Globe,
    badge: "Popular",
    badgeClass: "bg-[#00b7ff] text-white",
    fallbackPrice: "From $1.04 ex. taxes/month",
    cta: "Explore hosting",
    href: "/web-hosting",
  },
];

const productBullets: Record<string, string[]> = {
  VPS: ["Linux and Windows server templates", "NVMe SSD storage and unlimited traffic", "API, CLI and dashboard management"],
  DEDICATED: ["AMD EPYC and Intel Xeon processors", "Up to 128GB DDR4/DDR5 ECC", "Available in India, Europe and APAC"],
  WEB_HOSTING: ["Free SSL certificate", "cPanel / Plesk", "Daily backups", "1-click installs"],
};

const whyFeatures = [
  { icon: Zap, title: "Instant Provisioning", desc: "Server order karte hi minutes me live — manual wait nahi, full automation." },
  { icon: Shield, title: "Free DDoS Protection", desc: "Har plan ke sath enterprise-grade DDoS mitigation included — koi extra cost nahi." },
  { icon: Globe, title: "Global Locations", desc: "Global network of tier-III datacenters — apne users ke sabse paas deploy karo." },
  { icon: Headphones, title: "24/7 Expert Support", desc: "Real engineers, real help — tickets, chat aur email pe kabhi bhi." },
];

const customerHighlights = [
  { name: "SaaS Startups", role: "Common use case", text: "Fast VPS provisioning and predictable pricing help early-stage teams scale without overspending.", rating: 5 },
  { name: "Web Agencies", role: "Common use case", text: "Reliable web hosting with free SSL and DDoS protection keeps client sites online around the clock.", rating: 5 },
  { name: "Gaming Communities", role: "Common use case", text: "Low-latency dedicated servers give multiplayer environments the stable performance players expect.", rating: 5 },
  { name: "E-commerce Stores", role: "Common use case", text: "Scalable compute and 24/7 support let online stores handle traffic spikes with confidence.", rating: 5 },
];

const faqs = [
  { q: "GHC pe VPS kitni jaldi activate hota hai?", a: "Payment confirm hote hi automated provisioning chalti hai — zyadatar VPS 2-5 minutes me live ho jate hain. Dedicated servers inventory pe depend karte hain." },
  { q: "Kya DDoS protection free hai?", a: "Haan — har plan me enterprise-grade anti-DDoS protection included hai, bina kisi extra charge ke." },
  { q: "Kaunse OS aur control panels milte hain?", a: "Ubuntu, Debian, AlmaLinux, Windows Server aur cPanel, Plesk, DirectAdmin jaise panels — sab configure page pe select kar sakte ho." },
  { q: "Billing kaise kaam karti hai?", a: "Dashboard se monthly ya longer duration select karo — hourly/monthly billing, auto-invoices aur wallet system supported hai." },
  { q: "Kya main baad me upgrade kar sakta hoon?", a: "Bilkul — dashboard se plan upgrade/downgrade kar sakte ho. Resources scale karna easy hai, zero data loss." },
  { q: "Support kaise milta hai?", a: "24/7 ticket support + email pe expert team available hai. Enterprise plans pe priority response milta hai." },
];

const trustBadges = [
  { icon: Lock, label: "SSL Secure" },
  { icon: Shield, label: "DDoS Protected" },
  { icon: BadgeCheck, label: "99.99% Uptime SLA" },
  { icon: Headphones, label: "24/7 Support" },
  { icon: Rocket, label: "Instant Setup" },
];

function fmtMoney(n?: number, currency?: string) {
  if (n === undefined || n === null) return "—";
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const s = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${sym}${s}`;
}

const initialTldPrices = [
  { tld: ".in", price: fmtMoney(8.83, "USD"), strike: "", period: "ex. taxes/year" },
  { tld: ".com", price: fmtMoney(11.34, "USD"), strike: "", period: "ex. taxes/year" },
  { tld: ".io", price: fmtMoney(75.18, "USD"), strike: "", period: "ex. taxes/year" },
  { tld: ".biz", price: fmtMoney(21.21, "USD"), strike: "", period: "ex. taxes/year" },
];

const partnerBadges = [
  { icon: Server, label: "Bare Metal" },
  { icon: Cloud, label: "Public Cloud" },
  { icon: Database, label: "NVMe Storage" },
  { icon: Shield, label: "DDoS Shield" },
  { icon: Globe, label: "Global Network" },
  { icon: Cpu, label: "Compute" },
  { icon: Lock, label: "Secure KVM" },
  { icon: Wifi, label: "10 Gbps Uplink" },
];

const networkCities = [
  { x: 120, y: 200, n: "Los Angeles" },
  { x: 170, y: 190, n: "New York" },
  { x: 180, y: 170, n: "Toronto" },
  { x: 270, y: 160, n: "London" },
  { x: 285, y: 165, n: "Paris" },
  { x: 300, y: 160, n: "Frankfurt" },
  { x: 330, y: 155, n: "Amsterdam" },
  { x: 500, y: 230, n: "Dubai" },
  { x: 540, y: 250, n: "Mumbai" },
  { x: 710, y: 290, n: "Singapore" },
  { x: 750, y: 250, n: "Hong Kong" },
  { x: 840, y: 190, n: "Tokyo" },
  { x: 860, y: 390, n: "Sydney" },
  { x: 320, y: 320, n: "São Paulo" },
  { x: 430, y: 330, n: "Johannesburg" },
];

const networkLinks: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 5], [5, 6],
  [1, 5], [3, 14], [3, 13], [3, 8], [8, 4], [8, 9],
  [9, 11], [11, 12], [9, 12], [7, 8], [9, 10], [10, 11],
];

const whyList = [
  { title: "A flexible and open cloud", items: ["Choose from VPS, dedicated servers, web hosting and domains — all managed from one dashboard.", "Combine public cloud, bare metal and shared hosting to match your workload.", "Open APIs and standard tools make migration and integration straightforward."] },
  { title: "A trusted cloud for your data", items: ["Your data stays yours. We do not sell, share or transfer customer data.", "Deploy close to your users with our global network and local presence.", "Enterprise security and DDoS protection are included on every plan."] },
  { title: "Fair pricing for real performance", items: ["Transparent pricing with no hidden fees or surprise overages.", "NVMe storage, high-bandwidth uplinks and modern CPUs at every tier.", "Predictable monthly billing with optional longer-term discounts."] },
];

const helpCards = [
  { title: "Deploy your first cloud instance in minutes.", desc: "Choose a plan, select an OS and launch your project with NVMe storage and high-bandwidth uplinks.", cta: "Find out more", href: "/vps" },
  { title: "Deploy instances with guaranteed resources", desc: "Our VPS and dedicated servers give you stable, predictable performance with no noisy neighbours.", cta: "Find out more", href: "/dedicated-servers" },
  { title: "Build a website in a few steps", desc: "Use web hosting or a pre-configured WordPress, Drupal or Joomla setup with cPanel/Plesk and free SSL.", cta: "Find out more", href: "/web-hosting" },
];

interface DomainResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
}

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [announceGone, setAnnounceGone] = useState(false);
  const [tldPrices, setTldPrices] = useState(initialTldPrices);
  const [productPrices, setProductPrices] = useState<Record<string, string>>({});

  const { currency } = useCurrency();

  useEffect(() => {
    const tlds = [".in", ".com", ".io", ".biz"];
    Promise.all(
      tlds.map((tld) => api.server.checkDomain(`example${tld}`).catch(() => null))
    ).then((results) => {
      const updated = results.map((r: any, i: number) => ({
        tld: tlds[i],
        price: r?.price !== undefined ? fmtMoney(Number(r.price), r?.currency || currency) : initialTldPrices[i].price,
        strike: "",
        period: "ex. taxes/year",
      }));
      setTldPrices(updated);
    });

    // Fetch category min monthly prices for product cards
    (async () => {
      const next: Record<string, string> = {};
      for (const cat of ["VPS", "DEDICATED", "WEB_HOSTING"]) {
        try {
          const plans = await api.server.plans(cat);
          const prices = (plans || [])
            .flatMap((p: any) => (p.durations || []).map((d: any) => d.monthlyPrice || d.finalPrice))
            .filter((v: number) => v > 0);
          const min = prices.length ? Math.min(...prices) : 0;
          next[cat] = min > 0 ? `${getCurrencySymbol(currency)}${min.toFixed(2)}` : "";
        } catch {
          next[cat] = "";
        }
      }
      setProductPrices(next);
    })();
  }, [currency]);

  const [domainQuery, setDomainQuery] = useState("");
  const [domainLoading, setDomainLoading] = useState(false);
  const [domainResults, setDomainResults] = useState<DomainResult[]>([]);
  const [domainSearched, setDomainSearched] = useState(false);

  const ghc = useGhcSettings();

  const productCards = productDefs.map((p) => ({
    ...p,
    price: productPrices[p.key]
      ? `From ${productPrices[p.key]} ex. taxes/month`
      : p.fallbackPrice,
  }));

  const searchDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainQuery.trim()) return;
    setDomainLoading(true);
    setDomainSearched(true);
    try {
      const data = await api.server.checkDomain(domainQuery.trim());
      setDomainResults(data.results || []);
    } catch {
      setDomainResults([]);
    } finally {
      setDomainLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      {/* Announcement bar — controlled from believoo admin > Settings > GHC Site */}
      {ghc.announce_text && !announceGone && (
        <div id="ghc-announce">
          <Zap className="h-3.5 w-3.5" />
          <span>
            {ghc.announce_url ? (
              <a href={ghc.announce_url}>{ghc.announce_text}</a>
            ) : (
              ghc.announce_text
            )}
          </span>
          <button id="ghc-announce-close" aria-label="Close" onClick={() => setAnnounceGone(true)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <Navbar theme="light" />

      {/* Hero — premium GHC */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="ghc-orb absolute -top-20 right-[5%] h-96 w-96 rounded-full bg-[#00b7ff]/10 blur-3xl" />
          <div className="ghc-orb ghc-orb-2 absolute bottom-0 left-[10%] h-80 w-80 rounded-full bg-[#00b7ff]/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-md">
              <Zap className="h-4 w-4" /> {ghc.hero_badge}
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
              {ghc.hero_title}
            </h1>
            <p className="mt-4 text-lg font-semibold text-slate-200" style={{ minHeight: "1.75rem" }}>
              Deploy <span data-ghc-typing="VPS Servers|Dedicated Servers|Web Hosting|Cloud Instances|Domains|Kubernetes"></span><span className="ghc-caret"></span>
            </p>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              {ghc.hero_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#products" className="rounded-lg bg-[#00b7ff] px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,183,255,0.35)] transition hover:bg-[#0f0c29]">
                Explore products
              </a>
              <Link href="/dashboard" className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">
                Client dashboard
              </Link>
            </div>
          </div>

          {/* 3D cloud/server illustration */}
          <div className="relative hidden items-center justify-center md:flex">
            <div className="relative h-80 w-80 rounded-full border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <svg className="h-full w-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Cloud */}
                <g opacity="0.9">
                  <ellipse cx="200" cy="130" rx="90" ry="55" fill="white" fillOpacity="0.15" />
                  <circle cx="140" cy="140" r="40" fill="white" fillOpacity="0.15" />
                  <circle cx="260" cy="140" r="45" fill="white" fillOpacity="0.15" />
                  <circle cx="200" cy="100" r="50" fill="white" fillOpacity="0.15" />
                </g>
                {/* Server rack */}
                <g transform="translate(130, 200)">
                  <rect x="0" y="0" width="140" height="30" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" />
                  <rect x="0" y="40" width="140" height="30" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" />
                  <rect x="0" y="80" width="140" height="30" rx="6" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" />
                  <circle cx="115" cy="15" r="4" fill="#00b7ff" />
                  <circle cx="115" cy="55" r="4" fill="#00ff88" />
                  <circle cx="115" cy="95" r="4" fill="#ff3d00" />
                  <line x1="15" y1="15" x2="80" y2="15" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
                  <line x1="15" y1="55" x2="80" y2="55" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
                  <line x1="15" y1="95" x2="80" y2="95" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
                </g>
                {/* Connection lines */}
                <line x1="200" y1="190" x2="200" y2="205" stroke="#00b7ff" strokeOpacity="0.6" strokeWidth="2" />
                <circle cx="80" cy="160" r="8" fill="#00b7ff" fillOpacity="0.5" />
                <circle cx="320" cy="160" r="8" fill="#00b7ff" fillOpacity="0.5" />
                <line x1="130" y1="155" x2="170" y2="140" stroke="white" strokeOpacity="0.3" />
                <line x1="270" y1="140" x2="310" y2="155" stroke="white" strokeOpacity="0.3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-5">
          {trustBadges.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500">
              <b.icon className="h-4 w-4 text-[#00b7ff]" /> {b.label}
            </span>
          ))}
        </div>
      </section>

      {/* Services marquee */}
      <section className="overflow-hidden border-b border-slate-200 bg-[#f8fcff] py-5">
        <div className="ghc-marquee">
          {[0, 1].map((n) => (
            <div key={n} aria-hidden={n === 1} className="flex items-center gap-10 pr-10 text-sm font-bold uppercase tracking-widest text-slate-500">
              {marqueeItems.map((m) => (
                <span key={m} className="flex items-center gap-10">
                  {m} <span className="h-1.5 w-1.5 rounded-full bg-[#00b7ff]/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Product cards */}
      <section id="products" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="ghc-reveal mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">Explore our solutions</p>
          <h2 className="mt-2 text-3xl font-black text-[#0f172a] md:text-4xl">Build and grow with GHC</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">Choose the right infrastructure for your project — from cloud instances to bare metal.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {productCards.map((p) => (
            <div key={p.key} className="ghc-reveal group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-[#00b7ff]/30">
              <div className="h-2 bg-gradient-to-r from-[#0f0c29] to-[#00b7ff]" />
              <div className="p-6">
                {p.badge && (
                  <span className={`mb-3 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${p.badgeClass}`}>{p.badge}</span>
                )}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#00b7ff]/10 text-[#00b7ff]">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-[#0f172a]">{p.title}</h3>
                <p className="text-sm font-bold text-[#00b7ff]">{p.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{p.desc}</p>
                <ul className="mt-4 space-y-2">
                  {productBullets[p.key].map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-500">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b7ff]" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto border-t border-slate-100 p-6">
                <p className="text-sm font-bold text-[#0f172a]">{p.price}</p>
                <Link href={p.href} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f0c29] px-5 py-3 text-sm font-black text-white transition hover:bg-[#302b63]">
                  {p.cta} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats counters */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="ghc-reveal text-center">
              <p className="bg-gradient-to-r from-[#0f0c29] to-[#00b7ff] bg-clip-text text-3xl font-black text-transparent md:text-4xl">
                <span data-count={s.value}>{s.value}</span>{s.suffix}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Domain search */}
      <section className="bg-[#d7f4ff]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="ghc-reveal text-center">
            <h2 className="text-3xl font-black text-[#0f172a] md:text-4xl">Find the perfect domain name</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[#0f172a]/70">Search and register domain names with real-time availability and transparent pricing.</p>
          </div>

          <form onSubmit={searchDomain} className="ghc-reveal mx-auto mt-8 flex max-w-3xl gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={domainQuery}
                onChange={(e) => setDomainQuery(e.target.value)}
                placeholder="Find your domain"
                className="w-full rounded border border-slate-200 bg-white py-4 pl-10 pr-4 text-sm text-[#0f172a] outline-none focus:border-[#00b7ff]"
              />
            </div>
            <button type="submit" disabled={domainLoading} className="flex items-center gap-2 rounded bg-[#0f0c29] px-6 py-3 text-sm font-bold text-white hover:bg-[#302b63] disabled:opacity-50">
              {domainLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
            </button>
          </form>

          <div className="ghc-reveal mt-4 flex flex-wrap items-center justify-center gap-6 text-sm font-bold text-[#00b7ff]">
            <Link href="/domain" className="hover:underline">Multiple search →</Link>
            <Link href="/domain" className="hover:underline">Transfer your domain name →</Link>
          </div>

          {domainSearched && !domainLoading && domainResults.length > 0 && (
            <div className="mx-auto mt-8 max-w-3xl space-y-3">
              {domainResults.map((r) => (
                <div key={r.domain} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    {r.available ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-500" />}
                    <div>
                      <p className="font-bold text-[#0f172a]">{r.domain}</p>
                      <p className="text-xs text-slate-500">{r.available ? "Available" : "Taken"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {r.available && (
                      <>
                        <span className="text-sm font-bold text-[#00b7ff]">${r.price?.toFixed(2)} {r.currency}</span>
                        <Link href={`/register?domain=${encodeURIComponent(r.domain)}`} className="flex items-center gap-1 rounded bg-[#0f0c29] px-4 py-2 text-xs font-bold text-white hover:bg-[#302b63]">
                          Register <ChevronRight className="h-3 w-3" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="ghc-reveal mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {tldPrices.map((t) => (
              <div key={t.tld} className="rounded-lg border border-white/50 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="text-2xl font-black text-[#0f172a]">{t.tld}</p>
                {t.strike && <p className="text-xs text-slate-400 line-through">{t.strike}</p>}
                <p className="text-2xl font-black text-[#00b7ff]">{t.price}</p>
                <p className="text-xs text-slate-500">{t.period}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose GHC */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="ghc-reveal mb-12">
          <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">Why choose GHC?</p>
          <h2 className="mt-2 text-3xl font-black text-[#0f172a] md:text-4xl">Performance, security, and value for your cloud projects.</h2>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          {whyList.map((w, i) => (
            <div key={i} className="ghc-reveal">
              <h3 className="text-xl font-bold text-[#0f172a]">{w.title}</h3>
              <ul className="mt-4 space-y-3">
                {w.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm text-slate-500">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#00b7ff]" /> {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards grid */}
      <section className="border-y border-slate-200 bg-[#f0f8ff]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="ghc-reveal mb-12 text-center">
            <h2 className="text-3xl font-black text-[#0f172a] md:text-4xl">Explore solutions specially designed for a wide range of activities</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "Choose an infrastructure", icon: Server, links: [
                { label: "Versatile dedicated servers for SMEs", href: "/dedicated-servers/advance" },
                { label: "Dedicated servers for building clusters", href: "/dedicated-servers/scale" },
                { label: "Premium customisable dedicated servers", href: "/dedicated-servers/high-grade" },
                { label: "Virtual private servers at a competitive price", href: "/vps" },
              ]},
              { title: "Opt for an Enterprise solution", icon: Shield, links: [
                { label: "Private Cloud", href: "/private-cloud" },
                { label: "Disaster recovery plans", href: "/dedicated-servers/storage" },
                { label: "Migrating from your datacentre to the cloud", href: "/dedicated-servers/high-grade" },
                { label: "Certified solutions for hosting sensitive data", href: "/security" },
              ]},
              { title: "Start your cloud project", icon: Cloud, links: [
                { label: "Public Cloud", href: "/public-cloud" },
                { label: "Managed Kubernetes Service", href: "/vps" },
                { label: "Managed Databases", href: "/vps" },
                { label: "Data Analytics", href: "/vps" },
              ]},
              { title: "Manage your online presence", icon: Globe, links: [
                { label: "Web Hosting", href: "/web-hosting" },
                { label: "Domain Names", href: "/domain" },
                { label: "CDN & Security", href: "/security" },
                { label: "1-click CMS install", href: "/apps" },
              ]},
            ].map((card) => (
              <div key={card.title} className="ghc-reveal flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[#00b7ff]/10 sm:flex">
                  <card.icon className="h-12 w-12 text-[#00b7ff]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0f172a]">{card.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {card.links.map((l) => (
                      <li key={l.label}>
                        <Link href={l.href} className="text-sm font-semibold text-[#00b7ff] hover:underline">{l.label} →</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology badges */}
      <section className="overflow-hidden border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="ghc-reveal mb-8 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">Built for</p>
            <h2 className="mt-2 text-2xl font-black text-[#0f172a] md:text-3xl">Modern Cloud Workloads</h2>
          </div>
          <div className="ghc-marquee">
            {[0, 1].map((n) => (
              <div key={n} aria-hidden={n === 1} className="flex items-center gap-6 pr-6">
                {partnerBadges.map((badge) => (
                  <div key={badge.label} className="flex h-14 shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-600">
                    <badge.icon className="h-5 w-5 text-[#00b7ff]" />
                    {badge.label}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How GHC can help you */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="ghc-reveal mb-12 text-center">
          <h2 className="text-3xl font-black text-[#0f172a] md:text-4xl">How GHC can help you</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {helpCards.map((h, i) => (
            <div key={i} className="ghc-reveal flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-bold text-[#0f172a]">{h.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{h.desc}</p>
              <Link href={h.href} className="mt-auto pt-4 text-sm font-bold text-[#00b7ff] hover:underline">{h.cta} →</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Global Infrastructure */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
            {networkLinks.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={networkCities[a].x}
                y1={networkCities[a].y}
                x2={networkCities[b].x}
                y2={networkCities[b].y}
                stroke="white"
                strokeWidth="1"
                opacity="0.4"
              />
            ))}
            {networkCities.map((c) => (
              <g key={c.n}>
                <circle cx={c.x} cy={c.y} r="5" fill="white" />
                <circle cx={c.x} cy={c.y} r="3" fill="#00b7ff" />
              </g>
            ))}
          </svg>
        </div>
        <div className="relative mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-white p-8 text-[#0f172a] shadow-2xl md:p-12">
            <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">About Us</p>
            <h2 className="mt-2 text-3xl font-black">Our Global Infrastructure</h2>
            <div className="mt-6 space-y-4">
              <p className="flex items-center gap-3 text-lg font-bold text-[#0f172a]"><Check className="h-5 w-5 text-[#00b7ff]" /> <span className="text-2xl text-[#00b7ff]">High-capacity</span> <span className="font-normal text-slate-500">global network capacity</span></p>
              <p className="flex items-center gap-3 text-lg font-bold text-[#0f172a]"><Check className="h-5 w-5 text-[#00b7ff]" /> <span className="text-2xl text-[#00b7ff]">Multi-continent</span> <span className="font-normal text-slate-500">datacentre locations</span></p>
              <p className="flex items-center gap-3 text-lg font-bold text-[#0f172a]"><Check className="h-5 w-5 text-[#00b7ff]" /> <span className="text-2xl text-[#00b7ff]">24/7 redundant</span> <span className="font-normal text-slate-500">network operations</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-slate-200 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="ghc-reveal mb-12 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">Testimonials</p>
            <h2 className="mt-2 text-3xl font-black text-[#0f172a] md:text-4xl">Built for every use case</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {customerHighlights.map((t) => (
              <div key={t.name} className="ghc-reveal rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Quote className="mb-4 h-6 w-6 text-[#00b7ff]/50" />
                <div className="mb-3 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{t.text}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00b7ff]/15 text-sm font-black text-[#00b7ff]">
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <div className="ghc-reveal mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#00b7ff]">FAQ</p>
          <h2 className="mt-2 text-3xl font-black text-[#0f172a] md:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="ghc-faq-item ghc-reveal bg-white shadow-sm" data-open={openFaq === i ? 1 : 0}>
              <button className="ghc-faq-q text-[#0f172a]" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                {f.q}
                <Plus className="ghc-faq-icon h-4 w-4 shrink-0 text-[#00b7ff]" />
              </button>
              <div className="ghc-faq-a"><div className="text-slate-500">{f.a}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ schema for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      {/* BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://ghc.believoo.com/" },
            ],
          }),
        }}
      />

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-6 pb-16 md:pb-20">
        <div className="ghc-reveal relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] p-10 text-center shadow-xl md:p-16">
          <h2 className="relative text-3xl font-black text-white md:text-4xl">Ready to deploy?</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-slate-200">Apna first server minutes me launch karo — instant provisioning, transparent pricing, no lock-in.</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/vps" className="rounded-lg bg-white px-7 py-3 text-sm font-black text-[#00b7ff] shadow-lg transition hover:bg-[#0f0c29] hover:text-white">
              View Plans <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <Link href="/support" className="rounded-lg border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">
              Talk to Support
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
