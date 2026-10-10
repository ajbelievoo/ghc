"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import ServerDetailCards from "@/components/ServerDetailCards";
import DomainDnsPanel from "@/components/DomainDnsPanel";
import SshKeysCard from "@/components/SshKeysCard";
import OrderProgress from "@/components/OrderProgress";
import LoginHistoryCard from "@/components/LoginHistoryCard";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServerMetricsChart from "@/components/ServerMetricsChart";
import OrderHub from "@/components/OrderHub";
import ProductHub from "@/components/ProductHub";
import DomainOrderWizard from "@/components/DomainOrderWizard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Server,
  Activity,
  Power,
  RotateCcw,
  Square,
  Play,
  Monitor,
  FileText,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  HardDrive,
  Wifi,
  Loader2,
  DollarSign,
  Globe,
  MapPin,
  Lock,
  Network,
  Clock,
  BarChart3,
  X,
  Mail,
  Trash2,
  Database,
  Search,
  Check,
  User,
  Key,
  Bell,
  Layers,
  Plus,
  MessageSquare,
  Wallet,
  Download,
  Filter,
  SlidersHorizontal,
  MoreVertical,
  ChevronDown,
  ArrowRightLeft,
  CreditCard,
} from "lucide-react";

type Tab = "overview" | "servers" | "domains" | "invoices" | "wallet" | "support" | "security" | "profile";

