"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Activity, Loader2 } from "lucide-react";

const STATE_COLORS: Record<string, string> = {
  operational: "#00a832",
  degraded: "#f59e0b",
  outage: "#ef4444",
  maintenance: "#00b7ff",
};

export default function OperationsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch("/api/status/summary")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => setErr(true));
  }, []);

  const services = summary?.services || [];
  const incidents = summary?.incidents || [];
  const maintenance = summary?.maintenance || [];
  const avgUptime = services.length
    ? services.reduce((a: number, s: any) => a + (s.uptime30d || 0), 0) / services.length
    : null;
  const stateColor = STATE_COLORS[summary?.state || "operational"] || "#00a832";

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-[#0f0c29] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
            <Activity className="h-4 w-4" /> System Status
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Operations & Status</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">Live infrastructure health from our monitoring — service uptime, open incidents, and scheduled maintenance.</p>
          {summary && (
            <p className="mt-4 text-xs text-slate-400">
              Overall state: <span className="font-bold" style={{ color: stateColor }}>{(summary.state || "operational").toUpperCase()}</span>
              {" · "}Updated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black text-[#00a832]">{avgUptime != null ? `${avgUptime.toFixed(2)}%` : "—"}</p>
            <p className="mt-1 text-sm text-slate-500">Service uptime (30d, monitored fleet)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black text-[#00b7ff]">{services.reduce((a: number, s: any) => a + (s.checks || 0), 0).toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500">Health checks (30d)</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6 text-center">
            <p className="text-4xl font-black" style={{ color: incidents.length ? "#ef4444" : "#00a832" }}>{incidents.length}</p>
            <p className="mt-1 text-sm text-slate-500">Active incidents</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold">Service uptime (last 30 days)</h2>
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {!summary && !err && (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading live status…</div>
          )}
          {err && <p className="px-6 py-10 text-center text-sm text-slate-500">Status information is temporarily unavailable — see <Link className="text-[#00b7ff] underline" href="/status">/status</Link>.</p>}
          {services.map((s: any) => {
            const ok = (s.uptime30d ?? 100) >= 99.9;
            const color = ok ? "#00a832" : (s.uptime30d ?? 100) >= 99 ? "#f59e0b" : "#ef4444";
            return (
              <div key={s.category} className="flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium">{s.category === "IP_ADDON" ? "Additional IPs" : s.category.charAt(0) + s.category.slice(1).toLowerCase()}</span>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {(s.uptime30d ?? 0).toFixed(2)}% · {s.checks.toLocaleString()} checks
                </span>
              </div>
            );
          })}
          {summary && !services.length && <p className="px-6 py-10 text-center text-sm text-slate-500">No monitored services yet.</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-6 text-2xl font-bold">Incidents & maintenance</h2>
        <div className="space-y-4">
          {incidents.map((inc: any) => (
            <div key={inc.id || inc.title} className="rounded-xl border border-red-200 bg-red-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{inc.createdAt || inc.date ? new Date(inc.createdAt || inc.date).toLocaleDateString() : ""}</p>
                  <h3 className="mt-1 text-lg font-bold">{inc.title}</h3>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-red-500/10 text-red-600 border border-red-300">{inc.status || "Open"}</span>
              </div>
              {inc.description && <p className="mt-3 text-sm text-slate-600">{inc.description}</p>}
            </div>
          ))}
          {maintenance.map((m: any) => (
            <div key={m.id || m.title} className="rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{m.scheduledAt || m.date ? new Date(m.scheduledAt || m.date).toLocaleDateString() : ""}</p>
                  <h3 className="mt-1 text-lg font-bold">{m.title}</h3>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#00b7ff]/10 text-[#00b7ff] border border-[#00b7ff]/20">{m.status || "Scheduled"}</span>
              </div>
              {m.description && <p className="mt-3 text-sm text-slate-600">{m.description}</p>}
            </div>
          ))}
          {summary && !incidents.length && !maintenance.length && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-sm font-medium text-[#00a832]">All systems operational — no open incidents or scheduled maintenance.</p>
              <p className="mt-1 text-xs text-slate-500">Subscribe on the <Link className="text-[#00b7ff] underline" href="/status">status page</Link> to get notified.</p>
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#0f0c29] text-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-slate-400">&copy; 2026 GHC — Go Host Cloud. A Believoo Pvt Ltd brand.</div>
      </footer>
    </div>
  );
}
