import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react";

const groups = [
  {
    title: "Speed up your websites and applications",
    items: [
      { label: "WordPress", href: "/vps/wordpress", desc: "Pre-optimized WordPress VPS images" },
      { label: "Drupal", href: "/solutions/drupal", desc: "Drupal-ready VPS hosting" },
      { label: "PrestaShop", href: "/solutions/prestashop", desc: "eCommerce-ready PrestaShop" },
      { label: "Magento", href: "/solutions/magento", desc: "High-performance Magento hosting" },
    ],
  },
  {
    title: "The ideal foundation for your VMs",
    items: [
      { label: "Proxmox", href: "/solutions/proxmox", desc: "Virtualization on bare metal" },
      { label: "KVM", href: "/solutions/kvm", desc: "Kernel-based virtual machines" },
      { label: "VMware ESXi", href: "/solutions/vmware-esxi", desc: "Enterprise hypervisor hosting" },
      { label: "Microsoft Hyper-V", href: "/solutions/hyper-v", desc: "Windows-native virtualization" },
    ],
  },
  {
    title: "Your data, without data loss",
    items: [
      { label: "ClickHouse", href: "/solutions/clickhouse", desc: "Columnar analytics database" },
      { label: "PostgreSQL", href: "/solutions/postgresql", desc: "Relational database at scale" },
      { label: "Cassandra", href: "/solutions/cassandra", desc: "Distributed NoSQL database" },
      { label: "HBase", href: "/solutions/hbase", desc: "Hadoop-compatible storage" },
      { label: "InfluxDB", href: "/solutions/influxdb", desc: "Time-series database" },
    ],
  },
  {
    title: "The power for your critical workloads",
    items: [
      { label: "GROMACS", href: "/solutions/gromacs", desc: "Molecular dynamics compute" },
      { label: "NAMD", href: "/solutions/namd", desc: "Parallel simulation engine" },
    ],
  },
  {
    title: "Blockchain infrastructure",
    items: [
      { label: "Validator nodes", href: "/solutions/validator-nodes", desc: "Run PoS validators" },
      { label: "RPC nodes", href: "/solutions/rpc-nodes", desc: "Low-latency blockchain APIs" },
      { label: "Archive nodes", href: "/solutions/archive-nodes", desc: "Full chain history storage" },
    ],
  },
];

export const metadata = {
  title: "Solutions | GHC Cloud",
  description: "Ready-to-deploy solutions on GHC bare metal and VPS infrastructure.",
};

export default function SolutionsIndex() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white text-[#0f172a]">
        <section className="bg-[#0f0c29] text-white">
          <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">Solutions</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
              Purpose-built configurations for every workload — CMSs, virtualization, databases, compute and blockchain.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-2">
            {groups.map((g) => (
              <div key={g.title}>
                <h2 className="mb-4 text-lg font-bold">{g.title}</h2>
                <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <Link href={it.href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-slate-50">
                        <div>
                          <div className="text-sm font-semibold text-[#0f172a]">{it.label}</div>
                          <div className="text-xs text-slate-500">{it.desc}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
