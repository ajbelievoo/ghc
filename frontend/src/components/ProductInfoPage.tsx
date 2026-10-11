"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check, ChevronRight } from "lucide-react";

export interface ProductInfo {
  badge: string;
  title: string;
  subtitle: string;
  features: { title: string; desc: string }[];
  highlights: string[];
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export default function ProductInfoPage({ info }: { info: ProductInfo }) {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
            {info.badge}
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">{info.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">{info.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={info.cta.href} className="rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700]">
              {info.cta.label}
            </Link>
            {info.secondaryCta && (
              <Link href={info.secondaryCta.href} className="rounded border border-white/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
                {info.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {info.features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 p-8 hover:border-[#00b7ff]/30 transition-all">
              <h3 className="text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f8faff] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-8 text-2xl font-bold">What you get</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {info.highlights.map((h) => (
              <div key={h} className="flex items-start gap-3 rounded-xl bg-white border border-slate-200 px-5 py-4">
                <Check className="h-4 w-4 text-[#00a832] mt-0.5 shrink-0" />
                <p className="text-sm text-slate-600">{h}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href={info.cta.href} className="inline-flex items-center gap-1 text-sm font-bold text-[#00b7ff] hover:underline">
              {info.cta.label} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
