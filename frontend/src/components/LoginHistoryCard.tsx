"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { KeyRound } from "lucide-react";

function agentLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  const b = ua.includes("Edg") ? "Edge" : ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Browser";
  const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac OS") ? "macOS" : ua.includes("Linux") ? "Linux" : ua.includes("Android") ? "Android" : ua.includes("iPhone") || ua.includes("iOS") ? "iOS" : "";
  return os ? `${b} · ${os}` : b;
}

export default function LoginHistoryCard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.auth.loginHistory().then((r) => setEvents(Array.isArray(r) ? r : [])).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
      <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#00b7ff]" /> Recent sign-ins
      </h3>
      {!loaded ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-slate-400">No sign-in history yet — events appear here from your next login.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${e.success ? "bg-emerald-500" : "bg-red-500"}`} />
                <div>
                  <p className="text-xs font-medium text-[#0f172a]">
                    {agentLabel(e.userAgent)}
                    <span className="ml-2 text-slate-400 font-normal">{e.method === "google" ? "Google" : e.method === "2fa" ? "Password + 2FA" : "Password"}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">{e.ipAddress || "—"}</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">{e.createdAt ? new Date(e.createdAt).toLocaleString() : "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
