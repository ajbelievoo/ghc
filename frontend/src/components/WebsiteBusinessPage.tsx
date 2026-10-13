"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, BadgeDollarSign, ReceiptText, AppWindow, Layers,
  Cloud, Globe, LayoutDashboard, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["Dedicated server or shared hosting — which is right for me?", "Shared hosting is fine for a small site, but business applications need stable resources and management flexibility. A dedicated server gives you the whole machine — root access, your choice of OS and control panel, and performance that does not fluctuate with other tenants."],
  ["Can I host multiple websites on one server?", "Yes. Host multiple websites or applications on a single machine — for yourself or for your customers — using a control panel like cPanel or Plesk, and bill per project with predictable monthly pricing."],
  ["Which control panels are available?", "Deploy cPanel/WHM, Plesk, DirectAdmin or free panels like HestiaCP — installed from our distribution catalogue in a few clicks, or install your own stack manually."],
];

export default function WebsiteBusinessPage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(10);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const rows = useMemo(() => {
    const tagged = plans.filter((p) =>
      String(p.features?.["baremetal-server-usecases"] || "").split(",").map((s: string) => s.trim()).includes("hosting")
    );
    const list = (tagged.length ? tagged : plans).filter((p) => p.isActive !== false);
    return list
      .map((p) => {
        const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
        return { p, d };
      })
      .sort((a, b) => (a.d?.monthlyPrice || 0) - (b.d?.monthlyPrice || 0));
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Website Business Application</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Website Business Applications</p>
          <h1 className="mt-10 text-3xl md:text-4xl font-black leading-tight max-w-3xl">
            Hosting websites and applications on a bare-metal server
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-7 max-w-2xl">
            For larger projects or for technical reasons, hosting an application or website requires a flexible service with the right resources. Whether you are hosting a single website or a multisite infrastructure, a dedicated server is the perfect solution.
          </p>
        </div>
      </section>

      {/* 4 benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Get the best performance for your business applications and websites</h2>
        <p className="mt-3 text-sm text-slate-600 leading-7 max-w-3xl">
          Depending on your project, shared hosting packages can quickly prove to be limiting. Business application and website hosting requires stable resources, and a certain degree of management flexibility. It is important to have the ability to add more services as required — for example, a load balancer or an additional server can handle fluctuations in your activity.
        </p>
        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: BadgeDollarSign, t: "The best price/performance ratio", d: "We offer servers with optimal performance at affordable prices, and zero complexity. We deliver on this because we maintain full control of the server manufacturing chain, including the operation of systems in our datacentres." },
            { icon: ReceiptText, t: "Controlled, predictable costs", d: "Price transparency is a strong advantage of our bare-metal solutions — one fixed monthly price per server, with unlimited traffic on included bandwidth and anti-DDoS protection." },
            { icon: AppWindow, t: "A wide range of software programs and operating systems", d: "The most popular operating systems, distributions and software on the market are available with your dedicated server — choose from a selection of the latest versions of your favourite pre-installed systems from the control panel." },
            { icon: Layers, t: "For one or more projects", d: "With the performance offered by your server and the flexible administration it offers, you can host multiple websites or applications — your own projects, or resell hosting to your customers using cPanel or Plesk." },
          ].map((c, i) => (
            <div key={c.t} className="relative rounded-2xl border border-slate-200 bg-white p-5 pt-8 overflow-hidden hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-emerald-400", "bg-violet-500", "bg-amber-400"][i]}`} />
              <c.icon className="w-8 h-8 text-[#0284c7]" />
              <p className="mt-3 text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Websites & business applications — diagram + description */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center text-[#0f172a]">Websites and business applications</h2>
        <div className="mt-8 rounded-3xl border border-slate-200 bg-sky-50/50 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* CSS diagram */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#0b1020] flex items-center justify-center">
                <Cloud className="w-6 h-6 text-[#00b7ff]" />
              </div>
              <div className="w-px h-5 bg-[#00b7ff]/60" />
              <div className="w-14 h-14 rounded-xl bg-white border-2 border-[#00b7ff]/60 flex items-center justify-center">
                <Globe className="w-6 h-6 text-[#0284c7]" />
              </div>
              <div className="w-px h-5 bg-[#00b7ff]/60" />
              <div className="rounded-xl border-2 border-dashed border-violet-300 bg-white/80 p-3 w-full max-w-xs">
                <p className="text-[9px] font-black text-violet-600 text-center mb-2">Control panel — cPanel &amp; Plesk</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {["Site", "Mail", "DB", "DNS"].map((x) => (
                    <div key={x} className="rounded bg-sky-50 border border-sky-100 p-1.5 text-center">
                      <LayoutDashboard className="w-3.5 h-3.5 text-[#0284c7] mx-auto" />
                      <p className="text-[7px] font-bold text-slate-500 mt-0.5">{x}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <h3 className="text-lg font-black text-[#0f172a]">Description</h3>
              <p className="mt-3 text-xs text-slate-600 leading-6">
                By hosting your website and/or business application on a bare-metal server from GHC, you can get guaranteed access to an environment with dedicated resources.
              </p>
              <p className="mt-3 text-xs text-slate-600 leading-6">
                In just a few minutes, deploy your choice of operating system and distribution, as well as your cPanel or Plesk control panel. A dedicated server offers a high degree of flexibility — if you want to install an open-source solution or an application developed by your teams, root access enables you to get full control of the machine.
              </p>
              <p className="mt-4 text-xs font-black text-[#0f172a] uppercase tracking-wide">Options and services included</p>
              <ul className="mt-2.5 space-y-1.5">
                {[
                  "A range of RAM and storage options",
                  "Unlimited public and private bandwidth",
                  "500 GB external storage space",
                  "Anti-DDoS protection on all servers",
                ].map((o) => (
                  <li key={o} className="flex items-start gap-2 text-xs text-slate-600"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{o}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Server table */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Our dedicated servers for hosting websites and applications</h2>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rows.slice(0, visible).map(({ p, d }) => {
              const cur = d?.currency || p.currency || "USD";
              return (
                <div key={p.planCode} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 hover:bg-sky-50/50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#0f172a] uppercase truncate">{(p.invoiceName || p.planCode).split("|")[0].trim()}</p>
                      {!!p.features?.["last-generation"] && <span className="rounded-full bg-violet-100 text-violet-700 px-2 py-0.5 text-[9px] font-black uppercase shrink-0">New gen</span>}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-5 shrink-0 text-[11px] text-slate-500">
                    {!!p.cpuCores && <span>{p.cpuCores}c</span>}
                    {!!p.ramGb && <span>{p.ramGb} GB</span>}
                    {!!p.diskGb && <span>{p.diskGb >= 1000 ? `${(p.diskGb / 1000).toFixed(0)} TB` : `${p.diskGb} GB`} {p.diskType || ""}</span>}
                    {d && <p className="text-sm font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}<span className="text-[10px] font-normal text-slate-400">/mo</span></p>}
                    <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63700]">Configure</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {rows.length > visible && (
          <div className="mt-5 text-center">
            <button onClick={() => setVisible((v) => v + 10)} className="text-xs font-bold text-[#0284c7] hover:underline">Show more servers →</button>
          </div>
        )}
      </section>

      {/* Quote banner */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/60 py-10 px-6 text-center">
          <p className="text-3xl text-[#0284c7] font-serif">“</p>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 italic leading-7">
            We have not found anything that can compare to GHC's range of solutions, especially for the price. We are able to pick global locations for our servers through the control panel and deploy powerful, customisable dedicated servers with anti-DDoS protection quickly.
          </p>
          <p className="mt-4 text-xs font-black text-[#0f172a]">Hosting provider customer</p>
          <p className="text-[11px] text-slate-400">Founder &amp; CEO</p>
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
