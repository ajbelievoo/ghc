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

export default function WebCloudDatabasesPage({ plans }: { plans: any[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const hostingPlans = ["hosting-startup", "hosting-pro", "hosting-performance-1"]
    .map((c) => plans.find((p) => p.planCode === c))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero — blue band + price card */}
      <section className="bg-[#000e9c] text-white">
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

      {/* Services included — 8 cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <h2 className="text-xl font-black text-[#0f172a]">Services included with your Web Cloud Databases</h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {SERVICES.map((s) => (
            <div key={s.t}>
              <s.icon className="w-9 h-9 text-[#0050d7]" strokeWidth={1.5} />
              <p className="mt-3 text-sm font-bold text-[#0f172a]">{s.t}</p>
              <p className="mt-2 text-xs text-slate-500 leading-5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Hosting plans integrate */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <h2 className="text-center text-xl md:text-2xl font-black text-[#0f172a]">All of our hosting solutions integrate seamlessly with our Web Cloud Databases service.</h2>
        <PlanGrid plans={hostingPlans} recommended="hosting-pro" sub="business" />
      </section>

      {/* Alternating content */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl bg-gradient-to-br from-[#000e9c] to-[#0043b0] p-10 flex items-center justify-center min-h-[220px] order-2 md:order-1">
            <div className="text-center text-white">
              <Code2 className="w-14 h-14 mx-auto" />
              <p className="mt-3 text-2xl font-black tracking-widest">CMS</p>
              <p className="text-xs text-white/60 mt-1">WordPress · PrestaShop · Joomla · Drupal</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-black text-[#0f172a]">Take your web projects to the next level</h2>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              If you're looking to deploy a website, you'll undoubtedly need a database. Databases optimise the overall functioning of content management systems (CMS), such as <strong>WordPress</strong> or <strong>PrestaShop</strong> (for e-commerce websites).
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              Simplify your work by centralising your databases on the same instance. Whether your web projects are operated by GHC cloud or another provider, our instances connected to the public network meet a wide range of use cases — from website databases to mobile applications, SaaS applications, and much more.
            </p>
            <p className="mt-4 text-sm text-slate-600">Find out how to get started by reading our <a href="/kb" className="text-[#0050d7] font-semibold underline">guides</a>.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-black text-[#0f172a]">Get total flexibility for configuration and scalability</h2>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              You can create as many databases and projects as you like, and assign separate accesses to them.
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              With the advanced features included with your service, you can configure your environment to suit your needs. Depending on your database engine, you can modify different settings directly via the GHC Control Panel.
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              Need to scale up your databases for growing projects? Upgrade to a higher solution in just a few minutes. We offer up to 4GB RAM and up to 64GB storage space.
            </p>
          </div>
          <div className="rounded-2xl bg-[#eef4ff] border border-slate-100 p-10 flex items-center justify-center min-h-[220px]">
            <Layers className="w-16 h-16 text-[#0050d7]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl bg-[#f3eaff] border border-slate-100 p-10 flex items-center justify-center min-h-[220px] order-2 md:order-1">
            <FileText className="w-16 h-16 text-[#7b2ff7]" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-black text-[#0f172a]">Optimise your tables and queries</h2>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              For intensive processing, you can temporarily exceed the RAM/CPU resources allocated to you, so that your business is not affected.
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              Get phpMyAdmin and phpPgAdmin to simplify your database management by enabling access to GHC cloud Web Hosting plans via the GHC Control Panel.
            </p>
            <p className="mt-4 text-sm text-slate-600 leading-7">
              A query that takes too long to close can block other queries, increasing your database's overall response time. By checking your logs, you can identify your slowest queries and optimise them accordingly.
            </p>
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
                <span className={`text-sm font-semibold ${faqOpen === i ? "text-[#0050d7]" : "text-[#0f172a]"}`}>{q}</span>
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
