"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, ChevronDown, Check, ArrowRight, Globe, Database,
  Shield, Zap, BookOpen, MessageSquare, Headphones, Layers, Award,
  ShoppingCart, Sparkles, Server,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

interface RangeDef {
  badge: string;
  name: string;
  tagline: string;
  heroDesc: string;
  introTitle: string;
  introTabs: { label: string; text: string }[];
  presence: { title: string; text: string; points: string[] };
  expandTitle: string;
  expandText: string;
  expandCards: { t: string; d: string }[];
  useCases: { t: string; d: string; href: string }[];
  faqs: [string, string][];
  planCodes: string[];
}

const RANGES: Record<string, RangeDef> = {
  eco: {
    badge: "Eco Web Hosting",
    name: "Eco",
    tagline: "Everything you need to launch your website at a lower cost",
    heroDesc: "Host your site with a fast, reliable and affordable web plan — free domain for the first year, SSL included, and one-click CMS installs.",
    introTitle: "Get started with low-cost web hosting",
    introTabs: [
      { label: "Domain name", text: "Your plan includes a free domain name for the first year — register .com, .in, .net and hundreds more right at checkout." },
      { label: "One-click CMS", text: "Install WordPress, Joomla!, PrestaShop or Drupal in one click — no uploads, no database setup, it just works." },
      { label: "FAQ", text: "Answers to common questions are below — from SSL to email accounts to upgrades." },
      { label: "Guides", text: "Step-by-step tutorials in our knowledge base walk you through your first site launch." },
    ],
    presence: {
      title: "Build a complete online presence",
      text: "A domain, a website, and professional email addresses — all in one place. When your project grows, everything scales with it.",
      points: ["Free domain name for the first year", "Free SSL certificate on every site", "Professional mailboxes on your domain", "DNS zone management included"],
    },
    expandTitle: "Expand your website according to your needs",
    expandText: "Easily adjust your hosting in just a few clicks — add databases, mailboxes and options as your audience grows, without migrating anything.",
    expandCards: [
      { t: "Extra databases", d: "Add MySQL/PostgreSQL databases whenever a project needs them." },
      { t: "More email addresses", d: "Grow from a couple of mailboxes to your whole team." },
      { t: "Upgrade anytime", d: "Move to a bigger hosting plan without downtime." },
    ],
    useCases: [
      { t: "Create a landing page", d: "Ship a fast marketing page in an afternoon.", href: "/web-hosting" },
      { t: "Start a blog", d: "WordPress pre-installed, free SSL and domain.", href: "/web-hosting/wordpress" },
      { t: "Create a showcase site", d: "Present your business with a professional site.", href: "/web-hosting" },
    ],
    faqs: [
      ["Is Eco web hosting suitable for creating a first website?", "Yes — Eco is designed exactly for that. You get a free domain for the first year, SSL, email addresses and one-click WordPress. It is the cheapest way to get a real website online."],
      ["Can I install WordPress on an Eco plan?", "Absolutely — the 1-click installer covers WordPress, plus Joomla!, Drupal and PrestaShop on Personal and higher tiers."],
      ["Is a domain name included?", "Yes, a domain registration is free for the first year with every hosting plan."],
      ["Can I create professional email addresses?", "Yes — every plan includes mailboxes on your own domain, with webmail and IMAP/SMTP access."],
      ["Is my site secure?", "SSL certificates are included and renew automatically, and our anti-DDoS protection filters attacks before they reach your site."],
      ["Can I upgrade my hosting later?", "Yes — move from Starter to Personal to Pro without downtime or losing data."],
    ],
    planCodes: ["hosting-starter", "hosting-starter-ovh", "hosting-perso"],
  },
  business: {
    badge: "Business Web Hosting",
    name: "Business",
    tagline: "Performance and flexibility for business websites",
    heroDesc: "More power, more sites, more email — for shops, agencies and companies that need headroom and reliability.",
    introTitle: "Professional hosting for real business",
    introTabs: [
      { label: "Domain name", text: "Free domain for the first year — attach unlimited additional domains on multisite plans." },
      { label: "One-click CMS", text: "WordPress, Joomla!, PrestaShop, Drupal — install and update in one click." },
      { label: "FAQ", text: "Common answers about performance, email limits and scaling below." },
      { label: "Guides", text: "Our knowledge base covers DNS, SSL, multisite and performance tuning." },
    ],
    presence: {
      title: "Everything a business site needs",
      text: "Hundreds of mailboxes, multisite hosting, guaranteed resources and the same anti-DDoS backbone as our dedicated servers.",
      points: ["Up to 100 multisites", "Up to 100 email addresses", "Free domain + SSL", "Git, cron and SSH access"],
    },
    expandTitle: "Scale as your traffic grows",
    expandText: "Upgrade to Performance tiers or add databases and CDN caching — no migration, no downtime.",
    expandCards: [
      { t: "Performance tiers", d: "Guaranteed CPU/RAM for busy stores and portals." },
      { t: "CDN option", d: "Cache content at the edge — faster for global visitors." },
      { t: "Additional databases", d: "SQL and NoSQL capacity on demand." },
    ],
    useCases: [
      { t: "Company website", d: "A fast, reliable home for your brand.", href: "/web-hosting" },
      { t: "Online store", d: "PrestaShop or WooCommerce with headroom.", href: "/solutions/prestashop" },
      { t: "Client multisites", d: "Host many sites on one business plan.", href: "/web-hosting?range=Agency" },
    ],
    faqs: [
      ["What makes Business different from Eco?", "Business plans add multisite hosting (up to 100 sites), up to 100 email addresses, more resources and git/SSH access — built for professional use."],
      ["Can I host multiple websites?", "Yes — attach additional domains and sites directly from the hosting manager."],
      ["Is email included?", "Yes, up to 100 professional mailboxes with webmail, IMAP and SMTP."],
      ["Does it support e-commerce?", "Yes — PrestaShop and WooCommerce run well on Business and Performance tiers."],
      ["Can I add a CDN?", "Yes — the CDN option caches your site at global edge locations."],
      ["Can I upgrade later?", "Yes — upgrade to a higher tier or move to a VPS when you outgrow shared hosting."],
    ],
    planCodes: ["hosting-pro", "hosting-startup", "hosting-performance-1", "hosting-performance-2", "hosting-performance-3", "hosting-performance-4"],
  },
  agency: {
    badge: "Agency Web Hosting",
    name: "Agency",
    tagline: "Efficiently manage various client websites on a single hosting plan",
    heroDesc: "Unlimited multisites, 1,000 mailboxes and guaranteed resources — one plan for your whole client portfolio.",
    introTitle: "One plan for all your clients",
    introTabs: [
      { label: "Domain name", text: "Attach unlimited client domains — register or transfer them from the same dashboard." },
      { label: "One-click CMS", text: "Deploy WordPress or PrestaShop for every client in one click." },
      { label: "FAQ", text: "Answers about multisite limits, white-labeling and client isolation below." },
      { label: "Guides", text: "Guides on multisite layout, client billing and email migration." },
    ],
    presence: {
      title: "Agency-grade hosting",
      text: "Host every client on one powerful plan — separate directories, separate domains, one bill.",
      points: ["Unlimited multisites", "1,000 mailboxes included", "Free SSL per site", "Cron, git and SSH built in"],
    },
    expandTitle: "Built for scaling your portfolio",
    expandText: "Add databases per client, enable CDN for the sites that need it, and upgrade tiers without touching a single site.",
    expandCards: [
      { t: "Unlimited multisite", d: "Attach every client domain to the same hosting." },
      { t: "Per-site SSL", d: "Free certificates on every attached domain." },
      { t: "Client email", d: "1,000 mailboxes to distribute across clients." },
    ],
    useCases: [
      { t: "Client portfolios", d: "Every client site under one roof.", href: "/web-hosting" },
      { t: "Landing factories", d: "Spin up campaign sites in minutes.", href: "/web-hosting" },
      { t: "White-label hosting", d: "Your clients, our infrastructure.", href: "/products/support-levels" },
    ],
    faqs: [
      ["How many client sites can I host?", "Unlimited — attach as many domains as your disk and resources allow."],
      ["Are sites isolated?", "Each site has its own directory and domain; resources are shared across the plan."],
      ["How many mailboxes do I get?", "1,000 email addresses across all your attached domains."],
      ["Can I give clients panel access?", "Create separate mailboxes and delegate via team access on your account."],
      ["What happens if a site gets busy?", "Anti-DDoS is always on; you can upgrade tiers or move hot sites to a VPS."],
      ["Is WordPress supported?", "Yes — one-click WordPress, Joomla!, Drupal and PrestaShop for every site."],
    ],
    planCodes: ["hosting-agency", "hosting-agency-plus", "hosting-agency-max"],
  },
};

