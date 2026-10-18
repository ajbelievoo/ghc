"use client";

import { useState } from "react";
import {
  Check, ChevronDown, PiggyBank, ShieldCheck, Zap, Medal, Globe, Recycle,
  Shield, Gauge, Code2, Rocket, Boxes, Gamepad2, Database, LayoutDashboard, Building2,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";

const FAQS: [string, string][] = [
  ["How can partners benefit from the wholesale offer?", "White-label racks let you resell bare-metal infrastructure under your own brand. You get volume pricing, full API automation, your own control-panel workflows and our global datacentre footprint — while we handle hardware, network and datacentre operations."],
  ["Can I customise Bare Metal servers?", "Yes. Rack servers can be configured per node — CPU, RAM, storage and bandwidth options are selectable, and you manage each machine through the API or control panel exactly like retail dedicated servers."],
  ["Are Bare Metal servers ISO 27001 certified?", "Our datacentres and management processes are covered by industry certifications including ISO 27001, SOC and CSA-Star, depending on the region — suitable for regulated and enterprise workloads."],
];

const RACKS = [
  { name: "Core Rack", href: "/dedicated-servers/advance", bullets: ["Available on all Core servers", "Up to 320 GB memory", "Max public bandwidth: 25 Gbps per server", "Max private bandwidth: 25 Gbps guaranteed per server", "SLA: 99.95%"] },
  { name: "Elite Rack", href: "/dedicated-servers/high-grade", bullets: ["Available on all Elite servers", "Up to 1.5 TB memory", "Max public bandwidth: 50 Gbps per server", "Max private bandwidth: 50 Gbps guaranteed per server", "SLA: 99.99%"] },
  { name: "Flex Rack", href: "/dedicated-servers/scale", bullets: ["Available on all Flex servers", "Up to 2 TB memory", "Max public bandwidth: 50 Gbps per server", "Max private bandwidth: 50 Gbps guaranteed per server", "SLA: 99.99%"] },
];

export default function WholesalePage() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Wholesale dedicated servers</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Wholesale</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Your white-label infrastructure</h1>
              <p className="mt-4 text-sm text-white/80 leading-7">
                Reduce your datacentre costs by taking advantage of our rack-mountable server range. Enhance security and expand your projects with our scalable, fully manageable solutions.
              </p>
              <a href="/support" className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-[#0b1020] hover:bg-slate-100">Contact us for more information</a>
            </div>
            {/* CSS rack illustration */}
            <div className="hidden md:flex justify-center gap-3">
              {[0, 1].map((r) => (
                <div key={r} className="space-y-1.5" style={{ marginTop: r ? 18 : 0 }}>
                  {[0, 1, 2, 3].map((s) => (
                    <div key={s} className="w-36 h-9 rounded-md bg-gradient-to-b from-[#1c2f66] to-[#14235a] border border-[#00b7ff]/40 flex items-center px-2.5 gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00b7ff]" />
                      <span className="flex-1" />
                      <span className="w-8 h-1 rounded bg-white/20" />
                      <span className="w-2 h-2 rounded-sm bg-white/15" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rack cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {RACKS.map((r, i) => (
            <div key={r.name} className="relative rounded-2xl border border-slate-200 bg-white p-6 pt-8 overflow-hidden hover:shadow-lg transition-all flex flex-col">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-[#0b1020]", "bg-violet-500"][i]}`} />
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-[#0f172a] uppercase tracking-wide">{r.name}</p>
                <a href="/support" className="rounded-md bg-[#ff3d00] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#e63700]">Contact us</a>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {r.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-[#0284c7] shrink-0 mt-0.5" />{b}</li>
                ))}
              </ul>
              <a href={r.href} className="mt-5 text-xs font-bold text-[#0284c7] hover:underline">Discover the {r.name.split(" ")[0]} range →</a>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits for white label partners */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Benefits for white label partners</h2>
        <p className="mt-2 text-sm text-slate-500">GHC offers Bare Metal servers sold wholesale. This has multiple advantages for white label partners.</p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: PiggyBank, t: "Cost reduction", d: "Partners can significantly reduce the costs of their datacentre operations with fully manageable, secure solutions." },
            { icon: ShieldCheck, t: "Security and scalability", d: "We ensure security with the hardware that we build, offering full compliance with existing regulations." },
            { icon: Zap, t: "Faster time-to-market", d: "Our short production processes, ranging from prototyping to large-scale manufacturing, speed up critical delivery for the company." },
            { icon: Medal, t: "Over 20 years of experience", d: "Partners benefit from our expertise and cutting-edge solutions at highly competitive prices." },
            { icon: Globe, t: "A global presence", d: "With datacentres strategically located around the world, our partners can expand their businesses globally." },
            { icon: Recycle, t: "Effective hardware lifecycle management", d: "Transforming CAPEX investments into predictable and manageable OPEX costs." },
          ].map((c, i) => (
            <div key={c.t} className="relative rounded-2xl border border-slate-200 bg-white p-5 pt-8 overflow-hidden hover:shadow-md transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-emerald-400", "bg-violet-500", "bg-amber-400", "bg-sky-500", "bg-[#0b1020]"][i]}`} />
              <c.icon className="w-8 h-8 text-[#0284c7]" />
              <p className="mt-3 text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{c.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-9 text-center">
          <a href="/register" className="inline-block rounded-lg bg-[#0b1020] px-8 py-3 text-sm font-bold text-white hover:bg-[#101d42]">Discover the GHC Partner Program</a>
        </div>
      </section>

      {/* Key features band */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-xl font-black text-white">Key features</h2>
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, t: "Anti-DDoS protection", d: "Enhanced security for online operations with proactive protection." },
              { icon: Gauge, t: "Unlimited guaranteed bandwidth", d: "For optimal network performance at no additional cost." },
              { icon: Code2, t: "Full API", d: "Easy integration with automation capabilities for simplified management." },
              { icon: Rocket, t: "Fast delivery", d: "Rapid server provisioning to meet immediate needs." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl bg-white/[0.07] border border-white/10 p-5">
                <f.icon className="w-7 h-7 text-[#00b7ff]" />
                <p className="mt-3 text-sm font-bold text-white">{f.t}</p>
                <p className="mt-1.5 text-xs text-white/60 leading-5">{f.d}</p>
                <span className="mt-3 inline-block rounded-full bg-emerald-400/20 text-emerald-300 px-2.5 py-0.5 text-[10px] font-black uppercase">Included</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Use cases</h2>
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Boxes, t: "Virtualisation", d: "Support for migrating applications to the cloud and building hypervisor clusters.", href: "/dedicated-servers/use-cases/virtualisation" },
            { icon: Gamepad2, t: "Cloud gaming", d: "Industry-leading hardware resources and anti-DDoS for game platforms.", href: "/dedicated-servers/game" },
            { icon: Database, t: "Storage and databases", d: "Cost optimisation and global expansion with bare-metal storage nodes.", href: "/dedicated-servers/storage" },
            { icon: LayoutDashboard, t: "Web hosting", d: "Ideal for partners offering web hosting services, with improved margins and a global reach.", href: "/dedicated-servers/use-cases/web-applications" },
            { icon: Building2, t: "Datacentre solutions", d: "Customisable and affordable solutions for partners, including white label and DCaaS options.", href: "/support" },
          ].map((u, i) => (
            <a key={u.t} href={u.href} className="group relative rounded-2xl border border-slate-200 bg-white p-6 pt-8 overflow-hidden hover:border-[#0284c7] hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400", "bg-amber-400", "bg-sky-500"][i]}`} />
              <u.icon className="w-8 h-8 text-[#0284c7]" />
              <p className="mt-3 text-sm font-black text-[#0f172a] group-hover:text-[#0284c7]">{u.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{u.d}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Contact band */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#155e75] to-[#00b7ff] py-12 px-6 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white">Contact us for a personalised consultation</h2>
          <p className="mt-2 text-sm text-white/80">Fill out the form to get more information on our rack server solutions.</p>
          <a href="/support" className="mt-6 inline-block rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-[#0284c7] hover:bg-slate-100">Contact us</a>
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
