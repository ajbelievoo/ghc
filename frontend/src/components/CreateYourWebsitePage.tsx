"use client";

import { useState } from "react";
import {
  Check, ChevronDown, ArrowRight, MousePointerClick, Gauge, ShieldCheck,
  Globe, Mail, Layers, Briefcase, ShoppingBag, User, Users, RefreshCw, FileText,
  BarChart3, Route, KeyRound, HardDrive, Building2, Handshake,
  Store, Code2, Workflow,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const ALL_IN_ONE = [
  { t: "Free domain name for the first year*", d: "A domain name is a web address (e.g. .com) that allows internet users to access a website. You can also use it to create custom email addresses.", icon: Globe },
  { t: "Email addresses included", d: "Manage your communications with a custom email address. Get up to 1,000 email addresses included free of charge, depending on the solution you have chosen.", icon: Mail },
  { t: "A wide range of hosting plans", d: "Only pay for the performance you need, with a wide range of hosting plans available. Each plan offers a storage space, performance and a range of CMSs (including WordPress, PrestaShop), all adapted to your needs.", icon: Layers },
];

const PACKAGES = [
  { icon: Briefcase, t: "Showcase website", d: "Gain visibility on the Internet with a website showcasing your business. Introduce yourself and publish information that will bring customers to you." },
  { icon: ShoppingBag, t: "E-commerce website", d: "Create an additional revenue stream with an online store. Sell 24/7 with a website that displays your goods and services." },
  { icon: User, t: "Personal project", d: "Have you developed a passion project or a side project? With this additional visibility, you can expand your network and indulge your interests!" },
];

const EVERY_PROJECT = [
  "Create an online portfolio", "Create a personal website", "Create an estate agent website", "Create a website for a non-profit organisation",
  "Create a website for a CV", "Create a website for a restaurant", "Create a photographer's website", "Create a travel blog",
  "Create a startup website", "Create a private tutoring website", "Create a personal trainer website", "Create a website for a medical centre",
  "Create a bed-and-breakfast website", "Create a small business website", "Create a fashion website", "Create a food blog",
];

const PROFILES = [
  { t: "I'm an individual", d: "Are you an individual with a passion project? We recommend the Personal Web Hosting plan. It's perfect for small websites and blogs, and gives you the flexibility to easily install the most popular CMS tools (WordPress, Joomla, Drupal), get a free domain name for one year*, and get 10 email addresses." },
  { t: "I'm starting a business", d: "To start a business, the Professional web hosting plan will be the best for you. This solution is more powerful, perfectly suited to professionals. If your business uses an online store, whether it's e-commerce or service continuity and offers the Boost option, we recommend opting for a Performance hosting plan, which ensures service continuity and offers the Boost option." },
  { t: "I manage the digital side of a small business", d: "Adapt your SME's web hosting plan to suit your goals and your skills. The Performance hosting plan is a shared hosting plan suitable for use with a CMS. With Cloud Web hosting, you get an isolated environment and unlimited databases. However, you do need to be familiar with web programming languages." },
];

const SERVICES = [
  { icon: RefreshCw, t: "Managed hosting", d: "You create your website, we take care of the rest. On a shared web hosting plan, we manage the infrastructure — updates, security, 24/7 monitoring — so you can focus on your projects." },
  { icon: MousePointerClick, t: "1-click installation for CMS modules", d: "WordPress, Joomla!, Drupal, PrestaShop — pre-installed CMS tools for creating a blog, a standard website or an e-commerce platform.", link: "Find out more" },
  { icon: Globe, t: "Unlimited monthly traffic", d: "Make your web project a success — we help you grow your business with unlimited bandwidth on every plan." },
  { icon: BarChart3, t: "GHC Web Statistics", d: "Track the number of visitors to your website, pages viewed, and where they come from — detailed statistics included.", link: "Find out more" },
  { icon: Route, t: "CDN", d: "Improve browsing experience for your website's visitors, with quicker loading times for your webpages. The closer the infrastructure, the faster your content loads.", link: "Find out more", href: "/web-hosting/cdn" },
  { icon: KeyRound, t: "Let's Encrypt SSL certificate", d: "Activate a free SSL certificate in one click via the GHC Control Panel. It gives HTTPS access to your visitors.", link: "Find out more", href: "/web-hosting/ssl" },
  { icon: HardDrive, t: "Backup and restore", d: "Protect your data with automatic backups — restore or download a backup copy from 1, 2, 3, 7 or 14 days ago.", link: "Find out more" },
  { icon: ShieldCheck, t: "Anti-DDoS protection", d: "Protection against distributed denial-of-service attacks, one of GHCcloud's core services — included by default in every plan." },
];

const AGENCY = [
  { icon: Handshake, t: "GHCcloud Partner Program", d: "With our support, you play a key role in your customers' digital transformation. Access a wide range of resources and services to our technologies.", cta: "Find out more", href: "/products/support-levels" },
  { icon: Store, t: "GHCcloud Marketplace", d: "Find the software solutions that will help your customers with the best ways to get the best solutions, tested by GHCcloud.", cta: "Find out more", href: "/marketplace" },
];

const BEST_PRACTICES = [
  { t: "Secure your web project", d: "To secure your website, there's no need to be an expert. The SSL certificate feature enables data encryption and anti-DDoS protection on an infrastructure that sees itself as secure. Can't forget to protect them — you'll also find things to secure your credentials." },
  { t: "Add a blog or store with a sub-domain", d: "Do you want to add a blog or a store to your existing site? This allows you to create a professional blog on a web page, for example \"myproject.mydomain.com\" — rather than using a sub-directory like \"mydomain.com/blog\"." },
  { t: "Create content and update it regularly", d: "Content publishing is essential for your website's visibility. To encourage your readers and increase your site's audience and reputation, publish consistent and effective content for your visitors and the search engines. Carefully set up a 30-day content plan and update it regularly." },
];

const FAQS: [string, string][] = [
  ["Why should I create my website with GHCcloud?", "Because you get everything in one place: domain, hosting, email, SSL, backups and 1-click CMS installers — with anti-DDoS protection and support included. It's the simplest way to get a professional website online."],
  ["How much does it cost to build a website?", "From just a few rupees a month — a shared hosting plan plus a free domain for the first year covers the essentials. Costs grow only when you add options like a premium SSL or CDN."],
  ["What is HTTPS?", "HTTPS is the encrypted version of HTTP — the padlock in the browser. It protects data exchanged between your visitors and your website, is required for payments, and boosts SEO."],
  ["Do I need to use an SSL certificate for my website?", "Yes — a free Let's Encrypt certificate is included by default on every plan, and premium Sectigo DV/EV certificates are available for higher assurance."],
];

export default function CreateYourWebsitePage({ plans }: { plans: any[] }) {
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
          <p className="text-xs text-white/70">Create a secure, high-performance website</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; Create a secure, high-performance website</p>
          <div className="mt-10 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black leading-tight">Create a website with GHCcloud</h1>
            <ul className="mt-5 space-y-2">
              {["Ideal for entrepreneurs, retailers and SME owners", "Free domain name for the first year*", "Included customisable email addresses"].map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm font-semibold"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> {b}</li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-white/80">From ₹92.58 ex. taxes/month</p>
            <a href="/web-hosting" className="mt-4 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-slate-100">Create my website</a>
          </div>
        </div>
      </section>

      {/* You create, we host */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 text-center">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">You create your website. We host it.</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { icon: MousePointerClick, t: "Dedicate more time to your projects", rows: ["CMS installed for you: WordPress, Joomla!, Drupal", "Servers managed by GHCcloud", "You get to focus on your business"] },
            { icon: Gauge, t: "Performance at a competitive price", rows: ["Load your pages in record time", "Price adapted to different levels of traffic", "Flexibility with the Boost option for peak loads"] },
            { icon: ShieldCheck, t: "Bonus: Peace of mind", rows: ["99.9% availability rate", "Advanced security, backups and anti-DDoS included", "Data sovereignty"] },
          ].map((c) => (
            <div key={c.t} className="text-left">
              <c.icon className="w-9 h-9 text-[#0284c7] mx-0" strokeWidth={1.5} />
              <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#0f172a]">{c.t}</p>
              <ul className="mt-3 space-y-1.5">
                {c.rows.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <a href="/web-hosting" className="mt-8 inline-block rounded-lg bg-[#ff3d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">Create a website</a>
      </section>

      {/* All-in-one solution */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">An all-in-one solution to boost your company's web visibility</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {ALL_IN_ONE.map((a, i) => (
            <div key={a.t} className="relative rounded-2xl border border-slate-200 bg-white p-7 pt-9 overflow-hidden hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400"][i % 3]}`} />
              <a.icon className="w-10 h-10 text-[#0284c7]" strokeWidth={1.4} />
              <h3 className="mt-4 text-base font-black text-[#0f172a]">{a.t}</h3>
              <p className="mt-3 text-xs text-slate-600 leading-6">{a.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perfect package */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">The perfect hosting package for your needs</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {PACKAGES.map((p) => (
            <div key={p.t}>
              <p.icon className="w-12 h-12 mx-auto text-[#0284c7]" strokeWidth={1.2} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{p.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A website for every project */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">A website for every project</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
          {EVERY_PROJECT.map((t) => (
            <a key={t} href="/web-hosting" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:border-[#00b7ff] hover:text-[#0284c7] transition-all">
              <Globe className="w-3.5 h-3.5 text-[#00b7ff]" /> {t}
            </a>
          ))}
        </div>
      </section>

      {/* Which plan for my profile */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Which plan should I choose, depending on my profile?</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {PROFILES.map((p) => (
            <div key={p.t}>
              <p className="text-sm font-bold text-[#0f172a]">{p.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-center text-xl md:text-2xl font-black text-[#0f172a]">Solutions for individuals and professionals at the best price!</h2>
        <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="business" />
        <div className="mt-4 text-center">
          <a href="/compare" className="text-xs font-bold text-[#0284c7] hover:underline inline-flex items-center gap-1">View a detailed comparison of our plans <ArrowRight className="w-3 h-3" /></a>
        </div>
      </section>

      {/* 8 services */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {SERVICES.map((s) => (
            <div key={s.t}>
              <s.icon className="w-9 h-9 text-[#0284c7]" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
              {s.link && <a href={s.href || "/web-hosting"} className="mt-2 inline-block text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">{s.link} →</a>}
            </div>
          ))}
        </div>
      </section>

      {/* Did you know band */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] py-14 text-white text-center">
        <h2 className="text-2xl font-black">Did you know?</h2>
        <p className="mt-2 text-xs text-white/70">Since 1999, GHCcloud has been a European reference for hosting websites, with a presence in Europe and internationally.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { n: "6 million", d: "The number of websites, domain names and blog sites worldwide, hosted by 1.6 million of our servers." },
            { n: "85%", d: "The share of our customers who renew their hosting and trust every year." },
            { n: "99.99%", d: "The observed availability of our hosted services over the last 12 months." },
          ].map((s) => (
            <div key={s.n}>
              <p className="text-4xl font-black">{s.n}</p>
              <p className="mt-2 text-[11px] text-white/70 leading-5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our support */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Our support</h2>
        <p className="mt-2 text-center text-xs text-slate-500">Your success is our success. That's why you can rely on our support to thrive on your projects.</p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { icon: ShieldCheck, t: "Technical support", d: "Whether hosting plans, servers or licences, whatever your need, we offer tailored level 1 to 3 support to assist you.", cta: "View our support levels", href: "/products/support-levels" },
            { icon: FileText, t: "Documentation", d: "We have hundreds of guides and tutorials, detailed help center documentation and a range of FAQs to learn, and configure your account.", cta: "Access the Help Centre", href: "/kb" },
            { icon: Users, t: "Community", d: "Interact with other GHCcloud users. Ask our experts questions on our Discord, LinkedIn, Facebook, YouTube and Discord.", cta: "Join our community", href: "/support" },
            { icon: Workflow, t: "Partner Network", d: "Want to delegate the management of your technical needs to the services of our professional partners? OVHcloud has a Partner Program for that — help you whenever you need it.", cta: "View the Partner Directory", href: "/marketplace" },
          ].map((s) => (
            <div key={s.t}>
              <s.icon className="w-9 h-9 text-[#0284c7] mx-auto" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
              <a href={s.href} className="mt-2 inline-block text-[10px] font-bold text-[#0284c7] uppercase tracking-wide">{s.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Step by step */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Create your bespoke website, step by step</h2>
        <div className="mt-8 space-y-4">
          {[
            { t: "Choose your domain name", d: "Let's start with your web address. To access your website, the domain name is the address (including .com or .net) that people will type into their web browsers. You can find more detailed info on how to order a domain name on the associated page." },
            { t: "Select the right hosting plan", d: "Second of our web hosting plans available at prices that is adapted to the performance you need. Each has the option such as a free domain for the first year, custom email addresses and a CMS that can be installed in 1 click. We recommend you take a deep look at experience websites, and make sure you perform the load space you need." },
            { t: "Use our pre-installed CMS tools", d: "A content management system, or as you know most websites you visit use the most managed CMS tools, such as WordPress, you can use to create your e-commerce site (and please note that our cookies) and take care of it seamlessly — the performance of GHCcloud Web Hosting, we get all you need to test content." },
          ].map((s, i) => (
            <div key={s.t} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b1020] text-sm font-black text-[#00b7ff]">{i + 1}</span>
              <div>
                <p className="text-sm font-black text-[#0f172a]">{s.t}</p>
                <p className="mt-2 text-xs text-slate-600 leading-6">{s.d}</p>
                {i === 2 && <a href="/web-hosting" className="mt-3 inline-block rounded-lg bg-[#ff3d00] px-5 py-2 text-xs font-bold text-white hover:bg-[#e63700]">Create a website</a>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pre-installed CMS tools */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Create your website more easily and quickly with our pre-installed CMS tools</h2>
        <p className="mt-2 text-center text-xs text-slate-500">Pre-installed CMS tools is a ideal solution for creating a blog, a standard website or an e-commerce platform.</p>
        <div className="mt-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-lg font-black text-[#0f172a]">Save time creating and updating your website</h3>
              <div className="mt-4 space-y-3 text-xs text-slate-600 leading-6">
                <p>With a CMS, you can create and manage a website without having to use programming languages. Thanks to CMS tools such as WordPress and PrestaShop, you can quickly access the interface to manage your content.</p>
                <p>The CMS gives you access to easy-to-integrate themes, as well as text blocks or image galleries, which will be displayed instantly on your site.</p>
                <p>These solutions are therefore ideal if you, or someone looking for an easy way to focus on the content, for handy user feedback.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-slate-100 p-10 flex items-center justify-center min-h-[220px]">
              <MousePointerClick className="w-16 h-16 text-[#0284c7]" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-slate-100 p-10 flex items-center justify-center min-h-[220px] order-2 md:order-1">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-[#0b1020] mx-auto flex items-center justify-center"><span className="text-3xl font-serif font-black text-white">W</span></div>
                <p className="mt-3 text-sm font-black text-[#0284c7]">WORDPRESS · PRESTASHOP · JOOMLA · DRUPAL</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-lg font-black text-[#0f172a]">Choose from our 4 available solutions</h3>
              <p className="mt-4 text-xs text-slate-600 leading-6">At GHCcloud, several pre-installed CMSs are available to choose from — such as WordPress, Drupal, PrestaShop and WooCommerce.</p>
              <p className="mt-3 text-xs text-slate-600 leading-6">Each CMS has its own interface, along with its own advantages and disadvantages, to create your site or e-commerce platform.</p>
              <ul className="mt-3 space-y-2.5 text-xs text-slate-600 leading-6">
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Ease of use:</strong> if you're just getting started, it's best to start with a simple CMS. These solutions give you an intuitive interface for adding pages and regular updates.</span></li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Customisation:</strong> some CMSs are more flexible than others, and will allow you to create a design more in line with your expectations.</span></li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Security:</strong> using a CMS frequently updated by its developer. These updates add features and fix vulnerabilities: some CMSs, such as WordPress, offer automatic update features.</span></li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" /><span><strong>Online community:</strong> a large and strong community (such as the PrestaShop one) will give you access to many tutorials and expert blogs on the web. If you need help or advice, it's easy to find resources on the web.</span></li>
              </ul>
              <p className="mt-4 text-xs text-slate-600">For more information, view our <a href="/web-hosting/create-website" className="text-[#0284c7] underline">comparison table</a>.</p>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <a href="/web-hosting" className="inline-block rounded-lg bg-[#ff3d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">Browse our offers</a>
        </div>
      </section>

      {/* Web agency */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-14 text-center">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Are you a web agency?</h2>
        <p className="mt-2 text-xs text-slate-500">Join our community of partners and benefit from exclusive offers for our partners.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {AGENCY.map((a) => (
            <div key={a.t} className="rounded-xl border border-slate-200 p-6 text-center">
              <a.icon className="w-10 h-10 text-[#0284c7] mx-auto" />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{a.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{a.d}</p>
              <a href={a.href} className="mt-4 inline-block rounded-lg bg-[#ff3d00] px-5 py-2 text-xs font-bold text-white hover:bg-[#e63700]">{a.cta}</a>
            </div>
          ))}
        </div>
      </section>

      {/* Best practices */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Best practices for your web project</h2>
        <ul className="mt-5 space-y-4 text-xs text-slate-600 leading-6">
          {BEST_PRACTICES.map((b) => (
            <li key={b.t} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0 mt-2" />
              <span><strong className="text-[#0f172a]">{b.t}</strong><br />{b.d}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-center">
          <a href="/web-hosting" className="inline-block rounded-lg bg-[#ff3d00] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#e63700]">Create my website</a>
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
