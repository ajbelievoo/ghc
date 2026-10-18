"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Check, ChevronDown, Gauge, Settings2, Code2, Network, HardDrive, Shield, Server, Handshake } from "lucide-react";

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

const FEATURES = [
  { icon: Gauge, t: "Optimised resources at the best price", d: "Get ample resources without breaking the bank. Our VPS solutions, equipped with next-generation architectures and NVMe storage, guarantee speed and reliability." },
  { icon: Settings2, t: "An isolated, scalable environment", d: "Host your projects in an isolated, flexible environment, and upgrade your configuration in one click via your Control Panel." },
  { icon: Code2, t: "Simplicity and total control", d: "Gain full control over your VPS via root access and the GHC API. Choose and install your preferred distribution, then use tools like Plesk or cPanel to manage your services." },
  { icon: Network, t: "Unlimited traffic", d: "With your VPS server, you get unlimited traffic* and bandwidth of up to 3 Gbps. This is perfect for services that need high throughput, and comes at no extra cost." },
  { icon: HardDrive, t: "Backup options", d: "Your data is protected thanks to the automatic backup included. You can also opt for advanced options, such as Premium backup and snapshots." },
  { icon: Shield, t: "Availability", d: "Backed by a 99.9% SLA, our VPS solutions ensure reliable hosting for your websites, applications and critical projects." },
];

const FAQS = [
  { q: "What is a VPS?", a: "A virtual private server is a virtual machine with dedicated resources (CPU, RAM, NVMe storage) hosted on shared physical infrastructure. It gives you an isolated environment you fully control via root access — ideal for websites, apps, resold hosting and dev environments." },
  { q: "What type of business solutions can a VPS reseller integrate?", a: "Web and application hosting, managed WordPress, game servers, VPNs, dev/test environments, email, SaaS backends and more. With root access and control panels like Plesk or cPanel, a single Metal VPS can power multiple customer sites — or you can resell one VPS per customer." },
  { q: "What is the difference between a VPS and a web hosting plan?", a: "Web hosting is a turnkey, shared-resource product for simple sites. A VPS gives dedicated resources, root access and your choice of OS and software — it needs some server administration knowledge but offers far more control for your customers' projects." },
  { q: "Can I host several websites on an SSD VPS?", a: "Yes — there is no hard limit on the number of sites. Add Plesk or cPanel to manage accounts, domains and mailboxes per customer, and scale the VPS up whenever your consolidated traffic grows." },
  { q: "What are the advantages of a VPS, compared to a dedicated server?", a: "A VPS delivers dedicated resources at a fraction of the cost of bare metal — instant deployment, easy upgrades, no hardware management. Dedicated servers suit workloads that need the full machine; a VPS covers almost everything else." },
  { q: "How do I become a VPS reseller?", a: "Sign up for a GHC account, order Metal VPS servers at our reseller-friendly pricing, and manage everything from the Control Panel or API. Join our Partner Program to unlock dedicated reseller terms and support." },
];

