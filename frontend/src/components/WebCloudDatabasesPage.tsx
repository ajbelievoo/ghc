"use client";

import { useState } from "react";
import {
  Check, ChevronDown, Database, ShieldCheck, Layers, Save, Cpu,
  Network, Settings, Code2, FileText, Infinity as InfinityIcon, GitBranch,
} from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { PlanGrid } from "./HostingRangePage";

const SERVICES = [
  { icon: Database, t: "Managed database", d: "You create your databases, we take care of the rest. With GHC cloud, you get guaranteed simplicity, flexibility and performance. Get a fully managed DBaaS solution that is always available, monitored 24/7, and kept up-to-date with security patches." },
  { icon: InfinityIcon, t: "Unlimited databases", d: "Create as many databases as you want, on your own allocated storage space." },
  { icon: GitBranch, t: "Available engines and lifecycle", d: "Choose from the most popular solutions: MySQL (Percona Server), MariaDB, PostgreSQL and Valkey. We apply minor upgrades automatically, and make major upgrades available. Follow our end-of-sale and end-of-life announcements." },
  { icon: Save, t: "Automatic backup", d: "Automatic backups of all your databases are taken daily. You can find them easily in the GHC Control Panel, where they can be restored or downloaded." },
  { icon: Cpu, t: "512MB to 4GB of RAM guaranteed", d: "Your server's RAM is guaranteed for better performance. Data can be pre-loaded, which makes it more readily available than reading it straight from a hard drive." },
  { icon: ShieldCheck, t: "Access management by IP address", d: "Give access to your service via the public network by authorising the IP addresses of your choice. You can also enable access to all GHC cloud web hosting plans separately." },
  { icon: Network, t: "Incoming and outgoing traffic included", d: "Ingress and egress traffic are included. You can use your databases without any extra costs, all at an affordable price." },
  { icon: Settings, t: "Configuration and logs", d: "Configure your database server settings directly from the GHC Control Panel. Logs enable users to identify slow queries, so you can optimise your tables and requests." },
];

const FAQS: [string, string][] = [
  ["What is a database?", "A database is an organised collection of data your applications read and write — products, users, orders, content. Every CMS (WordPress, PrestaShop, Drupal) needs one."],
  ["What database management systems are available?", "MySQL (Percona Server), MariaDB, PostgreSQL and Valkey (Redis-compatible key-value store)."],
  ["What versions are available?", "Multiple major versions per engine, with minor upgrades applied automatically and major upgrades made available — you choose when to upgrade."],
  ["What are the differences between an SQL database and a NoSQL database?", "SQL databases (MySQL, MariaDB, PostgreSQL) store structured relational data and are what CMSs use. NoSQL/key-value stores (Valkey) are ideal for caching, sessions and queues."],
  ["Why choose a Web Cloud Databases solution?", "Guaranteed RAM, automatic backups, private-network access from your hosting, IP-based access control and configuration via the control panel — more resources than the shared SQL included with hosting."],
  ["How do I get started?", "Order a Web Cloud Database instance, create your databases and users in the control panel, authorise your hosting IPs, and connect your application with the provided host and credentials."],
];

const ENGINES = [
  { name: "MySQL (Percona)", d: "The world's most popular open-source relational engine — the default for WordPress, Joomla and most CMS workloads. Percona build for extra performance tooling.", tag: "Most popular" },
  { name: "MariaDB", d: "Drop-in MySQL replacement with faster replication and a fully community-driven roadmap. Great for Drupal and custom apps.", tag: "MySQL-compatible" },
  { name: "PostgreSQL", d: "Advanced relational engine with JSONB, powerful indexing and strict data integrity — preferred for SaaS and analytics-heavy apps.", tag: "Advanced SQL" },
  { name: "Valkey", d: "Redis-compatible in-memory key-value store. Use it for caching, sessions, queues and real-time features alongside your SQL databases.", tag: "NoSQL / cache" },
];

