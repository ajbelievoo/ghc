"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Server, Globe, Wallet, Headphones } from "lucide-react";

interface MobileBottomNavProps {
  tab: string;
  setTab: (t: any) => void;
}

const ITEMS = [
  { id: "overview", label: "Home", icon: LayoutDashboard },
  { id: "servers", label: "Servers", icon: Server },
  { id: "domains", label: "Domains", icon: Globe },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "support", label: "Support", icon: Headphones },
];

export default function MobileBottomNav({ tab, setTab }: MobileBottomNavProps) {
  const router = useRouter();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 pb-safe">
      <div className="flex items-center justify-around">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`flex flex-col items-center gap-0.5 py-2 px-2 w-full transition-colors ${active ? "text-[#00b7ff]" : "text-slate-500"}`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="text-[9px] font-medium leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
