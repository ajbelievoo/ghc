"use client";

import { useMemo } from "react";
import { ChevronRight, Cpu, ArrowRight, Database, Globe, Layers, Brain, Search, Radio, FolderGit2, Network, MonitorSmartphone, Archive, Binary } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "@/components/Footer";
import { useCurrency, getCurrencySymbol } from "@/components/CurrencyProvider";

const UC_LABEL: Record<string, string> = {
  "archive-backup-recovery": "Archiving, backup & recovery",
  "artificial-intelligence": "Artificial intelligence",
  bdd: "Databases",
  "big-data-analytics": "Big Data & Analytics",
  "confidential-computing": "Confidential computing",
  gaming: "Gaming servers",
  "grid-computing": "Grid computing",
  hosting: "Website hosting",
  hpc: "High Performance Computing (HPC)",
  "hyperconverged-infrastructure": "Hyperconverged infrastructure (HCI)",
  "multi-az": "3-AZ",
  sds: "Software defined storage",
  vdi: "Virtual Desktop Infrastructure (VDI)",
  "virtualisation-containerisation-orchestration": "Virtualisation, containerisation & orchestration",
};

const RANGE_CARDS: { label: string; href: string; match: (n: string) => boolean }[] = [
  { label: "Advance", href: "/dedicated-servers/advance", match: (n) => n.startsWith("adv") && !n.includes("stor") },
  { label: "Game", href: "/dedicated-servers/game", match: (n) => n.startsWith("game") },
  { label: "Scale", href: "/dedicated-servers/scale", match: (n) => n.startsWith("scale") },
  { label: "High Grade", href: "/dedicated-servers/high-grade", match: (n) => n.startsWith("hgr") },
  { label: "Storage", href: "/dedicated-servers/prices?range=storage", match: (n) => n.includes("stor") },
];

// Big feature cards — title, tagline, use-case link, chips (chips go to the same filtered list)
const FEATURES: {
  tag: string; title: string; uc: string; chips?: string[]; icon: any; navy?: boolean;
}[] = [
  { tag: "Web Hosting & PHP", title: "Launch your websites. Enhance them.", uc: "hosting", chips: ["WordPress", "Drupal", "PrestaShop", "Magento"], icon: Globe },
  { tag: "Databases", title: "Structure your data. Power through your work.", uc: "bdd", chips: ["ClickHouse", "PostgreSQL", "Cassandra", "HBase", "InfluxDB"], icon: Database, navy: true },
  { tag: "Virtualisation", title: "Consolidate. Control. Pick up the pace.", uc: "virtualisation-containerisation-orchestration", chips: ["VMware ESXi", "Proxmox VE", "KVM", "Kubernetes"], icon: Layers },
  { tag: "In-memory database", title: "In-memory data. Instant responses.", uc: "bdd", chips: ["KeyDB", "RocksDB", "Redis", "etcd", "Valkey", "Speedb"], icon: Cpu, navy: true },
  { tag: "Search and analyze", title: "Index. Analyse. Find it in an instant.", uc: "big-data-analytics", chips: ["Elastic", "OpenSearch", "Splunk Enterprise", "Apache Solr"], icon: Search },
  { tag: "Event streaming platforms", title: "Manage your events, in real time.", uc: "bdd", chips: ["Kafka", "RabbitMQ", "NATS JetStream", "Pulsar"], icon: Radio },
  { tag: "Distributed file systems", title: "Store at scale. Enjoy easy access.", uc: "sds", chips: ["Hadoop", "CephFS", "GlusterFS", "Lustre"], icon: FolderGit2, navy: true },
  { tag: "Machine Learning and GPU", title: "Intelligent computing, on a controlled basis.", uc: "artificial-intelligence", chips: ["TensorFlow GPU", "PyTorch GPU", "scikit-learn", "NumPy"], icon: Brain },
  { tag: "High Performance Computing", title: "Deploy your models with no core limit.", uc: "hpc", chips: ["MPI", "OpenMP", "CUDA", "Slurm"], icon: Binary },
  { tag: "Backup & Archiving", title: "Protect. Retain. Restore.", uc: "archive-backup-recovery", chips: ["restic", "BorgBackup", "rsync"], icon: Archive },
  { tag: "3-AZ Resilience", title: "Survive a full site failure.", uc: "multi-az", chips: ["3 zones", "30 km apart", "Low-latency fabric"], icon: Network, navy: true },
  { tag: "VDI", title: "Virtual desktops, delivered.", uc: "vdi", chips: ["Citrix", "Horizon", "Workspot"], icon: MonitorSmartphone },
];

