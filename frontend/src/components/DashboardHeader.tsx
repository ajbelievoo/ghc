"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Menu, X, User, LogOut, Wallet, Moon, Sun, Globe, DollarSign } from "lucide-react";
import { useCurrency, CURRENCIES, getCurrencySymbol } from "@/components/CurrencyProvider";
import { useI18n } from "@/components/LanguageProvider";
import { Language } from "@/lib/i18n";
import ThemeToggle from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  user: any;
  notifications: any[];
  onToggleSidebar: () => void;
  onSearch?: (q: string) => void;
}

export default function DashboardHeader({ user, notifications, onToggleSidebar, onSearch }: DashboardHeaderProps) {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const { lang, setLang } = useI18n();
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
    document.title = "Dashboard - GHC";
  }, []);

  const notifList = Array.isArray(notifications) ? notifications : [];
  const unread = notifList.filter((n) => !n.read).length || 0;

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <p className="text-xs text-slate-500">{greeting}</p>
            <p className="text-sm font-bold text-[#0a0f1c]">{user?.name || "Customer"}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md hidden md:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); onSearch?.(e.target.value); }}
            placeholder="Search services, domains, invoices..."
            className="w-full rounded-xl bg-slate-100 border border-slate-200 pl-10 pr-4 py-2 text-sm text-[#0a0f1c] focus:border-[#00b7ff]/50 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Language */}
          <div className="relative">
            <button onClick={() => { setLangOpen(!langOpen); setCurrencyOpen(false); setNotifOpen(false); setProfileOpen(false); }} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#0a0f1c] hover:border-[#00b7ff]">
              <Globe className="w-3.5 h-3.5" /> {lang.toUpperCase()}
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-24 rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
                  {(["en", "hi"] as Language[]).map((l) => (
                    <button key={l} onClick={() => { setLang(l); setLangOpen(false); }} className={`w-full text-left px-3 py-2 text-xs ${l === lang ? "bg-[#f8fcff] text-[#00b7ff]" : "text-slate-600 hover:bg-slate-50"}`}>
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Currency */}
          <div className="relative">
            <button onClick={() => { setCurrencyOpen(!currencyOpen); setLangOpen(false); setNotifOpen(false); setProfileOpen(false); }} className="hidden sm:flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-[#0a0f1c] hover:border-[#00b7ff]">
              <DollarSign className="w-3.5 h-3.5" /> {currency}
            </button>
            {currencyOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-24 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                  {CURRENCIES.map((c) => (
                    <button key={c} onClick={() => { setCurrency(c); setCurrencyOpen(false); }} className={`w-full text-left px-3 py-2 text-xs ${c === currency ? "bg-[#f8fcff] text-[#00b7ff]" : "text-slate-600 hover:bg-slate-50"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => { setNotifOpen(!notifOpen); setCurrencyOpen(false); setLangOpen(false); setProfileOpen(false); }} className="relative p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-[#00b7ff] hover:border-[#00b7ff]">
              <Bell className="w-4 h-4" />
              {unread > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#00b7ff] text-white text-[10px] font-bold flex items-center justify-center">{unread}</span>}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0a0f1c]">Notifications</p>
                    {unread > 0 && <span className="text-xs text-[#00b7ff]">{unread} new</span>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifList.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
                    ) : (
                      notifList.slice(0, 8).map((n, i) => (
                        <div key={i} className={`px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 ${!n.read ? "bg-[#f8fcff]" : ""}`}>
                          <p className="text-sm text-[#0a0f1c]">{n.title || n.message}</p>
                          <p className="text-xs text-slate-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button onClick={() => { setProfileOpen(!profileOpen); setCurrencyOpen(false); setLangOpen(false); setNotifOpen(false); }} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 hover:border-[#00b7ff]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00b7ff] to-[#b500ff] text-white text-xs font-bold flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-[#0a0f1c] max-w-[100px] truncate">{user?.name}</span>
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <button onClick={() => { setProfileOpen(false); router.push("/dashboard?tab=profile"); }} className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><User className="w-4 h-4" /> Profile</button>
                  <button onClick={() => { setProfileOpen(false); router.push("/dashboard?tab=wallet"); }} className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><Wallet className="w-4 h-4" /> Wallet</button>
                  <div className="border-t border-slate-100" />
                  <button onClick={() => { setProfileOpen(false); /* logout is on sidebar */ }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
