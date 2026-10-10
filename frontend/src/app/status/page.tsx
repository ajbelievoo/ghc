"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, CheckCircle, AlertCircle, Server, Globe, Shield, Clock, XCircle, Wrench, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CAT_LABELS: Record<string, { name: string; region: string }> = {
  VPS: { name: "VPS Platform", region: "India, Europe, Singapore" },
  DEDICATED: { name: "Dedicated Servers", region: "India, Europe" },
  DOMAINS: { name: "Domain Services", region: "Global" },
  WEB_HOSTING: { name: "Web Hosting", region: "Global" },
  PUBLIC_CLOUD: { name: "Public Cloud", region: "Global" },
  IP_ADDON: { name: "Additional IPs", region: "Global" },
};

const STATE_META: Record<string, { label: string; cls: string; icon: any }> = {
  operational: { label: "All systems operational", cls: "text-[#00ff88]", icon: CheckCircle },
  degraded: { label: "Degraded performance", cls: "text-yellow-400", icon: AlertCircle },
  partial_outage: { label: "Partial outage", cls: "text-orange-400", icon: AlertCircle },
  major_outage: { label: "Major outage", cls: "text-red-400", icon: XCircle },
  maintenance: { label: "Scheduled maintenance", cls: "text-blue-300", icon: Wrench },
};

const SEVERITY_BADGE: Record<string, string> = {
  minor: "bg-yellow-500/10 text-yellow-700",
  major: "bg-orange-500/10 text-orange-700",
  critical: "bg-red-500/10 text-red-700",
};

export default function StatusPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subMsg, setSubMsg] = useState("");
  const [unsubToken, setUnsubToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("unsubscribe");
    setUnsubToken(t);
    if (t) {
      fetch(`/api/status/unsubscribe/${t}`).then(() => setSubMsg("You have been unsubscribed.")).catch(() => {});
    }
    fetch("/api/status/summary")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubMsg("");
    try {
      const r = await fetch("/api/status/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setSubMsg(d.message || d.detail || "Subscribed.");
      if (r.ok) setEmail("");
    } catch {
      setSubMsg("Subscription failed. Try again.");
    }
  };

  const meta = STATE_META[data?.state || "operational"] || STATE_META.operational;
  const StateIcon = meta.icon;
  const fmtDate = (s?: string) => (s ? new Date(s + (s.endsWith("Z") ? "" : "Z")).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—");

  const IncidentCard = ({ i }: { i: any }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-[#0f172a]">{i.title}</p>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${SEVERITY_BADGE[i.severity] || SEVERITY_BADGE.minor}`}>{i.severity}</span>
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">{i.status}</span>
      </div>
      {i.message && <p className="mt-2 text-sm text-slate-600">{i.message}</p>}
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
        {i.scheduledFor && <span>Window: {fmtDate(i.scheduledFor)}{i.scheduledUntil ? ` – ${fmtDate(i.scheduledUntil)}` : ""}</span>}
        <span>Posted: {fmtDate(i.createdAt)}</span>
        {i.resolvedAt && <span>Resolved: {fmtDate(i.resolvedAt)}</span>}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#f8fcff]">
        <section className="bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] pb-24 pt-16 text-white">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h1 className="text-3xl font-black md:text-5xl">GHC System Status</h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-200">
              Live platform health measured from real uptime checks, plus incident and maintenance notices.
            </p>
            <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur">
              <StateIcon className={`h-5 w-5 ${meta.cls}`} />
              <span className="font-bold">{loading ? "Checking..." : meta.label}</span>
              {data?.generatedAt && <span className="text-sm text-blue-200">— {fmtDate(data.generatedAt)}</span>}
            </div>
          </div>
        </section>

        <section className="mx-auto -mt-12 max-w-7xl px-6">
          {/* Service uptime cards — real 30-day data */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <h2 className="text-xl font-black text-[#0f172a]">Service Uptime — last 30 days</h2>
            <p className="mt-1 text-xs text-slate-400">Measured by automated reachability checks every 5 minutes.</p>
            <div className="mt-6 divide-y divide-slate-100">
              {data?.services?.length ? data.services.map((s: any) => {
                const l = CAT_LABELS[s.category] || { name: s.category, region: "" };
                const ok = s.uptime30d >= 99.9;
                return (
                  <div key={s.category} className="flex items-center justify-between py-4 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-[#00b7ff]">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0f172a]">{l.name}</p>
                        <p className="text-xs text-slate-500">{l.region}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-black ${ok ? "text-[#00a832]" : "text-yellow-600"}`}>{s.uptime30d}%</span>
                      {ok
                        ? <span className="flex items-center gap-1.5 rounded-full bg-[#00ff88]/10 px-3 py-1 text-xs font-bold text-[#00a832]"><CheckCircle className="h-3.5 w-3.5" /> Operational</span>
                        : <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-bold text-yellow-700"><AlertCircle className="h-3.5 w-3.5" /> Degraded</span>}
                    </div>
                  </div>
                );
              }) : (
                <p className="py-4 text-sm text-slate-500">{loading ? "Loading…" : "No monitored services yet."}</p>
              )}
            </div>
          </div>

          {/* Active incidents + maintenance */}
          {(data?.incidents?.length > 0 || data?.maintenance?.length > 0) && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
              {data.incidents?.length > 0 && (
                <>
                  <h2 className="text-xl font-black text-[#0f172a]">Active Incidents</h2>
                  <div className="mt-4 space-y-3">{data.incidents.map((i: any) => <IncidentCard key={i.id} i={i} />)}</div>
                </>
              )}
              {data.maintenance?.length > 0 && (
                <>
                  <h2 className="mt-6 text-xl font-black text-[#0f172a]">Scheduled Maintenance</h2>
                  <div className="mt-4 space-y-3">{data.maintenance.map((i: any) => <IncidentCard key={i.id} i={i} />)}</div>
                </>
              )}
            </div>
          )}

          {/* Subscribe */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#0f172a]">Get incident alerts by email</h2>
                <p className="mt-1 text-sm text-slate-500">Be notified when incidents or maintenance windows are posted or resolved.</p>
              </div>
              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-64 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]"
                />
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#00b7ff] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc]">
                  <Mail className="h-4 w-4" /> Subscribe
                </button>
              </form>
            </div>
            {subMsg && <p className="mt-3 text-sm font-medium text-[#00a832]">{subMsg}</p>}
          </div>

          {/* Incident history */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-8">
            <h2 className="text-xl font-black text-[#0f172a]">Incident History — last 30 days</h2>
            <div className="mt-4 space-y-3">
              {data?.history?.length ? (
                data.history.map((i: any) => <IncidentCard key={i.id} i={i} />)
              ) : (
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-[#00a832]" />
                  <div>
                    <p className="font-bold text-[#0f172a]">No incidents reported</p>
                    <p className="text-sm text-slate-500">All services have been running normally for the past 30 days.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="my-12 text-center">
            <h2 className="text-2xl font-black text-[#0f172a]">Experiencing an issue?</h2>
            <p className="mt-3 text-slate-500">Check our Knowledge Base or open a support ticket.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/kb" className="inline-flex items-center gap-2 rounded-lg border border-[#00b7ff] px-6 py-3 font-bold text-[#00b7ff] transition hover:bg-[#0f0c29] hover:text-white">
                Knowledge Base
              </Link>
              <Link href="/support" className="inline-flex items-center gap-2 rounded-lg bg-[#ff3d00] px-6 py-3 font-bold text-white transition hover:bg-[#e63700]">
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
