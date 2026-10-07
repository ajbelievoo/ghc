"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, FileText, BookOpen, CreditCard, Server, Globe, HelpCircle, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = [
  { key: "getting-started", label: "Getting Started", icon: BookOpen },
  { key: "vps", label: "VPS", icon: Server },
  { key: "dedicated", label: "Dedicated Servers", icon: Server },
  { key: "domains", label: "Domains & DNS", icon: Globe },
  { key: "billing", label: "Billing & Wallet", icon: CreditCard },
  { key: "security", label: "Security & DDoS", icon: Shield },
  { key: "general", label: "General", icon: HelpCircle },
];

const articles = [
  { title: "How to create a GHC account", category: "getting-started", summary: "Step-by-step guide to sign up, verify email and log in." },
  { title: "How to order a VPS", category: "getting-started", summary: "Choose a plan, select OS, pick duration and complete payment." },
  { title: "How to connect to your VPS via SSH", category: "vps", summary: "Use root credentials from the dashboard to connect securely." },
  { title: "How to reinstall the OS on a VPS", category: "vps", summary: "Rebuild from available templates without losing data on secondary disks." },
  { title: "How to resize a VPS", category: "vps", summary: "Upgrade RAM, CPU and storage from your client dashboard." },
  { title: "How to order a dedicated server", category: "dedicated", summary: "Pick a range, configure hardware and confirm provisioning time." },
  { title: "Dedicated server remote management (IPMI)", category: "dedicated", summary: "Access IPMI/KVM for out-of-band server management." },
  { title: "How to register a domain name", category: "domains", summary: "Search for a domain, choose TLD and complete registration." },
  { title: "How to manage DNS records", category: "domains", summary: "Add A, CNAME, MX and TXT records from the domain control panel." },
  { title: "How to add funds to your wallet", category: "billing", summary: "Use UPI, cards or net banking to add prepaid balance." },
  { title: "How invoices and renewals work", category: "billing", summary: "Understand billing cycles, due dates and auto-renewal." },
  { title: "How DDoS protection works", category: "security", summary: "Automatic mitigation included with every GHC plan." },
  { title: "How to open a support ticket", category: "general", summary: "Contact support through the client dashboard or email." },
  { title: "GHC Service Level Agreement (SLA)", category: "general", summary: "Uptime commitment and service credit policy." },
  { title: "Currencies and tax (GST)", category: "billing", summary: "Choose your preferred currency and understand how tax is applied at checkout." },
];

export default function KnowledgeBasePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q);
      const matchesCategory = !activeCategory || a.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-24 pt-16 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-3xl font-black md:text-5xl">Knowledge Base</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Find guides, FAQs and troubleshooting steps for GHC hosting, domains, billing and security.
            </p>
            <div className="mx-auto mt-8 flex max-w-2xl items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
              <Search className="h-5 w-5 text-blue-200" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-blue-200 outline-none"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-12 max-w-7xl px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <div className="mb-6 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
                  activeCategory === null
                    ? "bg-[#0f0c29] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00b7ff]"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold transition ${
                    activeCategory === c.key
                      ? "bg-[#0f0c29] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-[#00b7ff]"
                  }`}
                >
                  <c.icon className="h-4 w-4" />
                  {c.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 font-bold">No articles found.</p>
                <p className="text-sm">Try a different search term or category.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((a) => {
                  const cat = categories.find((c) => c.key === a.category);
                  return (
                    <Link
                      key={a.title}
                      href="/support"
                      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-[#00b7ff] hover:shadow-lg"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#00b7ff]">
                        {cat && <cat.icon className="h-3.5 w-3.5" />}
                        {cat?.label}
                      </div>
                      <h3 className="mt-2 text-lg font-bold text-[#0f172a] group-hover:text-[#00b7ff]">
                        {a.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-slate-500">{a.summary}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 text-center">
          <h2 className="text-2xl font-black text-[#0f172a]">Still need help?</h2>
          <p className="mt-3 text-slate-500">
            Open a support ticket and our team will assist you within minutes.
          </p>
          <Link
            href="/support"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#ff3d00] px-6 py-3 font-bold text-white transition hover:bg-[#e63700]"
          >
            Contact Support
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
