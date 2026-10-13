"use client";

import { useState } from "react";
import {
  Check, ChevronDown, ArrowRight, Globe, ShieldCheck, Zap, Route,
  FileText, FileBarChart2, MousePointerClick, Database, Lock,
  Gauge, Network,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const OFFERS = [
  {
    name: "CDN Basic", price: "₹198", tag: "In one click, get a powerful CDN to easily expand your business",
    title: "CDN Basic",
    text: "Get the features of a professional-quality CDN to easily improve the performance of your content management system. With our global network of datacentres, you can offer an optimal experience to all your users, wherever they are based.",
    includes: ["Global coverage", "Anti-DDoS protection", "A cache boost", "Anycast routing", "An SSL certificate", "Data compression"],
  },
  {
    name: "CDN Security", price: "₹494", tag: "Secure your websites with a customisable default configuration",
    title: "CDN Security",
    text: "In addition to the benefits of the CDN Basic, add features specially developed to ensure optimal security, always on. Once you are able to protect your users: by deploying security policies in the CDN, your website will be protected as soon as they are activated. The CDN comes with a default configuration, which is fully customisable.",
    includes: ["CDN Basic features", "Web application firewall (WAF): protection against fraudulent attacks and major known vulnerabilities", "Cross-Origin Resource Sharing (CORS): specify the external domains that are authorised to access your resources", "HTTP Strict Transport Security (HSTS): protect against downgrade attacks by retaining an HTTPS connection", "Mixed Content: securely filter your content", "HTTPS redirect: redirect all traffic with temporary or permanent HTTPS redirection"],
  },
  {
    name: "CDN Advanced", price: "₹978", tag: "Optimise your CDN configuration to fit your needs, for an enhanced user experience",
    title: "CDN Advanced",
    text: "In addition to CDN Basic and CDN Security, you get new features with CDN Advanced. It's delivered with a default configuration, as well as more administrative freedom to offer a custom user experience. Customise how your website functions, depending on how your visitors use it. Deliver quicker responses to even complex URLs, without unnecessarily overloading your web hosting plan. Customise refresh rates for content that changes frequently. Refresh only the elements that have just been modified, to avoid content inconsistencies when updating.",
    includes: ["CDN Basic features", "CDN Security features", "Customisable configuration: create up to 100 cache rules, customise the cache purge, manage cache warming", "Redirection to your mobile site: redirect visitors automatically to a mobile-optimised version", "Query string: use new cache controls based on URL query settings", "Preloading content: keep your user offering of your critical resources", "Advanced internationalisation: offer a personalised experience based on where your visitors are based"],
  },
];

const TABLE: { f: string; basic: boolean | "+"; sec: boolean | "+"; adv: boolean | "+" }[] = [
  { f: "Always online", basic: true, sec: true, adv: true },
  { f: "Anti-DDoS protection", basic: true, sec: true, adv: true },
  { f: "Analytics", basic: true, sec: true, adv: true },
  { f: "HTTP logs", basic: true, sec: true, adv: true },
  { f: "HTTP/2", basic: true, sec: true, adv: true },
  { f: "Gzip compression", basic: true, sec: true, adv: true },
  { f: "Brotli Compression", basic: true, sec: true, adv: true },
  { f: "Purge", basic: true, sec: true, adv: true },
  { f: "Cache rules", basic: true, sec: true, adv: "+" },
  { f: "SSL Certificate", basic: true, sec: true, adv: true },
  { f: "Domain aliases", basic: true, sec: true, adv: true },
  { f: "Automatic HTTPS redirection", basic: false, sec: true, adv: true },
  { f: "Mixed Content", basic: false, sec: true, adv: true },
  { f: "HTTP Strict Transport Security (HSTS)", basic: false, sec: true, adv: true },
  { f: "Cross-origin resource sharing (CORS)", basic: false, sec: true, adv: true },
  { f: "Application firewall (WAF)", basic: false, sec: true, adv: true },
  { f: "Mobile website redirection", basic: false, sec: false, adv: true },
  { f: "Content preloading", basic: false, sec: false, adv: true },
  { f: "Query string management", basic: false, sec: false, adv: true },
  { f: "Advanced global reach", basic: false, sec: false, adv: true },
];

const INCLUDED = [
  { icon: Globe, t: "Global coverage", d: "Our service covers both sides of the Atlantic, so your website will load in record time for web users based in both Europe and the US." },
  { icon: ShieldCheck, t: "Anti-DDoS protection", d: "Protect yourself against distributed denial-of-service attacks. Our web services are delivered with the very best DDoS protection. They are covered by our Anti-DDoS protection, which is included by default in all of our solutions." },
  { icon: Zap, t: "Boost caching", d: "The GHCcloud CDN service constantly analyses the content on your website, and ensures that your cache is always as recent as possible." },
  { icon: Route, t: "Anycast routing", d: "Your website's traffic is redirected to the nearest GHC cloud infrastructure, or an infrastructure that will deliver a quicker response." },
  { icon: FileText, t: "Let's Encrypt SSL certificate", d: "Ensure security for your website with the free SSL certificate. It offers HTTPS access to your visitors, and can be activated in just a few clicks via the GHCcloud Control Panel. Find out more" },
  { icon: Gauge, t: "Data compression", d: "Reduce the volume of data transferred and speed up your website's loading time with Gzip and Brotli algorithms." },
  { icon: FileBarChart2, t: "CDN Analytics", d: "Optimise your site thanks to accurate metrics on the state of your traffic." },
  { icon: MousePointerClick, t: "1-click activation", d: "Enable or upgrade to a higher CDN service in one click from the GHCcloud Control Panel." },
];

const FAQS: [string, string][] = [
  ["What is a CDN?", "A Content Delivery Network is a set of servers distributed worldwide that cache copies of your website's static content (images, scripts, videos) and deliver them from the location closest to each visitor — making pages load faster."],
  ["How does a CDN work?", "When a visitor opens your site, the CDN serves cached files from the nearest point of presence instead of your hosting server. Origin traffic, latency and load all drop — your hosting only handles dynamic requests."],
  ["How do I configure my CDN?", "Enable the CDN option on your hosting plan from the GHC Control Panel — caching, SSL and routing work out of the box. With CDN Advanced you can add up to 100 custom cache rules."],
  ["Why choose the GHCcloud CDN?", "It integrates natively with your hosting (no DNS juggling), includes anti-DDoS protection by default, adds a free Let's Encrypt SSL, and scales from Basic to Advanced with one click."],
  ["How is the GHCcloud Shared CDN solution an asset for website visibility?", "Faster pages rank better on search engines and keep visitors longer — Core Web Vitals, bounce rate and conversions all improve."],
  ["How can I speed up page loading times?", "Enable the CDN, turn on Gzip/Brotli compression, cache static assets with rules, and preload critical resources — all included in the CDN options."],
];

export default function CdnOptionPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const hostingPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="rounded-xl bg-lime-300 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Gauge className="w-10 h-10 text-[#0f172a] shrink-0" />
          <div>
            <p className="text-sm font-black text-[#0f172a]">CDN Basic included for free in Performance web hosting plans</p>
            <p className="text-xs text-slate-700 mt-0.5">Get a CDN from a professional solution, free with any Performance hosting plan subscription.</p>
            <a href="/web-hosting/business" className="mt-2 inline-block rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-[#0f172a] shadow hover:bg-slate-100">Get started</a>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="bg-[#000e9c] text-white mt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-40">
          <p className="text-xs text-white/70">CDN</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; <a href="/web-hosting" className="hover:underline">Web Hosting Options</a> &gt; CDN</p>
          <div className="mt-12 text-center max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-black">Shared CDN</h1>
            <p className="mt-4 text-sm text-white/85 leading-7">Develop your website traffic with the Shared CDN option, and deliver an unparalleled user experience. The Content Delivery Network (CDN) reduces the loading time for your pages, allowing your visitors to browse your website more smoothly.</p>
          </div>
        </div>
      </section>

      {/* 3 offer cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-28 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {OFFERS.map((o) => (
            <div key={o.name} className="rounded-xl bg-[#0043b0] text-white p-6 text-center shadow-xl flex flex-col">
              <p className="text-sm font-bold">{o.name}</p>
              <p className="mt-1.5 text-[10px] text-white/70 leading-4">{o.tag}</p>
              <p className="mt-4 text-3xl font-black">{o.price}</p>
              <p className="text-[10px] text-white/60">ex. taxes/month</p>
              <p className="mt-3 text-[10px] text-white/70 leading-4">Annual subscription<br />with a Web Hosting plan.<br />Enabled via the GHCcloud Control Panel</p>
              <a href="/web-hosting" className="mt-auto pt-4 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-white border-b border-white/50 pb-0.5 hover:border-white self-center">Choosing a Web Hosting plan <ArrowRight className="w-3 h-3" /></a>
            </div>
          ))}
        </div>
      </section>

      {/* 3 feature blocks */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-16">
        {OFFERS.map((o, i) => (
          <div key={o.name} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={`rounded-2xl bg-[#eef4ff] border border-slate-100 p-10 flex items-center justify-center min-h-[220px] ${i % 2 === 0 ? "order-2 md:order-1" : "order-2"}`}>
              {i === 0 && <Database className="w-16 h-16 text-[#0050d7]" />}
              {i === 1 && <Lock className="w-16 h-16 text-[#0050d7]" />}
              {i === 2 && <Network className="w-16 h-16 text-[#0050d7]" />}
            </div>
            <div className={i % 2 === 0 ? "order-1 md:order-2" : "order-1"}>
              <h2 className="text-xl font-black text-[#0f172a]">{o.title}</h2>
              <p className="mt-3 text-xs text-slate-600 leading-6">{o.text}</p>
              <p className="mt-4 text-xs font-bold text-[#0f172a]">{o.title} includes:</p>
              <ul className="mt-2 space-y-1.5">
                {o.includes.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#0050d7] shrink-0 mt-1.5" />{b}</li>
                ))}
              </ul>
              <a href="/web-hosting" className="mt-5 inline-block rounded-lg border border-[#0050d7] px-5 py-2 text-xs font-bold text-[#0050d7] hover:bg-[#0050d7] hover:text-white">Order</a>
            </div>
          </div>
        ))}
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr className="bg-[#f6f8fc]">
                <th className="py-3 px-4 text-left font-semibold text-slate-500"></th>
                <th className="py-3 px-4 text-center font-black text-[#0f172a]">BASIC<br /><span className="text-[10px] font-normal text-slate-500">₹198 ex. taxes/month</span></th>
                <th className="py-3 px-4 text-center font-black text-[#0f172a]">SECURITY<br /><span className="text-[10px] font-normal text-slate-500">₹494 ex. taxes/month</span></th>
                <th className="py-3 px-4 text-center font-black text-[#0f172a]">ADVANCED<br /><span className="text-[10px] font-normal text-slate-500">₹978 ex. taxes/month</span></th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map((r) => (
                <tr key={r.f} className="border-t border-slate-100">
                  <td className="py-2 px-4 font-semibold text-slate-600">{r.f}</td>
                  {[r.basic, r.sec, r.adv].map((v, i) => (
                    <td key={i} className="py-2 px-4 text-center">
                      {v === true && <Check className="w-4 h-4 text-[#0050d7] inline" />}
                      {v === "+" && <span className="font-black text-[#0050d7]">✚</span>}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200">
                <td className="py-3 px-4 text-[10px] text-slate-400">Caption: ✓ Feature included in the solution. ✚ Feature included and enhanced.</td>
                <td className="py-3 px-4 text-center" colSpan={0}></td>
                {["₹198", "₹494", "₹978"].map((p) => (
                  <td key={p} className="py-3 px-4 text-center">
                    <a href="/web-hosting" className="inline-block rounded-md bg-[#0050d7] px-4 py-1.5 text-[10px] font-black uppercase text-white hover:bg-[#0043b0]">Order</a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Included in all 3 levels */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Included by default in the 3 offer levels:</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {INCLUDED.map((s) => (
            <div key={s.t}>
              <s.icon className="w-9 h-9 text-[#0050d7]" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Compatible band + hosting plans */}
      <section className="bg-[#000e9c] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Our Shared CDN is compatible with all of our web hosting plans:</h2>
          <a href="/compare" className="mt-5 inline-block rounded-lg border border-white px-6 py-2.5 text-sm font-bold text-white hover:bg-white/10">View detailed comparison</a>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-10">
          <div className="text-slate-900">
            <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="business" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Your questions answered</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
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