export default function HostingRangePage({ range, plans }: { range: string; plans: any[] }) {
  const def = RANGES[range];
  const router = useRouter();
  const { currency } = useCurrency();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [introTab, setIntroTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const rangePlans = useMemo(
    () => def.planCodes.map((c) => plans.find((p) => p.planCode === c)).filter(Boolean),
    [plans, def.planCodes]
  );

  if (!def) return null;

  const searchDomain = () => {
    const d = query.trim().toLowerCase();
    if (!d) return;
    setSearching(true);
    router.push(`/domain?q=${encodeURIComponent(d)}`);
  };

  const planFeatures = (p: any): string[] => {
    const f = p.features || {};
    const out: string[] = [];
    const sites = f["Unique site"] ? "1 site" : f["Multisites"] === "Inf" ? "Unlimited sites" : f["Multisites"] ? `${f["Multisites"]} sites` : null;
    if (sites) out.push(sites);
    if (f["Emails"]) out.push(`${f["Emails"]} email addresses`);
    if (f["Domain name"]) out.push("Free domain the first year");
    out.push("Free SSL certificate");
    if (f["Wordpress"] === "Yes") out.push("WordPress 1-click install");
    return out.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — OVH style blue banner + domain search */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-[#0050d7] text-white p-8 md:p-10">
            <span className="inline-block rounded-full bg-lime-300 text-[#0f172a] px-3 py-1 text-[11px] font-black uppercase tracking-wide">{def.badge}</span>
            <h1 className="mt-4 text-2xl md:text-3xl font-black leading-tight">{def.tagline}</h1>
            <p className="mt-3 text-sm text-white/85 leading-6">{def.heroDesc}</p>
          </div>
          <div className="bg-gradient-to-br from-[#7b2ff7] via-[#4f6df5] to-[#ff7ab8] p-8 md:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-3 text-white/90">
              <Globe className="w-10 h-10" />
              <Server className="w-10 h-10" />
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="mt-6 bg-white rounded-xl shadow-xl p-3 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchDomain()}
                placeholder="Find your domain name"
                className="flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm outline-none text-[#0f172a]"
              />
              <button onClick={searchDomain} className="rounded-lg bg-[#ff3d00] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#e63700] flex items-center gap-1.5 shrink-0">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Search
              </button>
            </div>
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-400">
          <a href="/web-hosting" className="hover:text-[#0050d7]">Web hosting</a> &gt; {def.badge} &gt; See all hosting
        </p>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 className="text-center text-2xl font-black text-[#0f172a]">Explore our web hosting plans</h2>
        <div className={`mt-8 grid grid-cols-1 gap-6 ${rangePlans.length <= 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : rangePlans.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {rangePlans.map((p: any) => {
            const cheapest = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
            return (
              <div key={p.planCode} className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#0050d7] hover:shadow-xl overflow-hidden">
                <div className="p-6 pb-4">
                  <h3 className="text-lg font-black text-[#0f172a]">{p.invoiceName || p.planCode}</h3>
                  <p className="mt-1 text-xs text-slate-400 line-through">{cheapest?.rawPrice && cheapest.rawPrice !== cheapest.monthlyPrice ? money(cheapest.rawPrice, cheapest.currency) : ""}&nbsp;</p>
                  <p className="text-3xl font-black text-[#0f172a]">{money(cheapest?.monthlyPrice, cheapest?.currency)}<span className="text-sm font-bold text-slate-400">/mo</span></p>
                  <p className="mt-1 text-[10px] text-slate-400">ex. taxes — billed {cheapest?.interval === 12 ? "annually" : "monthly"}</p>
                  <button
                    onClick={() => router.push(`/configure?category=WEB_HOSTING&plan=${encodeURIComponent(p.planCode)}&subCategory=${range}`)}
                    className="mt-4 w-full rounded-lg bg-[#ff3d00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e63700] flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Order now
                  </button>
                </div>
                <div className="flex-1 bg-[#f8faff] border-t border-slate-100 p-6 space-y-2.5">
                  {planFeatures(p).map((f) => (
                    <p key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {f}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {rangePlans.length === 0 && (
          <p className="text-center text-sm text-slate-500 mt-6">Plans for this range will appear here once available — <a href="/web-hosting" className="text-[#0050d7] font-semibold">browse all hosting plans</a>.</p>
        )}
      </section>

      {/* Intro with tabs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">{def.introTitle}</h2>
        <div className="mt-5 flex flex-wrap gap-6 border-b border-slate-200">
          {def.introTabs.map((t, i) => (
            <button key={t.label} onClick={() => setIntroTab(i)} className={`pb-3 text-sm font-semibold border-b-2 transition ${introTab === i ? "border-[#0050d7] text-[#0050d7]" : "border-transparent text-slate-500 hover:text-[#0f172a]"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm text-slate-600 leading-7">{def.introTabs[introTab].text}</p>
      </section>

      {/* Build presence */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#e8f7ff] to-white border border-slate-100 p-10 flex items-center justify-center order-2 md:order-1">
            <div className="text-center space-y-2">
              <Globe className="w-12 h-12 mx-auto text-[#0050d7]" />
              <p className="text-sm font-bold text-[#0f172a]">Free domain + SSL</p>
              <p className="text-xs text-slate-500">on every plan</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-xl font-black text-[#0f172a]">{def.presence.title}</h2>
            <p className="mt-3 text-sm text-slate-600 leading-7">{def.presence.text}</p>
            <ul className="mt-4 space-y-2">
              {def.presence.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{pt}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Expand */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">{def.expandTitle}</h2>
            <p className="mt-3 text-sm text-slate-600 leading-7">{def.expandText}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {def.expandCards.map((c) => (
              <div key={c.t} className="rounded-xl border border-slate-200 bg-white p-4 flex gap-3">
                <Zap className="w-5 h-5 text-[#0050d7] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">{c.t}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {def.useCases.map((u) => (
            <a key={u.t} href={u.href} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#0050d7] hover:shadow-lg transition-all group">
              <div className="h-28 bg-gradient-to-br from-[#0a2540] to-[#0050d7] flex items-center justify-center">
                <Layers className="w-10 h-10 text-white/80" />
              </div>
              <div className="p-5">
                <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#0050d7]">{u.t}</p>
                <p className="mt-1.5 text-xs text-slate-500 leading-5">{u.d}</p>
                <p className="mt-3 text-xs font-bold text-[#0050d7] flex items-center gap-1">Get started <ArrowRight className="w-3 h-3" /></p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Assistance */}
      <section className="bg-[#f6f8fc] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-black text-[#0f172a]">Assistance and support</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, t: "Guides", d: "Step-by-step tutorials on configuring your services.", l: "Access documentation →", href: "/kb" },
              { icon: MessageSquare, t: "Chatbot", d: "The GHC assistant answers 24/7 about our services.", l: "Contact us →", href: "/support" },
              { icon: Headphones, t: "Support levels", d: "Standard, Premium and Business support for every workload.", l: "Find out more →", href: "/products/support-levels" },
            ].map((a) => (
              <a key={a.t} href={a.href} className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#0050d7] transition-all block">
                <a.icon className="w-8 h-8 text-[#0050d7]" />
                <p className="mt-4 text-sm font-bold text-[#0f172a]">{a.t}</p>
                <p className="mt-2 text-xs text-slate-500 leading-5">{a.d}</p>
                <p className="mt-4 text-xs font-semibold text-[#0050d7]">{a.l}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Complement products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">To complement your web hosting plan</h2>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Shield, t: "SSL certificates", d: "Gain your customers' trust with validated certificates.", href: "/products/ssl-certificates" },
            { icon: Zap, t: "Content Delivery Network", d: "Improve page loading speed and security.", href: "/products/cdn" },
            { icon: Database, t: "Web Cloud Databases", d: "Managed SQL and NoSQL database services.", href: "/public-cloud?s=db-mysql" },
            { icon: Award, t: "Start SQL", d: "Additional MySQL databases for your projects.", href: "/web-hosting" },
          ].map((a) => (
            <a key={a.t} href={a.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-[#0050d7] hover:shadow-md transition-all block">
              <a.icon className="w-7 h-7 text-[#0050d7]" />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{a.t}</p>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-5">{a.d}</p>
              <p className="mt-3 text-xs font-semibold text-[#0050d7]">Find out more →</p>
            </a>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0050d7] via-[#7b2ff7] to-[#ff7ab8] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Your entire online presence in one place</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/domain" className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0050d7] hover:bg-slate-100">Find a domain</a>
            <a href="/web-hosting" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">Compare all plans</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {def.faqs.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0050d7]" : "text-[#0f172a]"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-slate-600 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