export default function WebCloudDatabasesPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [engine, setEngine] = useState(0);
  const hostingPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — blue band + price card */}
      <section className="bg-gradient-to-br from-[#0b1020] via-[#101d42] to-[#14307c] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-14">
          <p className="text-xs text-white/70">SQL and NoSQL database hosting service</p>
          <p className="mt-1 text-[11px] text-white/50"><a href="/web-hosting" className="hover:underline">Web hosting</a> &gt; SQL and NoSQL database hosting service</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
            <div className="md:col-span-2">
              <h1 className="text-3xl md:text-4xl font-black leading-tight">Add a new dimension to your web applications through powerful, affordable database services with guaranteed resources</h1>
              <p className="mt-5 text-sm text-white/85 leading-7">
                Including MySQL (Percona Server), MariaDB, PostgreSQL and Valkey.<br />
                Built on a cloud infrastructure, our database instances are fully managed and secure — so you get excellent performance and total configuration flexibility.
                Group all your databases in one place, and adapt your resources to suit your growth. The service can be accessed via the public network, and is also compatible with your GHC cloud web hosting services.
              </p>
            </div>
            <div className="rounded-xl border-2 border-white/70 p-6 text-center">
              <p className="text-xs font-black tracking-widest uppercase">Web Cloud Databases</p>
              <p className="mt-3 text-3xl font-black">From<br />₹499<span className="text-sm font-bold text-white/70"> ex. taxes/mo</span></p>
              <p className="mt-1 text-[11px] text-white/60">512 MB of RAM, 8 GB of storage</p>
              <a href="/web-hosting" className="mt-4 inline-block w-full rounded-lg border border-white px-4 py-2.5 text-sm font-bold hover:bg-white/10">Order now</a>
              <p className="mt-3 text-[10px] text-white/60 leading-4">Ultra-fast NVMe SSD storage<br />Guaranteed RAM<br />Backups included<br />Updates included</p>
            </div>
          </div>
        </div>
      </section>

      {/* Engine picker — tabs */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-14">
        <h2 className="text-xl font-black text-[#0f172a]">Pick your engine</h2>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-200">
            {ENGINES.map((e, i) => (
              <button
                key={e.name}
                onClick={() => setEngine(i)}
                className={`px-4 py-5 text-left transition ${engine === i ? "bg-[#0b1020] text-white" : "hover:bg-slate-50"}`}
              >
                <p className={`text-sm font-bold ${engine === i ? "text-white" : "text-[#0f172a]"}`}>{e.name}</p>
                <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${engine === i ? "text-[#00b7ff]" : "text-[#0284c7]"}`}>{e.tag}</p>
              </button>
            ))}
          </div>
          <div className="p-6 md:p-8 border-t border-slate-200 bg-slate-50">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0b1020]">
                <Database className="w-5 h-5 text-[#00b7ff]" />
              </div>
              <div>
                <p className="text-sm font-black text-[#0f172a]">{ENGINES[engine].name}</p>
                <p className="mt-1.5 text-sm text-slate-600 leading-7 max-w-3xl">{ENGINES[engine].d}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services included — icon-left rows */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Services included with your Web Cloud Databases</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SERVICES.map((s) => (
            <div key={s.t} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-[#0284c7] transition-colors">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 border border-sky-100">
                <s.icon className="w-5 h-5 text-[#0284c7]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{s.t}</p>
                <p className="mt-1.5 text-xs text-slate-500 leading-5">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hosting plans integrate */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-center text-xl md:text-2xl font-black text-[#0f172a]">All of our hosting solutions integrate seamlessly with our Web Cloud Databases service.</h2>
        <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="business" />
      </section>

      {/* Why Cloud DB — 3 cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h2 className="text-xl font-black text-[#0f172a]">Why move to a dedicated database instance</h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl bg-gradient-to-br from-[#0b1020] to-[#15295b] text-white p-7">
            <Code2 className="w-9 h-9 text-[#00b7ff]" />
            <p className="mt-4 text-base font-black">Level up your web projects</p>
            <p className="mt-2.5 text-xs text-white/75 leading-5">Every CMS — WordPress, PrestaShop, Joomla, Drupal — runs faster on a dedicated database. Centralise all your databases on one instance, reachable from GHC hosting or anywhere on the public network: websites, mobile apps, SaaS.</p>
            <a href="/kb" className="mt-4 inline-block text-xs font-bold text-[#00b7ff]">Read the guides →</a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <Layers className="w-9 h-9 text-[#0284c7]" />
            <p className="mt-4 text-base font-black text-[#0f172a]">Total flexibility & scalability</p>
            <p className="mt-2.5 text-xs text-slate-500 leading-5">Unlimited databases with separate access. Configure engine settings straight from the GHC Control Panel. Scale to 4GB RAM / 64GB storage in minutes as projects grow — burst beyond allocation for intensive processing.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <FileText className="w-9 h-9 text-[#0284c7]" />
            <p className="mt-4 text-base font-black text-[#0f172a]">Optimise tables & queries</p>
            <p className="mt-2.5 text-xs text-slate-500 leading-5">phpMyAdmin and phpPgAdmin built in via the control panel. Slow-query logs show which queries block response times so you can optimise indexes and requests.</p>
          </div>
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
