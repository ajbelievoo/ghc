"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Check, Code2, Globe, Shield, Gauge, HardDrive, Settings2, Zap, Database, Network, Cpu } from "lucide-react";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

const price = (p: any) => {
  const d = (p?.durations || []).find((x: any) => x.durationLabel === "1_month") || p?.durations?.[0];
  return d?.monthlyPrice ?? d?.finalPrice;
};

const OS_LIST = ["Ubuntu", "Debian", "Fedora", "Rocky Linux", "AlmaLinux", "Windows Server", "Docker", "Plesk", "cPanel"];

const OPTIONS = [
  { t: "Additional IP", d: "Hosting without interruptions", href: "/products/ip-failover" },
  { t: "Load balancer", d: "Fail-safe flexibility", href: "/products/load-balancer" },
  { t: "Backup options", d: "Protect your data", href: "/metal/vps#services" },
];

const DEV_FEATURES = [
  { icon: Gauge, t: "Optimised resources at the best price", d: "Get ample resources without breaking the bank. Our VPS solutions, equipped with next-generation architecture and NVMe storage, guarantee speed and reliability." },
  { icon: Settings2, t: "An isolated, scalable environment", d: "Host your projects in an isolated, flexible environment, and upgrade your configuration in one click via your Control Panel." },
  { icon: Code2, t: "Simplicity and total control", d: "Gain full control over your VPS via root access and the GHC API. Choose and install your preferred distribution, then use tools like Plesk or cPanel to manage your services." },
  { icon: Network, t: "Unlimited traffic", d: "With your VPS server, you get unlimited traffic* and bandwidth of up to 3 Gbps. This is perfect for services that need high throughput, and comes at no extra cost. * Excluding datacentres in Asia-Pacific." },
  { icon: HardDrive, t: "Backup options", d: "Your data is automatically backed up for protection. You can also choose advanced options, such as Premium backup and snapshots." },
  { icon: Shield, t: "Availability", d: "Backed by a 99.9% SLA, our VPS solutions ensure reliable hosting for your websites, applications, and critical projects." },
];

