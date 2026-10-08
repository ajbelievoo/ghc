"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import flavorsData from "@/data/cloudFlavors.json";
import {
  Check, Search, Cloud, Cpu, HardDrive, Network, Database,
  Container, BarChart3, Brain, Boxes, Image as ImageIcon, Archive, Server, Zap,
} from "lucide-react";

const MARGIN = 1.2; // public cloud resale margin

interface Flavor {
  code: string; hour?: number; month?: number;
  memory?: string; vcore?: string; storage?: string;
  "public-network"?: string; "private-network"?: string;
  gpu?: string; "nvme-disks"?: string;
}
interface Family { id: string; tag: string; name: string; desc: string; items: Flavor[] }
const families = flavorsData as unknown as Family[];

const sections = [
  { id: "overview", label: "Overview", icon: Cloud },
  { id: "compute", label: "Virtual Machine Instances", icon: Cpu },
  { id: "gpu", label: "Cloud GPU", icon: Zap },
  { id: "metal", label: "Metal Instances", icon: Server, href: "/dedicated-servers" },
  { id: "backup", label: "Instance Backup", icon: Archive },
  { id: "images", label: "Image Catalogs", icon: ImageIcon },
  { id: "network", label: "Network", icon: Network },
  { id: "storage", label: "Storage", icon: HardDrive, href: "/dedicated-servers/storage" },
  { id: "containers", label: "Containers & Orchestration", icon: Container },
  { id: "databases", label: "Databases", icon: Database },
  { id: "analytics", label: "Analytics & Data Platform", icon: BarChart3 },
  { id: "ai", label: "AI & Machine Learning", icon: Brain },
];

const extraServices = [
  { icon: HardDrive, title: "Object Storage", desc: "S3-compatible object storage, billed per GB stored per hour.", price: "₹0.023/GB-hr" },
  { icon: Database, title: "Block Storage", desc: "High-performance and classic block volumes, attachable to any instance.", price: "₹0.09/GB-mo" },
  { icon: Network, title: "Load Balancer", desc: "L4/L7 load balancing with health checks and anycast entry points.", price: "₹14.40/hr" },
  { icon: Boxes, title: "Private Network", desc: "vRack private networking between instances — unlimited internal traffic.", price: "Included" },
  { icon: Container, title: "Managed Kubernetes", desc: "Managed control plane — free; pay only for worker node instances.", price: "Free control plane" },
  { icon: Database, title: "Managed Databases", desc: "PostgreSQL, MySQL, Redis, MongoDB, Kafka and OpenSearch as a service.", price: "From ₹11/hr" },
];

