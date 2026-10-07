"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Database, Globe, Shield, Cpu, HardDrive, Server, Layers, Code, Box, Terminal, FileCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = ["All", "CMS", "Panels", "Databases", "DevOps", "Security"];

const apps = [
  { name: "WordPress", icon: FileCode, category: "CMS", desc: "World's most popular CMS. One-click install with pre-optimized PHP and MariaDB.", deployHref: "/web-hosting", deployLabel: "Deploy on Web Hosting" },
  { name: "cPanel", icon: Server, category: "Panels", desc: "Industry-leading web hosting control panel for shared and reseller hosting.", deployHref: "/web-hosting", deployLabel: "Deploy on Web Hosting" },
  { name: "Plesk", icon: Layers, category: "Panels", desc: "Powerful and secure hosting control panel with built-in WordPress toolkit.", deployHref: "/web-hosting", deployLabel: "Deploy on Web Hosting" },
  { name: "n8n", icon: Cpu, category: "DevOps", desc: "Open-source workflow automation. Self-host your integrations with no limits.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "Docker", icon: Box, category: "DevOps", desc: "Container runtime pre-installed. Deploy microservices and apps instantly.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "MySQL", icon: Database, category: "Databases", desc: "Reliable relational database for web apps and CMS platforms.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "PostgreSQL", icon: Database, category: "Databases", desc: "Advanced open-source database with excellent performance and reliability.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "Redis", icon: Database, category: "Databases", desc: "In-memory data store for caching, queues and real-time features.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "Node.js", icon: Code, category: "DevOps", desc: "JavaScript runtime pre-configured for modern backend applications.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "PHP", icon: Code, category: "DevOps", desc: "PHP-FPM with multiple version support, OPcache and Composer ready.", deployHref: "/vps", deployLabel: "Deploy on VPS" },
  { name: "Let's Encrypt SSL", icon: Shield, category: "Security", desc: "Free automatic SSL certificates for every domain.", deployHref: "/domain", deployLabel: "Add to a Domain" },
  { name: "Cloudflare DNS", icon: Globe, category: "Security", desc: "One-click Cloudflare nameserver integration for global CDN and DDoS.", deployHref: "/domain", deployLabel: "Configure DNS" },
];

export default function AppsPage() {
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = apps.filter((a) => {
    const matchesCategory = active === "All" || a.category === active;
    const matchesQuery = a.name.toLowerCase().includes(query.toLowerCase()) || a.desc.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-24 pt-16 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-3xl font-black md:text-5xl">One-Click App Marketplace</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Deploy popular CMS, panels, databases and DevOps tools pre-configured on GHC VPS and dedicated servers.
            </p>
            <div className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <Search className="h-5 w-5 text-blue-200" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search apps..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-blue-200 outline-none"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-12 max-w-7xl px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                onClick={() => setActive(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                    active === c
                      ? "bg-[#0f0c29] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00b7ff]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <div
                  key={a.name}
                  className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-[#00b7ff] hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#0f0c29] text-white">
                    <a.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#0f172a]">{a.name}</h3>
                  <span className="mt-1 w-fit rounded-full bg-[#00b7ff]/10 px-2.5 py-0.5 text-xs font-bold text-[#0f172a]">
                    {a.category}
                  </span>
                  <p className="mt-3 flex-1 text-sm text-slate-500">{a.desc}</p>
                  <Link
                    href={a.deployHref}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00b7ff] hover:underline"
                  >
                    {a.deployLabel} <Terminal className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <HardDrive className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 font-bold">No apps found.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="text-2xl font-black text-[#0f172a]">Need a custom stack?</h2>
          <p className="mt-3 text-slate-500">
            Choose a VPS or dedicated server and install any OS or panel you need.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/vps"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f0c29] px-6 py-3 font-bold text-white transition hover:bg-[#302b63]"
            >
              Browse VPS Plans
            </Link>
            <Link
              href="/dedicated-servers"
              className="inline-flex items-center gap-2 rounded-lg border border-[#00b7ff] px-6 py-3 font-bold text-[#00b7ff] transition hover:bg-[#0f0c29] hover:text-white"
            >
              Dedicated Servers
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
