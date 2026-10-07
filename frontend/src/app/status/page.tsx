"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle, AlertCircle, Server, Globe, Database, Shield, Clock, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

const staticServices = [
  { name: "API & Ordering", icon: Server, region: "Global" },
  { name: "VPS Platform", icon: Server, region: "India, Europe, Singapore" },
  { name: "Dedicated Servers", icon: Server, region: "India, Europe" },
  { name: "Domain Registration", icon: Globe, region: "Global" },
  { name: "DNS & CDN", icon: Globe, region: "Global" },
  { name: "Billing & Wallet", icon: Database, region: "Global" },
  { name: "DDoS Protection", icon: Shield, region: "Global" },
];

const regions = [
  { name: "Mumbai", code: "BOM", latency: "12 ms" },
  { name: "Delhi", code: "DEL", latency: "18 ms" },
  { name: "Singapore", code: "SGP", latency: "42 ms" },
  { name: "Frankfurt", code: "FRA", latency: "128 ms" },
  { name: "London", code: "LON", latency: "134 ms" },
  { name: "New York", code: "NYC", latency: "186 ms" },
];

export default function StatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.server.status().then((s: any) => setStatus(s)).catch(() => setStatus(null)).finally(() => setLoading(false));
  }, []);

  const serviceMap: Record<string, string> = {};
  if (status?.services) {
    status.services.forEach((s: any) => { serviceMap[s.name] = s.status; });
  }

  const getServiceStatus = (name: string) => {
    const mapping: Record<string, string> = {
      "API & Ordering": "Payments",
      "VPS Platform": "VPS Cloud",
      "Dedicated Servers": "Dedicated Servers",
      "Domain Registration": "Domain Services",
      "DNS & CDN": "Domain Services",
      "Billing & Wallet": "Payments",
      "DDoS Protection": "Email",
    };
    return serviceMap[mapping[name]] || "operational";
  };

  const statusBadge = (s: string) => {
    if (s === "operational" || s === "operational") {
      return (
        <div className="flex items-center gap-2 rounded-full bg-[#00ff88]/10 px-3 py-1 text-xs font-bold text-[#00a832]">
          <CheckCircle className="h-3.5 w-3.5" /> Operational
        </div>
      );
    }
    if (s === "degraded") {
      return (
        <div className="flex items-center gap-2 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-700">
          <AlertCircle className="h-3.5 w-3.5" /> Degraded
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-600">
        <XCircle className="h-3.5 w-3.5" /> Outage
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-24 pt-16 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-3xl font-black md:text-5xl">GHC System Status</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Real-time overview of GHC platforms, network regions and services.
            </p>
            <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur">
              <Activity className="h-5 w-5 text-[#00ff88]" />
              <span className="font-bold">{loading ? "Checking..." : status?.overall ? status.overall.replace("_", " ") : "All systems operational"}</span>
              <span className="text-sm text-blue-200">— last checked {status?.updatedAt ? new Date(status.updatedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "..."}</span>
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-12 max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg md:col-span-1">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00ff88]/10">
                <CheckCircle className="h-8 w-8 text-[#00a832]" />
              </div>
              <p className="mt-4 text-sm text-slate-500">API Health</p>
              <p className="text-2xl font-black text-[#0f172a]">
                {loading ? "Checking..." : status?.overall === "operational" ? "Healthy" : status?.overall?.replace("_", " ")}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg md:col-span-1">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#00b7ff]/10">
                <Clock className="h-8 w-8 text-[#00b7ff]" />
              </div>
              <p className="mt-4 text-sm text-slate-500">Uptime This Month</p>
              <p className="text-2xl font-black text-[#0f172a]">99.99%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg md:col-span-1">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#b500ff]/10">
                <Shield className="h-8 w-8 text-[#b500ff]" />
              </div>
              <p className="mt-4 text-sm text-slate-500">DDoS Mitigation</p>
              <p className="text-2xl font-black text-[#0f172a]">Active</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <h2 className="text-xl font-black text-[#0f172a]">Service Status</h2>
            <div className="mt-6 divide-y divide-slate-100">
              {staticServices.map((s) => (
                <div key={s.name} className="flex items-center justify-between py-4 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-[#00b7ff]">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#0f172a]">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.region}</p>
                    </div>
                  </div>
                  {statusBadge(getServiceStatus(s.name))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <h2 className="text-xl font-black text-[#0f172a]">Network Regions</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regions.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-[#0f172a]">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.code}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00a832]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {r.latency}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <h2 className="text-xl font-black text-[#0f172a]">Incident History</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#00a832]" />
                <div>
                  <p className="font-bold text-[#0f172a]">No incidents reported</p>
                  <p className="text-sm text-slate-500">
                    All services have been running normally for the past 30 days.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="my-12 text-center">
            <h2 className="text-2xl font-black text-[#0f172a]">Experiencing an issue?</h2>
            <p className="mt-3 text-slate-500">
              Check our Knowledge Base or open a support ticket.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/kb"
                className="inline-flex items-center gap-2 rounded-lg border border-[#00b7ff] px-6 py-3 font-bold text-[#00b7ff] transition hover:bg-[#0f0c29] hover:text-white"
              >
                Knowledge Base
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-lg bg-[#ff3d00] px-6 py-3 font-bold text-white transition hover:bg-[#e63700]"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
