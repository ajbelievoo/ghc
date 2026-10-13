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
  sections?: { title: string; pills: string[]; text: string }[];
  testimonial?: { quote: string; author: string };
  recommended?: string;
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
    tagline: "Performance and flexibility for websites that drive your business",
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
    sections: [
      {
        title: "Ensure quick and easy navigation for visitors.",
        pills: ["Optimised loading", "Smooth navigation", "High availability"],
        text: "Activate the CDN to cache your content closer to your visitors. Your pages load faster everywhere, which keeps people on your site and helps your search ranking.",
      },
      {
        title: "Fuel your business growth",
        pills: ["Scalability", "Reliability", "High performance"],
        text: "As your ambitions grow, so does your infrastructure. Business hosting gives you the resources to reach more visitors and support growth — upgrade resources on demand, without migrating.",
      },
      {
        title: "Manage your projects with increased flexibility",
        pills: ["Databases", "Task automation", "Advanced configuration"],
        text: "Run professional web tools on a flexible environment — schedule jobs with cron, connect over SSH/Git, and fine-tune PHP configuration for your applications.",
      },
      {
        title: "Strengthen your website's security",
        pills: ["Secure HTTPS", "Anti-DDoS protection", "Automatic backups"],
        text: "To keep your website online and protected from attacks, we've integrated enhanced security: free SSL on every domain, anti-DDoS on the network, and automatic backups for recovery.",
      },
    ],
    testimonial: {
      quote: "We use the web hosting on several of our own sites, and the multisite plan handles our client portfolio in one place — domains, sites and email, one dashboard.",
      author: "A GHC hosting customer",
    },
    recommended: "hosting-pro",
    useCases: [
      { t: "Create a business website", d: "Present your business with a fast, professional site.", href: "/web-hosting" },
      { t: "Create an online shop with PrestaShop", d: "Launch your store with the 1-click installer.", href: "/solutions/prestashop" },
      { t: "Manage production and pre-production environments", d: "Multisite lets you run staging next to production.", href: "/web-hosting" },
    ],
    faqs: [
      ["Is Business Web Hosting suitable for my business?", "Yes — it is designed for professional use: multisite hosting, up to 100 mailboxes, SSH/git access and guaranteed resources on Performance tiers."],
      ["What are Git and SSH used for in the Pro and Performance plans?", "Git lets you deploy code straight from your repository, and SSH gives you secure command-line access for scripts, WP-CLI and file management."],
      ["Is this plan suitable for a high-traffic site?", "Performance tiers carry guaranteed CPU/RAM and a CDN option — they handle traffic spikes far better than shared entry plans."],
      ["How secure are the hosting plans?", "Every plan includes free SSL, always-on anti-DDoS, automatic backups and anti-virus/anti-spam on mailboxes."],
      ["Can I really switch hosting plans with GHC?", "Yes — upgrades are done in place from the dashboard; your files, databases and email stay untouched."],
      ["How do I transfer my web hosting plan to GHC?", "Point your domain's DNS to our hosting after ordering, or open a support ticket — our team will help migrate files and databases."],
    ],
    planCodes: ["hosting-startup", "hosting-pro", "hosting-performance-1"],
  },
  agency: {
    badge: "Web Hosting for Agencies",
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

const truthy = (v: any) => v !== undefined && v !== null && v !== "" && v !== "No" && v !== "0" && v !== 0;

function coreRows(p: any): string[] {
  const f = p.features || {};
  const out: string[] = [];
  const sites = f["Unique site"] ? "1 site" : f["Multisites"] === "Inf" ? "Unlimited sites" : f["Multisites"] ? `${f["Multisites"]} sites` : null;
  if (sites) out.push(sites);
  if (f["Emails"]) out.push(`${f["Emails"]} email addresses`);
  if (Number(f["Simultaneous visitors"])) out.push(`${f["Simultaneous visitors"]} simultaneous visitors`);
  if (truthy(f["Domain name"])) out.push("1 domain name free for the first year");
  if (truthy(f["Databases"])) out.push(`Databases: ${f["Databases"]}`);
  out.push("Unlimited traffic", "99.9% observed availability", "Automatic backups");
  return out;
}

function detailGroups(p: any): { title: string; rows: string[] }[] {
  const f = p.features || {};
  const cms = ["Wordpress", "Joomla!", "Drupal", "Prestashop"].filter((k) => f[k] === "Yes").map((k) => k.replace("!", ""));
  const access = [
    f["FTP access"] === "Included" && "FTP access",
    f["Multi FTP"] === "Included" && "Multi-FTP access",
    f["SSH access - Multi SSH"] === "Included" && "SSH access",
    truthy(f["Git"]) && "Git repository",
    truthy(f["Logs access"]) && "Logs & statistics access",
    f["HTTP/2"] === "Included" && "HTTP/2",
    f["IPV6"] === "Included" && "IPv6",
    f["IP GEOLOCATION"] === "Included" && "IP geolocation",
    truthy(f["Sql"]) && `SQL databases: ${f["Sql"]}`,
    truthy(f["Private SQL"]) && `Private SQL: ${f["Private SQL"]}`,
    truthy(f["Cron"]) && "Cron / scheduled tasks",
  ].filter(Boolean) as string[];
  const security = ["Unlimited free SSL", "Anti-DDoS protection", "Anti-virus and anti-spam on email", "Automatic backups"];
  const perf = [
    f["CDN"] && f["CDN"] !== "Optional" ? `CDN included (${f["CDN"]})` : "CDN available as an option",
    "Unlimited traffic",
    "99.9% observed availability",
  ];
  return [
    ...(cms.length ? [{ title: "1-click CMS", rows: cms }] : []),
    { title: "Access and tools", rows: access },
    { title: "Security", rows: security },
    { title: "Performance", rows: perf },
    { title: "Support and additional services", rows: ["Standard support included", "Guides and 24/7 help centre"] },
  ].filter((g) => g.rows.length > 0);
}

function savePct(p: any): number | null {
  const durs: any[] = p.durations || [];
  const d12 = durs.find((x) => x.duration === "12_month");
  const best = durs.reduce<any | null>((a, x) => (!a || (x.monthlyPrice || 0) < (a.monthlyPrice || 0) ? x : a), null);
  if (!d12 || !best || best.duration === "12_month" || !d12.monthlyPrice) return null;
  const pct = Math.round((1 - best.monthlyPrice / d12.monthlyPrice) * 100);
  return pct > 0 ? pct : null;
}

function Hero({ badge, tagline, heroDesc }: { badge: string; tagline: string; heroDesc: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const searchDomain = () => {
    const d = query.trim().toLowerCase();
    if (!d) return;
    setSearching(true);
    router.push(`/domain?q=${encodeURIComponent(d)}`);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden shadow-lg">
      <div className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white p-8 md:p-10">
        <span className="inline-block rounded-full bg-white text-[#0284c7] px-3 py-1 text-[11px] font-black uppercase tracking-wide">{badge}</span>
        <h1 className="mt-4 text-2xl md:text-3xl font-black leading-tight">{tagline}</h1>
        <p className="mt-3 text-sm text-white/85 leading-6">{heroDesc}</p>
      </div>
      <div className="bg-gradient-to-br from-[#0891b2] via-[#2563eb] to-[#00b7ff] p-8 md:p-10 flex flex-col justify-center">
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
  );
}

export function PlanGrid({ plans, recommended, sub }: { plans: any[]; recommended?: string; sub: string }) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);
  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-slate-500 mt-6">Plans for this range will appear here once available — <a href="/web-hosting" className="text-[#0284c7] font-semibold">browse all hosting plans</a>.</p>
    );
  }
  return (
    <>
      <div className={`mt-8 grid grid-cols-1 gap-6 ${plans.length <= 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" : plans.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {plans.map((p: any) => {
          const cheapest = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
          const d12 = (p.durations || []).find((x: any) => x.duration === "12_month");
          const pct = savePct(p);
          const rec = recommended === p.planCode;
          return (
            <div key={p.planCode} className={`relative flex flex-col rounded-xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl overflow-hidden ${rec ? "border-[#0284c7] border-2" : "border-slate-200 hover:border-[#0284c7]"}`}>
              {(pct || rec) && (
                <div className="flex items-center gap-2 px-4 pt-4 flex-wrap">
                  {pct && <span className="rounded-full bg-cyan-300 text-[#0f172a] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide">Save {pct}%</span>}
                  {rec && <span className="rounded-full bg-[#0b1020] text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide">Recommended</span>}
                </div>
              )}
              <div className="p-6 pb-4">
                <h3 className="text-lg font-black text-[#0f172a]">{p.invoiceName || p.planCode}</h3>
                {d12 && cheapest && d12.monthlyPrice > cheapest.monthlyPrice && (
                  <p className="mt-1 text-xs text-slate-400 line-through">{money(d12.monthlyPrice, d12.currency)}/mo</p>
                )}
                <p className="text-3xl font-black text-[#0f172a]">{money(cheapest?.monthlyPrice, cheapest?.currency)}<span className="text-sm font-bold text-slate-400">/mo</span></p>
                <p className="mt-1 text-[10px] text-slate-400 leading-4">
                  ex. taxes{cheapest?.rawPrice && cheapest?.duration ? ` — ${money(cheapest.rawPrice, cheapest.currency)} ex. taxes for ${Number(cheapest.duration.split("_")[0])} months` : ""}
                </p>
                {d12 && cheapest && d12.monthlyPrice !== cheapest.monthlyPrice && (
                  <p className="mt-0.5 text-[10px] text-slate-400">Renewal price: {money(d12.monthlyPrice, d12.currency)}/mo</p>
                )}
                <button
                  onClick={() => router.push(`/configure?category=WEB_HOSTING&plan=${encodeURIComponent(p.planCode)}&subCategory=${sub}`)}
                  className="mt-4 w-full rounded-lg bg-[#ff3d00] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#e63700] flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" /> Order now
                </button>
              </div>
              <div className="flex-1 bg-slate-50 border-t border-slate-100 p-6 space-y-2.5">
                {coreRows(p).map((f) => (
                  <p key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {f}
                  </p>
                ))}
                {showDetails && detailGroups(p).map((g) => (
                  <div key={g.title} className="pt-3">
                    <p className="text-[11px] font-black uppercase tracking-wider text-[#0f172a] border-b border-slate-200 pb-1.5 mb-2">{g.title}</p>
                    <div className="space-y-2">
                      {g.rows.map((f) => (
                        <p key={f} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> {f}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <button onClick={() => setShowDetails(!showDetails)} className="text-sm font-bold text-[#0284c7] hover:underline inline-flex items-center gap-1.5">
          {showDetails ? "Show less details" : "Show more details"}
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
        </button>
      </div>
    </>
  );
}

function BottomSections({ def }: { def: Pick<RangeDef, "sections" | "testimonial" | "useCases" | "faqs"> }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  return (
    <>
      {def.sections && def.sections.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14 space-y-14">
          {def.sections.map((s, i) => (
            <div key={s.title} className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className={i % 2 === 0 ? "order-1" : "order-1 md:order-2"}>
                <h2 className="text-xl font-black text-[#0f172a]">{s.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.pills.map((pl) => (
                    <span key={pl} className="rounded-full bg-sky-50 text-[#0284c7] px-3 py-1 text-[11px] font-bold">{pl}</span>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-600 leading-7">{s.text}</p>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br ${i % 2 === 0 ? "from-sky-50 to-white" : "from-violet-50 to-white"} border border-slate-100 p-10 flex items-center justify-center ${i % 2 === 0 ? "order-2" : "order-2 md:order-1"}`}>
                {[Zap, Shield, Layers, Award].map((Icon, j) => (
                  <Icon key={j} className={`w-12 h-12 ${j === i % 4 ? "text-[#0284c7]" : "text-slate-200"} ${j > 0 ? "-ml-3" : ""}`} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {def.testimonial && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-14">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-10 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0284c7]">My client is rich</p>
            <p className="mt-4 text-lg md:text-xl font-bold text-[#0f172a] leading-8">&ldquo;{def.testimonial.quote}&rdquo;</p>
            <p className="mt-4 text-xs text-slate-400">{def.testimonial.author}</p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {def.useCases.map((u) => (
            <a key={u.t} href={u.href} className="rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#0284c7] hover:shadow-lg transition-all group">
              <div className="h-28 bg-gradient-to-br from-[#0a2540] to-[#00b7ff] flex items-center justify-center">
                <Layers className="w-10 h-10 text-white/80" />
              </div>
              <div className="p-5">
                <p className="text-sm font-bold text-[#0f172a] group-hover:text-[#0284c7]">{u.t}</p>
                <p className="mt-1.5 text-xs text-slate-500 leading-5">{u.d}</p>
                <p className="mt-3 text-xs font-bold text-[#0284c7] flex items-center gap-1">Get started <ArrowRight className="w-3 h-3" /></p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-black text-center text-[#0f172a]">Assistance and support</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, t: "Guides", d: "Step-by-step tutorials on configuring your services.", l: "Access documentation →", href: "/kb" },
              { icon: MessageSquare, t: "Chatbot", d: "The GHC assistant answers 24/7 about our services.", l: "Contact us →", href: "/support" },
              { icon: Headphones, t: "Support Levels", d: "Standard, Premium and Business support for every workload.", l: "Find out more →", href: "/products/support-levels" },
            ].map((a) => (
              <a key={a.t} href={a.href} className="rounded-2xl border border-slate-200 bg-white p-7 hover:border-[#0284c7] transition-all block">
                <a.icon className="w-8 h-8 text-[#0284c7]" />
                <p className="mt-4 text-sm font-bold text-[#0f172a]">{a.t}</p>
                <p className="mt-2 text-xs text-slate-500 leading-5">{a.d}</p>
                <p className="mt-4 text-xs font-semibold text-[#0284c7]">{a.l}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">To complement your web hosting plan</h2>
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Shield, t: "Sectigo SSL certificates", d: "Gain your customers' trust with validated certificates.", href: "/web-hosting/ssl" },
            { icon: Zap, t: "Content Delivery Network (CDN)", d: "Improve page loading speed and security.", href: "/web-hosting/cdn" },
            { icon: Database, t: "Web Cloud Databases", d: "Managed SQL and NoSQL database services.", href: "/web-hosting/databases" },
            { icon: Award, t: "Start SQL", d: "Additional MySQL databases for your projects.", href: "/web-hosting" },
          ].map((a) => (
            <a key={a.t} href={a.href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-[#0284c7] hover:shadow-md transition-all block">
              <a.icon className="w-7 h-7 text-[#0284c7]" />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{a.t}</p>
              <p className="mt-1.5 text-[11px] text-slate-500 leading-5">{a.d}</p>
              <p className="mt-3 text-xs font-semibold text-[#0284c7]">Find out more →</p>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#155e75] to-[#00b7ff] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Your entire online presence in one place</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/domain" className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0284c7] hover:bg-slate-100">Find a domain</a>
            <a href="/web-hosting" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">Compare all plans</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {def.faqs.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0284c7]" : "text-[#0f172a]"}`}>{q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && <p className="pb-5 text-sm text-slate-600 leading-7 pr-8">{a}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function WebHostingHubPage({ plans }: { plans: any[] }) {
  const rangeKeys = ["eco", "business", "agency"] as const;
  const [tab, setTab] = useState(0);
  const def = RANGES[rangeKeys[tab]];
  const tabPlans = useMemo(
    () => def.planCodes.map((c) => plans.find((p) => p.planCode === c)).filter(Boolean),
    [plans, def.planCodes]
  );

  const hub = {
    sections: [
      {
        title: "Single hosting with multiple options",
        pills: ["Multi-site", "Dashboard", "1-click CMS", "Budget-friendly"],
        text: "Need to migrate from one website to several others? No need to add more subscriptions and interfaces — save time and money by hosting all your websites under a single plan. The multisite feature gives you a single, easy-to-manage space.",
      },
      {
        title: "Quick loading websites every time",
        pills: ["Unlimited bandwidth", "SSD storage", "CDN", "High availability"],
        text: "Every second matters, as internet users tend to lose interest quickly. That's why fast page loading is crucial for retaining visitor attention and trust. Our hosting plans offer a consistently smooth experience on every visit.",
      },
      {
        title: "Security at every level",
        pills: ["SSL certificates", "Anti-DDoS", "Automatic backups", "Sovereignty"],
        text: "A cyber attack or a single forgotten backup can bring your website to a halt. To protect your business, all of our web hosting plans include advanced security features: an encrypted HTTPS connection with SSL certificates, anti-DDoS protection, and automatic backups.",
      },
    ],
    testimonial: {
      quote: "We've noticed a remarkable increase in website performance, a huge improvement that greatly enhances our service quality, overall user experience, and search engine optimisation.",
      author: "A GHC hosting customer",
    },
    useCases: [
      { t: "Set up multiple websites on a single web hosting plan", d: "With multisite and multi-domain features, you can create as many websites and link as many domain names as you want.", href: "/web-hosting/agency" },
      { t: "Create a WordPress blog or website", d: "Install WordPress in one click — themes, plugins and updates included.", href: "/web-hosting/wordpress" },
      { t: "Launch an online shop with PrestaShop", d: "Start selling online with the 1-click PrestaShop installer.", href: "/solutions/prestashop" },
    ],
    faqs: [
      ["What is web hosting?", "Web hosting is a service that stores your website's files on a server and makes them reachable on the internet. GHC hosting includes the server space, bandwidth, SSL, email and tools to manage it all."],
      ["What are the different types of hosting?", "Shared web hosting (many sites share resources — cheapest), VPS (your own virtual server with root access), and dedicated servers (a whole physical machine). Most websites start on shared hosting."],
      ["Web hosting, VPS, or dedicated servers: which option is best for my needs?", "Pick web hosting for standard websites and blogs — zero server administration. Choose a VPS when you need custom software or root access, and a dedicated server for heavy, mission-critical workloads."],
      ["How do I get web hosting?", "Choose a plan above, pick or register a domain, and check out — your hosting is provisioned automatically and you can install WordPress in one click."],
      ["How do I transfer my web hosting plan to GHC?", "Order a plan, upload your files and databases (our team can help via a support ticket), then point your domain's DNS to the new hosting."],
      ["Can I change my hosting plan later?", "Yes — upgrades are done in place from the dashboard without downtime or data loss."],
    ] as [string, string][],
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <Hero badge="Web hosting" tagline="Comprehensive packs adapted to all your web projects" heroDesc="Fast, secure shared hosting with free domain for the first year, free SSL, email addresses and one-click CMS installs — from your first site to a whole client portfolio." />
        <p className="mt-5 text-xs text-slate-400">
          <a href="/" className="hover:text-[#0284c7]">Home</a> &gt; Web hosting
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex flex-wrap gap-2 justify-center">
          {rangeKeys.map((k, i) => (
            <button
              key={k}
              onClick={() => setTab(i)}
              className={`px-5 py-2.5 text-sm font-bold border-b-2 transition ${tab === i ? "border-[#0284c7] text-[#0284c7]" : "border-transparent text-slate-500 hover:text-[#0f172a]"}`}
            >
              {RANGES[k].badge}
            </button>
          ))}
        </div>
        <PlanGrid plans={tabPlans} recommended={def.recommended} sub={rangeKeys[tab]} />
      </section>

      <BottomSections def={hub} />
      <Footer />
    </div>
  );
}

export default function HostingRangePage({ range, plans }: { range: string; plans: any[] }) {
  const def = RANGES[range];
  const [introTab, setIntroTab] = useState(0);

  const rangePlans = useMemo(
    () => (def ? def.planCodes.map((c) => plans.find((p) => p.planCode === c)).filter(Boolean) : []),
    [plans, def]
  );

  if (!def) return null;

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-8">
        <Hero badge={def.badge} tagline={def.tagline} heroDesc={def.heroDesc} />
        <p className="mt-5 text-xs text-slate-400">
          <a href="/web-hosting" className="hover:text-[#0284c7]">Web hosting</a> &gt; {def.badge}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <h2 className="text-center text-2xl font-black text-[#0f172a]">Explore our {def.name} Web Hosting plans</h2>
        <PlanGrid plans={rangePlans} recommended={def.recommended} sub={range} />
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">{def.introTitle}</h2>
        <div className="mt-5 flex flex-wrap gap-6 border-b border-slate-200">
          {def.introTabs.map((t, i) => (
            <button key={t.label} onClick={() => setIntroTab(i)} className={`pb-3 text-sm font-semibold border-b-2 transition ${introTab === i ? "border-[#0284c7] text-[#0284c7]" : "border-transparent text-slate-500 hover:text-[#0f172a]"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-sm text-slate-600 leading-7">{def.introTabs[introTab].text}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-slate-100 p-10 flex items-center justify-center order-2 md:order-1">
            <div className="text-center space-y-2">
              <Globe className="w-12 h-12 mx-auto text-[#0284c7]" />
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

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-xl font-black text-[#0f172a]">{def.expandTitle}</h2>
            <p className="mt-3 text-sm text-slate-600 leading-7">{def.expandText}</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {def.expandCards.map((c) => (
              <div key={c.t} className="rounded-xl border border-slate-200 bg-white p-4 flex gap-3">
                <Zap className="w-5 h-5 text-[#0284c7] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#0f172a]">{c.t}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottomSections def={def} />
      <Footer />
    </div>
  );
}
