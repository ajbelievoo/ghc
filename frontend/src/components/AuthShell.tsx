"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useGhcSettings } from "@/lib/ghcSettings";

export default function AuthShell({
  title,
  subtitle,
  tagline,
  features,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  tagline?: string;
  features?: string[];
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ghc = useGhcSettings();
  const ghcTag = tagline || ghc.tagline || "Go Host Cloud";
  const feats = features || [
    "Enterprise Cloud VPS",
    "Fast & Reliable",
    "24/7 Expert Support",
  ];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 sm:px-6 py-8"
      style={{
        background:
          "radial-gradient(1200px 800px at 85% -10%, rgba(0,183,255,.14) 0%, transparent 55%)," +
          "radial-gradient(900px 700px at -10% 110%, rgba(0,102,255,.10) 0%, transparent 50%)," +
          "linear-gradient(160deg, #f8fcff 0%, #eef6fc 100%)",
      }}
    >
      <div
        className="flex w-full max-w-[940px] min-h-[540px] bg-white rounded-[22px] overflow-hidden shadow-[0_30px_90px_-25px_rgba(0,80,160,.30),0_4px_18px_rgba(0,60,120,.08)]"
        style={{ animation: "ghc-card-in .7s cubic-bezier(.2,.8,.25,1) both .1s" }}
      >
        {/* Left brand panel */}
        <div className="relative hidden md:flex md:flex-1 flex-col p-11 text-white overflow-hidden" style={{ background: "linear-gradient(150deg, #012a52 0%, #0057b8 55%, #00b7ff 115%)" }}>
          <div className="absolute w-[340px] h-[340px] -top-[140px] -right-[120px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(127,227,255,.35) 0%, transparent 65%)" }} />
          <div className="absolute w-[280px] h-[280px] -bottom-[120px] -left-[100px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,183,255,.30) 0%, transparent 65%)" }} />

          <Link href="/" className="relative z-10">
            {ghc.logo_url ? (
              <img src="/images/ghc-logo.png" alt={ghc.name} className="w-52 max-w-[85%] h-auto" style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,.25))" }} />
            ) : (
              <h2 className="text-3xl font-black tracking-tight" style={{ textShadow: "0 4px 12px rgba(0,0,0,.25)" }}>{ghc.name}</h2>
            )}
            <p className="mt-2 text-sm uppercase tracking-[4px] text-white/85">{ghcTag}</p>
          </Link>

          <ul className="relative mt-auto mb-0 p-0 list-none z-10">
            {feats.map((f) => (
              <li key={f} className="flex items-center gap-3 my-3.5 text-[15px] text-white/[.92]">
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[rgba(143,230,255,.55)] bg-[rgba(127,227,255,.22)] shrink-0">
                  <Check className="w-3 h-3 text-[#8fe6ff]" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>

          <div className="relative mt-8 pt-4 border-t border-white/[.18] text-[12.5px] tracking-[1.5px] text-white/55 z-10">
            ghc.believoo.com
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 md:flex-[1.15] flex flex-col justify-center p-8 sm:p-12 bg-white">
          <h1 className="text-[30px] font-bold text-[#0f172a] tracking-[-.3px] leading-tight">{title}</h1>
          <p className="mt-2 text-[14.5px] text-slate-500 mb-7">{subtitle}</p>

          <div className="w-full max-w-[400px]">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
        </div>
      </div>

      <style jsx>{`
        @keyframes ghc-card-in {
          from { opacity: 0; transform: translateY(26px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
