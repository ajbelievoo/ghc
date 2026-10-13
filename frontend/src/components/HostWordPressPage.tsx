"use client";

import { useState } from "react";
import { ChevronDown, MessageSquare, ShoppingBag, Globe, LayoutGrid, Image as ImageIcon, Users } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const WHY_WP = [
  { t: "The world's most popular CMS:", d: "over 40% of all websites run on WordPress — proven, reliable and continuously improved." },
  { t: "User-friendly by design:", d: "create pages, posts and menus without writing a single line of code. Beginners publish in hours, not weeks." },
  { t: "Thousands of themes and plugins:", d: "77,000+ free plugins and thousands of themes cover virtually every feature — contact forms, SEO, caching, shops, forums." },
  { t: "SEO-friendly out of the box:", d: "clean URLs, fast themes and plugins like Yoast help your pages rank on search engines." },
  { t: "A massive community:", d: "tutorials, forums and developers everywhere — you will never be stuck for an answer." },
];

const WP_TYPES = [
  { icon: MessageSquare, t: "Blog", d: "The original WordPress use case — publish articles, news and stories with categories, tags and comments.", href: "/web-hosting/wordpress" },
  { icon: LayoutGrid, t: "Showcase website", d: "Present your business, portfolio or organisation with pages, galleries and contact forms.", href: "/web-hosting/wordpress" },
  { icon: ShoppingBag, t: "Online store (WooCommerce)", d: "Turn WordPress into a full e-commerce platform with WooCommerce — products, cart, payments and orders.", href: "/solutions/prestashop" },
  { icon: ImageIcon, t: "Portfolio", d: "Photographers, designers and artists showcase their work with gallery and media themes.", href: "/web-hosting/wordpress" },
  { icon: Users, t: "Membership & community", d: "Members-only content, courses and forums with plugins like MemberPress or bbPress.", href: "/web-hosting/business" },
  { icon: Globe, t: "Business site", d: "Company sites with services, team pages, booking forms and multilingual support.", href: "/web-hosting/business" },
];

const STEP5 = [
  "Write and format your posts and pages with the block editor — text, images, videos and embeds.",
  "Organise navigation with menus, categories and tags so visitors find everything quickly.",
  "Preview on mobile and desktop — most WordPress themes are responsive by default.",
  "Publish, share on social media, and submit your sitemap to Google to start getting traffic.",
];

const FAQS: [string, string][] = [
  ["What is WordPress?", "WordPress is a free, open-source content management system (CMS) that powers over 40% of the web — from personal blogs to major e-commerce stores."],
  ["Is WordPress free?", "Yes — the WordPress software is free and open-source. You only pay for hosting and a domain name; thousands of themes and plugins are free too."],
  ["What is the difference between WordPress.com and WordPress.org?", "WordPress.org is the self-hosted version you install on your own hosting — full control, any plugin or theme. WordPress.com is a limited hosted service. On GHC you get the full self-hosted experience."],
  ["Do I need to know how to code to use WordPress?", "No — the block editor, themes and plugins cover everything visually. Code knowledge only helps for deep customisation."],
  ["How do I install WordPress on my hosting?", "From the GHC Control Panel: pick your domain, click \"Install WordPress\", choose your admin credentials — your site is live in under a minute."],
  ["Is WordPress secure?", "Yes when maintained — keep WordPress, themes and plugins updated, use strong passwords and our included SSL. Automatic backups protect you if anything goes wrong."],
  ["Can I move an existing WordPress site to GHC?", "Yes — export your content and database, or open a support ticket and our team will help you migrate with zero downtime."],
];

