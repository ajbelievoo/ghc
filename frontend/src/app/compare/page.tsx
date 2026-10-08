import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, ArrowRight, IndianRupee, Headset, Zap, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "GHC vs buying direct from OVH — INR billing, UPI & local support | GHC",
  description:
    "Why order OVH-powered infrastructure through GHC? Pay in INR with UPI/cards, GST invoices, Indian support, managed assistance and the same enterprise hardware.",
};

const rows: { label: string; ghc: string | boolean; direct: string | boolean }[] = [
  { label: "Same OVH datacenters & hardware", ghc: true, direct: true },
  { label: "Automatic provisioning & delivery tracking", ghc: true, direct: true },
  { label: "Pay in INR — UPI, cards, netbanking, wallet", ghc: true, direct: false },
  { label: "GST-compliant Indian invoices (input credit)", ghc: true, direct: false },
  { label: "No international card / forex markup needed", ghc: true, direct: false },
  { label: "India-time-zone human support", ghc: true, direct: false },
  { label: "Free setup & migration assistance", ghc: true, direct: false },
  { label: "Coupon codes & wallet credits", ghc: true, direct: false },
  { label: "Unified panel: VPS + dedicated + domains + hosting", ghc: true, direct: "Multiple OVH panels" },
  { label: "Lowest list price", ghc: "Small reseller margin", direct: true },
];

const perks = [
  { icon: IndianRupee, title: "INR billing, zero forex", body: "UPI, RuPay cards, netbanking and wallet — no international transaction fees or foreign-exchange markup on your card." },
  { icon: Headset, title: "Local support", body: "Talk to engineers who understand Indian customers — WhatsApp, tickets and email, in your time zone." },
  { icon: Zap, title: "Managed help included", body: "Stuck on a reinstall, DNS or migration? We do it with you — not just a ticket queue." },
  { icon: ShieldCheck, title: "GST invoices & compliance", body: "Proper tax invoices with GSTIN, plus grievance, abuse and dispute channels — a registered Indian company you can reach." },
];

export default function ComparePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-24 pt-16 text-white">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <p className="mb-3 inline-block rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#00f0ff]">
              Honest comparison
            </p>
            <h1 className="text-3xl font-black md:text-5xl">GHC vs buying direct from OVH</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              We resell OVH infrastructure — and we&apos;re upfront about it. Here&apos;s what you gain (and the one thing you trade) when you order through GHC.
            </p>
          </div>
        </section>

        <section className="mx-auto -mt-12 max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 font-bold text-[#0f172a]">What you get</th>
                  <th className="w-40 px-5 py-4 text-center font-bold text-[#00b7ff]">GHC</th>
                  <th className="w-40 px-5 py-4 text-center font-bold text-slate-500">OVH direct</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-[#0f172a]">{r.label}</td>
                    {[r.ghc, r.direct].map((v, i) => (
                      <td key={i} className="px-5 py-3.5 text-center">
                        {v === true ? (
                          <Check className="mx-auto h-5 w-5 text-[#00c853]" />
                        ) : v === false ? (
                          <X className="mx-auto h-5 w-5 text-slate-300" />
                        ) : (
                          <span className="text-xs font-medium text-slate-500">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            Same upstream infrastructure, same SLA — GHC adds Indian billing, tax invoices and hands-on support for a small margin.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {perks.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00b7ff]/10 text-[#00b7ff]">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[#0f172a]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-20 text-center">
          <h2 className="text-2xl font-black text-[#0f172a]">Ready when you are</h2>
          <p className="mt-3 text-slate-500">Browse live plans and deploy in minutes — or open a ticket and we&apos;ll help you pick.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/vps" className="inline-flex items-center gap-2 rounded-lg bg-[#ff3d00] px-6 py-3 font-bold text-white transition hover:bg-[#e63700]">
              Browse VPS plans <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/support" className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-[#0f172a] transition hover:border-[#00b7ff]">
              Talk to us first
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
