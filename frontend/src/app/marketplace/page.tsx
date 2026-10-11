"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store, Key, Download, Monitor, Shield, ShieldCheck, Globe, Package, Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { getCurrencySymbol } from "@/components/CurrencyProvider";

const ICONS: Record<string, any> = {
  key: Key, download: Download, monitor: Monitor, shield: Shield,
  shieldcheck: ShieldCheck, globe: Globe, package: Package, store: Store,
};

const CATEGORY_LABELS: Record<string, string> = {
  apps: "Applications",
  licenses: "Licenses",
  images: "OS images",
  security: "Security",
  integrations: "Integrations",
};

export default function MarketplacePage() {
  const [items, setItems] = useState<any[] | null>(null);

  useEffect(() => {
    api.marketplace.list().then((d) => setItems(d.items || [])).catch(() => setItems([]));
  }, []);

  const groups: Record<string, any[]> = {};
  (items || []).forEach((i) => {
    const c = i.category || "apps";
    (groups[c] = groups[c] || []).push(i);
  });

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />
      <section className="border-b border-slate-200 bg-gradient-to-b from-[#0f0c29] to-[#1b1846] px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-[#00b7ff]"><Store className="w-5 h-5" /><span className="text-xs font-bold uppercase tracking-widest">Marketplace</span></div>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">Apps, licenses &amp; add-ons for your servers</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">Control panels, one-click installers, security suites and OS images — ready to attach to your GHC services. Everything is managed from one dashboard.</p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-4 py-12">
        {items === null && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#00b7ff]" /></div>}
        {items !== null && items.length === 0 && (
          <div className="rounded-xl border border-slate-200 p-12 text-center">
            <Package className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-600">Marketplace products will appear here soon.</p>
          </div>
        )}
        {Object.entries(groups).map(([cat, list]) => (
          <div key={cat} className="mb-10">
            <h2 className="mb-4 text-lg font-bold">{CATEGORY_LABELS[cat] || cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((i) => {
                const Icon = ICONS[(i.icon || "").toLowerCase()] || Package;
                const orderable = !!i.planCode;
                return (
                  <div key={i.slug} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 hover:border-[#00b7ff]/50 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00b7ff]/10 text-[#00b7ff]"><Icon className="w-5 h-5" /></span>
                      {i.vendor && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{i.vendor}</span>}
                    </div>
                    <h3 className="mt-3 text-sm font-bold">{i.name}</h3>
                    {i.description && <p className="mt-1 flex-1 text-xs text-slate-500">{i.description}</p>}
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-bold">
                        {i.billingCycle === "free" || i.price === 0
                          ? <span className="text-emerald-600">Free</span>
                          : <>{getCurrencySymbol(i.currency)}{i.price.toFixed(2)}<span className="text-[10px] font-normal text-slate-400">/{i.billingCycle === "one-time" ? "one-time" : i.billingCycle === "yearly" ? "yr" : "mo"}</span></>}
                      </p>
                      {orderable ? (
                        <Link href={`/configure?plan=${encodeURIComponent(i.planCode)}`} className="inline-flex items-center gap-1 rounded-lg bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0090cc]">
                          Order <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link href="/support" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#00b7ff] hover:text-[#00b7ff]">Enquire</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
      <Footer />
    </div>
  );
}