export default function MetalResellerPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [plans, setPlans] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  const configure = (p: any) => router.push(`/configure?category=VPS&plan=${encodeURIComponent(p.planCode)}&brand=metal`);

  return (
    <div className="ghc-metal-bg min-h-screen">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="ghc-metal-grid relative overflow-hidden bg-gradient-to-br from-[#0a0a10] via-[#14090a] to-[#1c0d04] text-white">
        <div className="ghc-metal-orb ghc-metal-orb-a -left-24 top-10 h-96 w-96" />
        <div className="ghc-metal-orb ghc-metal-orb-b right-0 top-1/3 h-[28rem] w-[28rem]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-4 pb-16">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">
            <span className="ghc-metal-text-grad">VPS Reseller</span>
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            <a href="/" className="hover:underline">Home</a> &gt; <a href="/metal/vps" className="hover:underline">VPS</a> &gt; VPS Reseller
          </p>

          <div className="mt-10 grid items-center gap-10 md:grid-cols-2">
            <div>
              <h1 className="text-3xl font-black md:text-4xl"><span className="ghc-metal-text-grad">Explore our solutions for VPS resellers</span></h1>
              <ul className="mt-6 space-y-2.5 text-sm font-semibold text-white/85">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> Scalable, flexible and competitive solutions</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> A range of operating systems to install</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ffb347]" /> Unlimited traffic, up to 3 Gbps bandwidth*</li>
              </ul>
            </div>
            <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-3xl border border-[#ff8a2a]/30 bg-[#1a0e06]/80 shadow-[0_0_80px_rgba(255,138,42,.25)]">
              <Server className="h-24 w-24 text-[#ffb347]" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── All 4 plans ─── */}
      <section className="mx-auto max-w-7xl px-6 py-14 text-white">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((p) => (
            <div key={p.planCode} className="rounded-2xl border border-[#ff8a2a]/20 bg-[#120c08] p-6 text-center hover:border-[#ff8a2a]/50 transition-colors">
              <span className="rounded-full bg-[#00b7ff]/15 px-3 py-1 text-[11px] font-bold text-[#00b7ff]">2027</span>
              <p className="mt-3 text-lg font-black">{(p.displayName || p.invoiceName || "").replace(/^Metal\s/, "")}</p>
              <p className="mt-1 text-xs text-white/50">From</p>
              <p className="text-2xl font-black text-[#ffb347]">{money(price(p), currency)}</p>
              <p className="text-[11px] text-white/50">exc. GST/month</p>
              <button onClick={() => configure(p)} className="mt-4 w-full rounded-lg bg-[#0050d7] py-2.5 text-sm font-bold hover:bg-[#0061ff] transition-colors">Configure</button>
              <ul className="mt-5 space-y-2 text-xs text-white/70">
                <li>{p.cpuCores} vCores</li>
                <li>{p.ramGb} GB RAM</li>
                <li>{p.diskGb} GB SSD NVMe ⓘ</li>
                <li>Daily backup of the previous 24 hours</li>
                <li>Unlimited traffic ⓘ</li>
                <li>{p.bandwidthMbps >= 1000 ? `${p.bandwidthMbps / 1000} Gbps` : `${p.bandwidthMbps} Mbps`} public bandwidth</li>
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Accessible to all your customers ─── */}
      <section className="mx-auto max-w-5xl px-6 pb-6 text-white">
        <h2 className="text-xl font-black"><span className="ghc-metal-text-grad">A virtual private server accessible to all your customers</span></h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
          Built for VPS resellers, these plans help you offer reliable solutions at a competitive price. Our virtual private servers provide outstanding flexibility in terms of how you manage your solution. Your customers can host their websites or applications in a dedicated environment. They also benefit from higher speed, with NVMe SSDs — offering a cost-effective solution for users at all levels.
        </p>
      </section>

      {/* ─── Features ─── */}
      <section className="mx-auto max-w-7xl px-6 pb-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="rounded-xl border border-white/10 bg-[#120c08] p-5">
              <f.icon className="h-5 w-5 text-[#ffb347]" />
              <p className="mt-2 text-sm font-black text-white">{f.t}</p>
              <p className="mt-1 text-xs leading-5 text-white/55">{f.d}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[10px] text-white/30">* Excluding our datacentres in Asia-Pacific.</p>
      </section>

      {/* ─── Partner program ─── */}
      <section className="mx-auto max-w-5xl px-6 pb-14">
        <div className="flex items-center justify-between gap-6 rounded-2xl border border-[#ff8a2a]/20 bg-[#120c08] p-8">
          <div>
            <p className="text-lg font-black text-white"><span className="ghc-metal-text-grad">Become a VPS reseller by joining our Partner Program</span></p>
            <a href="/register" className="mt-3 inline-block text-sm font-bold text-[#ffb347] hover:underline">Find out more</a>
          </div>
          <Handshake className="hidden h-20 w-20 shrink-0 text-[#ffb347]/40 sm:block" />
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="mx-auto max-w-4xl px-6 pb-14">
        <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Your questions answered</span></h2>
        <div className="mt-5 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-[#ffb347] hover:text-white">
                {f.q}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="pb-4 text-sm leading-6 text-white/60">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Solutions adapted + Why choose ─── */}
      <section className="border-t border-white/10 py-12">
        <div className="mx-auto max-w-3xl px-6 text-white/70">
          <h2 className="text-xl font-black text-white"><span className="ghc-metal-text-grad">Solutions adapted to your customers' needs</span></h2>
          <p className="mt-4 text-sm leading-7">
            In addition to our NVMe SSD VPS solutions, you can offer your customers a Cloud VPS. It's a comprehensive virtual server solution: your customers can pair this machine with other cloud solutions to grow their business.
          </p>
          <p className="mt-4 text-sm leading-7">
            Do your customers' projects need more power? With its raw resources, a <a href="/metal/dedicated" className="text-[#ffb347] hover:underline">dedicated server</a> will provide them with the capacity they need.
          </p>

          <h3 className="mt-10 text-lg font-black text-white">Why choose GHC?</h3>
          <p className="mt-3 text-sm leading-7">
            We manage our entire production chain, from server design to datacentre construction. We're constantly innovating to meet your current and future needs. We are present all over the world, so you can launch your projects as close as possible to your customers.
          </p>
          <p className="mt-3 text-sm leading-7">
            Our goal is simple: to help everyone get their projects online. With this in mind, we created our VPS solutions. We have designed them to suit all budgets. From the GHC Control Panel, you can view your invoices and easily manage your resources. We monitor and maintain the infrastructure that your VPS is hosted on, so that you can focus on your core business.
          </p>

          <p className="mt-10 text-[10px] leading-4 text-white/30">
            * Our VPS solutions in the Asia-Pacific region (Mumbai, Singapore, Sydney) come with a set monthly quota: 500 GB for Metal Bolt 1, 1 TB for Metal Bolt 2 and Bolt 3, 2 TB for Metal Bolt 4. Beyond this, the bandwidth is capped at 10 Mbps.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
