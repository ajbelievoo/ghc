"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Check, ArrowRight, Globe, Gamepad2, Blocks, TrendingUp, FlaskConical, LayoutPanelTop, AppWindow, Database } from "lucide-react";

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

const USE_CARDS = [
  { icon: Globe, t: "Host a WordPress multisite installation", d: "Easily launch and manage your own ideal multisite environment in the cloud at the best possible price.", href: "/metal/vps/multisite" },
  { icon: Gamepad2, t: "Host video games on a Gaming VPS", d: "Host your online games on a VPS. Virtual private servers are the perfect solution for hosting the most popular video games.", href: "/metal/vps" },
  { icon: Blocks, t: "Host Minecraft on a GHC VPS", d: "Are you looking for a scalable and secure hosting solution for one of the most popular online games in the world? Choose the GHC VPS, ideal for both gamers and hosting professionals.", href: "/metal/vps" },
  { icon: TrendingUp, t: "Host trading applications on a Forex VPS", d: "Host your Forex trading applications in a stable, high-performance environment.", href: "/metal/vps" },
  { icon: FlaskConical, t: "Deploy a sandbox VPS", d: "In just a few seconds, deploy a flexible virtual sandbox environment to accelerate the path from concept to production. The VPS offers a flexible, cost-effective, and secure service ideal for your development and testing phases.", href: "/metal/vps/developers" },
  { icon: LayoutPanelTop, t: "Web hosting", d: "Host your websites on a flexible, high-powered VPS, with dedicated resources and high availability to deliver fast load times and a smooth user experience.", href: "/metal/vps" },
  { icon: AppWindow, t: "Software hosting", d: "Deploy your applications on a secure, scalable VPS, with configurations tailored to your business development and usage.", href: "/metal/vps/distributions" },
  { icon: Database, t: "Database hosting", d: "Store and manage your databases on our fast and reliable VPS, designed to scale and adapt to the most demanding workloads.", href: "/metal/vps" },
];

export default function MetalUsesPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    api.server.metalVpsPlans()
      .then((p: any[]) => {
        const base = (p || [])
          .filter((x: any) => String(x.planCode).startsWith("vps-2027") && !/\.lz$/i.test(String(x.planCode)) && price(x) != null)
          .sort((a: any, b: any) => price(a) - price(b));
        setPlans(base);
      })
      .catch(() => {});
  }, [currency]);

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="mx-auto max-w-7xl px-6 pt-4 pb-14 text-center">
          <p className="text-left text-[11px] font-bold uppercase tracking-wider text-white/60"><span className="ghc-metal-text-grad">VPS uses</span></p>
          <p className="mt-1 text-left text-[11px] text-white/40"><a href="/" className="hover:underline">Home</a> &gt; <a href="/metal/vps" className="hover:underline">VPS</a> &gt; VPS uses</p>
          <h1 className="mt-10 text-3xl font-black md:text-4xl"><span className="ghc-metal-text-grad">See the uses for a VPS</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/70">
            Every day, GHC solutions help you complete your projects, no matter what their scale. With our VPS usage examples, find out how our virtual private server solutions can help you host websites and cloud applications.
          </p>
        </div>
      </section>

      {/* ─── Use-case cards ─── */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {USE_CARDS.map((c) => (
            <a key={c.t} href={c.href} className="group rounded-xl border border-white/10 bg-[#120c08] hover:border-[#ff8a2a]/50 transition-colors">
              <div className="flex h-32 items-center justify-center rounded-t-xl bg-gradient-to-br from-[#0b1a45] via-[#0f2566] to-[#12308f]">
                <c.icon className="h-14 w-14 text-[#ffb347]" />
              </div>
              <div className="p-5">
                <p className="text-sm font-black text-white">{c.t}</p>
                <p className="mt-2 text-xs leading-5 text-white/55">{c.d}</p>
                <span className="mt-4 flex items-center gap-1 text-xs font-bold text-[#ffb347] group-hover:underline">Find out more <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ─── VPS range ─── */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Our VPS Range</span></h2>
        <p className="mt-1 text-sm text-white/60">Choose the configuration that fits your needs — web hosting, gaming, development and more.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.planCode} className="rounded-2xl border border-[#ff8a2a]/20 bg-[#120c08] p-6 text-center hover:border-[#ff8a2a]/50 transition-colors text-white">
              <span className="rounded-full bg-[#00b7ff]/15 px-3 py-1 text-[11px] font-bold text-[#00b7ff]">2027</span>
              <p className="mt-3 text-lg font-black">{(p.displayName || p.invoiceName || "").replace(/^Metal\s/, "")}</p>
              <p className="mt-1 text-xs text-white/50">From</p>
              <p className="text-2xl font-black text-[#ffb347]">{money(price(p), currency)}</p>
              <p className="text-[11px] text-white/50">exc. GST/month · Installation fees: <b className="text-white/70">Free</b></p>
              <button onClick={() => router.push(`/configure?category=VPS&plan=${encodeURIComponent(p.planCode)}&brand=metal`)} className="mt-4 w-full rounded-lg bg-[#0050d7] py-2.5 text-sm font-bold hover:bg-[#0061ff] transition-colors">Configure</button>
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-left text-xs text-white/70">
                {[`${p.cpuCores} vCores`, `${p.ramGb} GB RAM`, `${p.diskGb} GB SSD NVMe ⓘ`, "Daily backup of the previous 24 hours", "Unlimited traffic ⓘ", `${p.bandwidthMbps >= 1000 ? `${p.bandwidthMbps / 1000} Gbps` : `${p.bandwidthMbps} Mbps`} public bandwidth`].map((s) => (
                  <li key={s} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-[#ffb347]" />{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Uses copy ─── */}
      <section className="mx-auto max-w-4xl px-6 pb-16 text-white/70">
        <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Uses for GHC VPS solutions</span></h2>
        <p className="mt-4 text-sm leading-7">
          Our VPS solutions can be used for a wide range of purposes, across a variety of different industries. Whether you are looking to host your business website, online store, or launch cloud projects with flexible servers, the VPS range responds to all your needs. We have listed several different uses for GHC VPS solutions, from the most common to the most specific types. Want to deploy a server with a test environment, and switch it from pre-production to production in no time at all? Looking to launch your WordPress websites with the multi-site option, or create an online video gaming server? Our range of VPS servers are designed to suit a wide range of needs, and are easy to set up, offering unparalleled flexibility.
        </p>
        <p className="mt-4 text-sm leading-7">
          These different use types, complemented by advice from our solution experts, will give you everything you need by providing information on the best solutions for you. This will help you ensure that your project is a success.
        </p>
        <p className="mt-4 text-sm leading-7">
          GHC virtual private servers offer outstanding performance at low prices, with no compromises. Choose from a wide range that combines simplicity, scalability, customisation and full autonomy in terms of how you manage your server.
        </p>
      </section>

      <Footer />
    </div>
  );
}
