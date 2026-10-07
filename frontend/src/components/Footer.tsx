"use client";

import Link from "next/link";
import { Server, Shield, Zap, Star } from "lucide-react";
import { useGhcSettings } from "@/lib/ghcSettings";

export default function Footer() {
  const ghc = useGhcSettings();

  return (
    <footer className="bg-[#0f0c29] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              {ghc.logo_url ? (
                <img src={ghc.logo_url} alt={ghc.name} className="h-8 w-auto" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#00b7ff]/10 border border-[#00b7ff]/30">
                  <Server className="h-4 w-4 text-[#00b7ff]" />
                </div>
              )}
              <span className="font-bold text-white">{ghc.name}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{ghc.tagline} — automated cloud billing & provisioning by Believoo Private Limited.</p>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Products</p>
            <div className="space-y-2 text-sm text-slate-300">
              <Link href="/vps" className="block hover:text-white">VPS Hosting</Link>
              <Link href="/dedicated-servers" className="block hover:text-white">Dedicated Servers</Link>
              <Link href="/web-hosting" className="block hover:text-white">Web Hosting</Link>
              <Link href="/domain" className="block hover:text-white">Domains</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Account</p>
            <div className="space-y-2 text-sm text-slate-300">
              <Link href="/dashboard" className="block hover:text-white">Client Dashboard</Link>
              <Link href="/login" className="block hover:text-white">Sign in</Link>
              <Link href="/register" className="block hover:text-white">Create account</Link>
              <Link href="/support" className="block hover:text-white">Support</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Legal</p>
            <div className="space-y-2 text-sm text-slate-300">
              <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
              <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
              <Link href="/refund" className="block hover:text-white">Refund Policy</Link>
              <Link href="/acceptable-use" className="block hover:text-white">Acceptable Use</Link>
              <Link href="/sla" className="block hover:text-white">SLA</Link>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Why {ghc.name}</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p className="flex items-center gap-2"><Shield className="h-4 w-4 text-[#00ff88]" /> DDoS protection</p>
              <p className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#00b7ff]" /> Instant provisioning</p>
              <p className="flex items-center gap-2"><Star className="h-4 w-4 text-[#b500ff]" /> 99.99% SLA</p>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-700 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} {ghc.name} — {ghc.tagline}. A Believoo Private Limited brand.
        </div>
      </div>
    </footer>
  );
}