export default function HostWordPressPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const hostingPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Host your WordPress website</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; Host your WordPress website</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Host your WordPress website in minutes</h1>
              <p className="mt-5 text-sm text-white/85 leading-7">WordPress is the world's most popular CMS — and our web hosting plans are built for it. One-click install, free SSL, free domain for the first year, and automatic backups. Your WordPress site, online in minutes.</p>
              <ul className="mt-6 space-y-2.5">
                {["1-click WordPress install", "Free domain + free SSL", "Automatic daily backups", "99.9% availability"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold">
                    <span className="w-4 h-4 text-emerald-400 shrink-0">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center md:justify-end">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center mx-auto">
                  <span className="text-5xl font-serif font-black">W</span>
                </div>
                <p className="mt-3 text-xl font-black tracking-widest">WORDPRESS</p>
                <p className="text-xs text-white/60 mt-1">hosted on GHC</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why WordPress */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Why choose WordPress?</h2>
        <p className="mt-3 text-xs text-slate-600">WordPress powers everything from personal blogs to major online stores. Here's why it's the first choice for millions of website owners:</p>
        <ul className="mt-5 space-y-3">
          {WHY_WP.map((w) => (
            <li key={w.t} className="flex items-start gap-2 text-xs text-slate-600 leading-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" />
              <span><strong className="text-[#0f172a]">{w.t}</strong> {w.d}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Types */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">What type of website can you create with WordPress?</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WP_TYPES.map((t) => (
            <a key={t.t} href={t.href} className="rounded-xl border border-slate-200 p-5 hover:border-[#0284c7] hover:shadow-md transition-all block">
              <p className="text-sm font-bold text-[#0f172a]">{t.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{t.d}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 5 steps */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">How to host a WordPress website in 5 steps</h2>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {["Book a domain name", "Pick a WordPress plan", "Install in 1 click", "Configure & secure", "Publish content"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-[#0f172a] shadow-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0b1020] text-[10px] font-black text-[#00b7ff]">{i + 1}</span>
                {s}
              </span>
              {i < 4 && <span className="text-slate-300 font-bold hidden sm:inline">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">1</span>Book a domain name for your WordPress site</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>Your domain is your WordPress site's address — short, memorable, and matching your brand. Every GHC web hosting plan includes a <strong>free domain name for the first year</strong>, so you can register it right at checkout.</p>
          <p>Check availability with our WHOIS tool and choose from 800+ extensions — .com, .in, .blog, .shop and many more. Registering several extensions protects your brand.</p>
          <p><a href="/domain" className="text-[#0284c7] font-bold underline">Search for your domain name</a> and secure it in a few clicks.</p>
        </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">2</span>Choose a WordPress-ready web hosting plan</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>WordPress needs a PHP environment and a database — every GHC hosting plan provides both, tuned for WordPress performance. Pick based on your traffic: Starter for a first blog, Pro for business sites and small shops, Performance for high-traffic stores.</p>
          <p>All plans include unlimited traffic, free SSL, anti-DDoS protection, automatic backups and email addresses — no hidden extras needed to run WordPress properly.</p>
        </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <h2 className="text-center text-xl md:text-2xl font-black text-[#0f172a]">WordPress-ready hosting plans</h2>
        <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="wordpress" />
      </section>

      {/* Step 3 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">3</span>Install WordPress in one click</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>No FTP uploads, no database creation, no config files. From your GHC Control Panel, select your domain, click <strong>"Install WordPress"</strong>, set your admin username and password — and your site is ready in under a minute.</p>
          <p>The installer configures the database, applies the latest stable WordPress version and secures the installation automatically.</p>
        </div>
        </div>
      </section>

      {/* Step 4 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">4</span>Configure and secure your website</h2>
        <div className="mt-4 space-y-3 text-xs text-slate-600 leading-6">
          <p><strong className="text-[#0f172a]">Pick a theme:</strong> choose from thousands of free themes in the WordPress library, or upload a premium theme — responsive designs adapt to mobile automatically.</p>
          <p><strong className="text-[#0f172a]">Install key plugins:</strong> caching, SEO (Yoast/RankMath), contact forms, security — only install what you need to keep the site fast.</p>
          <p><strong className="text-[#0f172a]">Secure it:</strong> your free SSL is already active (HTTPS padlock). Keep WordPress, themes and plugins updated, use strong admin passwords, and enable automatic updates.</p>
          <p><strong className="text-[#0f172a]">Set up email:</strong> create professional addresses like contact@yourdomain — included with every plan.</p>
        </div>
        </div>
      </section>

      {/* Step 5 */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="border-l-4 border-[#00b7ff] pl-5 md:pl-6">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0f172a]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">5</span>Publish your pages and posts</h2>
        <div className="mt-4 space-y-4 text-xs text-slate-600 leading-6">
          <p>Log in to your WordPress admin at <strong>yourdomain.com/wp-admin</strong> and start creating:</p>
          <ul className="space-y-2 pl-4">
            {STEP5.map((s) => (
              <li key={s} className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" />{s}</li>
            ))}
          </ul>
          <p>Keep publishing regularly — fresh content keeps visitors coming back and improves your search ranking. Your WordPress site grows with you: add WooCommerce later to sell online, or multisite to run several sites.</p>
        </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#155e75] to-[#00b7ff] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Your WordPress site is one click away</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/web-hosting" className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0284c7] hover:bg-slate-100">Choose a hosting plan</a>
            <a href="/web-hosting/wordpress" className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10">Managed WordPress hosting</a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0284c7]" : "text-[#0f172a]"}`}>{q}</span>
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
