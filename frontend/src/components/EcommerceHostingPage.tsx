"use client";

import { useState } from "react";
import {
  Check, ChevronDown, Play, MousePointerClick, Gauge, ShieldCheck,
  RefreshCw, Globe, BarChart3, Route, KeyRound, HardDrive, Users,
  FileText, Workflow, Handshake, Store,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const COLUMNS = [
  { t: "Your time is valuable", d: "PrestaShop, the management tool for your online catalogue, is pre-installed for you.", rows: ["Servers managed by GHCcloud", "You get to focus on your business"] },
  { t: "Performance at a competitive price", d: "Load your pages in record time.", rows: ["A powerful service adapted to your web traffic", "The boost option gives you the flexibility to temporarily handle traffic spikes"] },
  { t: "Added bonus: your peace of mind", d: "99.99% availability rate assured.", rows: ["Advanced security, backups and restore", "Data sovereignty"] },
];

const ESSENTIALS = [
  { icon: RefreshCw, t: "Managed hosting", d: "You create your website, we take care of the rest. On this infrastructure, GHCcloud web hosting offers simplicity, flexibility and performance. Let us take care of the installation of your website in 1 click. We're on hand to deal with security patches." },
  { icon: Store, t: "Included with your PrestaShop hosting", d: "GHCcloud guarantees that your PrestaShop website will be hosted on an optimised platform. Since this solution is already ready to use, you don't need to worry about installation even if technical updates to create your online store." },
  { icon: Globe, t: "Unlimited monthly traffic", d: "Make your web project a success: we help you grow your business." },
  { icon: BarChart3, t: "GHCcloud Web Statistics", d: "Track the number of visitors to your website in detail, via our comprehensive statistics dashboard." },
  { icon: Route, t: "CDN", d: "Improve browsing experience for your website's visitors, with quicker loading times for your webpages. The closer the infrastructure, the faster your content loads." },
  { icon: KeyRound, t: "SSL certificate", d: "We include a Let's Encrypt SSL certificate with all of our web hosting plans. It offers HTTPS access to your visitors and improves SEO." },
  { icon: HardDrive, t: "Backup and recovery", d: "All of our hosting plans come with an interface that will enable you to save and restore your e-commerce site if the worst happens to your e-shop." },
  { icon: ShieldCheck, t: "Anti-DDoS protection", d: "Protection against distributed denial-of-service attacks, one of our GHCcloud solutions with services are subject to the strictest protections." },
];

const AGENCY = [
  { icon: Handshake, t: "GHCcloud Partner Program", d: "With our support, you play a key role in your customers' digital transformation. Access a wide range of services and strengthen your expertise on our technologies.", cta: "Find out more", href: "/products/support-levels" },
  { icon: Workflow, t: "GHCcloud Marketplace", d: "Find the software solutions that will meet your customers' needs. Get access to more than 100 tested solutions, tested by GHCcloud.", cta: "Find out more", href: "/marketplace" },
];

const FAQS: [string, string][] = [
  ["Why is Performance Hosting the best solution for an online shop?", "It combines guaranteed CPU/RAM resources, a CDN option, multisite capacity and the Boost option for traffic spikes — your store stays fast during sales events and campaigns, when speed directly drives conversions."],
  ["How is my online shop made secure with GHCcloud?", "Free SSL on every domain encrypts transactions, always-on anti-DDoS filters attacks before they reach your shop, and automatic daily backups let you restore your store if anything goes wrong."],
  ["Why are SSL certificates important, and which one is best?", "SSL encrypts payments and customer data and displays the padlock customers look for. Let's Encrypt (included) covers basic security; Sectigo DV adds a warranty; Sectigo EV verifies your company and maximises trust for serious stores."],
  ["Why is a CDN included in Performance Hosting?", "A CDN caches your product images and pages closer to customers worldwide — faster loading means lower bounce rates and better search rankings, especially for international shoppers."],
];

export default function EcommerceHostingPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const perfPlan = plans.find((p) => p.planCode === "hosting-performance-1");
  const wpPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c)).filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Hosting for e-commerce</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; Hosting for e-commerce</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Create your e-commerce website and sell on evenings and weekends!</h1>
              <ul className="mt-6 space-y-2.5">
                {["Launch your e-commerce website in just a few clicks", "Grow your business by launching more sites over time", "Manage your inventory and customers, anywhere"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> {b}</li>
                ))}
              </ul>
              <a href="/web-hosting" className="mt-6 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-slate-100">Get Started</a>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#0891b2] to-[#00b7ff] w-full max-w-md h-52 flex items-center justify-center">
                <Store className="w-16 h-16 text-white/80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"><Play className="w-6 h-6 fill-[#0b1020] text-[#0b1020]" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 columns */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
          {COLUMNS.map((c) => (
            <div key={c.t}>
              <p className="text-xs font-black uppercase tracking-widest text-[#0f172a]">{c.t}</p>
              <p className="mt-3 text-xs text-slate-600 leading-6">{c.d}</p>
              <ul className="mt-3 space-y-1.5 text-left inline-block">
                {c.rows.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Performance plan spotlight */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Performance Hosting: the solution for online retailers</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <ul className="space-y-4 text-xs text-slate-600 leading-6">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Compatible e-commerce solutions load quickly at <strong>lightning-fast page loading times</strong>.</span></li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>The <strong>Boost</strong> traffic option. PrestaShop included and pre-installed.</span></li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><span>Your customer first domain name for the first year & flows the most popular extensions (including .com and .uk).</span></li>
          </ul>
          {perfPlan && (
            <div>
              <PlanGrid plans={[perfPlan]} sub="business" />
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-14 space-y-10">
        <div className="md:pl-[40%]">
          <h3 className="text-base font-black text-[#0f172a]">I run a local business and it's my first time selling online</h3>
          <p className="mt-2 text-xs text-slate-600 leading-6">
            As a novice in selling online, having my website available and easy to update and a secure platform was essential to me. With Performance hosting, I can quickly get my online store up and running. My website is managed 24/7, and I can easily share my inventory with my PrestaShop catalogue; any orders are directly addressed to the site. The team's are managing the hosting. PrestaShop was pre-installed in my hosting, so I can access and track online family purchases. I think for my website, new customers can discover me and order products through my shop.
          </p>
        </div>
        <div className="md:pr-[40%]">
          <h3 className="text-base font-black text-[#0f172a]">I sell exclusively online</h3>
          <p className="mt-2 text-xs text-slate-600 leading-6">
            My e-commerce website is my only point of sale, so it's important that I make it as efficient as possible. With GHCcloud Performance hosting, I get a solution tailored to the needs of my online store, PrestaShop, an SSL certificate to keep my customers secure, and infrastructure that can be configured with a few clicks. This comes in handy when my sales spike during promotions! And if something goes wrong, I can access recovery options, and other business offered by PrestaShop, such as tools, payment and delivery management.
          </p>
        </div>
      </section>

      {/* Essential features */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl md:text-2xl font-black text-center text-[#0f172a]">Essential features to help you succeed in e-commerce</h2>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {ESSENTIALS.map((s) => (
            <div key={s.t}>
              <s.icon className="w-9 h-9 text-[#0284c7]" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Did you know */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] py-14 text-white text-center">
        <h2 className="text-2xl font-black">Did you know?</h2>
        <p className="mt-2 text-xs text-white/70 px-4">Since 1999, GHCcloud has been the European reference for hosting solutions, with a presence in Europe and internationally.</p>
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

      {/* Support */}
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

      {/* All plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-center text-xl md:text-2xl font-black text-[#0f172a]">Explore our e-commerce-ready hosting plans</h2>
        <PlanGrid plans={wpPlans} recommended="hosting-performance-1" sub="business" />
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
