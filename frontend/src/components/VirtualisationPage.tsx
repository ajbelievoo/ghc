"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronDown, Server, Network, Globe, CloudCog, ArrowRight,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const FAQS: [string, string][] = [
  ["Which hypervisors can I install?", "Any hypervisor you like — you have full root access. Popular choices include Proxmox VE, VMware ESXi, Microsoft Hyper-V, Citrix XenServer and Linux KVM, plus orchestration tools like Kubernetes and OpenShift for containers."],
  ["Is a private network included?", "Yes. Our private network (vRack) lets you connect servers across datacentres in an isolated layer-2 network — ideal for cluster traffic, storage replication and VM migration between hosts."],
  ["How many VMs can I run per server?", "It depends on the CPU cores and RAM you choose. Virtualisation-dedicated servers typically offer 12–64+ cores and up to 1.5 TB of RAM, so a single host can comfortably run dozens of virtual machines."],
];

export default function VirtualisationPage({ plans }: { plans: any[] }) {
  const router = useRouter();
  const { currency } = useCurrency();
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const [visible, setVisible] = useState(8);
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  const virtPlans = useMemo(() => {
    const tagged = plans.filter((p) =>
      String(p.features?.["baremetal-server-usecases"] || "").includes("virtualisation-containerisation-orchestration")
    );
    const list = (tagged.length ? tagged : plans).filter((p) => p.isActive !== false);
    const groups = new Map<string, { p: any; d: any; locations: number; isRegional: boolean }>();
    for (const p of list) {
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      if (!d) continue;
      const key = String(p.planCode || "").split("-").slice(0, 2).join("-");
      const isRegional = /-(syd|mum|sgp|waw|gra|rbx|sbg|bhs|lon|eri|lim|par)$/i.test(String(p.planCode));
      const prev = groups.get(key);
      if (!prev || (prev.isRegional && !isRegional) || (prev.isRegional === isRegional && d.monthlyPrice < prev.d.monthlyPrice)) {
        groups.set(key, { p, d, locations: (prev?.locations || 0) + 1, isRegional });
      } else {
        prev.locations += 1;
      }
    }
    return Array.from(groups.values()).sort((a, b) => a.d.monthlyPrice - b.d.monthlyPrice);
  }, [plans]);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">Virtualisation, Containerisation &amp; Orchestration</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/" className="hover:underline">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline">Dedicated servers</a> &gt; Virtualisation, containerisation &amp; orchestration</p>
          <h1 className="mt-10 text-3xl md:text-4xl font-black leading-tight max-w-3xl">
            Virtualisation, containerisation and orchestration on a bare-metal dedicated server
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-7 max-w-2xl">
            There are many advantages to virtualisation and containerisation when it comes to deploying projects and applications: flexibility, isolation, optimised software and hardware resources, and long-term flexibility. Our dedicated servers offer flexibility and efficiency with raw resources, leaving you to choose your virtualisation and containerisation applications.
          </p>
        </div>
      </section>

      {/* Maintain control + benefits */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl md:text-2xl font-black text-[#0f172a]">Maintain control of your technical platform</h2>
        <p className="mt-3 text-sm text-slate-600 leading-7 max-w-3xl">
          Install your infrastructure on dedicated servers you can customise, with the most popular software on the market: Linux KVM, Microsoft Hyper-V, Citrix XenServer, VMware ESXi, Proxmox VE and OpenStack. In terms of containerisation and orchestration, deploy your own Kubernetes or other tools, and fully control your IT system.
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-7 max-w-3xl">
          Our servers are designed to be scalable, with easy configuration options and lots of room. They meet all your container and daily needs.
        </p>
        <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Server, t: "A wide range of servers", d: "Choose the server range that fits your virtualisation needs — RAM-dense for VDI, core-dense for containers, storage-heavy for private clouds." },
            { icon: Network, t: "Private network included", d: "Our dedicated private network links your servers across datacentres. Create your cluster and migrate workloads securely." },
            { icon: Globe, t: "A global infrastructure", d: "Deploy clusters close to your users, spread nodes across regions and scale geographically as your platform grows." },
            { icon: CloudCog, t: "GHC cloud solutions", d: "Build on open, reversible standards — combine dedicated servers with our cloud services for a complete hybrid platform." },
          ].map((c, i) => (
            <div key={c.t} className="relative rounded-2xl border border-slate-200 bg-white p-5 pt-8 overflow-hidden hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-emerald-400", "bg-amber-400"][i]}`} />
              <c.icon className="w-8 h-8 text-[#0284c7]" />
              <p className="mt-3 text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs: Virtualisation / Containerisation */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-14">
        <div className="flex justify-center">
          <div className="inline-flex gap-1.5 rounded-full border border-slate-200 bg-slate-50 p-1.5">
            {["Virtualisation", "Containerisation"].map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`rounded-full px-6 py-2 text-xs font-bold transition ${tab === i ? "bg-[#0b1020] text-white shadow" : "text-slate-500 hover:text-[#0f172a]"}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-sky-50/50 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            {/* CSS diagram */}
            <div className="flex justify-center">
              {tab === 0 ? (
                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((h) => (
                      <div key={h} className="rounded-lg border-2 border-[#00b7ff]/60 bg-white p-2 space-y-1.5">
                        {[1, 2].map((v) => (
                          <div key={v} className="rounded border border-violet-300 bg-violet-50 p-1.5 text-center">
                            <p className="text-[8px] font-black text-violet-700">App</p>
                            <p className="text-[7px] text-violet-400">Bins/Libs · Guest OS</p>
                          </div>
                        ))}
                        <p className="text-[8px] font-bold text-center text-[#0284c7] bg-sky-50 rounded py-0.5">Hypervisor</p>
                        <p className="text-[8px] text-center text-slate-400">Local storage</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/60 p-2 text-center">
                    <p className="text-[9px] font-black text-emerald-700">Shared storage · NSX SDN</p>
                    <p className="text-[8px] text-emerald-500">Private &amp; public clusters — network fabric</p>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-xs">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <div key={c} className="rounded border border-[#00b7ff]/50 bg-white p-1.5 text-center">
                        <p className="text-[8px] font-black text-[#0284c7]">App {c}</p>
                        <p className="text-[7px] text-slate-400">Bins/Libs</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 rounded border-2 border-violet-300 bg-violet-50 p-1.5 text-center">
                    <p className="text-[9px] font-bold text-violet-700">Container engine · orchestration (Kubernetes)</p>
                  </div>
                  <div className="mt-1.5 rounded border border-slate-300 bg-slate-50 p-1.5 text-center">
                    <p className="text-[9px] font-bold text-slate-600">Host OS — bare-metal dedicated server</p>
                  </div>
                </div>
              )}
            </div>
            {/* Description */}
            <div>
              <h3 className="text-lg font-black text-[#0f172a]">{tab === 0 ? "Virtualisation" : "Containerisation"}</h3>
              <p className="mt-3 text-xs text-slate-600 leading-6">
                {tab === 0
                  ? "With dedicated servers, you can harness the advantages of virtualisation and get the most out of your resources. On hypervisor hosts, you can create many virtual machines which you can deploy in production, using well-known platforms (VMware vSphere, Proxmox VE, KVM). The virtual machines get dedicated resources from the physical machine's performance — you get all the advantages of the cloud: performance, resilience and cost control."
                  : "Containers package an application with its dependencies so it runs identically anywhere. On bare metal, containers start in milliseconds with zero hypervisor overhead. Pair them with an orchestrator (Kubernetes, OpenShift, Docker Swarm) to schedule workloads, self-heal failures and scale automatically across your cluster."}
              </p>
              <p className="mt-4 text-xs font-black text-[#0f172a] uppercase tracking-wide">Options and services included</p>
              <ul className="mt-2.5 space-y-1.5">
                {[
                  "Up to 500 GB storage space on backup storage",
                  "500 Mbps public bandwidth, guaranteed and unlimited",
                  "Private bandwidth on vRack — up to 25 Gbps on high-end servers",
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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Deploy on our dedicated servers</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">Servers tagged for virtualisation, containerisation and orchestration — grouped by model, real OVH-backed specs.</p>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px] text-xs">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-5 py-3 font-black text-slate-500">Name</th>
                <th className="px-4 py-3 font-black text-slate-500">Processor</th>
                <th className="px-4 py-3 font-black text-slate-500">Memory</th>
                <th className="px-4 py-3 font-black text-slate-500">Storage</th>
                <th className="px-4 py-3 font-black text-slate-500">Bandwidth</th>
                <th className="px-4 py-3 font-black text-slate-500 text-right">Price</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {virtPlans.slice(0, visible).map(({ p, d, locations }: any) => {
                const cur = d?.currency || p.currency || "USD";
                const spec = p.spec || {};
                const name = p.displayName || (p.invoiceName || p.planCode).split("|")[0].trim();
                return (
                  <tr key={p.planCode} className="hover:bg-sky-50/50 transition-colors">
                    <td className="px-5 py-3.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-[#0f172a]">{name}</span>
                      </div>
                      {locations > 1 && <p className="mt-0.5 text-[10px] text-slate-400">{locations} locations</p>}
                    </td>
                    <td className="px-4 py-3.5 align-top text-slate-500">{spec.cpu || p.description || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.ram || (p.ramGb ? `${p.ramGb} GB` : "—")}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.storage || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-slate-500 whitespace-nowrap">{spec.bandwidth || "—"}</td>
                    <td className="px-4 py-3.5 align-top text-right whitespace-nowrap">
                      <span className="text-sm font-black text-[#0f172a]">{sym(cur)}{d.monthlyPrice.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                      <span className="text-[10px] font-normal text-slate-400">/mo</span>
                    </td>
                    <td className="px-5 py-3.5 align-top text-right">
                      <button onClick={() => router.push(`/configure?category=DEDICATED&plan=${encodeURIComponent(p.planCode)}`)} className="rounded-lg bg-[#ff3d00] px-4 py-2 text-xs font-bold text-white hover:bg-[#e63700] whitespace-nowrap">Configure</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {virtPlans.length > visible && (
          <div className="mt-5 text-center">
            <a href="/dedicated-servers/prices?use_cases=virtualisation-containerisation-orchestration" className="inline-block rounded-lg bg-[#0050d7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0043b3]">Show more servers ({virtPlans.length - visible}) →</a>
          </div>
        )}
      </section>

      {/* Recommended ranges */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Find out more about our recommended ranges for this use case</h2>
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { t: "Core", d: "Power and reliability for common workloads — versatile hosts for small and mid-size clusters.", href: "/dedicated-servers/advance" },
            { t: "Flex", d: "Compute power for the most demanding workloads — dense cores and memory for large clusters.", href: "/dedicated-servers/scale" },
            { t: "Elite", d: "High resilience for critical workloads — top-spec hosts for production platforms.", href: "/dedicated-servers" },
          ].map((r, i) => (
            <a key={r.t} href={r.href} className="group relative rounded-2xl border border-slate-200 bg-white p-6 pt-8 overflow-hidden hover:border-[#0284c7] hover:shadow-lg transition-all">
              <span className={`absolute top-0 left-0 right-0 h-1.5 ${["bg-[#00b7ff]", "bg-violet-500", "bg-[#0b1020]"][i]}`} />
              <p className="text-base font-black text-[#0f172a] group-hover:text-[#0284c7]">{r.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{r.d}</p>
              <p className="mt-4 text-xs font-bold text-[#0284c7] flex items-center gap-1">Discover {r.t} <ArrowRight className="w-3.5 h-3.5" /></p>
            </a>
          ))}
        </div>
      </section>

      {/* Deployment patterns (case-study style) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">Customer deployment patterns</h2>
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { t: "SaaS provider", d: "A software vendor runs a scalable, highly available virtualisation platform on bare metal, migrating VMs between hosts during maintenance windows.", tags: ["High availability", "Scalability", "Virtualisation"] },
            { t: "Media streaming platform", d: "A streaming service moved to a tailored Kubernetes cluster on dedicated servers — cutting costs and responding faster to traffic spikes.", tags: ["High availability", "Virtualisation"] },
            { t: "Agency & hosting reseller", d: "An agency pools powerful, high-availability infrastructure to host hundreds of client sites across isolated containers and VMs.", tags: ["Security & Compliance", "Scalability", "High availability"] },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg transition-all">
              <p className="text-sm font-black text-[#0f172a]">{c.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{c.d}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-semibold text-[#0284c7]">{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What is server virtualisation */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-[#0f172a]">What is server virtualisation?</h2>
        <p className="mt-4 text-sm text-slate-600 leading-7">
          Server virtualisation involves creating one or more virtual machines from a server's physical infrastructure using a software layer called a hypervisor. With a physical server, you can deploy as many virtual servers as you need — the virtual servers share the resources of the physical server, which are distributed using management software. You can then optimise the use of a server's resources by allocating them as needed, to avoid provisioning additional servers.
        </p>
        <p className="mt-3 text-sm text-slate-600 leading-7">
          A server virtualisation infrastructure has many other uses too. For example, you can use it to create your own cloud. By using a hypervisor to manage the infrastructure, you get more flexibility — and you can easily add more physical or virtual servers and resources to your public, hybrid or private cloud.
        </p>
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