export default function MetalDevelopersPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    api.server.metalVpsPlans()
      .then((p: any[]) => {
        const base = (p || [])
          .filter((x: any) => String(x.planCode).startsWith("vps-2027") && !/\.lz$/i.test(String(x.planCode)) && price(x) != null)
          .sort((a: any, b: any) => price(a) - price(b));
        setPlans(base.slice(-2)); // OVH recommends the top two for developers
      })
      .catch(() => {});
  }, [currency]);

  const configure = (p: any) => router.push(`/configure?category=VPS&plan=${encodeURIComponent(p.planCode)}&brand=metal`);

  const specs = (p: any) => [
    `${p.cpuCores || "—"} vCores`,
    `${p.ramGb || "—"} GB RAM`,
    `${p.diskGb || "—"} GB SSD NVMe`,
    "Daily backup of the previous 24 hours",
    "Unlimited traffic ⓘ",
    `${p.bandwidthMbps >= 1000 ? `${p.bandwidthMbps / 1000} Gbps` : `${p.bandwidthMbps} Mbps`} public bandwidth`,
  ];

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="ghc-metal-grid relative overflow-hidden bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="ghc-metal-orb ghc-metal-orb-a -left-24 top-10 h-96 w-96" />
        <div className="ghc-metal-orb ghc-metal-orb-b right-0 top-1/3 h-[28rem] w-[28rem]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-16">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
            <span className="ghc-metal-text-grad">VPS for Developers</span>
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            <a href="/" className="hover:underline">Home</a> &gt; <a href="/metal/vps" className="hover:underline">VPS</a> &gt; VPS for Developers
          </p>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-3xl font-black md:text-4xl"><span className="ghc-metal-text-grad">Flexible VPS for faster deployment</span></h1>
              <p className="mt-3 text-sm text-white/70">Get a powerful, dedicated setup at a price you can't beat.</p>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> Simplicity, scalability, and customisation</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> Up to 3 Gbps unlimited bandwidth*</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> 99.9% SLA</li>
              </ul>
              <a href="#plans" className="ghc-metal-btn mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold">Get started</a>
            </div>
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-3xl border border-[#ff8a2a]/30 bg-[#1a0e06]/80 shadow-[0_0_80px_rgba(255,138,42,.25)]">
              <Code2 className="h-24 w-24 text-[#ffb347]" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Plans ─── */}
      <section id="plans" className="mx-auto max-w-7xl scroll-mt-24 px-6 py-14 text-white">
        <h2 className="text-center text-2xl font-black"><span className="ghc-metal-text-grad">Choose your VPS solution</span></h2>
        <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 text-xs text-white/60 sm:grid-cols-4">
          {["Scalable configuration", "Unlimited traffic*", "Anti-DDoS included", "Available in Europe, Canada, USA, and APAC"].map((f) => (
            <span key={f} className="flex items-center justify-center gap-1.5 text-center"><Check className="h-3.5 w-3.5 shrink-0 text-[#ffb347]" />{f}</span>
          ))}
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl gap-5 sm:grid-cols-2">
          {plans.map((p) => (
            <div key={p.planCode} className="rounded-2xl border border-[#ff8a2a]/20 bg-[#120c08] p-6 text-center hover:border-[#ff8a2a]/50 transition-colors">
              <span className="rounded-full bg-[#00b7ff]/15 px-3 py-1 text-[11px] font-bold text-[#00b7ff]">2027</span>
              <p className="mt-3 text-xl font-black">{p.displayName || p.invoiceName}</p>
              <p className="mt-1 text-xs text-white/50">From</p>
              <p className="text-2xl font-black text-[#ffb347]">{money(price(p), currency)}</p>
              <p className="text-[11px] text-white/50">exc. GST/month · Installation fees: <b className="text-white/70">Free</b></p>
              <button onClick={() => configure(p)} className="mt-4 w-full rounded-lg bg-[#0050d7] py-2.5 text-sm font-bold hover:bg-[#0061ff] transition-colors">Configure</button>
              <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-left text-xs text-white/70">
                {specs(p).map((s) => (
                  <li key={s} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-[#ffb347]" />{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Options ─── */}
      <section className="bg-[#0d0805] py-12">
        <div className="mx-auto max-w-4xl px-6 text-white">
          <h2 className="text-center text-xl font-black"><span className="ghc-metal-text-grad">Options compatible with our VPS solutions</span></h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {OPTIONS.map((o) => (
              <a key={o.t} href={o.href} className="rounded-xl border border-[#ff8a2a]/20 bg-[#161009] px-5 py-4 text-center hover:border-[#ff8a2a]/60 transition-colors">
                <p className="text-sm font-black">{o.t}</p>
                <p className="mt-1 text-xs text-white/50">{o.d}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ─── OS grid ─── */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Operating systems and applications</span></h2>
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-5">
          {OS_LIST.map((os) => (
            <a key={os} href="/metal/vps/distributions" className="rounded-xl border border-white/10 bg-[#120c08] px-4 py-5 text-center text-xs font-bold text-white/80 hover:border-[#ff8a2a]/60 hover:text-white transition-colors">
              <Cpu className="mx-auto mb-2 h-7 w-7 text-[#ffb347]" />
              {os}
            </a>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-6 rounded-2xl border border-[#ff8a2a]/20 bg-[#120c08] p-6">
          <div>
            <p className="text-lg font-black text-white"><span className="ghc-metal-text-grad">Pick a plan that works for you</span></p>
            <a href="/metal/vps" className="ghc-metal-btn mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-bold">Get started →</a>
          </div>
          <Globe className="hidden h-20 w-20 shrink-0 text-[#ffb347]/40 sm:block" />
        </div>
      </section>

      {/* ─── Benchmark ─── */}
      <section className="border-t border-white/10 py-12">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Improved performance at a lower price point</span></h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              The OVHcloud infrastructure our VPS run on was ranked among the best global cloud servers by VPS Benchmarks, a well-regarded platform that independently tests and ranks VPS plans from various providers using a comprehensive set of criteria. The bottom line is that what sets us apart — and allows us to offer superior value to our customers — is our unmatched price/performance ratio.
            </p>
            <p className="mt-2 text-[10px] text-white/30">VPSBenchmarks, 2025-09-08</p>
          </div>
          <div className="flex justify-center"><Database className="h-28 w-28 text-[#ffb347]/50" /></div>
        </div>
      </section>

      {/* ─── Dev features ─── */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">VPS solutions for developers</span></h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEV_FEATURES.map((f) => (
            <div key={f.t} className="rounded-xl border border-white/10 bg-[#120c08] p-5">
              <f.icon className="h-5 w-5 text-[#ffb347]" />
              <p className="mt-2 text-sm font-black text-white">{f.t}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Stats band ─── */}
      <section className="bg-gradient-to-r from-[#0b1a45] via-[#0f2566] to-[#12308f] py-12 text-center text-white">
        <p className="text-3xl font-black"><span className="ghc-metal-text-grad">100 Tbps</span></p>
        <p className="mt-1 text-sm text-white/60">of global network capacity</p>
        <a href="/metal/vps" className="ghc-metal-btn mt-6 inline-block rounded-lg px-7 py-3 text-sm font-bold"><Zap className="mr-1 inline h-4 w-4" />Deploy your VPS now</a>
      </section>

      <Footer />
    </div>
  );
}
