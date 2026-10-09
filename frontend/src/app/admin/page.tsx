"use client";
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
import AdminDomainManager from "@/components/AdminDomainManager";
import AdminServerModal from "@/components/AdminServerModal";
import {
  LayoutDashboard, Settings, CreditCard, Shield, Activity, Server, Users, LogOut,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle, FileText, Zap, Trash2,
  Pause, Play, Search, RefreshCw, Key, Palette, Eye, EyeOff,
  ChevronLeft, ChevronRight, Save, Globe, Mail, DollarSign, Package,
  CloudCog, Tag, Ban, RotateCcw, XCircle, Percent, Clock
} from "lucide-react";

type Tab = "overview" | "users" | "credentials" | "brand" | "settings" | "margins" | "coupons" | "catalog" | "subscriptions" | "suspensions" | "domain-tlds" | "customer-domains" | "logs" | "orders" | "support" | "invoices";

interface LogEntry { id: string; type: string; message: string; createdAt: string; details?: any; }
interface SubEntry { id: string; name: string; providerResourceId: string | null; category: string; status: string; userId: string; user?: { name: string; email: string }; planCode: string | null; billingCycle: string; nextBillDate: string; priceAmount: number; currency: string; autoRenew: boolean; createdAt: string; }
interface PlanEntry { planCode: string; invoiceName: string; description: string | null; category: string; family: string; cpuCores: number | null; ramGb: number | null; diskGb: number | null; diskType: string | null; bandwidthMbps: number | null; currency: string; isActive: boolean; overridePrice: number | null; overrideMargin: number | null; durations: { durationLabel: string; rawPrice: number; finalPrice: number; interval: number; intervalUnit: string }[]; }

