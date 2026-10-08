"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHpcCatalog, HpcGroup } from "@/lib/cloudLive";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Search, Loader2 } from "lucide-react";

/** Live Hosted Private Cloud catalog — real-time upstream data, GHC margin. */
export default function HpcCatalog({ orderHref }: { orderHref?: string }) {
  const { currency } = useCurrency();
  const [groups, setGroups] = useState<HpcGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    getHpcCatalog().then((g) => { if (on) { setGroups(g); if (g?.length) setOpenGroup(g[0].id); } });
    return () => { on = false; };
  }, []);

  const cur = (currency || "INR").toUpperCase();
  const sym = getCurrencySymbol(cur);
  const rate = cur === "INR" ? 1 : cur === "USD" ? 1 / 83.5 : cur === "EUR" ? 1 / 90 : 1;
  const fmt = (v?: number | null) => {
    if (typeof v !== "number") return "—";
    const p = v * rate;
    const dec = p >= 100 ? 0 : p >= 1 ? 2 : 4;
    return `${sym}${p.toLocaleString("en-IN", { maximumFractionDigits: dec })}`;
  };

  if (groups === null) {
    return <div className="rounded-2xl border border-slate-200 bg-white/60 p-10 text-center text-sm text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Loading live catalog…</div>;
  }

  const q = search.toLowerCase();
  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search hosts, datastores…" className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-[#00b7ff]" />
      </div>
      <div className="space-y-3">
        {groups.map((g) => {
          const items = g.items.filter((i) => !q || i.code.toLowerCase().includes(q) || (i.name || "").toLowerCase().includes(q));
          if (!items.length) return null;
          const open = openGroup === g.id || q.length > 0;
          return (
            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <button onClick={() => setOpenGroup(openGroup === g.id ? null : g.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8faff] transition text-left">
                <div>
                  <p className="font-bold text-[#0f172a]">{g.title} <span className="ml-2 text-xs font-normal text-slate-400">{items.length} products</span></p>
                  <p className="text-xs text-slate-500 mt-0.5">{g.desc}</p>
                </div>
                <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
              </button>
              {open && (
                <div className="border-t border-slate-100 overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="w-full text-left min-w-[640px]">
                    <thead className="sticky top-0 bg-[#f8faff]">
                      <tr className="border-b border-slate-200">
                        <th className="px-5 py-2.5 text-xs font-bold text-slate-500">Name</th>
                        <th className="px-5 py-2.5 text-xs font-bold text-slate-500">Price / month</th>
                        <th className="px-5 py-2.5 text-xs font-bold text-slate-500">Price / hour</th>
                        <th className="px-5 py-2.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.code} className="border-b border-slate-100 hover:bg-[#f8faff] transition">
                          <td className="px-5 py-2.5"><p className="text-sm font-bold text-[#00b7ff]">{i.name !== i.code ? i.name : i.code}</p><p className="text-[10px] text-slate-400 font-mono">{i.code}</p></td>
                          <td className="px-5 py-2.5 text-sm font-bold text-[#0f172a]">{i.month ? fmt(i.month) : "—"}</td>
                          <td className="px-5 py-2.5 text-sm text-slate-500">{i.hour ? fmt(i.hour) : "—"}</td>
                          <td className="px-5 py-2.5"><Link href={orderHref || `/dashboard?view=private-cloud&plan=${i.code}`} className="rounded bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#009fe0] whitespace-nowrap">Order</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
