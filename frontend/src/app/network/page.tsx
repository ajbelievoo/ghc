"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Network, Globe, Shield, Zap, Server, ChevronRight, Check } from "lucide-react";

const features = [
  { icon: Globe, title: "Global Anycast Network", desc: "Edge nodes in 45+ cities worldwide. Traffic automatically routes to the closest PoP." },
  { icon: Shield, title: "DDoS Protection", desc: "Always-on mitigation up to 10 Tbps. Automatic detection and filtering of volumetric attacks." },
  { icon: Zap, title: "Low Latency Routing", desc: "Private backbone with 100G links. Average RTT under 15ms within the same region." },
  { icon: Server, title: "Load Balancing", desc: "Layer 4 and Layer 7 load balancing with health checks, SSL termination, and sticky sessions." },
];

const plans = [
  { name: "Standard", price: "Free", desc: "Included with every server", features: ["1 Gbps public port", "Basic DDoS protection", "Standard routing", "Community support"] },
  { name: "Advanced", price: "$29.76/mo", desc: "For production workloads", features: ["10 Gbps public port", "Advanced DDoS protection", "Anycast IP option", "Private backbone access", "Priority support"] },
  { name: "Enterprise", price: "Custom", desc: "Mission-critical infrastructure", features: ["100 Gbps public port", "Dedicated anti-DDoS", "Custom BGP routing", "Private backbone + VLAN", "24/7 SRE support"] },
];

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
            <Network className="h-4 w-4" /> Network Infrastructure
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Built for speed. Designed for resilience.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Global network backbone with enterprise-grade DDoS protection, anycast routing, and private interconnects.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/vps" className="rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Deploy with Network</Link>
            <Link href="/support" className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Talk to Network Engineers</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 p-8 hover:border-[#00b7ff]/30 transition-all">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                <f.icon className="h-6 w-6 text-[#00b7ff]" />
              </div>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f8faff] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-10 text-center text-3xl font-black">Network Tiers</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 bg-white p-8">
                <h3 className="text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{p.desc}</p>
                <p className="mt-4 text-3xl font-black">{p.price}</p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600"><Check className="h-4 w-4 text-[#00a832] flex-shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                <Link href="/vps" className="mt-6 block w-full rounded-lg bg-[#0f0c29] py-2.5 text-center text-sm font-bold text-white hover:bg-[#302b63]">Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#0f0c29] text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-slate-400">&copy; 2026 GHC — Go Host Cloud. A Believoo Pvt Ltd brand.</div>
      </footer>
    </div>
  );
}
