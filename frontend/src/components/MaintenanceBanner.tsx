"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Wrench } from "lucide-react";

/**
 * Site-wide incident/maintenance strip — pulls the public status summary and
 * shows a slim banner above the navbar when anything is active.
 */
export default function MaintenanceBanner() {
  const [items, setItems] = useState<{ kind: "incident" | "maintenance"; title: string; severity?: string }[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch("/api/status/summary")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!alive || !d) return;
          const out: typeof items = [];
          for (const i of d.incidents || []) {
            if (i.resolvedAt || i.status === "resolved") continue;
            out.push({ kind: "incident", title: i.title || "Active incident", severity: i.severity });
          }
          for (const m of d.maintenance || []) {
            const end = m.endsAt || m.endTime;
            if (end && new Date(end).getTime() < Date.now()) continue;
            out.push({ kind: "maintenance", title: m.title || "Scheduled maintenance" });
          }
          setItems(out.slice(0, 2));
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 120000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  if (!items.length) return null;
  const item = items[0];
  const isIncident = item.kind === "incident";

  return (
    <Link
      href="/status"
      className={`block w-full px-4 py-2 text-center text-xs font-medium ${
        isIncident ? "bg-red-600 text-white hover:bg-red-700" : "bg-amber-500 text-[#0f172a] hover:bg-amber-400"
      } transition-colors`}
    >
      <span className="inline-flex items-center gap-2">
        {isIncident ? <AlertTriangle className="w-3.5 h-3.5" /> : <Wrench className="w-3.5 h-3.5" />}
        {item.title}
        {items.length > 1 && <span className="opacity-80">+{items.length - 1} more</span>}
        <span className="underline underline-offset-2 ml-1">View status →</span>
      </span>
    </Link>
  );
}
