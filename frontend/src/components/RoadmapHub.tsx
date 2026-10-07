"use client";

import { Map, CheckCircle2, Rocket, Calendar, ArrowLeft } from "lucide-react";

interface RoadmapHubProps {
  onBack?: () => void;
}

const ROADMAP = [
  { q: "Q3 2025", status: "live", items: ["Unified client dashboard", "Bare Metal Cloud & VPS hubs", "Network IP management", "Real ping monitoring", "Multi-language (EN + HI)", "Wallet + invoice payments"] },
  { q: "Q4 2025", status: "upcoming", items: ["HA-NAS + Cloud Disk Array ordering", "Backup Agent + Veeam licenses", "Load balancer + vRack", "Network Security Dashboard", "cPanel/Plesk/Windows SPLA licenses", "AI assistant v2"] },
  { q: "Q1 2026", status: "planned", items: ["Public Cloud object storage", "Kubernetes service", "Bare Metal GPU instances", "Advanced DDoS analytics", "Mobile app", "GHC marketplace"] },
];

const CHANGELOG = [
  { date: "12 Aug 2025", version: "v2.4.0", notes: ["OVH-style persistent sidebar in client dashboard", "Full IP order flow with geolocation", "Storage, Licenses & Private Cloud quote requests", "GHC admin integration in Laravel admin"] },
  { date: "08 Aug 2025", version: "v2.3.0", notes: ["Real server ping agent", "Multi-language support", "Service Hub links fixed", "Currency selector with 30 currencies"] },
  { date: "01 Aug 2025", version: "v2.2.0", notes: ["Customer dashboard overview", "Invoice Pay Now + PDF", "Wallet transaction history", "Announcements & status page"] },
];

export default function RoadmapHub({ onBack }: RoadmapHubProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-2xl bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-4">
          {onBack && <button onClick={onBack} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"><ArrowLeft className="w-5 h-5" /></button>}
          <Map className="w-8 h-8 text-[#00b7ff]" />
          <div>
            <h2 className="text-2xl font-bold">Roadmap & Changelog</h2>
            <p className="text-slate-200">What we are building and what we have shipped.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><Rocket className="w-5 h-5 text-[#00b7ff]" /> Roadmap</h3>
          <div className="space-y-6">
            {ROADMAP.map((r) => (
              <div key={r.q} className="relative pl-6 border-l-2 border-slate-200">
                <div className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ${r.status === "live" ? "bg-[#00ff88]" : r.status === "upcoming" ? "bg-[#00b7ff]" : "bg-slate-300"}`} />
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-[#0f172a]">{r.q}</span>
                  {r.status === "live" && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#00ff88]/10 text-[#00ff88]">Live</span>}
                  {r.status === "upcoming" && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#00b7ff]/10 text-[#00b7ff]">Next</span>}
                  {r.status === "planned" && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500">Planned</span>}
                </div>
                <ul className="space-y-1.5">
                  {r.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-slate-600"><CheckCircle2 className="w-4 h-4 text-[#00b7ff] mt-0.5 shrink-0" /> {it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#00b7ff]" /> Changelog</h3>
          <div className="space-y-4">
            {CHANGELOG.map((c) => (
              <div key={c.version} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0f172a]">{c.version}</span>
                  <span className="text-xs text-slate-500">{c.date}</span>
                </div>
                <ul className="space-y-1">
                  {c.notes.map((n) => (
                    <li key={n} className="text-sm text-slate-600">• {n}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
