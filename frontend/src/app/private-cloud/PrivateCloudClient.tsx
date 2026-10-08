"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HpcCatalog from "@/components/HpcCatalog";
import Link from "next/link";

export default function PrivateCloudClient() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />
      <section className="border-b border-slate-200 bg-gradient-to-b from-[#f8faff] to-white">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h1 className="text-3xl font-black md:text-4xl">Hosted Private Cloud</h1>
          <p className="mt-3 text-slate-500 max-w-2xl mx-auto">Managed VMware, vSphere and VCF as-a-Service on dedicated hardware — we maintain the infrastructure, you run your workloads.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            {["Managed VMware vSphere", "Managed SDDC", "NSX networking", "Enterprise datastores"].map((f) => (
              <span key={f} className="rounded-full bg-[#e8f6ff] text-[#00b7ff] px-4 py-1.5 font-semibold">{f}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-10">
        <HpcCatalog orderHref="/register" />
        <p className="mt-6 text-center text-xs text-slate-400">Prices update in real time from our upstream catalog — GHC margin included. Need a custom configuration? <Link href="/support" className="text-[#00b7ff] font-semibold">Request a quote</Link>.</p>
      </section>
      <Footer />
    </div>
  );
}
