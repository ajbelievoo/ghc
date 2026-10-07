"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Shield, Lock, FileKey, EyeOff, Fingerprint, Check } from "lucide-react";

const features = [
  { icon: Shield, title: "DDoS Protection", desc: "Always-on mitigation with automatic detection. Up to 10 Tbps capacity per region." },
  { icon: Lock, title: "SSL/TLS Certificates", desc: "Free Let\'s Encrypt SSL on every service. Wildcard and EV certificates available." },
  { icon: FileKey, title: "Private Network", desc: "VLAN isolation between your servers. No traffic leaves our backbone." },
  { icon: EyeOff, title: "Data Encryption", desc: "AES-256 encryption at rest. TLS 1.3 in transit. Key management included." },
  { icon: Fingerprint, title: "Access Control", desc: "Role-based access, 2FA enforcement, IP whitelisting, and audit logging." },
  { icon: Shield, title: "Compliance", desc: "ISO 27001, SOC 2 Type II, and GDPR-ready infrastructure and processes." },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
            <Shield className="h-4 w-4" /> Security
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Security-first infrastructure.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Enterprise-grade protection for your data, networks, and workloads. Built into every layer.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Get Started Securely</Link>
            <Link href="/support" className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Contact Security Team</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
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
          <h2 className="mb-8 text-center text-3xl font-black">Security Checklist</h2>
          <div className="mx-auto max-w-2xl space-y-3">
            {[
              "Automatic security patches within 24 hours",
              "Network intrusion detection across all regions",
              "Encrypted backups with 30-day retention",
              "Immutable audit logs for compliance",
              "Dedicated security team with 24/7 monitoring",
              "Regular third-party penetration testing",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-5 py-3">
                <Check className="h-5 w-5 text-[#00a832]" />
                <span className="text-sm font-medium">{item}</span>
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
