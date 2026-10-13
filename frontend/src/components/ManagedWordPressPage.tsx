"use client";

import { useState } from "react";
import {
  Check, ChevronDown, Globe, Shield, Zap,
  RefreshCw, Gauge, Lock, LayoutDashboard, Copy, HardDrive,
  Activity, Puzzle, Cloud,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const FEATURES = [
  {
    title: "Smart automatic updates",
    text: "You are responsible for keeping your website up to date, improving user experience and safeguarding your brand. Managing hundreds of sites manually is a nightmare, draining time, money, and peace of mind. With Managed hosting for WordPress, every update — whether it's the core, plugins or themes — is first tested on a clone of your site. We then compare performance and user experience to ensure nothing breaks.",
    points: [
      "If everything checks out, the update goes live, seamlessly.",
      "If issues are found, we keep your current experience intact, notify you through your dashboard, and switch to the previous test results for you to review.",
    ],
    bullets: null,
    icon: RefreshCw,
  },
  {
    title: "Performance by design",
    text: "WordPress performance can suffer from misconfiguration or incomplete optimization, loading times can add three seconds or more on average. Our infrastructure is specifically optimized for WordPress, delivering fast, scalable and secure websites by design.",
    points: null,
    bullets: [
      "From the infrastructure up to the application layer, every component is fine-tuned to WordPress best practices for maximum efficiency.",
      "Your sites load quickly, with guaranteed performance even under peak traffic, thanks to advanced caching and modern storage.",
      "Every WordPress site runs in its own isolated environment, ensuring reliability and performance for every visitor.",
      "Monitor usage in real time across key metrics (storage, traffic, site count), and scale effortlessly as your needs evolve.",
    ],
    icon: Gauge,
  },
  {
    title: "End-to-end automated security",
    text: "Your website is always online and secure at the threats. That's why every WordPress site comes with a comprehensive security stack designed to protect your websites and your visitors, 24/7.",
    points: null,
    bullets: [
      "We scan your plugins daily against a blacklist of known vulnerabilities to proactively detect and mitigate risks before they impact your sites.",
      "A free Let's Encrypt SSL certificate is automatically installed and renewed for every site, encrypting traffic between your visitors and your site.",
      "Our anti-DDoS protection filters malicious traffic before it ever reaches your sites.",
    ],
    icon: Lock,
  },
  {
    title: "Centralized fleet management",
    text: "Managing multiple WordPress sites shouldn't mean multiplying your workload. Our centralized dashboard gives you full control over your entire fleet from a single interface.",
    points: null,
    bullets: [
      "Add, remove, and manage all your WordPress sites from one place. Whether you're hosting 10 or 1,000 sites, everything stays updated and accessible.",
      "Monitor performance, update progress, and security alerts across your entire fleet at a glance.",
      "Save time by applying updates, security checks, or configuration changes across multiple sites at once.",
      "Get a consolidated view of key metrics, security scans, plugin updates, and resource usage, all in one dashboard.",
    ],
    icon: LayoutDashboard,
  },
];

const CONTROL = [
  { icon: Copy, t: "Launch faster with cloning or master sites", d: "Create new sites from scratch in minutes, or start from a pre-configured master site with your preferred themes and plugins already in place." },
  { icon: Globe, t: "Total reversibility", d: "You stay in control of your data. Built on native WordPress, your site is fully portable. Export your content and migrate anytime, with no lock-in." },
  { icon: Activity, t: "Smart monitoring", d: "Stay on top of things, effortlessly. Monitor performance and uptime across your fleet in real time and catch issues before they become problems." },
  { icon: HardDrive, t: "Automated backups & one-click restore", d: "Daily backups are included, with quick restore options to roll back anytime." },
  { icon: Puzzle, t: "Certified plugins ecosystem", d: "Access a curated list of GHC cloud-approved plugins, tested for performance and compatibility, including integrations for video, AI tools, and more." },
];

const FAQS: [string, string][] = [
  ["What is Managed hosting for WordPress?", "A hosting service where GHC takes care of the technical maintenance of your WordPress sites — core, plugin and theme updates (tested on a clone first), security scanning, SSL, backups and performance optimization — so you only manage content."],
  ["How are updates managed with Managed hosting for WordPress?", "Every update is first applied to a clone of your site. We compare performance and rendering; if everything checks out the update goes live automatically. If something breaks, your production site stays untouched and you are notified."],
  ["What are the benefits of the optimized infrastructure for WordPress?", "The stack is tuned specifically for WordPress: OPcache, HTTP/2, server-side caching and modern SSD storage. Pages load faster, rank better and handle traffic spikes without you tuning anything."],
  ["How is security ensured with Managed hosting for WordPress?", "Daily plugin vulnerability scanning, free auto-renewed SSL on every site, always-on anti-DDoS protection and isolated per-site environments."],
  ["What is centralized fleet management?", "A single dashboard to manage all your WordPress sites — apply bulk updates, review security scans and monitor every site at a glance, whether you run 10 or 1,000 sites."],
  ["Can I clone or create a site from scratch with Managed hosting for WordPress?", "Yes — spin up a fresh site in minutes or clone an existing site (or a saved master template with your favourite themes and plugins) for instant new projects."],
  ["What are the benefits of reversibility with Managed hosting for WordPress?", "Your site is standard WordPress — export everything and move anytime. No proprietary lock-in: your data, themes and plugins remain fully portable."],
];

export default function ManagedWordPressPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const wpPlans = plans.filter((p) => (p.features || {})["Wordpress"] === "Yes");

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — full blue band */}
      <section className="bg-[#000e9c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Managed hosting for WordPress</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; Managed hosting for WordPress</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="inline-block rounded-full bg-emerald-400 text-[#0f172a] px-3 py-1 text-[11px] font-black uppercase tracking-wide">New</span>
              <h1 className="mt-4 text-3xl md:text-4xl font-black leading-tight">Managed hosting for WordPress: Speed up deployment and cut down on maintenance for all your WordPress websites</h1>
              <ul className="mt-6 space-y-2.5">
                {["Automatic install and setup", "Bulk actions and automatic updates", "Optimized infrastructure and scalable resources"].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm font-semibold">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center mx-auto">
                  <span className="text-4xl font-serif font-black">W</span>
                </div>
                <p className="mt-3 text-lg font-black tracking-widest">WORDPRESS</p>
                <p className="text-xs text-white/60 mt-1">× GHC Go Host Cloud</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain intro */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-black text-[#0f172a] leading-snug">We know the pain — managing multiple WordPress websites can feel like a constant uphill battle.</h2>
        <p className="mt-6 text-sm text-slate-600 leading-7">
          That's why we built Managed hosting for WordPress, to help you take back control, eliminate repetitive tasks, and concentrate on growing your projects with confidence.
          No more chasing updates, dealing with slow sites, or manually repeating the same setup process. <strong>We're right there with you, turning complexity into simplicity.</strong>
        </p>
        <div className="mt-8 inline-flex flex-col items-start gap-2.5 text-left">
          {["Smart automatic updates", "Performance by design", "End-to-end automated security", "Centralized fleet management"].map((b) => (
            <p key={b} className="flex items-center gap-2.5 text-sm font-semibold text-[#0f172a]">
              <Check className="w-4 h-4 text-[#0050d7] shrink-0" /> {b}
            </p>
          ))}
        </div>
      </section>

      {/* Alternating feature blocks */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 space-y-16">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className={i % 2 === 0 ? "order-1" : "order-1 md:order-2"}>
              <h2 className="text-2xl font-black text-[#0f172a]">{f.title}</h2>
              <p className="mt-4 text-sm text-slate-600 leading-7">{f.text}</p>
              {f.points && (
                <ul className="mt-4 space-y-2">
                  {f.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-slate-600"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />{pt}</li>
                  ))}
                </ul>
              )}
              {f.bullets && (
                <ul className="mt-4 space-y-2.5 list-none">
                  {f.bullets.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#0050d7] shrink-0 mt-2" />{pt}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className={`rounded-2xl bg-gradient-to-br ${i % 2 === 0 ? "from-[#eef4ff]" : "from-[#f3eaff]"} to-white border border-slate-100 p-10 flex items-center justify-center min-h-[240px] ${i % 2 === 0 ? "order-2" : "order-2 md:order-1"}`}>
              <f.icon className="w-16 h-16 text-[#0050d7]" />
            </div>
          </div>
        ))}

        {/* More control, more possibilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-black text-[#0f172a]">More control, more possibilities</h2>
            <p className="mt-3 text-sm text-slate-600">Gain full control, enhanced speed, and built-in flexibility for every WordPress project.</p>
            <div className="mt-6 space-y-5">
              {CONTROL.map((c) => (
                <div key={c.t}>
                  <p className="text-sm font-bold text-[#0f172a] flex items-center gap-2"><c.icon className="w-4 h-4 text-[#0050d7]" />{c.t}</p>
                  <p className="mt-1 text-xs text-slate-500 leading-5 pl-6">{c.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#e8f7ff] to-white border border-slate-100 p-10 flex items-center justify-center min-h-[280px]">
            <Cloud className="w-16 h-16 text-[#0050d7]" />
          </div>
        </div>
      </section>

      {/* Scale statement + 3 icons */}
      <section className="bg-[#f6f8fc] py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-[#0f172a] leading-snug">
            With Managed hosting for WordPress designed to scale, you can effortlessly create and manage all your websites on an always up-to-date, fully optimized infrastructure, giving you more time to focus on growing your business.
          </h2>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { icon: RefreshCw, t: "No more update headaches: effortlessly keep all your WordPress sites up to date" },
              { icon: Zap, t: "Less setup, more business: experience a hassle-free WordPress installation" },
              { icon: Shield, t: "Fix websites problems before your users even notice" },
            ].map((b) => (
              <div key={b.t} className="flex flex-col items-center">
                <b.icon className="w-10 h-10 text-[#0050d7]" />
                <p className="mt-3 text-sm font-semibold text-[#0f172a] leading-6">{b.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-center text-2xl font-black text-[#0f172a]">Get started with a WordPress-ready plan</h2>
        <p className="mt-2 text-center text-sm text-slate-500">Every plan below includes the 1-click WordPress installer, free SSL and a free domain for the first year.</p>
        <PlanGrid plans={wpPlans} recommended="hosting-perso" sub="wordpress" />
      </section>

      {/* Numbered FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">FAQ</h2>
        <div className="mt-5 divide-y divide-slate-200 border-t border-b border-slate-200">
          {FAQS.map(([q, a], i) => (
            <div key={i}>
              <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="flex w-full items-center justify-between py-4 text-left gap-4">
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0050d7]" : "text-[#0f172a]"}`}>{i + 1} - {q}</span>
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