export default function DedicatedUseCasesPage({ plans }: { plans: any[] }) {
  const { currency } = useCurrency();
  const sym = (c: string) => getCurrencySymbol((c || currency || "USD").toUpperCase());

  // min price per range + per use-case, from real plans
  const { rangeMin, ucMin } = useMemo(() => {
    const rangeMin: Record<string, { price: number; cur: string }> = {};
    const ucMin: Record<string, { price: number; cur: string }> = {};
    for (const p of plans) {
      if (p.isActive === false) continue;
      const d = (p.durations || []).slice().sort((a: any, b: any) => (a.monthlyPrice || 0) - (b.monthlyPrice || 0))[0];
      if (!d) continue;
      const cur = d.currency || p.currency || "USD";
      const inv = (p.invoiceName || "").toLowerCase();
      for (const rc of RANGE_CARDS) {
        if (rc.match(inv) && (!rangeMin[rc.label] || d.monthlyPrice < rangeMin[rc.label].price)) {
          rangeMin[rc.label] = { price: d.monthlyPrice, cur };
        }
      }
      for (const u of String(p.features?.["baremetal-server-usecases"] || "").split(",").map((x: string) => x.trim()).filter(Boolean)) {
        if (!ucMin[u] || d.monthlyPrice < ucMin[u].price) ucMin[u] = { price: d.monthlyPrice, cur };
      }
    }
    return { rangeMin, ucMin };
  }, [plans]);

  const carousel = [
    { label: "See the full list of servers", href: "/dedicated-servers/prices", min: null as null | { price: number; cur: string } },
    ...RANGE_CARDS.map((r) => ({ label: r.label, href: r.href, min: rangeMin[r.label] || null })),
    ...Object.entries(UC_LABEL).filter(([k]) => ucMin[k]).map(([k, v]) => ({ label: v, href: `/dedicated-servers/prices?use_cases=${k}`, min: ucMin[k] })),
  ];

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      {/* Hero banner */}
      <section className="bg-[#0b1020] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="rounded-2xl bg-gradient-to-r from-[#0b1020] via-[#101d42] to-[#0a2a5e] border border-white/10 px-8 py-10 relative overflow-hidden">
            <Cpu className="absolute right-10 top-1/2 -translate-y-1/2 w-40 h-40 text-[#00b7ff]/20 hidden md:block" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#00b7ff]">Dedicated servers</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-black">The right server for every use case</h1>
          </div>
          <p className="mt-5 text-[11px] text-slate-500"><a href="/" className="hover:underline text-[#0050d7]">Home</a> &gt; <a href="/dedicated-servers" className="hover:underline text-[#0050d7]">Dedicated Servers</a> &gt; Use cases</p>
        </div>
      </section>

      {/* Carousel strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-2">
        <div className="flex gap-3 overflow-x-auto pb-4 pt-2 snap-x">
          {carousel.map((c) => (
            <a key={c.label} href={c.href} className="snap-start shrink-0 w-40 rounded-xl border border-slate-200 bg-white p-4 hover:border-[#0050d7] hover:shadow-md transition-all flex flex-col">
              <p className="text-[12px] font-black text-[#0f172a] leading-4 min-h-[36px]">{c.label}</p>
              {c.min && (
                <p className="mt-2 text-[10px] text-slate-500">Starting from
                  <span className="block text-sm font-black text-[#0050d7]">{sym(c.min.cur)}{c.min.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })} <span className="text-[9px] font-normal">excl. VAT</span></span>
                </p>
              )}
              <ChevronRight className="mt-auto w-4 h-4 text-[#0050d7]" />
            </a>
          ))}
        </div>
      </section>

      {/* Feature cards grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const min = ucMin[f.uc];
            return (
              <a key={f.title} href={`/dedicated-servers/prices?use_cases=${f.uc}`} className={`rounded-2xl p-6 border transition-all hover:shadow-lg group ${f.navy ? "bg-[#0b1020] border-white/10 text-white" : "bg-sky-50/60 border-slate-200 text-[#0f172a]"}`}>
                <span className={`inline-block rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider ${f.navy ? "bg-[#00b7ff]/15 text-[#00b7ff]" : "bg-[#0050d7]/10 text-[#0050d7]"}`}>{f.tag}</span>
                <h2 className="mt-3 text-lg font-black leading-6">{f.title}</h2>
                {min && <p className={`mt-2 text-[11px] ${f.navy ? "text-white/50" : "text-slate-500"}`}>Starting from <span className={`font-black ${f.navy ? "text-[#00b7ff]" : "text-[#0050d7]"}`}>{sym(min.cur)}{min.price.toLocaleString("en-IN", { maximumFractionDigits: 0 })} excl. VAT</span></p>}
                {f.chips && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.chips.map((ch) => (
                      <span key={ch} className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-bold ${f.navy ? "bg-white/10 text-white/80" : "bg-white border border-slate-200 text-slate-600"}`}>{ch} <ChevronRight className="w-3 h-3" /></span>
                    ))}
                  </div>
                )}
                <span className={`mt-5 inline-flex items-center gap-1 text-xs font-bold ${f.navy ? "text-[#00b7ff]" : "text-[#0050d7]"}`}>See servers <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
              </a>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="rounded-2xl bg-[#0b1020] py-10 px-6 text-center">
          <h2 className="text-lg md:text-xl font-black text-white">Explore our full selection of servers</h2>
          <p className="mt-1.5 text-sm text-white/50">Whatever your use case, you'll find the machine for you.</p>
          <a href="/dedicated-servers/prices" className="mt-5 inline-block rounded-lg bg-[#0050d7] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#0043b3]">See the full list of servers →</a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