interface ServerInstance {
  id: string;
  name: string;
  displayName?: string;
  planCode?: string;
  providerResourceId: string | null;
  ipAddress: string | null;
  rootPassword: string | null;
  osTemplate: string;
  status: string;
  category: string;
  nextBillDate: string;
  priceAmount: number;
  expiresAt: string;
  additional_ips?: any[];
  suspensionReason?: string | null;
  suspension_reason?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [activeView, setActiveView] = useState<string | null>(null);
  const [launchParam, setLaunchParam] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [servers, setServers] = useState<ServerInstance[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [carbon, setCarbon] = useState<any>(null);
  const [ping, setPing] = useState<any>(null);
  const [pingHistory, setPingHistory] = useState<any[]>([]);
  const [serverDetail, setServerDetail] = useState<any>(null);
  const [additionalIps, setAdditionalIps] = useState<any[]>([]);
  const [ipPrice, setIpPrice] = useState<any>(null);
  const [buyingIp, setBuyingIp] = useState(false);
  const [loading, setLoading] = useState(true);
  // Security / Team states
  const [twoFactorQr, setTwoFactorQr] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState("");
  const [teamData, setTeamData] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<string[]>(["VIEW_SERVERS"]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [osTemplate, setOsTemplate] = useState("ubuntu22.04");
  const [planName, setPlanName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFamily, setSelectedFamily] = useState<string>("");
  const [durationLabel, setDurationLabel] = useState("1_month");
  const [gateway, setGateway] = useState("stripe");
  const [plans, setPlans] = useState<any[]>([]);
  const [activeGateways, setActiveGateways] = useState<string[]>([]);
  const [payPrefs, setPayPrefs] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("50");
  const [myDomains, setMyDomains] = useState<any[]>([]);
  const [managingDomain, setManagingDomain] = useState<string | null>(null);
  const [domainQuery, setDomainQuery] = useState("");
  const [domainResult, setDomainResult] = useState<any>(null);
  const [domainResults, setDomainResults] = useState<any[]>([]);
  const [domainLoading, setDomainLoading] = useState(false);
  const [selectedDomainTld, setSelectedDomainTld] = useState<any>(null);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
  const [domainPaymentMessage, setDomainPaymentMessage] = useState<{amount: number, currency: string, instructions: string, txId: string} | null>(null);
  const [domainMenuId, setDomainMenuId] = useState<string | null>(null);
  const [domainColsOpen, setDomainColsOpen] = useState(false);
  const [domainCols, setDomainCols] = useState({ technical: true, renewal: true, operations: true, registrant: true });
  const [domainTableQuery, setDomainTableQuery] = useState("");
  const [domainWizard, setDomainWizard] = useState<string | null>(null);
  const [transferDomain, setTransferDomain] = useState("");
  const [transferCode, setTransferCode] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsTotal, setTicketsTotal] = useState(0);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("GENERAL");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSending, setTicketSending] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketFiles, setTicketFiles] = useState<FileList | null>(null);
  const [ticketReplyFiles, setTicketReplyFiles] = useState<FileList | null>(null);

  const [activity, setActivity] = useState<any[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState<any>({ orderUpdates: true, invoiceReminders: true, supportReplies: true, promotions: false, securityAlerts: true });
  const [notifList, setNotifList] = useState<any[]>([]);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [serviceStatus, setServiceStatus] = useState<any>(null);
  const [referral, setReferral] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    api.auth.me()
      .then((data: any) => {
        if (!data.user) { router.push("/login"); return; }
        setUser(data.user);
        setProfile({ name: data.user.name || "", phone: data.user.phone || "" });
        localStorage.setItem("user", JSON.stringify(data.user));
        const params = new URLSearchParams(window.location.search);
        const requestedTab = params.get("tab") as Tab | null;
        const requestedCategory = params.get("category");
        const requestedPlan = params.get("plan");
        const requestedFamily = params.get("family");
        const requestedView = params.get("view");
        const requestedLaunch = params.get("launch");
        if (requestedView) setActiveView(requestedView);
        if (requestedLaunch) setLaunchParam(requestedLaunch);
        if (requestedTab && ["overview", "servers", "domains", "invoices", "wallet", "support", "security", "profile"].includes(requestedTab)) setTab(requestedTab);
        const requestedDomain = params.get("domain");
        if (requestedDomain) {
          setDomainQuery(requestedDomain);
          setTab("domains");
          setDomainWizard(requestedDomain);
        }
        fetchData();
        if (requestedCategory) fetchPlansCategory(requestedCategory, requestedPlan, requestedFamily);
        else fetchPlans();
        fetchGateways();
        fetchWallet();
        fetchMyDomains();
        fetchNotifications();
        handlePaymentReturn();
      })
      .catch(() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); });
    const onCurrency = () => {
      fetchData();
      fetchPlans();
      fetchWallet();
      fetchMyDomains();
      if (tab === "domains") setTimeout(() => handleCheckDomain(), 0);
      if (selectedServer) setTimeout(() => fetchMetrics(selectedServer), 0);
    };
    window.addEventListener("currencychange", onCurrency);
    return () => window.removeEventListener("currencychange", onCurrency);
  }, [router, currency]);

  // Auto-refresh live metrics every 5 seconds when a server is selected
  useEffect(() => {
    if (!selectedServer) return;
    const interval = setInterval(() => {
      fetchMetrics(selectedServer);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedServer]);

  const handlePaymentReturn = () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");
    if (payment === "success" && sessionId) {
      setPaymentMessage("Payment successful! Processing your transaction...");
      api.payments.getSession(sessionId)
        .then(() => { setPaymentMessage("Transaction completed successfully!"); fetchWallet(); fetchData(); fetchMyDomains(); })
        .catch((e: any) => setPaymentMessage("Payment verification failed: " + e.message));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === "cancelled") {
      setPaymentMessage("Payment was cancelled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // ============ 2FA ============
  const handleSetup2FA = async () => {
    setSecurityLoading(true);
    try {
      const res = await api.auth.setup2FA();
      setTwoFactorQr(res.qrCode);
      setTwoFactorSecret(res.secret);
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  const handleConfirm2FA = async () => {
    setSecurityLoading(true);
    try {
      await api.auth.confirm2FA({ code: twoFactorCodeInput });
      setTwoFactorQr(null);
      setTwoFactorSecret(null);
      setTwoFactorCodeInput("");
      showToast("2FA enabled successfully!", "success");
      api.auth.me().then((data: any) => setUser(data.user));
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  const handleDisable2FA = async () => {
    setSecurityLoading(true);
    try {
      await api.auth.disable2FA({ code: twoFactorCodeInput });
      setTwoFactorCodeInput("");
      showToast("2FA disabled.", "success");
      api.auth.me().then((data: any) => setUser(data.user));
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  // ============ Team ============
  const fetchTeam = async () => {
    try {
      const data = await api.team.getMyTeam();
      setTeamData(data);
    } catch (e) { console.error(e); }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setSecurityLoading(true);
    try {
      await api.team.inviteMember({ inviteeEmail: inviteEmail, permissions: invitePermissions });
      setInviteEmail("");
      setInvitePermissions(["VIEW_SERVERS"]);
      fetchTeam();
      showToast("Invitation sent!", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  const handleAcceptInvite = async (token: string) => {
    setSecurityLoading(true);
    try {
      await api.team.acceptInvitation({ token });
      fetchTeam();
      showToast("Invitation accepted!", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  const handleRejectInvite = async (token: string) => {
    setSecurityLoading(true);
    try {
      await api.team.rejectInvitation({ token });
      fetchTeam();
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  const handleRevokeAccess = async (memberId: string) => {
    if (!confirm("Revoke this member's access?")) return;
    setSecurityLoading(true);
    try {
      await api.team.revokeAccess({ memberId });
      fetchTeam();
    } catch (e: any) { showToast(e.message, "error"); }
    setSecurityLoading(false);
  };

  useEffect(() => {
    if (tab === "security") fetchTeam();
    if (tab === "support") fetchTickets();
  }, [tab]);

  const DEDICATED_FAMILIES: Record<string, string> = {
    rise: "Kimufi",
    advance: "Advance",
    game: "Game",
    scale: "Scale",
    highGrade: "High Grade",
  };

  const getPlanLabel = (plan: any) => {
    const price = plan.durations?.[0]?.finalPrice;
    const specs = [
      plan.cpuCores ? `${plan.cpuCores} vCPU` : null,
      plan.ramGb ? `${plan.ramGb}GB RAM` : null,
      plan.diskGb ? `${plan.diskGb}GB ${plan.diskType || "SSD"}` : null,
    ].filter(Boolean).join(" / ");
    return `${plan.invoiceName || plan.planCode}${specs ? ` - ${specs}` : ""}${price ? ` - ${getCurrencySymbol(plan.currency || currency)}${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${plan.currency || currency}` : ""}`;
  };

  const fetchPlans = async () => {
    try {
      const p = await api.server.plans();
      setPlans(p || []);
      if (p && p.length > 0 && !planName) setPlanName(p[0].planCode);
    } catch (e) { console.error(e); }
  };
  const fetchPlansCategory = async (category: string, requestedPlan?: string | null, family?: string | null) => {
    setSelectedCategory(category);
    if (family) setSelectedFamily(family);
    else setSelectedFamily("");
    try {
      const p = await api.server.plans(category, family || undefined);
      setPlans(p || []);
      const matchingPlan = requestedPlan && p?.some((plan: any) => plan.planCode === requestedPlan) ? requestedPlan : p?.[0]?.planCode || "";
      setPlanName(matchingPlan);
      setDurationLabel("1_month");
    } catch (e) { console.error(e); }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvList, invList, ordList, act, anns, status, ref] = await Promise.all([
        api.server.list(),
        api.billing.invoices(),
        api.orders.list().catch(() => []),
        api.auth.activity().catch(() => []),
        api.public.announcements().catch(() => []),
        api.public.status().catch(() => null),
        api.auth.referral().catch(() => null),
      ]);
      setServers(srvList || []);
      setInvoices(invList || []);
      setOrdersList(ordList || []);
      setActivity(act || []);
      setAnnouncements(anns || []);
      setServiceStatus(status);
      setReferral(ref);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Unauthorized") || e.message?.includes("Forbidden")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };
  const fetchGateways = async () => {
    try {
      const gws = await api.server.gateways();
      const active = (gws || []).filter((g: any) => g.isActive).map((g: any) => g.name);
      setActiveGateways(active);
      const prefs = await api.auth.paymentPreferences().catch(() => null);
      if (prefs) setPayPrefs(prefs);
      const preferred = prefs?.preferredGateway && active.includes(prefs.preferredGateway) ? prefs.preferredGateway : active[0];
      if (preferred) setGateway(preferred);
    } catch (e) { console.error(e); }
  };
  const fetchWallet = async () => {
    try {
      const [w, txs] = await Promise.all([api.billing.wallet(), api.billing.walletTransactions().catch(() => [])]);
      setWallet(w);
      setWalletTransactions(txs || []);
    } catch (e) { console.error(e); }
  };
  const fetchNotifications = async () => {
    try {
      const n = await api.auth.notifications();
      setNotifications(n);
      const list = await api.auth.notificationsList().catch(() => []);
      setNotifList(list || []);
    } catch (e) { console.error(e); }
  };
  const fetchMyDomains = async () => {
    try {
      const d = await api.server.myDomains();
      setMyDomains(d || []);
    } catch (e) { console.error(e); }
  };
  const handleDeposit = async (amt?: number) => {
    const amount = amt || parseFloat(depositAmount);
    if (!amount || amount <= 0) { showToast("Enter a valid amount", "error"); return; }
    try {
      const res = await api.payments.createCheckoutSession({ type: "WALLET_DEPOSIT", amount, gateway, currency });
      if (res.paid) {
        showToast("Wallet funded", "success");
        fetchWallet();
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Could not initiate payment. No checkout URL returned.", "error");
      }
    } catch (e: any) { showToast("Deposit failed: " + e.message, "error"); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.auth.updateMe({ name: profile.name, phone: profile.phone });
      setUser(res.user);
      localStorage.setItem("user", JSON.stringify(res.user));
      showToast("Profile saved", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSavingProfile(false); }
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotifications(true);
    try {
      await api.auth.updateNotifications(notifications);
      showToast("Notification preferences saved", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSavingNotifications(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { showToast("Passwords do not match", "error"); return; }
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showToast("Password changed", "success");
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const handlePayInvoice = async (inv: any) => {
    if (!gateway) { showToast("Select a payment gateway in wallet tab", "error"); return; }
    setPayingInvoice(inv.id);
    try {
      const res = await api.billing.payInvoice(inv.id, gateway);
      if (res.paid) {
        showToast("Invoice paid from wallet", "success");
        fetchData();
        fetchWallet();
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Payment could not be initiated", "error");
      }
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setPayingInvoice(null); }
  };

  const handleCheckDomain = async (query?: string) => {
    const search = (query ?? domainQuery).trim();
    if (!search) return;
    setDomainLoading(true);
    setDomainResults([]);
    setSelectedDomainTld(null);
    try {
      const r = await api.server.checkDomain(search);
      setDomainResults(Array.isArray(r?.results) ? r.results : r ? [r] : []);
    } catch (e: any) { showToast("Check failed: " + e.message, "error"); }
    finally { setDomainLoading(false); }
  };
  const handleRenewDomain = async (d: any) => {
    if (!gateway || !activeGateways.includes(gateway)) { showToast("Select a valid payment gateway", "error"); return; }
    try {
      const res = await api.payments.createCheckoutSession({
        type: "DOMAIN_RENEWAL",
        amount: 0,
        gateway,
        domainId: d.id,
        years: 1,
      });
      if (res.paid) {
        showToast("Domain renewed from wallet", "success");
        fetchMyDomains();
      } else if (res.manual) {
        setDomainPaymentMessage({
          amount: res.amount,
          currency: res.currency,
          instructions: res.instructions,
          txId: res.id,
        });
        showToast("Manual renewal payment instructions generated", "success");
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Could not initiate renewal payment.", "error");
      }
    } catch (e: any) { showToast("Renewal failed: " + e.message, "error"); }
  };

  const handleToggleAutoRenew = async (domainId: string) => {
    try {
      await api.server.toggleDomainAutoRenew(domainId);
      showToast("Auto-renew updated", "success");
      fetchMyDomains();
    } catch (e: any) { showToast(e.message || "Failed to update auto-renew", "error"); }
  };

  const fetchTickets = async (page = 1) => {
    setTicketsLoading(true);
    try {
      const r = await api.support.getTickets({ page, limit: 20 });
      setTickets(r.tickets || []);
      setTicketsTotal(r.total || 0);
      setTicketsPage(r.page || 1);
    } catch (e: any) { showToast("Failed to load tickets: " + e.message, "error"); }
    finally { setTicketsLoading(false); }
  };
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) { showToast("Subject and message required", "error"); return; }
    setTicketSending(true);
    try {
      const form = new FormData();
      form.append("name", user?.name || user?.email || "Customer");
      form.append("email", user?.email || "");
      form.append("category", ticketCategory);
      form.append("priority", ticketPriority);
      form.append("subject", ticketSubject.trim());
      form.append("message", ticketMessage.trim());
      if (ticketFiles) for (let i = 0; i < Math.min(ticketFiles.length, 3); i++) form.append("files", ticketFiles[i]);
      await api.support.createTicket(form);
      showToast("Support ticket created", "success");
      setTicketSubject("");
      setTicketMessage("");
      setTicketCategory("GENERAL");
      setTicketPriority("medium");
      setTicketFiles(null);
      fetchTickets();
    } catch (e: any) { showToast("Ticket failed: " + e.message, "error"); }
    finally { setTicketSending(false); }
  };
  const handleReply = async (ticketId: string) => {
    if (!ticketReply.trim()) return;
    try {
      const form = new FormData();
      form.append("message", ticketReply.trim());
      if (ticketReplyFiles) for (let i = 0; i < Math.min(ticketReplyFiles.length, 3); i++) form.append("files", ticketReplyFiles[i]);
      await api.support.addReply(ticketId, form);
      showToast("Reply sent", "success");
      setTicketReply("");
      setTicketReplyFiles(null);
      const t = await api.support.getTicket(ticketId);
      setSelectedTicket(t);
      fetchTickets();
    } catch (e: any) { showToast("Reply failed: " + e.message, "error"); }
  };

  const handleRegisterDomain = async (item: any) => {
    if (!item?.available) return;
    if (!gateway || !activeGateways.includes(gateway)) { showToast("Select a valid payment gateway", "error"); return; }
    try {
      const parts = item.domain.split('.');
      const name = parts[0];
      const tld = '.' + parts.slice(1).join('.');
      const reg = await api.server.registerDomain({
        domainName: name,
        tld,
        years: 1,
        currency,
      });
      const res = await api.payments.createCheckoutSession({
        type: "DOMAIN_REGISTRATION",
        amount: reg.totalAmount,
        gateway,
        domainId: reg.domainId,
        domainName: name,
        tld,
        years: 1,
      });
      if (res.paid) {
        showToast("Domain registered and paid from wallet!", "success");
        fetchMyDomains();
      } else if (res.manual) {
        setDomainPaymentMessage({
          amount: res.amount,
          currency: res.currency,
          instructions: res.instructions,
          txId: res.id,
        });
        showToast("Manual payment instructions generated", "success");
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Could not initiate payment. No checkout URL returned.", "error");
      }
    } catch (e: any) { showToast("Registration payment failed: " + e.message, "error"); }
  };
  const handlePayWithWallet = async () => {
    if (!planName) { showToast("Select a plan first", "error"); return; }
    try {
      await api.billing.payWithWallet({ planCode: planName, durationLabel, category: plans.find((p: any) => p.planCode === planName)?.category || "VPS", currency });
      showToast("Paid with wallet and provisioned!", "success");
      setTab("servers");
      fetchData();
      fetchWallet();
    } catch (e: any) { showToast("Payment failed: " + e.message, "error"); }
  };

  const fetchMetrics = async (id: string) => {
    try {
      const [m, hist, detail, ips, ipPriceData, carbonData, pingData, pingHist] = await Promise.all([
        api.server.metrics(id),
        api.server.metricsHistory(id),
        api.server.details(id),
        api.server.additionalIps(id),
        api.server.additionalIpPrice(id).catch(() => null),
        api.server.carbon(id).catch(() => null),
        api.server.ping(id).catch(() => null),
        api.server.pingHistory(id).catch(() => []),
      ]);
      setMetrics(m);
      setMetricsHistory(hist);
      setServerDetail(detail);
      setAdditionalIps(ips || []);
      setIpPrice(ipPriceData);
      setCarbon(carbonData);
      setPing(pingData);
      setPingHistory(pingHist || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePower = async (id: string, action: string) => {
    setActionLoading(action);
    try {
      await api.server.power(id, action);
      fetchData();
    } catch (e: any) {
      showToast("Action failed: " + e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstall = async (id: string) => {
    if (!confirm("This will WIPE all data. Continue?")) return;
    setActionLoading("reinstall");
    try {
      await api.server.reinstall(id, osTemplate);
      fetchData();
    } catch (e: any) {
      showToast("Reinstall failed: " + e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBuyAdditionalIp = async (serverId: string) => {
    if (!gateway) { showToast("Select a payment gateway first", "error"); return; }
    setBuyingIp(true);
    try {
      const res = await api.server.purchaseAdditionalIp(serverId, { gateway, currency });
      const ip = res.ip;
      const paymentRes = await api.payments.createCheckoutSession({
        type: "ADDITIONAL_IP",
        amount: ip.totalAmount,
        gateway,
        subscriptionId: serverId,
        ipId: ip.id,
      });
      if (paymentRes.paid) {
        showToast("Additional IP purchased from wallet", "success");
        fetchMetrics(serverId);
      } else if (paymentRes.manual) {
        showToast("Manual payment instructions generated", "success");
      } else if (paymentRes.checkoutUrl) {
        window.location.href = paymentRes.checkoutUrl;
      } else {
        showToast("Could not initiate payment for additional IP.", "error");
      }
    } catch (e: any) {
      showToast("Failed to purchase additional IP: " + e.message, "error");
    } finally {
      setBuyingIp(false);
    }
  };

  const handleProvision = async () => {
    setActionLoading("provision");
    try {
      const plan = plans.find((p: any) => p.planCode === planName);
      const dur = plan?.durations?.find((d: any) => d.durationLabel === durationLabel) || plan?.durations?.[0];
      if (!dur) { showToast("No pricing found for selected duration", "error"); setActionLoading(null); return; }
      const finalPrice = dur.finalPrice;
      const res = await api.payments.createCheckoutSession({
        type: "ORDER",
        amount: finalPrice,
        gateway,
        planCode: planName,
        durationLabel,
        category: plan?.category || "VPS",
      });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Could not initiate payment. No checkout URL returned.", "error");
      }
    } catch (e: any) {
      showToast("Provisioning failed: " + e.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const activeServer = servers.find((s) => s.id === selectedServer);

  const q = searchQuery.toLowerCase();
  const safeServers = Array.isArray(servers) ? servers : [];
  const safeDomains = Array.isArray(myDomains) ? myDomains : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];
  const safeTickets = Array.isArray(tickets) ? tickets : [];
  const filteredServers = useMemo(() => safeServers.filter((s) => (s.name || s.displayName || s.planCode || "").toLowerCase().includes(q) || (s.ipAddress || "").toLowerCase().includes(q) || (s.category || "").toLowerCase().includes(q)), [safeServers, q]);
  const filteredDomains = useMemo(() => {
    const tq = domainTableQuery.toLowerCase();
    return safeDomains.filter((d) =>
      ((!q && !tq) || (d.domainName || "").toLowerCase().includes(q) || (d.tld || "").toLowerCase().includes(q) || (d.status || "").toLowerCase().includes(q))
      && (!tq || (d.domain || "").toLowerCase().includes(tq) || (d.status || "").toLowerCase().includes(tq) || (d.registrantContact || "").toLowerCase().includes(tq))
    );
  }, [safeDomains, q, domainTableQuery]);

  const exportDomainsCsv = () => {
    const rows = [["Domain name", "Status", "Technical status", "Renewal frequency", "Ongoing operations", "Expiry", "Registrant contact", "Auto-renew"]];
    filteredDomains.forEach((d: any) => rows.push([d.domain, d.status, d.technicalStatus || "", d.renewalFrequency || "", String(d.ongoingOperations || 0), d.expiresAt ? new Date(d.expiresAt).toISOString().slice(0, 10) : "", d.registrantContact || "", d.autoRenew ? "yes" : "no"]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `ghc-domains-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const filteredInvoices = useMemo(() => safeInvoices.filter((i) => (i.id || "").toLowerCase().includes(q) || (i.status || "").toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q)), [safeInvoices, q]);
  const filteredTickets = useMemo(() => safeTickets.filter((t) => (t.subject || "").toLowerCase().includes(q) || (t.category || "").toLowerCase().includes(q) || (t.status || "").toLowerCase().includes(q)), [safeTickets, q]);

  if (loading) {
    return (
      <div className="ghc-dash-shell min-h-screen bg-[#0a0f1c] flex">
        <aside className="ghc-dash-sidebar w-72 border-r border-white/10 bg-[#0a0f1c] hidden lg:flex" />
        <main className="ghc-dash-main flex-1 bg-[#f4f6fb] p-6 space-y-6">
          <div className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map((i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1,2,3,4].map((i) => <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />)}
          </div>
          <div className="text-center py-4">
            <Loader2 className="w-8 h-8 text-[#00b7ff] animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading your GHC dashboard…</p>
            <p className="text-xs text-slate-400">If this takes too long, your session may have expired. <button onClick={() => window.location.href = "/login"} className="text-[#00b7ff] hover:underline">Login again</button></p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="ghc-dash-shell min-h-screen bg-[#0a0f1c] flex relative">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <DashboardSidebar
        activeView={activeView}
        setActiveView={(v) => { setActiveView(v); setSidebarOpen(false); }}
        tab={tab}
        setTab={(t: Tab) => { setTab(t); setSelectedServer(null); setMetrics(null); setSidebarOpen(false); }}
        user={user}
        onLogout={logout}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="ghc-dash-main flex-1 overflow-auto bg-[#f4f6fb] pb-20 lg:pb-0">
        <DashboardHeader
          user={user}
          notifications={notifList}
          onToggleSidebar={() => setSidebarOpen(true)}
          onSearch={(q) => setSearchQuery(q)}
        />

        <div className="ghc-dash-content p-4 sm:p-6 lg:p-8">
        {typeof window !== "undefined" && localStorage.getItem("ghc-impersonating") && (
          <div className="mb-6 rounded-xl border border-[#ffaa00]/40 bg-[#ffaa00]/10 px-6 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-amber-700">You are impersonating <strong>{localStorage.getItem("ghc-impersonating")}</strong> (support mode)</p>
            <button
              onClick={() => {
                const adminToken = localStorage.getItem("ghc-admin-token");
                if (adminToken) localStorage.setItem("token", adminToken);
                localStorage.removeItem("ghc-admin-token");
                localStorage.removeItem("ghc-impersonating");
                localStorage.removeItem("user");
                window.location.href = "/admin";
              }}
              className="rounded-lg bg-[#ffaa00]/20 border border-[#ffaa00]/40 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-[#ffaa00]/30"
            >
              Exit impersonation
            </button>
          </div>
        )}
        {paymentMessage && (
          <div className={`mb-6 rounded-xl border px-6 py-4 text-sm font-medium ${paymentMessage.includes("cancelled") || paymentMessage.includes("failed") ? "border-red-500/30 bg-red-500/10 text-red-600" : "border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]"}`}>
            {paymentMessage}
            <button onClick={() => setPaymentMessage(null)} className="ml-4 text-xs underline opacity-70">Dismiss</button>
          </div>
        )}

        {/* PRODUCT HUB VIEW */}
        {activeView && (() => {
          const [hubView, hubSub] = activeView.split("|");
          return (
          <ProductHub
            view={hubView}
            servers={servers}
            myDomains={myDomains}
            invoices={invoices}
            wallet={wallet}
            user={user}
            onBack={() => setActiveView(null)}
            onTab={(t) => { setActiveView(null); setTab(t as Tab); }}
            onSelectView={(v) => { setActiveView(v); }}
            setSelectedServer={(id) => { setActiveView(null); if (id) { setTab("servers"); setSelectedServer(id); }}}
            launch={hubSub || launchParam}
          />
          );
        })()}

        {/* OVERVIEW TAB */}
        {!activeView && tab === "overview" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0f172a]">Welcome back, {user?.name || "Customer"}</h2>
                <p className="text-sm text-slate-500 mt-1">Here is everything happening with your GHC account.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => setActiveView("order")} className="rounded-xl bg-gradient-to-r from-[#00b7ff] to-[#00f0ff] text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-[#00b7ff]/20 hover:shadow-[#00b7ff]/40 transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Order Service</button>
              <button onClick={() => setActiveView("domain-search")} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0a0f1c] hover:border-[#00b7ff] transition-all flex items-center gap-2"><Globe className="w-4 h-4 text-[#00b7ff]" /> Register Domain</button>
              <button onClick={() => setActiveView("network")} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0a0f1c] hover:border-[#00b7ff] transition-all flex items-center gap-2"><Network className="w-4 h-4 text-[#00b7ff]" /> Add IP</button>
              <button onClick={() => setTab("support")} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0a0f1c] hover:border-[#00b7ff] transition-all flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#00b7ff]" /> Create Ticket</button>
              <button onClick={() => setTab("wallet")} className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0a0f1c] hover:border-[#00b7ff] transition-all flex items-center gap-2"><Wallet className="w-4 h-4 text-[#00b7ff]" /> Top Up</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center"><Server className="w-5 h-5 text-[#00b7ff]" /></div><p className="text-sm font-medium text-slate-500">Active Servers</p></div><p className="text-2xl font-bold text-[#0f172a]">{servers.filter((s) => s.status === "ACTIVE").length}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center"><Globe className="w-5 h-5 text-[#00ff88]" /></div><p className="text-sm font-medium text-slate-500">My Domains</p></div><p className="text-2xl font-bold text-[#0f172a]">{myDomains.length}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center"><FileText className="w-5 h-5 text-yellow-700" /></div><p className="text-sm font-medium text-slate-500">Pending Invoices</p></div><p className="text-2xl font-bold text-[#0f172a]">{invoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED").length}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-[#b500ff]/10 border border-[#b500ff]/30 flex items-center justify-center"><DollarSign className="w-5 h-5 text-[#b500ff]" /></div><p className="text-sm font-medium text-slate-500">Wallet</p></div><p className="text-2xl font-bold text-[#0f172a]">{wallet ? getCurrencySymbol(wallet.currency) + wallet.balance?.toFixed(2) : "—"} {wallet?.currency || ""}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Recent Activity</h3>
                {activity.length === 0 ? <p className="text-sm text-slate-500">No recent activity.</p> : (
                  <div className="space-y-3">
                    {activity.slice(0, 8).map((a: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-100/40 transition-colors">
                        <div className={`w-2 h-2 mt-2 rounded-full ${a.type === 'order' ? 'bg-[#00b7ff]' : a.type === 'invoice' ? 'bg-yellow-500' : a.type === 'ticket' ? 'bg-[#b500ff]' : 'bg-[#00ff88]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] truncate">{a.title}</p>
                          <p className="text-[10px] text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'} {a.status ? `· ${a.status}` : ''} {a.amount ? `· ${getCurrencySymbol(a.currency)}${a.amount.toFixed(2)} ${a.currency}` : ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Announcements</h3>
                <div className="space-y-3">
                  {announcements.slice(0, 4).map((a: any) => (
                    <div key={a.id} className={`rounded-lg border px-4 py-3 ${a.priority === 'success' ? 'border-[#00ff88]/20 bg-[#00ff88]/5' : a.priority === 'warning' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-[#00b7ff]/20 bg-[#00b7ff]/5'}`}>
                      <p className="text-sm font-medium text-[#0f172a]">{a.title}</p>
                      <p className="text-xs text-slate-600 mt-1">{a.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-sm text-slate-500">No announcements.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Service Status</h3>
                  <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-[#00ff88]/10 text-[#00ff88]">{serviceStatus?.overall || 'operational'}</span>
                </div>
                <div className="space-y-2">
                  {(serviceStatus?.services || []).map((s: any) => (
                    <div key={s.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-sm text-slate-600">{s.name}</span>
                      <span className={`w-2 h-2 rounded-full ${s.status === 'operational' ? 'bg-[#00ff88]' : 'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Quick Links</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setTab("servers")} className="text-left rounded-xl border border-slate-200 bg-slate-100 p-4 hover:border-[#00b7ff]/50 transition-all"><p className="text-sm font-medium text-[#0f172a]">My Servers</p><p className="text-xs text-slate-500 mt-1">Manage, reboot, console</p></button>
                  <button onClick={() => setTab("domains")} className="text-left rounded-xl border border-slate-200 bg-slate-100 p-4 hover:border-[#00b7ff]/50 transition-all"><p className="text-sm font-medium text-[#0f172a]">My Domains</p><p className="text-xs text-slate-500 mt-1">Register, DNS, renew</p></button>
                  <button onClick={() => setTab("invoices")} className="text-left rounded-xl border border-slate-200 bg-slate-100 p-4 hover:border-[#00b7ff]/50 transition-all"><p className="text-sm font-medium text-[#0f172a]">Invoices</p><p className="text-xs text-slate-500 mt-1">Pay and download PDF</p></button>
                  <button onClick={() => setTab("support")} className="text-left rounded-xl border border-slate-200 bg-slate-100 p-4 hover:border-[#00b7ff]/50 transition-all"><p className="text-sm font-medium text-[#0f172a]">Support</p><p className="text-xs text-slate-500 mt-1">Open a ticket</p></button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Recent Invoices</h3>
                  <button onClick={() => setTab("invoices")} className="text-xs text-[#00b7ff] hover:underline">View all</button>
                </div>
                <div className="space-y-2">
                  {invoices.slice(0, 5).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">{inv.id.slice(0,8).toUpperCase()}</p>
                        <p className="text-[10px] text-slate-500">{inv.status} · {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#0f172a]">{getCurrencySymbol(inv.currency || currency)}{inv.amount.toFixed(2)}</p>
                        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                          <button onClick={() => handlePayInvoice(inv)} className="text-[10px] text-[#00ff88] hover:underline">Pay</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && <p className="text-sm text-slate-500">No invoices yet.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#0f172a]">Open Tickets</h3>
                  <button onClick={() => setTab("support")} className="text-xs text-[#00b7ff] hover:underline">View all</button>
                </div>
                <div className="space-y-2">
                  {tickets.slice(0, 5).map((t) => (
                    <div key={t.id} onClick={() => { setTab("support"); setSelectedTicket(t); }} className="cursor-pointer flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 hover:border-[#00b7ff]/50 transition-all">
                      <div>
                        <p className="text-sm font-medium text-[#0f172a]">{t.subject}</p>
                        <p className="text-[10px] text-slate-500">{t.category}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.status === 'OPEN' ? 'bg-[#00ff88]/10 text-[#00ff88]' : t.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-slate-100/50 text-slate-500'}`}>{t.status}</span>
                    </div>
                  ))}
                  {tickets.length === 0 && <p className="text-sm text-slate-500">No tickets yet.</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4">Services at a Glance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServers.slice(0, 6).map((s) => (
                  <button key={s.id} onClick={() => { setTab("servers"); setSelectedServer(s.id); }} className="text-left rounded-xl border border-slate-200 bg-slate-100 p-4 hover:border-[#00b7ff]/50 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[#0f172a]">{s.name || s.displayName || s.category}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.status === 'ACTIVE' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-yellow-500/10 text-yellow-700'}`}>{s.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">{s.ipAddress || s.providerResourceId || '—'}</p>
                  </button>
                ))}
                {filteredServers.length === 0 && <p className="text-sm text-slate-500 col-span-3">{searchQuery ? "No matching services." : "No active services yet."}</p>}
              </div>
            </div>
          </div>
        )}

        {/* SERVERS TAB */}
        {!activeView && tab === "servers" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">My Infrastructure</h2>

            {filteredServers.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-12 text-center">
                <Server className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No servers yet.</p>
                <Link href="/vps" className="inline-flex items-center gap-2 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">
                  Browse Plans
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Server List */}
                <div className="space-y-3">
                  {filteredServers.map((srv) => (
                    <button
                      key={srv.id}
                      onClick={() => {
                        setSelectedServer(srv.id);
                        fetchMetrics(srv.id);
                      }}
                      className={`w-full text-left rounded-xl border p-5 transition-all ${
                        selectedServer === srv.id
                          ? "border-[#00b7ff]/30 bg-[#00b7ff]/5"
                          : "border-slate-200 bg-white/60 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#0f172a]">{srv.name}</h3>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-slate-100/50 text-slate-500 uppercase">{srv.category || 'VPS'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <ShieldCheck className="w-3 h-3 text-[#00ff88]" /> DDoS
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              srv.status === "ACTIVE" || srv.status === "RUNNING"
                                ? "bg-[#00ff88]/10 text-[#00ff88]"
                                : srv.status === "SUSPENDED" || srv.status === "STOPPED"
                                ? "bg-red-500/10 text-red-600"
                                : "bg-yellow-500/10 text-yellow-700"
                            }`}
                          >
                            {srv.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-slate-500">{srv.ipAddress || "IP pending"}</p>
                        <span className="text-[10px] text-slate-500">•</span>
                        <p className="text-xs text-slate-500">{srv.osTemplate}</p>
                        <span className="text-[10px] text-slate-500">•</span>
                        <p className="text-xs text-slate-500">Exp {new Date(srv.expiresAt).toLocaleDateString()}</p>
                      </div>
                      {srv.status === "SUSPENDED" && (srv.suspensionReason || srv.suspension_reason) && (
                        <p className="text-[10px] text-red-500 mt-1.5">⚠ {srv.suspensionReason || srv.suspension_reason}</p>
                      )}
                      {srv.status === "ACTIVE" && srv.nextBillDate && new Date(srv.nextBillDate) < new Date() && (
                        <p className="text-[10px] text-amber-600 mt-1.5">⚠ Payment overdue — grace period</p>
                      )}
                    </button>
                  ))}
                </div>

                {/* Server Detail Panel */}
                {activeServer && (
                  <div className="space-y-4">
                    {/* Server Header */}
                    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#0f172a]">{activeServer.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${activeServer.status === 'ACTIVE' ? 'bg-[#00ff88]/10 text-[#00ff88]' : activeServer.status === 'SUSPENDED' ? 'bg-red-500/10 text-red-600' : 'bg-yellow-500/10 text-yellow-700'}`}>
                              {activeServer.status}
                            </span>
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100/50 text-slate-500">{activeServer.category || 'VPS'}</span>
                            {serverDetail?.location && (
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="w-3 h-3" /> {serverDetail.location.datacenter}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Next Bill</p>
                          <p className="text-sm text-[#0f172a]">{activeServer.nextBillDate ? new Date(activeServer.nextBillDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Network */}
                    {serverDetail?.network && (
                      <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <Network className="w-4 h-4 text-[#00b7ff]" /> Network
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">IPv4</p>
                            <p className="text-sm font-mono text-[#00b7ff]">{serverDetail.network.ipv4}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">IPv6</p>
                            <p className="text-sm font-mono text-[#00b7ff] truncate">{serverDetail.network.ipv6}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">Gateway</p>
                            <p className="text-sm font-mono text-[#0f172a]">{serverDetail.network.gateway}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">Reverse DNS</p>
                            <p className="text-sm font-mono text-[#0f172a]">{serverDetail.network.reverseDns || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Additional IPs */}
                    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                          <Network className="w-4 h-4 text-[#00b7ff]" /> Additional IPs
                        </h3>
                        <button
                          onClick={() => handleBuyAdditionalIp(activeServer.id)}
                          disabled={buyingIp || activeGateways.length === 0}
                          className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1.5 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50"
                        >
                          {buyingIp
                            ? "Processing..."
                            : ipPrice
                              ? `+ Buy IP (${getCurrencySymbol(ipPrice.currency)}${ipPrice.totalAmount?.toFixed(2)} ${ipPrice.currency} ex. taxes/mo)`
                              : "+ Buy IP"}
                        </button>
                      </div>
                      {additionalIps.length === 0 ? (
                        <p className="text-xs text-slate-500">No additional IPs. Click Buy IP to add a failover IP.</p>
                      ) : (
                        <div className="space-y-2">
                          {additionalIps.map((ip: any) => (
                            <div key={ip.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
                              <div>
                                <p className="text-sm font-mono text-[#00b7ff]">{ip.ipAddress || "Assigning..."}</p>
                                <p className="text-[10px] text-slate-500">{ip.status} · Added {ip.createdAt ? new Date(ip.createdAt).toLocaleDateString() : "—"}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-[#0f172a]">{ip.price ? `${getCurrencySymbol(ip.currency)}${ip.price.toFixed(2)}` : "—"}</p>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ip.status === 'ACTIVE' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-yellow-500/10 text-yellow-700'}`}>{ip.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeGateways.length === 0 && (
                        <p className="text-[10px] text-slate-500 mt-2">No payment gateways active. Contact admin to enable.</p>
                      )}
                    </div>

                    {/* Security */}
                    {serverDetail?.security && (
                      <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#00b7ff]" /> Security & Protection
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'DDoS Protection', active: serverDetail.security.ddosProtection, icon: ShieldCheck, color: '#00ff88' },
                            { label: 'Firewall', active: serverDetail.security.firewall, icon: Lock, color: '#00f0ff' },
                            { label: 'Anti-DDoS', active: !!serverDetail.security.antiDDoS, icon: ShieldAlert, color: '#b500ff' },
                            { label: 'SSL', active: serverDetail.security.ssl, icon: Lock, color: '#00ff88' },
                            { label: 'WAF', active: serverDetail.security.waf, icon: Shield, color: '#00f0ff' },
                            { label: 'Backup', active: serverDetail.security.backupEnabled, icon: HardDrive, color: '#00ff88' },
                          ].map((s) => (
                            <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.active ? 'border-slate-200 bg-slate-100' : 'border-white/5 bg-slate-100/50 opacity-50'}`}>
                              <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.active ? s.color : '#666' }} />
                              <p className={`text-xs font-medium ${s.active ? 'text-[#0f172a]' : 'text-slate-500'}`}>{s.label}</p>
                              {s.active && s.label === 'Anti-DDoS' && <p className="text-[10px] text-slate-500">{serverDetail.security.antiDDoS}</p>}
                              {s.active && s.label === 'Backup' && <p className="text-[10px] text-slate-500">{serverDetail.security.snapshotCount} snapshots</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Live Metrics */}
                    {metrics && (
                      <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#00b7ff]" /> Live Resource Monitor
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> Live
                          </span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {[
                            { label: "CPU", value: metrics.cpu, unit: "%", icon: Cpu, color: "#00f0ff" },
                            { label: "RAM", value: metrics.ram, unit: "%", icon: HardDrive, color: "#b500ff" },
                            { label: "Disk", value: metrics.disk, unit: "%", icon: HardDrive, color: "#ff6b00" },
                            { label: "Load", value: metrics.load, unit: "", icon: BarChart3, color: "#00ff88" },
                          ].map((m) => (
                            <div key={m.label} className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                                  <span className="text-xs text-slate-500">{m.label}</span>
                                </div>
                                <span className="text-sm font-bold text-[#0f172a]">{m.value.toFixed(1)}{m.unit}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100/50 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, m.value)}%`, backgroundColor: m.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Network Traffic */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                            <p className="text-xs text-slate-500 mb-1">Network In</p>
                            <p className="text-sm font-bold text-[#00ff88]">{metrics.netIn.toFixed(2)} Mbps</p>
                          </div>
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                            <p className="text-xs text-slate-500 mb-1">Network Out</p>
                            <p className="text-sm font-bold text-[#00b7ff]">{metrics.netOut.toFixed(2)} Mbps</p>
                          </div>
                        </div>
                        {/* Server monitoring chart */}
                        <ServerMetricsChart history={metricsHistory} current={metrics} />

                        {/* Ping monitor */}
                        {ping && (
                          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Real Ping Monitor</h3>
                            <div className="flex items-center gap-4 mb-4">
                              <div className={`w-3 h-3 rounded-full ${ping.status === 'UP' ? 'bg-[#00ff88]' : 'bg-red-500'} ${ping.status === 'UP' ? 'animate-pulse' : ''}`} />
                              <div>
                                <p className="text-sm font-medium text-[#0f172a]">{ping.status}</p>
                                <p className="text-xs text-slate-500">{ping.ipAddress} · {ping.latencyMs ? `${ping.latencyMs} ms` : 'timeout'}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 ml-auto">{ping.checkedAt ? new Date(ping.checkedAt).toLocaleTimeString() : ''}</span>
                            </div>
                            {pingHistory.length > 0 && (
                              <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={pingHistory.slice().reverse()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                    <Line type="step" dataKey="latencyMs" stroke="#00b7ff" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        )}
                        {carbon && (
                          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-[#00ff88]" /> Carbon Footprint Estimate</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-xs text-slate-500">Daily</p><p className="text-lg font-bold text-[#0f172a]">{carbon.co2DailyKg} kg CO₂</p></div>
                              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-xs text-slate-500">Monthly</p><p className="text-lg font-bold text-[#0f172a]">{carbon.co2MonthlyKg} kg CO₂</p></div>
                              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-xs text-slate-500">Yearly</p><p className="text-lg font-bold text-[#0f172a]">{carbon.co2YearlyKg} kg CO₂</p></div>
                            </div>
                            <p className="text-xs text-slate-500">Offsetting this would need ~{carbon.treesNeeded} trees per year.</p>
                            <p className="text-[10px] text-slate-400 mt-2">{carbon.message}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* OS Info */}
                    {serverDetail?.os && (
                      <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-[#00b7ff]" /> Operating System
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">OS</p>
                            <p className="text-sm font-medium text-[#0f172a]">{serverDetail.os.name}</p>
                          </div>
                          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                            <p className="text-xs text-slate-500 mb-1">Control Panel</p>
                            <p className="text-sm font-medium text-[#0f172a]">{serverDetail.os.panel}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Access Credentials */}
                    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                      <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#00b7ff]" /> Access Credentials
                      </h3>
                      <div className="space-y-3">
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">IP Address</p>
                          <p className="text-sm font-mono text-[#00b7ff]">{activeServer.ipAddress || "Provisioning..."}</p>
                        </div>
                        <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                          <p className="text-xs text-slate-500 mb-1">Root Password</p>
                          <p className="text-sm font-mono text-[#00b7ff]">{activeServer.rootPassword || "Provisioning..."}</p>
                        </div>
                      </div>
                    </div>

                    {/* Power Controls */}
                    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                      <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                        <Power className="w-4 h-4 text-[#00b7ff]" /> Power Controls
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        {["start", "stop", "reboot"].map((action) => (
                          <button
                            key={action}
                            onClick={() => handlePower(activeServer.id, action)}
                            disabled={actionLoading === action}
                            className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-xs font-medium transition-all capitalize ${
                              action === "stop"
                                ? "border-red-500/20 text-red-600 hover:bg-red-500/10"
                                : action === "start"
                                ? "border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/10"
                                : "border-[#00b7ff]/20 text-[#00b7ff] hover:bg-[#00b7ff]/10"
                            }`}
                          >
                            {action === "start" && <Play className="w-5 h-5" />}
                            {action === "stop" && <Square className="w-5 h-5" />}
                            {action === "reboot" && <RotateCcw className="w-5 h-5" />}
                            {actionLoading === action ? <Loader2 className="w-4 h-4 animate-spin" /> : action}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* OS Reinstall */}
                    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                      <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-[#00b7ff]" /> OS Reinstallation
                      </h3>
                      <div className="flex gap-3">
                        <select
                          value={osTemplate}
                          onChange={(e) => setOsTemplate(e.target.value)}
                          className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                        >
                          <option value="ubuntu22.04">Ubuntu 22.04 LTS</option>
                          <option value="ubuntu20.04">Ubuntu 20.04 LTS</option>
                          <option value="debian12">Debian 12</option>
                          <option value="debian11">Debian 11</option>
                          <option value="centos9">CentOS Stream 9</option>
                          <option value="windows2022">Windows Server 2022</option>
                          <option value="cpanel">cPanel/WHM (CentOS)</option>
                          <option value="plesk">Plesk (Ubuntu)</option>
                        </select>
                        <button
                          onClick={() => handleReinstall(activeServer.id)}
                          disabled={actionLoading === "reinstall"}
                          className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-all"
                        >
                          {actionLoading === "reinstall" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reinstall"}
                        </button>
                      </div>
                    </div>

                    {/* Rich Server Details (hardware, network, service info, console, tasks) */}
                    <ServerDetailCards server={activeServer} detail={serverDetail} metrics={metrics} />

                    {/* CDN Management Panel */}
                    {activeServer.category === 'CDN' && (
                      <div className="rounded-2xl border border-[#ff9500]/20 bg-[#ff9500]/5 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <Network className="w-4 h-4 text-[#ff9500]" /> CDN Management
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                            <p className="text-2xl font-bold text-[#ff9500]">50+</p>
                            <p className="text-xs text-slate-500">Global PoPs</p>
                          </div>
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                            <p className="text-2xl font-bold text-[#00ff88]">99.9%</p>
                            <p className="text-xs text-slate-500">Cache Hit Rate</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-red-600" /> Purge All Cache
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[#00b7ff]" /> Configure Origin
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#00ff88]" /> SSL/TLS Settings
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[#b500ff]" /> View Analytics
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Web Hosting Management Panel */}
                    {activeServer.category === 'WEB_HOSTING' && (
                      <div className="rounded-2xl border border-[#b500ff]/20 bg-[#b500ff]/5 backdrop-blur-xl p-6">
                        <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[#b500ff]" /> Hosting Control Panel
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                            <p className="text-2xl font-bold text-[#b500ff]">∞</p>
                            <p className="text-xs text-slate-500">Websites</p>
                          </div>
                          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                            <p className="text-2xl font-bold text-[#00ff88]">100GB</p>
                            <p className="text-xs text-slate-500">SSD Storage</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Monitor className="w-4 h-4 text-[#00b7ff]" /> cPanel / Plesk Login
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#b500ff]" /> MySQL Databases
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#ff9500]" /> Email Accounts
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#00ff88]" /> SSL Certificates
                          </button>
                          <button className="w-full rounded-lg border border-slate-200 bg-slate-100/50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100/80 hover:text-[#0f172a] transition-all text-left flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" /> File Manager
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* INVOICES TAB */}
        {!activeView && tab === "invoices" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">Billing & Invoices</h2>

            {ordersList.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200"><h3 className="text-sm font-bold text-[#0f172a]">Order history</h3></div>
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-200 bg-slate-100/50">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Order</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Plan</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500"></th>
                  </tr></thead>
                  <tbody>
                    {ordersList.slice(0, 10).map((o) => (
                      <>
                        <tr key={o.id} onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer">
                          <td className="px-6 py-3 text-xs font-mono text-slate-500">#{o.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-6 py-3 text-sm font-medium text-[#0f172a]">{o.display_name || o.plan_code || o.category}</td>
                          <td className="px-6 py-3 text-sm">{getCurrencySymbol(o.currency || currency)}{Number(o.customer_amount ?? o.total_amount ?? 0).toFixed(2)}</td>
                          <td className="px-6 py-3"><span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${o.status === "ACTIVE" || o.status === "COMPLETED" || o.status === "DELIVERED" || o.status === "OVH_PAID" ? "bg-emerald-100 text-emerald-700" : o.status === "PENDING" ? "bg-amber-100 text-amber-700" : o.status === "FAILED" || o.status === "PROVISIONING_FAILED" ? "bg-red-100 text-red-700" : o.status === "PAYMENT_RECEIVED" || o.status === "PROVISIONING" || o.status === "OVH_CART_CREATED" || o.status === "OVH_ORDER_PLACED" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600"}`}>{o.status}</span></td>
                          <td className="px-6 py-3 text-xs text-slate-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</td>
                          <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            {(o.status === "PENDING" || o.status === "PENDING_PAYMENT") && (
                              <button onClick={async () => { try { await api.orders.payWallet(o.id); showToast("Payment applied", "success"); fetchData(); } catch (e: any) { showToast(e.message, "error"); } }} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1.5 text-xs font-bold text-[#00b7ff] hover:bg-[#00b7ff]/20">Pay with wallet</button>
                            )}
                            <ChevronDown className={`inline w-4 h-4 ml-2 text-slate-400 transition-transform ${expandedOrder === o.id ? "rotate-180" : ""}`} />
                          </td>
                        </tr>
                        {expandedOrder === o.id && (
                          <tr key={o.id + "-detail"} className="border-b border-slate-100 bg-slate-50/40">
                            <td colSpan={6} className="px-6 py-4">
                              <OrderProgress orderId={o.id} onRetryDone={fetchData} />
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/50">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Invoice #</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Due Date</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-slate-100/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-[#0f172a]">{inv.id.slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-sm text-[#0f172a]">{getCurrencySymbol(inv.currency || currency)}{inv.amount.toFixed(2)} {inv.currency || currency}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(inv.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            inv.status === "PAID"
                              ? "bg-[#00ff88]/10 text-[#00ff88]"
                              : inv.status === "OVERDUE"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-yellow-500/10 text-yellow-700"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                            <button
                              onClick={() => handlePayInvoice(inv)}
                              disabled={payingInvoice === inv.id}
                              className="text-xs font-bold text-[#00ff88] hover:underline disabled:opacity-50"
                            >
                              {payingInvoice === inv.id ? "Paying..." : "Pay Now"}
                            </button>
                          )}
                          <button
                            onClick={() => api.billing.downloadInvoice(inv.id)}
                            className="text-xs font-bold text-[#00b7ff] hover:text-[#0f172a] hover:underline"
                          >
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                        {searchQuery ? "No matching invoices." : "No invoices yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* WALLET TAB */}
        {!activeView && tab === "wallet" && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-2xl font-bold text-[#0f172a]">My Wallet</h2>
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-[#00b7ff]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Current Balance</p>
                  <p className="text-3xl font-bold text-[#0f172a]">{getCurrencySymbol(wallet?.currency)}{wallet?.balance?.toFixed(2) || "0.00"} {wallet?.currency || currency}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-100/60 p-4">
                <p className="text-sm font-medium text-[#0f172a] mb-3">Add Funds</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[10, 25, 50, 100, 250, 500].map((a) => (
                    <button key={a} onClick={() => handleDeposit(a)} className="rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/10 px-3 py-1.5 text-sm font-semibold text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">
                      {getCurrencySymbol(wallet?.currency)}{a}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="flex-1 rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" placeholder="Custom amount" />
                  <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
                    {activeGateways.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <button onClick={() => handleDeposit()} className="w-full rounded-lg bg-[#00b7ff] text-white py-2.5 text-sm font-semibold hover:bg-[#009fe0] transition-all">Deposit Now</button>
              </div>
            </div>

            {/* Payment preferences */}
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00b7ff]" /> Payment preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">Wallet auto-pay</p>
                    <p className="text-xs text-slate-500 mt-0.5">Automatically pay due invoices from your wallet balance.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const next = !(payPrefs?.walletAutopay);
                      setPayPrefs((p: any) => ({ ...(p || {}), walletAutopay: next }));
                      try { await api.auth.updatePaymentPreferences({ walletAutopay: next }); showToast(next ? "Auto-pay enabled" : "Auto-pay disabled", "success"); }
                      catch (e: any) { setPayPrefs((p: any) => ({ ...(p || {}), walletAutopay: !next })); showToast(e.message, "error"); }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${payPrefs?.walletAutopay ? "bg-[#00b7ff]" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${payPrefs?.walletAutopay ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">Preferred gateway</p>
                    <p className="text-xs text-slate-500 mt-0.5">Pre-selected at checkout and for wallet top-ups.</p>
                  </div>
                  <select
                    value={payPrefs?.preferredGateway || ""}
                    onChange={async (e) => {
                      const v = e.target.value || null;
                      setPayPrefs((p: any) => ({ ...(p || {}), preferredGateway: v }));
                      try { await api.auth.updatePaymentPreferences({ preferredGateway: v }); if (v && activeGateways.includes(v)) setGateway(v); }
                      catch (err: any) { showToast(err.message, "error"); }
                    }}
                    className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                  >
                    <option value="">No preference</option>
                    {activeGateways.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {walletTransactions.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200"><h3 className="text-sm font-semibold text-[#0f172a]">Recent Transactions</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-6 py-3 text-xs font-semibold text-slate-500">Type</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Amount</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Description</th><th className="px-6 py-3 text-xs font-semibold text-slate-500">Date</th></tr></thead>
                    <tbody>
                      {walletTransactions.map((tx: any) => (
                        <tr key={tx.id} className="border-b border-white/5">
                          <td className="px-6 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tx.type === 'DEPOSIT' ? 'bg-[#00ff88]/10 text-[#00ff88]' : tx.type === 'PAYMENT' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-400'}`}>{tx.type}</span></td>
                          <td className="px-6 py-3 text-sm text-[#0f172a]">{getCurrencySymbol(wallet?.currency)}{Math.abs(tx.amount).toFixed(2)} {wallet?.currency}</td>
                          <td className="px-6 py-3 text-sm text-slate-500">{tx.description || "—"}</td>
                          <td className="px-6 py-3 text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}


        {/* DOMAINS TAB */}
        {!activeView && tab === "domains" && domainWizard !== null && (
          <div className="space-y-6">
            <DomainOrderWizard
              user={user}
              currency={currency}
              initialQuery={domainWizard}
              onClose={() => setDomainWizard(null)}
              onDone={fetchMyDomains}
            />
          </div>
        )}
        {!activeView && tab === "domains" && domainWizard === null && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">Domain names</h2>
            </div>

            <div id="ghc-domain-register" className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 scroll-mt-24">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00b7ff]" /> Order a domain name
              </h3>
              <form
                onSubmit={(e) => { e.preventDefault(); if (domainQuery.trim()) setDomainWizard(domainQuery.trim()); else setDomainWizard(""); }}
                className="flex flex-col gap-3 md:flex-row md:items-center"
              >
                <input
                  value={domainQuery}
                  onChange={(e) => setDomainQuery(e.target.value)}
                  placeholder="example.com"
                  className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#00b7ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00b7ff]/85 transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Search &amp; Order
                </button>
              </form>
              <p className="text-[10px] text-slate-500 mt-2">Guided order tunnel — select extensions, duration, contacts and payment step by step.</p>
            </div>

            {/* Transfer a domain in */}
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-1 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#b500ff]" /> Transfer a domain to GHC
              </h3>
              <p className="text-[10px] text-slate-500 mb-4">
                Already own a domain elsewhere? Unlock it at your current registrar, get the auth/EPP code, and move it here — adds 1 year.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const d = transferDomain.trim().toLowerCase();
                  if (!d || !transferCode.trim()) { showToast("Domain and auth code are required", "error"); return; }
                  if (!gateway || !activeGateways.includes(gateway)) { showToast("Select a valid payment gateway", "error"); return; }
                  setTransferLoading(true);
                  try {
                    const reg = await api.server.transferDomain({ domainName: d, authCode: transferCode.trim(), currency });
                    const res = await api.payments.createCheckoutSession({
                      type: "DOMAIN_REGISTRATION",
                      amount: reg.totalAmount,
                      gateway,
                      domainId: reg.domainId,
                      domainName: d.split(".")[0],
                      tld: "." + d.split(".").slice(1).join("."),
                      years: 1,
                    });
                    if (res.paid) {
                      showToast("Transfer order placed and paid from wallet!", "success");
                      setTransferDomain(""); setTransferCode("");
                      fetchMyDomains();
                    } else if (res.manual) {
                      setDomainPaymentMessage({ amount: res.amount, currency: res.currency, instructions: res.instructions, txId: res.id });
                      showToast("Manual payment instructions generated", "success");
                    } else if (res.checkoutUrl) {
                      window.location.href = res.checkoutUrl;
                    } else {
                      showToast("Could not initiate payment.", "error");
                    }
                  } catch (err: any) {
                    showToast(err.message || "Transfer failed", "error");
                  } finally {
                    setTransferLoading(false);
                  }
                }}
                className="flex flex-col gap-3 md:flex-row md:items-center"
              >
                <input
                  value={transferDomain}
                  onChange={(e) => setTransferDomain(e.target.value)}
                  placeholder="yourdomain.com"
                  className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                />
                <input
                  value={transferCode}
                  onChange={(e) => setTransferCode(e.target.value)}
                  placeholder="Auth / EPP code"
                  className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                />
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="rounded-lg bg-[#b500ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b500ff]/85 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {transferLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />} Transfer
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              {/* OVH-style toolbar */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button onClick={() => setDomainWizard("")} className="rounded-lg bg-[#00b7ff] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00b7ff]/85 transition-all">Order</button>
                <button onClick={exportDomainsCsv} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0f172a] hover:border-[#00b7ff]/50 transition-all flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export in CSV <ChevronDown className="w-3 h-3 text-slate-400" /></button>
                <button disabled title="No domains awaiting restore/renewal" className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">Restore/Renew ({safeDomains.filter((d: any) => d.status === "EXPIRED").length})</button>
                <div className="ml-auto flex items-center gap-2">
                  <input value={domainTableQuery} onChange={(e) => setDomainTableQuery(e.target.value)} placeholder="Search" className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-[#0f172a] w-40 focus:border-[#00b7ff]/50 outline-none" />
                  <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#0f172a] hover:border-[#00b7ff]/50 transition-all flex items-center gap-1.5"><Filter className="w-3.5 h-3.5 text-slate-400" /> Filter</button>
                  <div className="relative">
                    <button onClick={() => setDomainColsOpen(!domainColsOpen)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#0f172a] hover:border-[#00b7ff]/50 transition-all flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" /> Columns ({4 + Object.values(domainCols).filter(Boolean).length})</button>
                    {domainColsOpen && (
                      <div className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        {([["technical", "Technical status"], ["renewal", "Renewal frequency"], ["operations", "Ongoing operations"], ["registrant", "Registrant contact"]] as const).map(([k, label]) => (
                          <label key={k} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[#0f172a] hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" checked={domainCols[k]} onChange={() => setDomainCols({ ...domainCols, [k]: !domainCols[k] })} className="accent-[#00b7ff]" /> {label}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {filteredDomains.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">{searchQuery || domainTableQuery ? "No matching domains." : "No domains registered yet — use the Order button above to register one."}</p>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-3 w-8"><input type="checkbox" className="accent-[#00b7ff]" onChange={(e) => {/* visual only */}} /></th>
                        <th className="py-3 pr-4">Domain name</th>
                        <th className="py-3 pr-4">Status</th>
                        {domainCols.technical && <th className="py-3 pr-4">Technical status</th>}
                        {domainCols.renewal && <th className="py-3 pr-4">Renewal frequency</th>}
                        {domainCols.operations && <th className="py-3 pr-4">Ongoing operations</th>}
                        <th className="py-3 pr-4">Expiry</th>
                        {domainCols.registrant && <th className="py-3 pr-4">Registrant contact</th>}
                        <th className="py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDomains.map((d: any) => (
                        <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 pr-3"><input type="checkbox" className="accent-[#00b7ff]" /></td>
                          <td className="py-3.5 pr-4">
                            <button onClick={() => d.status === "ACTIVE" && setManagingDomain(d.domain)} className="text-sm font-medium text-[#0f172a] hover:text-[#00b7ff] transition-colors flex items-center gap-1.5">
                              {d.domain} {d.status === "ACTIVE" && <ChevronDown className="w-3 h-3 -rotate-90 text-slate-400" />}
                            </button>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${d.status === "ACTIVE" ? "bg-green-100 text-green-700" : d.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{d.status === "ACTIVE" ? "Registered" : d.status === "PENDING" ? "Pending" : d.status}</span>
                          </td>
                          {domainCols.technical && (
                            <td className="py-3.5 pr-4">
                              <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${(d.technicalStatus || "") === "Active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{d.technicalStatus || "—"}</span>
                            </td>
                          )}
                          {domainCols.renewal && (
                            <td className="py-3.5 pr-4 text-xs text-slate-600">
                              {d.renewalFrequency || "Every year"}
                              <span className={`ml-1.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${d.autoRenew ? "bg-[#00ff88]/15 text-green-700" : "bg-slate-100 text-slate-400"}`}>{d.autoRenew ? "AUTO" : "MANUAL"}</span>
                            </td>
                          )}
                          {domainCols.operations && <td className="py-3.5 pr-4 text-xs text-slate-500">{(d.ongoingOperations || 0) === 0 ? "—" : `${d.ongoingOperations} in progress`}</td>}
                          <td className="py-3.5 pr-4 text-xs text-slate-600">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                          {domainCols.registrant && <td className="py-3.5 pr-4 text-xs text-slate-600 font-medium">{d.registrantContact || "—"}</td>}
                          <td className="py-3.5 relative">
                            <button onClick={() => setDomainMenuId(domainMenuId === d.id ? null : d.id)} className="rounded p-1 hover:bg-slate-100 text-slate-400"><MoreVertical className="w-4 h-4" /></button>
                            {domainMenuId === d.id && (
                              <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" onMouseLeave={() => setDomainMenuId(null)}>
                                {d.status === "ACTIVE" && <button onClick={() => { setManagingDomain(d.domain); setDomainMenuId(null); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-slate-50">Manage DNS</button>}
                                {d.status === "ACTIVE" && <button onClick={() => { handleRenewDomain(d); setDomainMenuId(null); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-slate-50">Renew now</button>}
                                <button onClick={() => { handleToggleAutoRenew(d.id); setDomainMenuId(null); }} disabled={d.status !== "ACTIVE"} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-slate-50 disabled:opacity-40">Auto-renew: {d.autoRenew ? "ON → OFF" : "OFF → ON"}</button>
                                <button onClick={() => { setTab("support"); setDomainMenuId(null); }} className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-[#0f172a] hover:bg-slate-50">Contact support</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-right text-[11px] text-slate-400 pt-3">{filteredDomains.length} of {safeDomains.length} results</p>
                </div>
              )}
            </div>

            {managingDomain && (
              <DomainDnsPanel
                domain={managingDomain}
                onClose={() => setManagingDomain(null)}
              />
            )}
          </div>
        )}


        {/* SUPPORT TAB */}
        {!activeView && tab === "support" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#0f172a]">Support Tickets</h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Create New Ticket</h3>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Subject"
                    className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                  />
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                  >
                    {["GENERAL", "BILLING", "TECHNICAL", "DOMAIN", "ABUSE"].map((c) => (
                      <option key={c} value={c}>{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Priority</span>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setTicketPriority(p)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-all ${ticketPriority === p ? (p === "urgent" ? "bg-red-500/10 border-red-400/40 text-red-500" : p === "high" ? "bg-amber-500/10 border-amber-400/40 text-amber-600" : "bg-[#00b7ff]/10 border-[#00b7ff]/40 text-[#00b7ff]") : "bg-slate-100 border-slate-200 text-slate-500 hover:text-[#0f172a]"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                />
                <input
                  type="file"
                  multiple
                  onChange={(e) => setTicketFiles(e.target.files)}
                  className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                />
                <button
                  type="submit"
                  disabled={ticketSending}
                  className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50"
                >
                  {ticketSending ? "Sending..." : "Submit Ticket"}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Your Tickets</h3>
              {ticketsLoading ? (
                <p className="text-sm text-slate-500">Loading tickets...</p>
              ) : filteredTickets.length === 0 ? (
                <p className="text-sm text-slate-500">{searchQuery ? "No matching tickets." : "No support tickets yet."}</p>
              ) : (
                <div className="space-y-3">
                  {filteredTickets.map((t: any) => (
                    <div
                      key={t.id}
                      className="cursor-pointer rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 hover:bg-slate-100/80"
                      onClick={async () => {
                        const full = await api.support.getTicket(t.id).catch(() => t);
                        setSelectedTicket(full);
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{t.subject}</p>
                          <p className="text-xs text-slate-500">
                            {t.category} · #{t.id.slice(0, 8)}
                            {t.priority && t.priority !== "medium" && (
                              <span className={`ml-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${t.priority === "urgent" ? "bg-red-500/10 text-red-500" : t.priority === "high" ? "bg-amber-500/10 text-amber-600" : "bg-slate-200/60 text-slate-500"}`}>{t.priority}</span>
                            )}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${t.status === 'OPEN' ? 'bg-[#00ff88]/10 text-[#00ff88]' : t.status === 'IN_PROGRESS' ? 'bg-yellow-500/10 text-yellow-700' : 'bg-slate-100/50 text-slate-500'}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedTicket && (
                <div className="mt-4 rounded-xl border border-[#00b7ff]/20 bg-[#00b7ff]/5 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-[#0f172a]">{selectedTicket.subject}</p>
                    <button onClick={() => setSelectedTicket(null)} className="text-xs text-slate-500 hover:text-[#0f172a]">Close</button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{selectedTicket.category} · {selectedTicket.status}</p>
                  <div className="space-y-3 mb-4">
                    {(selectedTicket.replies || []).map((r: any, i: number) => (
                      <div key={i} className={`rounded-lg border p-3 text-sm ${r.sender === 'admin' ? 'border-[#00b7ff]/20 bg-slate-100' : 'border-slate-200 bg-white'}`}>
                        <p className="text-[10px] font-medium text-slate-500 mb-1 uppercase">{r.sender}</p>
                        <p className="text-[#0f172a]">{r.message}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <input
                      value={ticketReply}
                      onChange={(e) => setTicketReply(e.target.value)}
                      placeholder="Type your reply..."
                      className="w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
                    />
                    <div className="flex gap-2">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => setTicketReplyFiles(e.target.files)}
                        className="flex-1 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm text-[#0f172a]"
                      />
                      <button
                        onClick={() => handleReply(selectedTicket.id)}
                        disabled={!ticketReply.trim()}
                        className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* SECURITY & TEAM TAB */}
        {!activeView && tab === "security" && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold text-[#0f172a]">Security & Team Access</h2>

            {/* 2FA Section */}
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00b7ff]" /> Two-Factor Authentication
              </h3>
              {user?.twoFactorEnabled ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/20 px-4 py-3 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#00ff88]" />
                    <div>
                      <p className="text-sm text-[#0f172a] font-medium">2FA is enabled</p>
                      <p className="text-xs text-slate-500">Your account is protected with an authenticator app.</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">Enter 2FA code to disable</label>
                    <div className="flex gap-3">
                      <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={twoFactorCodeInput} onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, ""))} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none tracking-widest text-center" placeholder="000000" />
                      <button onClick={handleDisable2FA} disabled={securityLoading || twoFactorCodeInput.length !== 6} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50">Disable 2FA</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">Protect your account with an extra layer of security using Google Authenticator or Authy.</p>
                  {!twoFactorQr ? (
                    <button onClick={handleSetup2FA} disabled={securityLoading} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50">Setup 2FA</button>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 text-center">
                        <img src={twoFactorQr} alt="2FA QR Code" className="mx-auto w-48 h-48" />
                        <p className="text-xs text-slate-500 mt-2">Scan with Google Authenticator</p>
                        <p className="text-[10px] text-slate-500 mt-1 font-mono">{twoFactorSecret}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1.5">Enter code from app to confirm</label>
                        <div className="flex gap-3">
                          <input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={twoFactorCodeInput} onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, ""))} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none tracking-widest text-center" placeholder="000000" />
                          <button onClick={handleConfirm2FA} disabled={securityLoading || twoFactorCodeInput.length !== 6} className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 px-4 py-2.5 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/20 transition-all disabled:opacity-50">Confirm</button>
                        </div>
                      </div>
                      <button onClick={() => { setTwoFactorQr(null); setTwoFactorSecret(null); setTwoFactorCodeInput(""); }} className="text-xs text-slate-500 hover:text-slate-700">Cancel setup</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SSH Keys */}
            <SshKeysCard />

            {/* Recent sign-ins */}
            <LoginHistoryCard />

            {/* Team Invitations Sent */}
            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Invite Team Member</h3>
              <div className="flex flex-col gap-3">
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
                <div className="flex flex-wrap gap-2">
                  {["VIEW_SERVERS", "MANAGE_SERVERS", "VIEW_BILLING", "MANAGE_DOMAINS", "VIEW_INVOICES"].map((perm) => (
                    <label key={perm} className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                      <input type="checkbox" checked={invitePermissions.includes(perm)} onChange={(e) => {
                        if (e.target.checked) setInvitePermissions([...invitePermissions, perm]);
                        else setInvitePermissions(invitePermissions.filter((p) => p !== perm));
                      }} className="rounded border-slate-200 bg-slate-100 text-[#00b7ff]" />
                      {perm.replace(/_/g, " ")}
                    </label>
                  ))}
                </div>
                <button onClick={handleInviteMember} disabled={securityLoading || !inviteEmail.trim()} className="self-start rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50">Send Invitation</button>
              </div>

              {teamData?.sentInvites?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2">Pending Invitations</p>
                  <div className="space-y-2">
                    {teamData.sentInvites.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
                        <div>
                          <p className="text-sm text-[#0f172a]">{inv.inviteeEmail}</p>
                          <p className="text-[10px] text-slate-500">{inv.permissions.join(", ")}</p>
                        </div>
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-yellow-500/10 text-yellow-700">{inv.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* My Team Members */}
            {teamData?.myTeam?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Team Members</h3>
                <div className="space-y-2">
                  {teamData.myTeam.map((tm: any) => (
                    <div key={tm.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm text-[#0f172a]">{tm.member.name}</p>
                        <p className="text-xs text-slate-500">{tm.member.email}</p>
                        <p className="text-[10px] text-[#00b7ff]">{tm.permissions.join(", ")}</p>
                      </div>
                      <button onClick={() => handleRevokeAccess(tm.member.id)} className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-all">Revoke</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared With Me */}
            {teamData?.sharedWithMe?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Accounts Shared With You</h3>
                <div className="space-y-2">
                  {teamData.sharedWithMe.map((tm: any) => (
                    <div key={tm.id} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                      <p className="text-sm text-[#0f172a]">{tm.owner.name}</p>
                      <p className="text-xs text-slate-500">{tm.owner.email}</p>
                      <p className="text-[10px] text-[#00b7ff]">{tm.permissions.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Received Invitations */}
            {teamData?.receivedInvites?.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Team Invitations</h3>
                <div className="space-y-2">
                  {teamData.receivedInvites.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                      <div>
                        <p className="text-sm text-[#0f172a]">{inv.inviter.name} invited you</p>
                        <p className="text-xs text-slate-500">{inv.inviter.email}</p>
                        <p className="text-[10px] text-[#00b7ff]">{inv.permissions.join(", ")}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAcceptInvite(inv.token)} disabled={securityLoading} className="rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 px-3 py-1.5 text-xs font-medium text-[#00ff88] hover:bg-[#00ff88]/20 transition-all disabled:opacity-50">Accept</button>
                        <button onClick={() => handleRejectInvite(inv.token)} disabled={securityLoading} className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {!activeView && tab === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-[#0f172a]">My Profile</h2>

            <form onSubmit={handleUpdateProfile} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2"><User className="w-4 h-4 text-[#00b7ff]" /> Personal Details</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Full Name</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Phone</label>
                <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                <input value={user?.email || ""} disabled className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
              </div>
              <button type="submit" disabled={savingProfile} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50">{savingProfile ? "Saving..." : "Save Profile"}</button>
            </form>

            <form onSubmit={handleChangePassword} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-2 flex items-center gap-2"><Key className="w-4 h-4 text-[#00b7ff]" /> Change Password</h3>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
              <button type="submit" className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Change Password</button>
            </form>

            {referral && (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-[#0f172a]">Refer & Earn</h3>
                <p className="text-xs text-slate-500">{referral.reward}</p>
                <div className="flex gap-2">
                  <input value={referral.link} readOnly className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs text-slate-600" />
                  <button onClick={() => { navigator.clipboard.writeText(referral.link); showToast("Referral link copied", "success"); }} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Copy</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveNotifications} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2"><Bell className="w-4 h-4 text-[#00b7ff]" /> Email Notifications</h3>
              {[
                { key: "orderUpdates", label: "Order updates" },
                { key: "invoiceReminders", label: "Invoice reminders" },
                { key: "supportReplies", label: "Support ticket replies" },
                { key: "securityAlerts", label: "Security alerts" },
                { key: "promotions", label: "Promotions & offers" },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-700">{n.label}</span>
                  <button type="button" onClick={() => setNotifications((p: any) => ({ ...p, [n.key]: !p[n.key] }))} className={`w-10 h-6 rounded-full p-1 transition-colors ${notifications[n.key as keyof typeof notifications] ? 'bg-[#00b7ff]' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${notifications[n.key as keyof typeof notifications] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
              <button type="submit" disabled={savingNotifications} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50">{savingNotifications ? "Saving..." : "Save Preferences"}</button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2"><Bell className="w-4 h-4 text-[#00b7ff]" /> Preferences</h3>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div><p className="text-sm text-[#0f172a]">Selected Currency</p><p className="text-xs text-slate-500">Prices shown in {currency}</p></div>
                <span className="text-sm font-medium text-[#00b7ff]">{currency}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div><p className="text-sm text-[#0f172a]">2FA Status</p><p className="text-xs text-slate-500">Extra account security</p></div>
                <span className={`text-sm font-medium ${user?.twoFactorEnabled ? 'text-[#00ff88]' : 'text-slate-500'}`}>{user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
      <MobileBottomNav tab={tab} setTab={(t) => { setTab(t); setActiveView(null); setSelectedServer(null); setMetrics(null); }} />
    </div>
    </ErrorBoundary>
  );
}