export default function PublicCloudClient({ initialPlans }: { initialPlans?: any[] }) {
  const { currency } = useCurrency();
  const [section, setSection] = useState("compute");
  const [os, setOs] = useState<"linux" | "windows">("linux");
  const [search, setSearch] = useState("");

  const cur = (currency || "INR").toUpperCase();
  const sym = getCurrencySymbol(cur);
  // Flavor data is published in INR; convert roughly for display when USD selected
  const rate = cur === "INR" ? 1 : cur === "USD" ? 1 / 83.5 : cur === "EUR" ? 1 / 90 : 1;
  const fmt = (v?: number, per = "") =>
    typeof v === "number"
      ? `${sym}${(v * MARGIN * rate).toLocaleString("en-IN", { maximumFractionDigits: v * rate < 10 ? 2 : 0 })}${per}`
      : "—";

  const computeFamilies = families.filter((f) => ["d2", "b3", "c3", "r3", "i1"].includes(f.id));
  const gpuFamilies = families.filter((f) => !["d2", "b3", "c3", "r3", "i1"].includes(f.id));

  const renderTable = (fam: Family) => {
    const items = fam.items.filter((i) => !search || i.code.includes(search.toLowerCase()));
    if (!items.length) return null;
    return (
      <div key={fam.id} className="mb-10">
        <h3 className="text-xl font-black text-[#0f172a] mb-1">{fam.name}</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-3xl">{fam.desc}</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f8faff]">
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Memory</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">vCore</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Storage</th>
                {fam.items.some((i) => i.gpu) && <th className="px-4 py-3 text-xs font-bold text-slate-500">GPU</th>}
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Public network</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Price / hour</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-500">Price / month</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.code} className="border-b border-slate-100 hover:bg-[#f8faff] transition">
                  <td className="px-4 py-3 text-sm font-bold text-[#00b7ff]">{i.code}</td>
                  <td className="px-4 py-3 text-sm text-[#0f172a]">{i.memory}</td>
                  <td className="px-4 py-3 text-sm text-[#0f172a]">{i.vcore}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{i.storage}{i["nvme-disks"] ? ` + ${i["nvme-disks"]} NVMe` : ""}</td>
                  {fam.items.some((x) => x.gpu) && <td className="px-4 py-3 text-xs text-[#0f172a]">{i.gpu || "—"}</td>}
                  <td className="px-4 py-3 text-xs text-slate-500">{i["public-network"]}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#0f172a]">{fmt(i.hour)}/hr</td>
                  <td className="px-4 py-3 text-sm text-slate-500">~{fmt(i.month)}/mo</td>
                  <td className="px-4 py-3">
                    <Link href="/register" className="rounded bg-[#ff3d00] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e63700]">Launch</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Promo banner */}
      <div className="bg-gradient-to-r from-[#fff200] via-[#ffe] to-[#9ff] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-3 flex flex-wrap items-center justify-center gap-3 text-center">
          <p className="text-sm font-bold text-[#0f172a]">Public Cloud: launch your first project today — pay only for what you use, per hour.</p>
          <Link href="/dashboard" className="rounded bg-[#00b7ff] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#009fe0]">Get started</Link>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <p className="text-xs font-bold text-slate-300 mb-2">Public Cloud ▸ Prices</p>
          <h1 className="max-w-3xl text-3xl font-black leading-tight md:text-5xl">Simple, predictable pricing — billed per hour</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-200">Create your project for free, then launch instances in seconds. Hourly billing, no commitment, unlimited traffic.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { t: "Free project", d: "Create a project at no cost — instances billed per hour only while running." },
              { t: "Unbeatable TCO", d: "Consistent performance with transparent pricing and no hidden fees." },
              { t: "Clear pricing", d: "Hourly rates shown below include compute, storage and public bandwidth." },
            ].map((c) => (
              <div key={c.t} className="rounded-lg bg-white/10 backdrop-blur p-4">
                <p className="text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4 text-[#00ff88]" />{c.t}</p>
                <p className="mt-1 text-xs text-slate-300">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 md:grid md:grid-cols-[240px_1fr] md:gap-10">
        {/* Section nav */}
        <aside className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full rounded border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#00b7ff]" />
            </div>
            {sections.map((s) => (
              s.href ? (
                <Link key={s.id} href={s.href} className="block rounded px-3 py-2 text-sm text-slate-600 hover:bg-[#f8faff] hover:text-[#00b7ff] transition">{s.label}</Link>
              ) : (
                <button key={s.id} onClick={() => setSection(s.id)} className={`block w-full rounded px-3 py-2 text-left text-sm transition ${section === s.id ? "bg-[#e8f6ff] text-[#00b7ff] font-bold border-l-2 border-[#00b7ff]" : "text-slate-600 hover:bg-[#f8faff]"}`}>{s.label}</button>
              )
            ))}
          </div>
        </aside>

        {/* Content */}
        <div>
          {section === "overview" && (
            <div>
              <h2 className="text-2xl font-black mb-4">Public Cloud — pay as you go</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {extraServices.map((s) => (
                  <div key={s.title} className="rounded-xl border border-slate-200 p-5 hover:border-[#00b7ff] hover:shadow-md transition">
                    <s.icon className="h-6 w-6 text-[#00b7ff] mb-2" />
                    <p className="font-bold text-[#0f172a]">{s.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                    <p className="mt-2 text-xs font-bold text-[#00b7ff]">{s.price}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-[#e8f6ff] border border-[#00b7ff]/30 p-6 text-center">
                <p className="font-bold text-[#0f172a]">Get up to 30% off your instances with 12 &amp; 24-month Savings Plans.</p>
                <Link href="/support" className="mt-3 inline-block rounded bg-[#00b7ff] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#009fe0]">Discover Savings Plans</Link>
              </div>
            </div>
          )}

          {section === "compute" && (
            <div>
              <div className="mb-6 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-500 uppercase">Location:</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">All regions</span>
                <span className="font-bold text-slate-500 uppercase ml-4">Operating system:</span>
                <button onClick={() => setOs("linux")} className={`rounded-full px-3 py-1 ${os === "linux" ? "bg-[#00b7ff] text-white font-bold" : "bg-slate-100 text-slate-600"}`}>Linux</button>
                <button onClick={() => setOs("windows")} className={`rounded-full px-3 py-1 ${os === "windows" ? "bg-[#00b7ff] text-white font-bold" : "bg-slate-100 text-slate-600"}`}>Windows</button>
                {os === "windows" && <span className="text-slate-400">Windows licence is billed additionally per hour.</span>}
              </div>
              {computeFamilies.map(renderTable)}
            </div>
          )}

          {section === "gpu" && <div>{gpuFamilies.map(renderTable)}</div>}

          {["backup", "images", "network", "containers", "databases", "analytics", "ai"].includes(section) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {extraServices.map((s) => (
                <div key={s.title} className="rounded-xl border border-slate-200 p-5">
                  <s.icon className="h-6 w-6 text-[#00b7ff] mb-2" />
                  <p className="font-bold text-[#0f172a]">{s.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.desc}</p>
                  <p className="mt-2 text-xs font-bold text-[#00b7ff]">{s.price}</p>
                  <Link href="/dashboard" className="mt-3 inline-block text-xs font-bold text-[#00b7ff] hover:underline">Open in console →</Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create project CTA */}
      <section className="border-t border-slate-200 bg-[#f8faff]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <h2 className="text-2xl font-black md:text-3xl">Create a Public Cloud project</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">A project is free to create. Add a payment method, launch instances and pay only for what you use — per hour.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="rounded bg-[#ff3d00] px-8 py-3 text-sm font-bold text-white hover:bg-[#e63700]">Create your project — free</Link>
            <Link href="/support" className="rounded border border-slate-300 bg-white px-8 py-3 text-sm font-bold text-[#0f172a] hover:border-[#00b7ff]">Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