const CATEGORIES = ["VPS", "DEDICATED", "WEB_HOSTING", "IP_ADDON", "LICENSE", "DOMAINS"];

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("ghc_token", token);
      params.delete("token");
      const clean = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", clean);
    }
  }, []);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [settings, setSettings] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [logFilter, setLogFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState({ provider_app_key: "", provider_app_secret: "", provider_consumer_key: "", provider_endpoint: "", provider_subsidiary: "" });
  const [providerTest, setProviderTest] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });
  const [googleCreds, setGoogleCreds] = useState({ google_client_id: "", google_client_secret: "" });
  const [smtp, setSmtp] = useState({ smtp_host: "", smtp_port: "", smtp_user: "", smtp_pass: "" });
  const [gwInputs, setGwInputs] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [brand, setBrand] = useState({ siteName: "GHC", companyName: "Believoo Pvt Ltd", logoUrl: "", faviconUrl: "", primaryColor: "#00f0ff", accentColor: "#b500ff", customCss: "" });
  const [syncing, setSyncing] = useState(false);
  const [margins, setMargins] = useState<Record<string, number>>({});
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "percent", value: "", maxUses: "", perUserLimit: "1", minOrderAmount: "", appliesToCategory: "", expiresAt: "", isActive: true });
  const [catalogPlans, setCatalogPlans] = useState<PlanEntry[]>([]);
  const [catalogCategory, setCatalogCategory] = useState("ALL");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubEntry[]>([]);
  const [subFilter, setSubFilter] = useState("ALL");
  const [subCategory, setSubCategory] = useState("ALL");
  const [pageError, setPageError] = useState<string | null>(null);
  const [domainTlds, setDomainTlds] = useState<any[]>([]);
  const [domainTldSearch, setDomainTldSearch] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersFilter, setOrdersFilter] = useState("ALL");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [suspensionQueue, setSuspensionQueue] = useState<any>(null);
  const [invoicesFilter, setInvoicesFilter] = useState("ALL");
  const [viewingServer, setViewingServer] = useState<string | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportFilter, setSupportFilter] = useState("ALL");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.auth.me()
      .then((data: any) => {
        if (!data.user || data.user.role !== "ADMIN") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/dashboard");
          return;
        }
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        loadTabData("overview");
      })
      .catch((e: any) => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      });
  }, [router]);

  const loadTabData = async (t: Tab) => {
    setLoading(true);
    setPageError(null);
    try {
      if (t === "overview") { const s = await api.admin.stats(); setStats(s); const subs = await api.admin.getSubscriptions(); setSubscriptions(subs); }
      if (t === "settings") { const cfg = await api.admin.settings(); setSettings(cfg.settings || []); setGateways(cfg.gateways || []); }
      if (t === "logs") { const params: any = {}; if (logFilter !== "ALL") params.type = logFilter; const lg = await api.admin.logs(params); setLogs(lg || []); }
      if (t === "users") { const u = await api.admin.getUsers({ search: userSearch || undefined, page: usersPage, limit: 20 }); setUsers(u.users || []); setUsersTotal(u.total || 0); }
      if (t === "credentials") { const c = await api.admin.getCredentials(); setProvider({ provider_app_key: c.credentials.provider_app_key || "", provider_app_secret: c.credentials.provider_app_secret || "", provider_consumer_key: c.credentials.provider_consumer_key || "", provider_endpoint: c.credentials.provider_endpoint || "", provider_subsidiary: c.credentials.provider_subsidiary || "" }); setGoogleCreds({ google_client_id: c.credentials.google_client_id || "", google_client_secret: c.credentials.google_client_secret || "" }); setSmtp({ smtp_host: c.credentials.smtp_host || "", smtp_port: c.credentials.smtp_port || "", smtp_user: c.credentials.smtp_user || "", smtp_pass: c.credentials.smtp_pass || "" }); const gws: Record<string, any> = {}; (c.gateways || []).forEach((g: any) => { gws[g.name] = { ...(g.config || {}), isActive: g.isActive }; }); setGwInputs(gws); }
      if (t === "brand") { const b = await api.admin.getBrand(); setBrand(b); }
      if (t === "margins") { const m = await api.admin.getMargins(); const map: Record<string, number> = {}; m.forEach((x: any) => map[x.category] = x.percent); setMargins(map); }
      if (t === "coupons") { const c = await api.admin.getCoupons(); setCoupons(c || []); }
      if (t === "catalog") { setCatalogLoading(true); const params: any = { search: catalogSearch || undefined }; if (catalogCategory !== "ALL") params.category = catalogCategory; const p = await api.admin.getCatalog(params); setCatalogPlans(p || []); setCatalogLoading(false); }
      if (t === "subscriptions") { const params: any = {}; if (subFilter !== "ALL") params.status = subFilter; if (subCategory !== "ALL") params.category = subCategory; const subs = await api.admin.getSubscriptions(params); setSubscriptions(subs || []); }
      if (t === "domain-tlds") { const tlds = await api.admin.getDomainTlds(); setDomainTlds(tlds || []); }
      if (t === "orders") { const o = await api.admin.getOrders({ status: ordersFilter !== "ALL" ? ordersFilter : undefined, page: ordersPage, limit: 20 }); setOrders(o.orders || []); setOrdersTotal(o.total || 0); }
      if (t === "invoices") { const inv = await api.admin.getInvoices({ status: invoicesFilter !== "ALL" ? invoicesFilter : undefined }); setInvoices(inv || []); }
      if (t === "suspensions") { const q = await api.admin.suspensionQueue(); setSuspensionQueue(q); }
      if (t === "support") { const params: any = {}; if (supportFilter !== "ALL") params.status = supportFilter; const st = await api.support.getTickets(params); setSupportTickets(st.tickets || []); }
    } catch (e: any) { console.error(e); setPageError(e.message || "Failed to load data"); } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === "users") loadTabData("users"); }, [usersPage, userSearch, tab]);
  useEffect(() => { if (tab === "logs") loadTabData("logs"); }, [logFilter, tab]);
  useEffect(() => { if (tab === "catalog") loadTabData("catalog"); }, [catalogCategory, catalogSearch, tab]);
  useEffect(() => { if (tab === "subscriptions") loadTabData("subscriptions"); }, [subFilter, subCategory, tab]);
  useEffect(() => { if (tab === "suspensions") loadTabData("suspensions"); }, [tab]);
  useEffect(() => { if (tab === "support") loadTabData("support"); }, [supportFilter, tab]);
  useEffect(() => { if (tab === "orders") loadTabData("orders"); }, [ordersFilter, ordersPage, tab]);
  useEffect(() => { if (tab === "invoices") loadTabData("invoices"); }, [invoicesFilter, tab]);

  const handleTabChange = (t: Tab) => { setTab(t); loadTabData(t); };

  const toggleSetting = async (key: string, currentValue: string) => { const newValue = currentValue === "true" ? "false" : "true"; try { await api.admin.updateSetting({ key, value: newValue }); setSettings((p) => p.map((s) => s.key === key ? { ...s, value: newValue } : s)); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const toggleGateway = async (name: string, currentActive: boolean) => { try { await api.admin.updateGateway({ name, isActive: !currentActive }); setGateways((p) => p.map((g) => g.name === name ? { ...g, isActive: !currentActive } : g)); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handleUpdateUser = async (userId: string, data: any) => { try { await api.admin.updateUser(userId, data); loadTabData("users"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };

  const handleImpersonate = async (u: any) => {
    if (!confirm(`Log in as ${u.name} (${u.email})? Your admin session is restored via the exit banner.`)) return;
    try {
      const res = await api.admin.impersonate(u.id);
      const adminToken = localStorage.getItem("token");
      if (adminToken) localStorage.setItem("ghc-admin-token", adminToken);
      localStorage.setItem("ghc-impersonating", u.email);
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      window.location.href = "/dashboard";
    } catch (e: any) { showToast(e.message || "Impersonation failed", "error"); }
  };

  const handleExportSales = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}${api.admin.salesReportUrl}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `ghc-sales-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) { showToast(e.message || "Export failed", "error"); }
  };
  const handleSaveCredentials = async (e: FormEvent) => { e.preventDefault(); try { const gatewayList = Object.entries(gwInputs).map(([name, cfg]) => ({ name, config: { keyId: cfg.keyId, keySecret: cfg.keySecret, merchantId: cfg.merchantId, webhookSecret: cfg.webhookSecret, env: cfg.env }, isActive: cfg.isActive })); await api.admin.updateCredentials({ provider, google: googleCreds, smtp, gateways: gatewayList }); showToast("Credentials saved successfully", "success"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handleSaveBrand = async (e: FormEvent) => { e.preventDefault(); try { await api.admin.updateBrand(brand); showToast("Brand settings saved", "success"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const getSettingValue = (key: string) => { const s = settings.find((x) => x.key === key); return s?.value || "false"; };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); };
  const handleMarginChange = (cat: string, val: string) => { setMargins((p) => ({ ...p, [cat]: parseFloat(val) || 0 })); };
  const saveMargin = async (cat: string) => { try { await api.admin.updateMargin({ category: cat, percent: margins[cat] || 0 }); showToast(`Margin for ${cat} saved`, "success"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handlePlanOverride = async (planCode: string, overridePrice: string, overrideMargin: string) => { try { await api.admin.updatePlanOverride(planCode, { overridePrice: overridePrice === "" ? null : parseFloat(overridePrice), overrideMargin: overrideMargin === "" ? null : parseFloat(overrideMargin) }); showToast("Override saved for " + planCode, "success"); loadTabData("catalog"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handleFulfillPayment = async (sessionId: string) => { try { await api.payments.fulfillSession(sessionId); showToast("Payment fulfilled and service activated", "success"); loadTabData("orders"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handleRetryProvision = async (orderId: string) => { try { await api.admin.retryProvision(orderId); showToast("Provisioning retry initiated", "success"); loadTabData("orders"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };
  const handleLifecycle = async (id: string, action: string) => { if (!confirm(`Are you sure you want to ${action} this subscription?`)) return; try { await api.admin.subscriptionLifecycle(id, action); showToast(`${action} executed`, "success"); loadTabData("subscriptions"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } };

  const navItem = (id: Tab, label: string, icon: any) => (
    <button key={id} onClick={() => handleTabChange(id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${tab === id ? "bg-[#00b7ff]/10 text-[#00b7ff] border border-[#00b7ff]/20" : "text-slate-500 hover:text-[#0f172a] hover:bg-slate-100/50"}`}>{icon}{label}</button>
  );

  const secretInput = (label: string, value: string, onChange: (v: string) => void, keyName: string) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input type={showSecrets[keyName] ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 pr-10 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none transition-all" />
        <button type="button" onClick={() => setShowSecrets((p) => ({ ...p, [keyName]: !p[keyName] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0f172a]">{showSecrets[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
      </div>
    </div>
  );

  const panel = (title: string, icon: any, children: React.ReactNode) => (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
      <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </div>
  );

  if (loading && tab !== "catalog") return <div className="min-h-screen bg-[#f8fcff] flex items-center justify-center"><RefreshCw className="w-8 h-8 text-[#00b7ff] animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8fcff] flex">
      <aside className="w-64 border-r border-slate-200 bg-slate-100/80 backdrop-blur-xl p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center"><Zap className="w-4 h-4 text-[#00b7ff]" /></div>
          <h1 className="text-lg font-bold text-[#0f172a]">GHC</h1>
        </div>
        <nav className="space-y-1 flex-1">
          {navItem("overview", "Overview", <LayoutDashboard className="w-4 h-4" />)}
          {navItem("users", "Users", <Users className="w-4 h-4" />)}
          {navItem("credentials", "Credentials", <Key className="w-4 h-4" />)}
          {navItem("brand", "Brand", <Palette className="w-4 h-4" />)}
          {navItem("settings", "Controls", <Settings className="w-4 h-4" />)}
          {navItem("margins", "Margins", <DollarSign className="w-4 h-4" />)}
          {navItem("coupons", "Coupons", <Tag className="w-4 h-4" />)}
          {navItem("catalog", "Catalog", <Package className="w-4 h-4" />)}
          {navItem("subscriptions", "Subscriptions", <Server className="w-4 h-4" />)}
          {navItem("suspensions", "Suspension Queue", <AlertTriangle className="w-4 h-4" />)}
          {navItem("domain-tlds", "Domain TLDs", <Globe className="w-4 h-4" />)}
          {navItem("customer-domains", "Customer Domains", <Globe className="w-4 h-4" />)}
          {navItem("orders", "Orders", <FileText className="w-4 h-4" />)}
          {navItem("invoices", "Invoices", <FileText className="w-4 h-4" />)}
          {navItem("support", "Support Tickets", <Mail className="w-4 h-4" />)}
          {navItem("logs", "Logs", <FileText className="w-4 h-4" />)}
        </nav>
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center"><Shield className="w-4 h-4 text-[#00b7ff]" /></div>
            <div><p className="text-sm font-medium text-[#0f172a]">{user?.name || "Admin"}</p><p className="text-xs text-slate-500">Administrator</p></div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-500/10 transition-all mt-2"><LogOut className="w-4 h-4" />Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {pageError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-600">API Error</p>
              <p className="text-xs text-red-300/70">{pageError}</p>
            </div>
            <button onClick={() => setPageError(null)} className="ml-auto text-xs text-red-600 hover:text-red-300">Dismiss</button>
          </div>
        )}
        {/* ===== OVERVIEW ===== */}
        {tab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">Command Overview</h2>
              <div className="flex items-center gap-2">
                <button onClick={async () => { setSyncing(true); try { const r = await api.admin.syncProviderPlans(); showToast(r.message, "success"); loadTabData("overview"); } catch(e: any) { showToast("Sync failed: " + e.message, "error"); } finally { setSyncing(false); } }} disabled={syncing} className="flex items-center gap-2 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50">
                  <CloudCog className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing..." : "Sync Plans"}
                </button>
                <button onClick={() => loadTabData("overview")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Subscriptions", value: stats.totalServers || 0, icon: Server, color: "#00f0ff" },
                { label: "Active Subs", value: stats.activeServers || 0, icon: Activity, color: "#00ff88" },
                { label: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "#b500ff" },
                { label: "Total Admins", value: stats.totalAdmins || 0, icon: Shield, color: "#ff007f" },
                { label: "Total Revenue", value: `$${(stats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "#00f0ff" },
                { label: "Est. MRR", value: `~₹${(stats.mrr || 0).toFixed(0)}/mo`, icon: Activity, color: "#00ff88" },
                { label: "Pending Orders", value: stats.pendingOrders || 0, icon: Package, color: "#ffaa00" },
                { label: "Total Orders", value: stats.totalOrders || 0, icon: CheckCircle, color: "#00ff88" },
                { label: "Overdue Invoices", value: stats.overdueInvoices || 0, icon: AlertTriangle, color: "#ff3d00" },
                { label: "Open Tickets", value: stats.openTickets || 0, icon: Mail, color: "#ffaa00" },
                { label: "Domains expiring 30d", value: stats.expiringDomains || 0, icon: Globe, color: "#b500ff" },
                { label: "24h Logs", value: stats.recentLogs || 0, icon: FileText, color: "#b500ff" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 hover:border-slate-200 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}15`, border: `1px solid ${card.color}30` }}>
                      <card.icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Live</span>
                  </div>
                  <p className="text-3xl font-bold text-[#0f172a]">{card.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
            {panel("Infrastructure Health", <Activity className="w-5 h-5 text-[#00b7ff]" />,
              <div className="space-y-3">
                {[
                  { label: "Provider API Connection", status: "Operational", color: "#00ff88" },
                  { label: "Payment Gateway Webhooks", status: "Active", color: "#00ff88" },
                  { label: "Cron Job Engine", status: "Running", color: "#00ff88" },
                  { label: "Email Delivery System", status: (stats.totalRevenue || 0) > 0 ? "Operational" : "Check Config", color: (stats.totalRevenue || 0) > 0 ? "#00ff88" : "#ffaa00" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5" style={{ color: item.color }} /><span className="text-sm text-slate-700">{item.label}</span></div>
                    <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ color: item.color, backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>{item.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== USERS ===== */}
        {tab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">User Management</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none w-64" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Email</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Role</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Subs</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Orders</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Joined</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3 text-sm text-[#0f172a]">{u.name}</td>
                        <td className="px-6 py-3 text-sm text-slate-700">{u.email}</td>
                        <td className="px-6 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-[#00b7ff]/10 text-[#00b7ff]" : "bg-[#b500ff]/10 text-[#b500ff]"}`}>{u.role}</span></td>
                        <td className="px-6 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${u.isSuspended ? "bg-red-500/10 text-red-600" : "bg-[#00ff88]/10 text-[#00ff88]"}`}>{u.isSuspended ? "Suspended" : "Active"}</span></td>
                        <td className="px-6 py-3 text-sm text-slate-500">{u._count.subscriptions}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{u._count.orders}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpdateUser(u.id, { role: u.role === "ADMIN" ? "CLIENT" : "ADMIN" })} className="rounded-lg bg-slate-100/50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/80 transition-all">{u.role === "ADMIN" ? "Demote" : "Promote"}</button>
                            <button onClick={() => handleUpdateUser(u.id, { isSuspended: !u.isSuspended })} className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${u.isSuspended ? "bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 hover:bg-yellow-500/20"}`}>{u.isSuspended ? "Activate" : "Suspend"}</button>
                            {u.role !== "ADMIN" && <button onClick={() => handleImpersonate(u)} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1.5 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Login as</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && <tr><td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">No users found.</td></tr>}
                  </tbody>
                </table>
              </div>
              {usersTotal > 20 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">{usersTotal} total users</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setUsersPage((p) => Math.max(1, p - 1))} disabled={usersPage === 1} className="p-1.5 rounded-lg bg-slate-100/50 border border-slate-200 text-slate-500 hover:text-[#0f172a] disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm text-slate-700">Page {usersPage} of {Math.ceil(usersTotal / 20)}</span>
                    <button onClick={() => setUsersPage((p) => Math.min(Math.ceil(usersTotal / 20), p + 1))} disabled={usersPage >= Math.ceil(usersTotal / 20)} className="p-1.5 rounded-lg bg-slate-100/50 border border-slate-200 text-slate-500 hover:text-[#0f172a] disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== CREDENTIALS ===== */}
        {tab === "credentials" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">Credentials &amp; API Keys</h2>
            <form onSubmit={handleSaveCredentials} className="space-y-6">
              {panel("Provider API Credentials", <Server className="w-5 h-5 text-[#00b7ff]" />,
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {secretInput("Application Key", provider.provider_app_key, (v) => setProvider((p: any) => ({ ...p, provider_app_key: v })), "provider_app_key")}
                    {secretInput("Application Secret", provider.provider_app_secret, (v) => setProvider((p: any) => ({ ...p, provider_app_secret: v })), "provider_app_secret")}
                    {secretInput("Consumer Key", provider.provider_consumer_key, (v) => setProvider((p: any) => ({ ...p, provider_consumer_key: v })), "provider_consumer_key")}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Endpoint</label>
                      <select value={provider.provider_endpoint} onChange={(e) => setProvider((p: any) => ({ ...p, provider_endpoint: e.target.value }))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                        <option value="">Select endpoint</option>
                        <option value="ovh-eu">ovh-eu (Europe / World)</option>
                        <option value="ovh-ca">ovh-ca (Canada)</option>
                        <option value="ovh-us">ovh-us (US)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Subsidiary</label>
                      <input type="text" value={provider.provider_subsidiary} onChange={(e) => setProvider((p: any) => ({ ...p, provider_subsidiary: e.target.value }))} placeholder="IN / CA / US / EU..." className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
                    </div>
                    <div className="flex items-end">
                      <button type="button" disabled={providerTest.loading} onClick={async () => {
                        setProviderTest({ loading: true, result: null });
                        try {
                          const r = await api.admin.testProvider();
                          setProviderTest({ loading: false, result: `Connected — balance ${r.balance} ${r.currency}` });
                        } catch (e: any) {
                          setProviderTest({ loading: false, result: `Failed: ${e.message || "connection error"}` });
                        }
                      }} className="rounded-lg bg-[#0f0c29] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50">
                        {providerTest.loading ? "Testing..." : "Test connection"}
                      </button>
                    </div>
                  </div>
                  {providerTest.result && (
                    <p className={`text-xs font-semibold ${providerTest.result.startsWith("Connected") ? "text-emerald-600" : "text-red-500"}`}>{providerTest.result}</p>
                  )}
                </div>
              )}
              {panel("Google OAuth", <Globe className="w-5 h-5 text-[#00b7ff]" />,
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {secretInput("Client ID", googleCreds.google_client_id, (v) => setGoogleCreds((p: any) => ({ ...p, google_client_id: v })), "google_client_id")}
                    {secretInput("Client Secret", googleCreds.google_client_secret, (v) => setGoogleCreds((p: any) => ({ ...p, google_client_secret: v })), "google_client_secret")}
                  </div>
                  <div className="rounded-lg bg-[#00b7ff]/5 border border-[#00b7ff]/20 p-4 space-y-2">
                    <p className="text-xs font-semibold text-[#00b7ff]">Paste these URLs in your Google Cloud Console {'->'} APIs &amp; Services {'->'} Credentials {'->'} OAuth 2.0 Client ID</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Authorized JavaScript Origins</label>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2">
                          <span className="text-xs text-[#0f172a] font-mono flex-1 truncate">https://ghc.believoo.com</span>
                          <button type="button" onClick={() => navigator.clipboard.writeText("https://ghc.believoo.com")} className="text-[10px] text-[#00b7ff] hover:underline">Copy</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1">Backend API Endpoint</label>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2">
                          <span className="text-xs text-[#0f172a] font-mono flex-1 truncate">https://ghc.believoo.com/api/auth/google</span>
                          <button type="button" onClick={() => navigator.clipboard.writeText("https://ghc.believoo.com/api/auth/google")} className="text-[10px] text-[#00b7ff] hover:underline">Copy</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {panel("Email (SMTP)", <Mail className="w-5 h-5 text-[#00b7ff]" />,
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Host</label><input type="text" value={smtp.smtp_host} onChange={(e) => setSmtp((p: any) => ({ ...p, smtp_host: e.target.value }))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Port</label><input type="text" value={smtp.smtp_port} onChange={(e) => setSmtp((p: any) => ({ ...p, smtp_port: e.target.value }))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label><input type="text" value={smtp.smtp_user} onChange={(e) => setSmtp((p: any) => ({ ...p, smtp_user: e.target.value }))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  {secretInput("Password", smtp.smtp_pass, (v) => setSmtp((p: any) => ({ ...p, smtp_pass: v })), "smtp_pass")}
                </div>
              )}
              {panel("Payment Gateways", <CreditCard className="w-5 h-5 text-[#00b7ff]" />,
                <div className="space-y-4">
                  {["razorpay", "cashfree", "paypal", "payu", "stripe"].map((gwName) => {
                    const keyLabels: Record<string, [string, string]> = {
                      razorpay: ["Key ID", "Key Secret"],
                      cashfree: ["App ID", "Secret Key"],
                      paypal: ["Client ID", "Client Secret"],
                      payu: ["Merchant Key", "Merchant Salt"],
                      stripe: ["Publishable Key", "Secret Key"],
                    };
                    const [l1, l2] = keyLabels[gwName] || ["Key ID", "Key Secret"];
                    const needsWebhook = ["razorpay", "stripe"].includes(gwName);
                    const needsMerchant = gwName === "payu";
                    return (
                    <div key={gwName} className="rounded-xl border border-slate-200 bg-slate-100/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-[#0f172a] capitalize">{gwName}</p>
                        <div className="flex items-center gap-3">
                          {gwName !== "razorpay" && (
                            <select value={gwInputs[gwName]?.env || "sandbox"} onChange={(e) => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], env: e.target.value } }))} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs text-[#0f172a] outline-none">
                              <option value="sandbox">Test / Sandbox</option>
                              <option value="production">Live / Production</option>
                            </select>
                          )}
                          <button type="button" onClick={() => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], isActive: !p[gwName]?.isActive } }))} className="transition-transform active:scale-95">
                            {gwInputs[gwName]?.isActive ? <ToggleRight className="w-7 h-7 text-[#00b7ff]" /> : <ToggleLeft className="w-7 h-7 text-slate-500" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {secretInput(l1, gwInputs[gwName]?.keyId || "", (v) => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], keyId: v }})), `${gwName}_keyId`)}
                        {secretInput(l2, gwInputs[gwName]?.keySecret || "", (v) => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], keySecret: v }})), `${gwName}_keySecret`)}
                        {needsWebhook && secretInput("Webhook Secret", gwInputs[gwName]?.webhookSecret || "", (v) => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], webhookSecret: v }})), `${gwName}_webhookSecret`)}
                        {needsMerchant && secretInput("Merchant ID", gwInputs[gwName]?.merchantId || "", (v) => setGwInputs((p) => ({ ...p, [gwName]: { ...p[gwName], merchantId: v }})), `${gwName}_merchantId`)}
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-6 py-3 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">
                  <Save className="w-4 h-4" />Save All Credentials
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== BRAND ===== */}
        {tab === "brand" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">Brand &amp; Identity</h2>
            <form onSubmit={handleSaveBrand} className="space-y-6 max-w-2xl">
              {panel("Site Identity", <Palette className="w-5 h-5 text-[#00b7ff]" />,
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Site Name</label><input type="text" value={brand.siteName} onChange={(e) => setBrand((p) => ({ ...p, siteName: e.target.value }))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label><input type="text" value={brand.companyName} onChange={(e) => setBrand((p) => ({ ...p, companyName: e.target.value }))} placeholder="Believoo Pvt Ltd" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Logo URL</label><input type="text" value={brand.logoUrl || ""} onChange={(e) => setBrand((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Favicon URL</label><input type="text" value={brand.faviconUrl || ""} onChange={(e) => setBrand((p) => ({ ...p, faviconUrl: e.target.value }))} placeholder="https://..." className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Color</label><div className="flex items-center gap-3"><input type="color" value={brand.primaryColor} onChange={(e) => setBrand((p) => ({ ...p, primaryColor: e.target.value }))} className="w-12 h-10 rounded-lg bg-transparent border border-slate-200 cursor-pointer" /><input type="text" value={brand.primaryColor} onChange={(e) => setBrand((p) => ({ ...p, primaryColor: e.target.value }))} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Accent Color</label><div className="flex items-center gap-3"><input type="color" value={brand.accentColor} onChange={(e) => setBrand((p) => ({ ...p, accentColor: e.target.value }))} className="w-12 h-10 rounded-lg bg-transparent border border-slate-200 cursor-pointer" /><input type="text" value={brand.accentColor} onChange={(e) => setBrand((p) => ({ ...p, accentColor: e.target.value }))} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div></div>
                  </div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Custom CSS (injected on all pages)</label><textarea value={brand.customCss || ""} onChange={(e) => setBrand((p) => ({ ...p, customCss: e.target.value }))} placeholder=".btn-primary { background: #00b7ff !important; }" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" rows={8} /></div>
                </div>
              )}
              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-6 py-3 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">
                  <Save className="w-4 h-4" />Save Brand Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== SETTINGS / CONTROLS ===== */}
        {tab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">Master Control Hub</h2>
            {panel("Global Master Toggles", <Settings className="w-5 h-5 text-[#00b7ff]" />,
              <div className="space-y-4">
                {[
                  { key: "google_login_enabled", label: "Google OAuth Login", desc: "Allow users to sign in with Google" },
                  { key: "email_alerts_enabled", label: "Email System Alerts", desc: "Send automated email notifications" },
                  { key: "require_email_verification", label: "Email Verification", desc: "Require email verification before sign-in (needs SMTP)" },
                  { key: "auto_suspend_enabled", label: "Auto-Suspend Overdue", desc: "Suspend services 12h after invoice due date" },
                ].map((toggle) => {
                  const active = getSettingValue(toggle.key) === "true";
                  return (
                    <div key={toggle.key} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                      <div><p className="text-sm font-medium text-[#0f172a]">{toggle.label}</p><p className="text-xs text-slate-500 mt-0.5">{toggle.desc}</p></div>
                      <button onClick={() => toggleSetting(toggle.key, String(active))} className="transition-transform active:scale-95">{active ? <ToggleRight className="w-8 h-8 text-[#00b7ff]" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}</button>
                    </div>
                  );
                })}
              </div>
            )}
            {panel("Payment Gateway Controller", <CreditCard className="w-5 h-5 text-[#00b7ff]" />,
              <div className="space-y-4">
                {(gateways.length ? gateways : [
                  { name: "razorpay", isActive: false }, { name: "cashfree", isActive: false }, { name: "paypal", isActive: false }, { name: "payu", isActive: false }, { name: "stripe", isActive: false },
                ]).map((gw: any) => (
                  <div key={gw.name} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3"><CreditCard className="w-5 h-5 text-slate-500" /><div><p className="text-sm font-medium text-[#0f172a] capitalize">{gw.name}</p><p className="text-xs text-slate-500">Gateway integration status</p></div></div>
                    <button onClick={() => toggleGateway(gw.name, gw.isActive)} className="transition-transform active:scale-95">{gw.isActive ? <ToggleRight className="w-8 h-8 text-[#00b7ff]" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}</button>
                  </div>
                ))}
              </div>
            )}
            {panel("Pricing Engine Notice", <DollarSign className="w-5 h-5 text-[#00b7ff]" />,
              <div className="text-sm text-slate-700">
                <p>Profit margins are now managed per-category. Go to the <strong>Margins</strong> tab to configure markups for VPS, Dedicated, Hosting, IP Add-ons, and Licenses individually.</p>
                <p className="mt-2 text-slate-500">Plan-specific overrides can be set in the <strong>Catalog</strong> tab.</p>
              </div>
            )}
          </div>
        )}

        {/* ===== MARGINS ===== */}
        {tab === "margins" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">Category Profit Margins</h2>
              <button onClick={() => loadTabData("margins")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center"><Percent className="w-5 h-5 text-[#00b7ff]" /></div>
                    <div><p className="text-sm font-medium text-[#0f172a]">{cat.replace("_", " ")}</p><p className="text-xs text-slate-500">Default markup %</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="number" value={margins[cat] ?? 20} onChange={(e) => handleMarginChange(cat, e.target.value)} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
                    <button onClick={() => saveMargin(cat)} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Save</button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">Applied to all {cat.replace("_", " ").toLowerCase()} plans on next sync.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== COUPONS ===== */}
        {tab === "coupons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">Discount Coupons</h2>
              <button onClick={() => loadTabData("coupons")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
            </div>
            {panel("Create / Update coupon", <Tag className="w-5 h-5 text-[#00b7ff]" />,
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input placeholder="CODE (e.g. LAUNCH20)" value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm uppercase outline-none" />
                <select value={couponForm.discountType} onChange={(e) => setCouponForm((f) => ({ ...f, discountType: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none">
                  <option value="percent">Percent %</option>
                  <option value="fixed">Fixed amount</option>
                </select>
                <input type="number" placeholder={couponForm.discountType === "percent" ? "Value (%)" : "Value (amount)"} value={couponForm.value} onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none" />
                <input type="number" placeholder="Max uses (blank=∞)" value={couponForm.maxUses} onChange={(e) => setCouponForm((f) => ({ ...f, maxUses: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none" />
                <input type="number" placeholder="Per-user limit" value={couponForm.perUserLimit} onChange={(e) => setCouponForm((f) => ({ ...f, perUserLimit: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none" />
                <input type="number" placeholder="Min order (blank=any)" value={couponForm.minOrderAmount} onChange={(e) => setCouponForm((f) => ({ ...f, minOrderAmount: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none" />
                <select value={couponForm.appliesToCategory} onChange={(e) => setCouponForm((f) => ({ ...f, appliesToCategory: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none">
                  <option value="">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2.5 text-sm outline-none" />
              </div>
            )}
            <div className="flex justify-end -mt-2">
              <button onClick={async () => {
                try {
                  await api.admin.upsertCoupon({ code: couponForm.code, discountType: couponForm.discountType, value: parseFloat(couponForm.value), maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null, perUserLimit: parseInt(couponForm.perUserLimit) || 1, minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : null, appliesToCategory: couponForm.appliesToCategory || null, expiresAt: couponForm.expiresAt || null, isActive: couponForm.isActive });
                  showToast("Coupon saved", "success");
                  setCouponForm({ code: "", discountType: "percent", value: "", maxUses: "", perUserLimit: "1", minOrderAmount: "", appliesToCategory: "", expiresAt: "", isActive: true });
                  loadTabData("coupons");
                } catch (e: any) { showToast(e.message, "error"); }
              }} className="flex items-center gap-2 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-5 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20"><Save className="w-4 h-4" />Save coupon</button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100/80 text-left text-xs font-bold uppercase text-slate-500">
                  <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th><th className="px-4 py-3">Uses</th><th className="px-4 py-3">Min order</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Expires</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="bg-white/60">
                      <td className="px-4 py-3 font-mono font-bold text-[#0f172a]">{c.code}</td>
                      <td className="px-4 py-3">{c.discountType === "percent" ? `${c.value}%` : c.value}</td>
                      <td className="px-4 py-3">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""} ({c.perUserLimit}/user)</td>
                      <td className="px-4 py-3">{c.minOrderAmount || "—"}</td>
                      <td className="px-4 py-3">{c.appliesToCategory || "All"}</td>
                      <td className="px-4 py-3">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={async () => { await api.admin.upsertCoupon({ code: c.code, discountType: c.discountType, value: c.value, isActive: !c.isActive }); loadTabData("coupons"); }} className={`text-xs font-bold ${c.isActive ? "text-emerald-600" : "text-slate-400"}`}>{c.isActive ? "ACTIVE" : "OFF"}</button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={async () => { if (confirm(`Delete ${c.code}?`)) { await api.admin.deleteCoupon(c.id); loadTabData("coupons"); } }} className="text-xs font-bold text-red-500 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {coupons.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-500">No coupons yet — create one above.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== DOMAIN TLDS ===== */}
        {tab === "domain-tlds" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Domain TLD Pricing & Markup</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search TLDs..." value={domainTldSearch} onChange={(e) => setDomainTldSearch(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none w-64" />
                </div>
                <button onClick={() => loadTabData("domain-tlds")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domainTlds.filter((d: any) => !domainTldSearch || d.tld.toLowerCase().includes(domainTldSearch.toLowerCase())).map((config: any) => {
                const tld = config.tld;
                return (
                  <div key={tld} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center"><Globe className="w-5 h-5 text-[#00b7ff]" /></div>
                      <div><p className="text-sm font-medium text-[#0f172a]">{tld}</p><p className="text-xs text-slate-500">Domain extension</p></div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-slate-500">Base Cost</label>
                        <input type="number" value={config.baseCost ?? 0} onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) setDomainTlds((prev) => prev.map((d) => d.tld === tld ? { ...d, baseCost: val } : d)); }} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500">Margin %</label>
                        <input type="number" value={config.marginPercent ?? 20} onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) setDomainTlds((prev) => prev.map((d) => d.tld === tld ? { ...d, marginPercent: val } : d)); }} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={!!config.isActive} onChange={(e) => { const checked = e.target.checked; setDomainTlds((prev) => prev.map((d) => d.tld === tld ? { ...d, isActive: checked } : d)); }} className="rounded bg-slate-100 border-slate-200" />
                        <span className="text-xs text-slate-500">Active</span>
                      </div>
                      <button onClick={async () => { const c = domainTlds.find((d) => d.tld === tld) || { tld, baseCost: 0, marginPercent: 20, isActive: true }; try { await api.admin.updateDomainTld({ tld, baseCost: c.baseCost, marginPercent: c.marginPercent, isActive: c.isActive }); showToast(`Saved ${tld}`, "success"); } catch (e: any) { showToast("Failed: " + e.message, "error"); } }} className="w-full rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Save {tld}</button>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Customer price: {config.finalPrice?.toFixed(2)} {config.currency || "USD"}
                    </p>
                  </div>
                );
              })}
            </div>
            {domainTlds.length === 0 && !domainTldSearch && (
              <p className="text-sm text-slate-500">No TLD catalog found. Sync provider plans first.</p>
            )}
          </div>
        )}

        {/* ===== CUSTOMER DOMAINS ===== */}
        {tab === "customer-domains" && (
          <AdminDomainManager />
        )}

        {/* ===== CATALOG ===== */}
        {tab === "catalog" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Plan Catalog Manager</h2>
              <div className="flex items-center gap-3">
                <select value={catalogCategory} onChange={(e) => setCatalogCategory(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search plans..." value={catalogSearch} onChange={(e) => setCatalogSearch(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none w-64" />
                </div>
                <button onClick={() => loadTabData("catalog")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 text-[#00b7ff] animate-spin" /></div>
            ) : (
              <div className="space-y-4">
                {catalogPlans.map((plan) => (
                  <div key={plan.planCode} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-[#0f172a]">{plan.invoiceName}</h3>
                          <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#b500ff]/10 text-[#b500ff]">{plan.category}</span>
                          {plan.isActive ? <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#00ff88]/10 text-[#00ff88]">Active</span> : <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/10 text-red-600">Inactive</span>}
                        </div>
                        <p className="text-xs text-slate-500 font-mono">{plan.planCode}</p>
                        <p className="text-sm text-slate-500 mt-1">{plan.description || "No description"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {plan.cpuCores && <div className="rounded-lg bg-slate-100/60 border border-white/5 px-3 py-2"><p className="text-xs text-slate-500">CPU</p><p className="text-sm text-[#0f172a] font-medium">{plan.cpuCores} vCores</p></div>}
                      {plan.ramGb && <div className="rounded-lg bg-slate-100/60 border border-white/5 px-3 py-2"><p className="text-xs text-slate-500">RAM</p><p className="text-sm text-[#0f172a] font-medium">{plan.ramGb} GB</p></div>}
                      {plan.diskGb && <div className="rounded-lg bg-slate-100/60 border border-white/5 px-3 py-2"><p className="text-xs text-slate-500">Disk</p><p className="text-sm text-[#0f172a] font-medium">{plan.diskGb} GB {plan.diskType}</p></div>}
                      {plan.bandwidthMbps && <div className="rounded-lg bg-slate-100/60 border border-white/5 px-3 py-2"><p className="text-xs text-slate-500">Bandwidth</p><p className="text-sm text-[#0f172a] font-medium">{plan.bandwidthMbps} Mbps</p></div>}
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Pricing by Duration</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {plan.durations.map((dur) => (
                          <div key={dur.durationLabel} className="rounded-lg border border-slate-200 bg-slate-100/60 px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">{dur.interval} {dur.intervalUnit}</span>
                              <span className="text-xs text-[#00b7ff] font-medium">${dur.finalPrice.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-slate-500">Raw: ${dur.rawPrice.toFixed(2)} {plan.currency}</p>
                          </div>
                        ))}
                        {plan.durations.length === 0 && <p className="text-xs text-slate-500 col-span-3">No pricing data synced yet.</p>}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-100/40 p-4">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Custom Override</p>
                      {(() => {
                        const [op, setOp] = useState(plan.overridePrice?.toString() || "");
                        const [om, setOm] = useState(plan.overrideMargin?.toString() || "");
                        return (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex-1 min-w-[140px]"><label className="text-xs text-slate-500">Fixed Price</label><input type="number" value={op} onChange={(e) => setOp(e.target.value)} placeholder="Auto" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                            <div className="flex-1 min-w-[140px]"><label className="text-xs text-slate-500">Margin %</label><input type="number" value={om} onChange={(e) => setOm(e.target.value)} placeholder="Auto" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" /></div>
                            <button onClick={() => handlePlanOverride(plan.planCode, op, om)} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all mt-4 md:mt-0">Save Override</button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                {catalogPlans.length === 0 && <div className="text-center py-12 text-slate-500">No plans found. Run Sync Plans from Overview.</div>}
              </div>
            )}
          </div>
        )}

        {/* ===== SUBSCRIPTIONS ===== */}
        {tab === "subscriptions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Subscription Lifecycle</h2>
              <div className="flex items-center gap-3">
                <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
                <select value={subFilter} onChange={(e) => setSubFilter(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <button onClick={() => loadTabData("subscriptions")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Category</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">User</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Plan</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Cycle</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Next Bill</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Auto-Renew</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3 text-sm text-[#0f172a]">{sub.name}</td>
                        <td className="px-6 py-3"><span className="rounded-full px-2 py-0.5 text-xs font-medium bg-[#b500ff]/10 text-[#b500ff]">{sub.category}</span></td>
                        <td className="px-6 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sub.status === "ACTIVE" ? "bg-[#00ff88]/10 text-[#00ff88]" : sub.status === "SUSPENDED" ? "bg-yellow-500/10 text-yellow-700" : sub.status === "PENDING" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-600"}`}>{sub.status}</span></td>
                        <td className="px-6 py-3 text-sm text-slate-700">{sub.user?.name || sub.userId.slice(0, 8)}</td>
                        <td className="px-6 py-3 text-sm text-slate-500 font-mono">{sub.planCode || "—"}</td>
                        <td className="px-6 py-3 text-sm text-slate-500">{sub.billingCycle}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{sub.nextBillDate ? new Date(sub.nextBillDate).toLocaleDateString() : "—"}</td>
                        <td className="px-6 py-3">{sub.autoRenew ? <CheckCircle className="w-4 h-4 text-[#00ff88]" /> : <XCircle className="w-4 h-4 text-red-600" />}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleLifecycle(sub.id, "renew")} title="Renew" className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 px-2 py-1.5 text-xs text-[#00ff88] hover:bg-[#00ff88]/20 transition-all"><RotateCcw className="w-3.5 h-3.5" /></button>
                            {sub.status === "ACTIVE" && <button onClick={() => handleLifecycle(sub.id, "suspend")} title="Suspend" className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5 text-xs text-yellow-700 hover:bg-yellow-500/20 transition-all"><Ban className="w-3.5 h-3.5" /></button>}
                            {sub.status === "SUSPENDED" && <button onClick={() => handleLifecycle(sub.id, "unsuspend")} title="Unsuspend" className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20 transition-all"><Play className="w-3.5 h-3.5" /></button>}
                            {(sub.status === "ACTIVE" || sub.status === "SUSPENDED") && <button onClick={() => handleLifecycle(sub.id, "terminate")} title="Terminate" className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5 text-xs text-red-600 hover:bg-red-500/20 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>}
                            <button onClick={() => setViewingServer(sub.id)} title="Manage" className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-2 py-1.5 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Manage</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && <tr><td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">No subscriptions found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            {viewingServer && <AdminServerModal subscriptionId={viewingServer} onClose={() => setViewingServer(null)} />}
          </div>
        )}

        {/* ===== SUSPENSION QUEUE ===== */}
        {tab === "suspensions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-[#0f172a]">Suspension Queue</h2>
                <p className="text-xs text-slate-500 mt-1">Subscriptions past their bill date {suspensionQueue?.autoSuspendEnabled ? "(auto-suspend is ON — these suspend ~12h overdue)" : "(auto-suspend is OFF — review manually)"}</p>
              </div>
              <button onClick={() => loadTabData("suspensions")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-100/50"><h3 className="font-bold text-[#0f172a]">Overdue subscriptions ({suspensionQueue?.overdueSubscriptions?.length ?? 0})</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Service</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Due</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Overdue</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                  </tr></thead>
                  <tbody>
                    {(suspensionQueue?.overdueSubscriptions || []).map((s: any) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-slate-100/50">
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{s.user?.name || "—"}<br/><span className="text-slate-500">{s.user?.email}</span></td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{s.service}<br/><span className="text-slate-500 font-mono">{s.planCode}</span></td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{s.currency} {Number(s.amount).toFixed(2)}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}</td>
                        <td className="px-6 py-3"><span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600">{s.daysOverdue}d</span></td>
                        <td className="px-6 py-3">
                          {s.protected ? (
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Protected</span>
                          ) : (
                            <button onClick={async () => { if (!confirm(`Suspend ${s.service} for ${s.user?.email}?`)) return; try { await api.admin.suspendSubscription(s.id); showToast("Suspended", "success"); loadTabData("suspensions"); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1.5 text-xs text-red-600 hover:bg-red-500/20 transition-all">Suspend</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!suspensionQueue || suspensionQueue.overdueSubscriptions?.length === 0) && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">Queue is clear — nothing overdue.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-100/50"><h3 className="font-bold text-[#0f172a]">Overdue unpaid invoices ({suspensionQueue?.overdueInvoices?.length ?? 0})</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Invoice</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Due</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Overdue</th>
                  </tr></thead>
                  <tbody>
                    {(suspensionQueue?.overdueInvoices || []).map((i: any) => (
                      <tr key={i.id} className="border-b border-white/5 hover:bg-slate-100/50">
                        <td className="px-6 py-3 text-xs font-mono text-[#0f172a]">{i.number}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{i.user?.email}</td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{i.currency} {Number(i.amount).toFixed(2)}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "—"}</td>
                        <td className="px-6 py-3"><span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-600">{i.daysOverdue}d</span></td>
                      </tr>
                    ))}
                    {(!suspensionQueue || suspensionQueue.overdueInvoices?.length === 0) && <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">No overdue invoices.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== ORDERS ===== */}
        {tab === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Order Management</h2>
              <div className="flex items-center gap-2">
                <select value={ordersFilter} onChange={(e) => { setOrdersFilter(e.target.value); setOrdersPage(1); }} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-6 py-3 text-xs font-semibold text-slate-500">Order ID</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Plan</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th></tr></thead>
                  <tbody>
                    {orders.map((o: any) => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3 text-xs text-[#0f172a] font-mono">{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{o.user?.name || 'N/A'}<br/><span className="text-slate-500">{o.user?.email}</span></td>
                        <td className="px-6 py-3 text-xs text-slate-500">{o.displayName || o.planCode || 'N/A'}<br/><span className="text-slate-500">{o.category}</span></td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{getCurrencySymbol(o.currency)}{o.customerAmount?.toFixed(2) || o.amount?.toFixed(2)} {o.currency}</td>
                        <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${o.status === 'COMPLETED' ? 'bg-[#00ff88]/10 text-[#00ff88]' : o.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-700' : o.status === 'PROCESSING' ? 'bg-[#00b7ff]/10 text-[#00b7ff]' : 'bg-red-500/10 text-red-600'}`}>{o.status}</span></td>
                        <td className="px-6 py-3 text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">
                          <div className="flex gap-2">
                            {o.paymentTransactionId && o.paymentGateway === "manual" && o.status !== "COMPLETED" && (
                              <button onClick={() => handleFulfillPayment(o.paymentTransactionId)} className="rounded bg-[#0f0c29] px-2 py-1 text-xs font-bold text-white hover:bg-[#302b63]">Fulfill</button>
                            )}
                            {(o.status === 'FAILED' || o.status === 'PROVISIONING_FAILED') && (
                              <button onClick={() => handleRetryProvision(o.id)} className="rounded bg-[#00b7ff] px-2 py-1 text-xs font-bold text-white hover:bg-[#0f0c29]">Retry</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">No orders found.</td></tr>}
                  </tbody>
                </table>
              </div>
              {ordersTotal > 20 && (
                <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Showing {((ordersPage - 1) * 20) + 1}-{Math.min(ordersPage * 20, ordersTotal)} of {ordersTotal}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))} disabled={ordersPage === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/50 disabled:opacity-30"><ChevronLeft className="w-3 h-3" /></button>
                    <span className="text-xs text-slate-500">Page {ordersPage}</span>
                    <button onClick={() => setOrdersPage(ordersPage + 1)} disabled={ordersPage * 20 >= ordersTotal} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100/50 disabled:opacity-30"><ChevronRight className="w-3 h-3" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== INVOICES ===== */}
        {tab === "invoices" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Billing & Invoices</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleExportSales} className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 px-3 py-2 text-xs font-medium text-[#00a86b] hover:bg-[#00ff88]/20 transition-all">Export Sales CSV</button>
                <select value={invoicesFilter} onChange={(e) => setInvoicesFilter(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <button onClick={() => loadTabData("invoices")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Invoice #</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Customer</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Order</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Due</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv: any) => (
                      <tr key={inv.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3 text-xs text-[#0f172a] font-mono">{inv.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{inv.user?.name || 'N/A'}<br/><span className="text-slate-500">{inv.user?.email}</span></td>
                        <td className="px-6 py-3 text-xs text-slate-500">{inv.orderId ? inv.orderId.slice(0, 8).toUpperCase() : 'N/A'}</td>
                        <td className="px-6 py-3 text-xs text-[#0f172a]">{getCurrencySymbol(inv.currency)}{inv.amount?.toFixed(2)} {inv.currency}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${inv.status === 'PAID' ? 'bg-[#00ff88]/10 text-[#00ff88]' : inv.status === 'OVERDUE' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-700'}`}>{inv.status}</span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <a href={`${process.env.NEXT_PUBLIC_API_URL || '/api'}/admin/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-2 py-1.5 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">PDF</a>
                            {inv.status !== 'PAID' && <button onClick={async () => { try { await api.admin.updateInvoiceStatus(inv.id, { status: 'PAID' }); showToast('Marked paid', 'success'); loadTabData('invoices'); } catch (e: any) { showToast(e.message, 'error'); } }} className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 px-2 py-1.5 text-xs text-[#00ff88] hover:bg-[#00ff88]/20 transition-all">Paid</button>}
                            {inv.status !== 'OVERDUE' && <button onClick={async () => { try { await api.admin.updateInvoiceStatus(inv.id, { status: 'OVERDUE' }); showToast('Marked overdue', 'success'); loadTabData('invoices'); } catch (e: any) { showToast(e.message, 'error'); } }} className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5 text-xs text-yellow-700 hover:bg-yellow-500/20 transition-all">Overdue</button>}
                            <button onClick={async () => { setSendingInvoice(inv.id); try { await api.admin.sendInvoiceEmail(inv.id); showToast('Invoice emailed', 'success'); } catch (e: any) { showToast(e.message, 'error'); } finally { setSendingInvoice(null); } }} disabled={sendingInvoice === inv.id} className="rounded-lg bg-[#b500ff]/10 border border-[#b500ff]/30 px-2 py-1.5 text-xs text-[#b500ff] hover:bg-[#b500ff]/20 transition-all disabled:opacity-50">{sendingInvoice === inv.id ? 'Sending...' : 'Email'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">No invoices found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== SUPPORT TICKETS ===== */}
        {tab === "support" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-[#0f172a]">Support Tickets</h2>
              <div className="flex items-center gap-2">
                <select value={supportFilter} onChange={(e) => setSupportFilter(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Status</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button onClick={() => loadTabData("support")} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Subject</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Category</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">User</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supportTickets.map((t: any) => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3 text-sm text-[#0f172a]">{t.subject}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{t.category}</td>
                        <td className="px-6 py-3 text-xs text-slate-700">{t.name}<br/><span className="text-slate-500">{t.email}</span></td>
                        <td className="px-6 py-3"><span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t.status === "OPEN" ? "bg-[#00b7ff]/10 text-[#00b7ff]" : t.status === "IN_PROGRESS" ? "bg-yellow-500/10 text-yellow-700" : t.status === "RESOLVED" ? "bg-[#00ff88]/10 text-[#00ff88]" : "bg-gray-500/10 text-slate-500"}`}>{t.status}</span></td>
                        <td className="px-6 py-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            {t.status === "OPEN" && <button onClick={async () => { try { const f = new FormData(); f.append("status", "IN_PROGRESS"); await api.support.updateStatus(t.id, f); loadTabData("support"); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2 py-1.5 text-xs text-yellow-700 hover:bg-yellow-500/20 transition-all">Start</button>}
                            {(t.status === "OPEN" || t.status === "IN_PROGRESS") && <button onClick={async () => { try { const f = new FormData(); f.append("status", "RESOLVED"); await api.support.updateStatus(t.id, f); loadTabData("support"); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20 px-2 py-1.5 text-xs text-[#00ff88] hover:bg-[#00ff88]/20 transition-all">Resolve</button>}
                            <button onClick={async () => { try { const f = new FormData(); f.append("status", "CLOSED"); await api.support.updateStatus(t.id, f); loadTabData("support"); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded-lg bg-gray-500/10 border border-gray-500/20 px-2 py-1.5 text-xs text-slate-500 hover:bg-gray-500/20 transition-all">Close</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {supportTickets.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">No support tickets found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===== LOGS ===== */}
        {tab === "logs" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">System Log Tracker</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-4 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                  <option value="ALL">All Types</option><option value="INFO">Info</option><option value="ERROR">Error</option><option value="WARNING">Warning</option><option value="PAYMENT_WEBHOOK">Payment</option><option value="PROVIDER_API">Provider API</option><option value="CRON">Cron</option>
                </select>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-6 py-3 text-xs font-semibold text-slate-500">Type</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Message</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Time</th></tr></thead>
                  <tbody>
                    {logs.filter((l) => logFilter === "ALL" || l.type === logFilter).map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${log.type === "ERROR" ? "bg-red-500/10 text-red-600" : log.type === "WARNING" ? "bg-yellow-500/10 text-yellow-700" : log.type === "PAYMENT_WEBHOOK" ? "bg-[#00b7ff]/10 text-[#00b7ff]" : log.type === "PROVIDER_API" ? "bg-[#b500ff]/10 text-[#b500ff]" : "bg-[#00ff88]/10 text-[#00ff88]"}`}>
                            {log.type === "ERROR" && <AlertTriangle className="w-3 h-3" />}{log.type === "PROVIDER_API" && <Server className="w-3 h-3" />}{log.type === "PAYMENT_WEBHOOK" && <CreditCard className="w-3 h-3" />}{log.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-700">{log.message}</td>
                        <td className="px-6 py-3 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-sm text-slate-500">No logs found. System is clean.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
