"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Activity, BarChart3, Clock, CheckCircle, AlertTriangle, Server, ChevronRight } from "lucide-react";

const statusItems = [
  { name: "Compute - North America", status: "Operational", color: "#00a832" },
  { name: "Compute - Europe", status: "Operational", color: "#00a832" },
  { name: "Compute - Asia Pacific", status: "Operational", color: "#00a832" },
  { name: "Object Storage", status: "Operational", color: "#00a832" },
  { name: "Block Storage", status: "Operational", color: "#00a832" },
  { name: "Network Backbone", status: "Operational", color: "#00a832" },
  { name: "API & Control Plane", status: "Operational", color: "#00a832" },
  { name: "Billing & Payments", status: "Operational", color: "#00a832" },
];

const incidents = [
  { date: "2025-06-01", title: "Scheduled Maintenance - Block Storage", status: "Resolved", desc: "Firmware update completed with zero customer impact." },
  { date: "2025-05-28", title: "Network Optimization - Europe", status: "Resolved", desc: "Latency improvements deployed across Frankfurt and Paris PoPs." },
  { date: "2025-05-15", title: "DDoS Mitigation Event", status: "Resolved", desc: "Volumetric attack mitigated automatically. No service degradation." },
];

export default function OperationsPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
            <Activity className="h-4 w-4" /> System Status
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Operations & Status</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Real-time infrastructure health, incident history, and scheduled maintenance windows.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black text-[#00a832]">99.99%</p>
            <p className="mt-1 text-sm text-slate-500">Compute Uptime (30d)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black text-[#00b7ff]">&lt;15ms</p>
            <p className="mt-1 text-sm text-slate-500">Avg Internal Latency</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black text-[#b500ff]">0</p>
            <p className="mt-1 text-sm text-slate-500">Active Incidents</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold">Service Status</h2>
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {statusItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${item.color}15`, color: item.color, border: `1px solid ${item.color}30` }}>{item.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold">Recent Incidents</h2>
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc.title} className="rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{inc.date}</p>
                  <h3 className="mt-1 text-lg font-bold">{inc.title}</h3>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#00ff88]/10 text-[#00a832] border border-[#00ff88]/20">{inc.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{inc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[#0f0c29] text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-slate-400">&copy; 2026 GHC — Go Host Cloud. A Believoo Pvt Ltd brand.</div>
      </footer>
    </div>
  );
}
