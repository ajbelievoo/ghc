"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Check, Globe, Settings2, Gauge, Shield, Database } from "lucide-react";

function money(value?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const decimals = ["JPY", "KRW", "IDR", "VND"].includes(cur) ? 0 : 2;
  if (typeof value !== "number") return "Contact us";
  return `${sym}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

export default function MetalMultisitePage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [rec, setRec] = useState<any>(null);

  useEffect(() => {
    api.server.metalVpsPlans()
      .then((p: any[]) => {
        const vps4 = (p || []).find((x: any) => String(x.planCode) === "vps-2027-model4");
        if (vps4) setRec(vps4);
      })
      .catch(() => {});
  }, [currency]);

  const price = (p: any) => {
    const d = (p?.durations || []).find((x: any) => x.durationLabel === "1_month") || p?.durations?.[0];
    return d?.monthlyPrice ?? d?.finalPrice;
  };

  const recSpecs = [
    rec?.cpuCores ? `${rec.cpuCores} vCores` : "8 vCores",
    rec?.ramGb ? `${rec.ramGb} GB RAM` : "24 GB RAM",
    rec?.diskGb ? `${rec.diskGb} GB SSD NVMe` : "200 GB SSD NVMe",
    "Daily backup of the previous 24 hours",
    "Unlimited traffic",
    rec?.bandwidthMbps ? `${Math.round(rec.bandwidthMbps / 1000)} Gbps public bandwidth` : "3 Gbps public bandwidth",
  ];

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="ghc-metal-grid relative overflow-hidden bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="ghc-metal-orb ghc-metal-orb-a -left-24 top-10 h-96 w-96" />
        <div className="ghc-metal-orb ghc-metal-orb-b right-0 top-1/3 h-[28rem] w-[28rem]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-14">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
            <span className="ghc-metal-text-grad">Host a multisite WordPress setup</span>
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            <a href="/" className="hover:underline">Home</a> &gt; <a href="/metal/vps" className="hover:underline">VPS</a> &gt; Host a multisite WordPress setup
          </p>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-[auto_1fr]">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-[#ff8a2a]/30 bg-[#1a0e06]/80 shadow-[0_0_60px_rgba(255,138,42,.25)]">
              <Globe className="h-14 w-14 text-[#ffb347]" />
            </div>
            <div>
              <h1 className="text-3xl font-black md:text-4xl"><span className="ghc-metal-text-grad">What is WordPress multisite?</span></h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">
                Building a great website with a unique domain name is the most important step you can take towards establishing your presence online. There are lots of web hosting solutions available, but WordPress remains one of the most popular businesses of all sizes… and with good reason.
              </p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/70">
                WordPress hosting streamlines the process of designing, launching and managing websites with a wide range of versatile tools, complemented with numerous specialist plug-ins (including content management, SEO and analytics). This means it can be utilised as a site builder for everything from blogs to e-commerce, with all sites included in your hosting package managed from a single, centralised interface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Body ─── */}
      <section className="mx-auto max-w-3xl px-6 py-14 text-white/80">
        <h2 className="text-xl font-black text-white">Why consider hosting your multisite on a virtual private server?</h2>
        <p className="mt-4 text-sm leading-7">
          A virtual private server offers the perfect balance of performance, flexibility and value for money, making it the perfect way to launch your own WordPress multisite setup with minimal costs, while retaining full control of your costs. With a VPS, you get the same flexibility you would have on your own dedicated servers, at a fraction of the price, in order to obtain the highest possible hosting solutions for websites. This way, you can benefit from the control and scalability of a cloud solution, combined with the power of a dedicated hosting solution — with a range of options available to suit any budget.
        </p>
        <p className="mt-4 text-sm leading-7">
          This makes it an ideal solution for growing businesses in all industries, allowing them to launch attractive, highly available websites, with plenty of scope to scale as they evolve.
        </p>

        <h2 className="mt-12 text-lg font-black text-white"><span className="text-[#ffb347]">#1</span> Consider your short- and long-term requirements when evaluating hosting plans</h2>
        <p className="mt-4 text-sm leading-7">
          One of the key advantages of a virtual private server is that you only pay for the exact resources you need for your multisite. This is in contrast to bare metal, where you pay for the entirety of the server's resources, regardless of what you actually use. When planning your multisite, be sure to consider your exact requirements in terms of disk space, storage, vCores — as this will help you make effective use of your available budget and retain full control of your costs.
        </p>
      </section>

      {/* ─── Recommendation band ─── */}
      <section className="bg-gradient-to-r from-[#0b1a45] via-[#0f2566] to-[#12308f] py-12 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-black">Our recommendations</h2>
          <div className="mx-auto mt-8 max-w-xs">
            <div className="rounded-2xl border border-white/20 bg-[#0b1020]/90 p-6 text-center shadow-[0_0_60px_rgba(0,80,215,.3)]">
              <span className="rounded-full bg-[#00b7ff]/20 px-3 py-1 text-[11px] font-bold text-[#00b7ff]">2027</span>
              <p className="mt-3 text-xl font-black">{rec?.displayName || rec?.invoiceName || "Metal VPS-4"}</p>
              <p className="mt-1 text-xs text-white/50">From</p>
              <p className="text-2xl font-black text-[#00b7ff]">{money(price(rec), currency)}</p>
              <p className="text-[11px] text-white/50">exc. GST/month</p>
              <button
                onClick={() => rec && router.push(`/configure?category=VPS&plan=${encodeURIComponent(rec.planCode)}&brand=metal`)}
                className="mt-4 w-full rounded-lg bg-[#0050d7] py-2.5 text-sm font-bold hover:bg-[#0061ff] transition-colors"
              >
                Configure
              </button>
              <ul className="mt-5 space-y-2 text-left text-xs text-white/70">
                {recSpecs.map((s) => (
                  <li key={s} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 shrink-0 text-[#00b7ff]" />{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Steps 2 & 3 ─── */}
      <section className="mx-auto max-w-3xl px-6 py-14 text-white/80">
        <h2 className="text-lg font-black text-white"><span className="text-[#ffb347]">#2</span> Where should your virtual private server be hosted?</h2>
        <p className="mt-4 text-sm leading-7">
          It's important to remember that location is an important part of maximising a website's performance and minimising load times, regardless of whether it is hosted with a physical or virtualised solution. Ideally, your multisite should be hosted as close as possible to where your customers are based, in order to achieve the highest possible availability. Furthermore, consider how you plan to grow in the future, and which countries you plan on expanding into. Can your chosen hosting provider offer a choice of datacentres in which to host your VPS, as well as solutions for securely interconnecting multiple datacentres in different countries, if required later?
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Globe className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">Global locations</p><p className="mt-1 text-xs text-white/50">Datacentres across Europe, North America and Asia-Pacific — pick the closest to your audience.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Gauge className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">Low latency</p><p className="mt-1 text-xs text-white/50">Fast peering and up to 3 Gbps public bandwidth keep every site in your network responsive.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Shield className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">Included anti-DDoS</p><p className="mt-1 text-xs text-white/50">Every Metal VPS ships with always-on attack mitigation at no extra cost.</p></div>
        </div>

        <h2 className="mt-12 text-lg font-black text-white"><span className="text-[#ffb347]">#3</span> What additional tools will you require to manage your multisite?</h2>
        <p className="mt-4 text-sm leading-7">
          One of the key factors in the enduring popularity of WordPress multisite is the number of plug- and play tools it comes with straight out of the box, and the number of professional-quality plug-ins available for it. The GHC VPS range builds on this approach, offering a wide range of pre-installed tools and operating systems, which can be launched in just one click. Consider then, what tools you would prefer to use in your admin day job (such as Joomla, Plesk, or the standard WordPress dashboard, to name a few), and what you will require in terms of content management, blogging, search engine optimisation, and data analytics. You may have a selection of preferred tools you would like to continue using, but if you are in any doubt, consult your hosting provider regarding the available options.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Settings2 className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">Control panels</p><p className="mt-1 text-xs text-white/50">Plesk and cPanel available — manage every site in your multisite network from one interface.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Database className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">Your stack, your way</p><p className="mt-1 text-xs text-white/50">Root access — install Docker, n8n, Nginx, Apache or any database your network needs.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#120c08] p-4"><Check className="h-5 w-5 text-[#ffb347]" /><p className="mt-2 text-xs font-bold text-white">One-click images</p><p className="mt-1 text-xs text-white/50">30+ pre-installed distributions and apps — see <a href="/metal/vps/distributions" className="text-[#ffb347] hover:underline">VPS Distributions</a>.</p></div>
        </div>

        <p className="mt-10 text-[10px] leading-4 text-white/30">
          * For VPS hosted in Sydney and Singapore: 1 TB traffic/month for the VPS range "Starter" and "Value", 2 TB/month for the VPS range "Essential", 3 TB/month for the VPS range "Comfort" and 4 TB/month for the VPS range "Elite". Bandwidth is reduced to 10 Mbps once the monthly quota is exceeded.
        </p>

        <a href="/metal/vps" className="ghc-metal-btn mt-8 inline-block rounded-lg px-7 py-3 text-sm font-bold">Explore the Metal VPS range</a>
      </section>

      <Footer />
    </div>
  );
}
