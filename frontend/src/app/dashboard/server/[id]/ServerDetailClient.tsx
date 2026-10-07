"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import ServerDetailCards from "@/components/ServerDetailCards";
import {
  Server as ServerIcon,
  Activity,
  Power,
  RotateCcw,
  Square,
  Play,
  Monitor,
  Loader2,
  Cpu,
  HardDrive,
  Wifi,
  MapPin,
  Lock,
  Network,
  BarChart3,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowLeft,
  Copy,
  Clock,
} from "lucide-react";

interface ServerInstance {
  id: string;
  name: string;
  ovhResourceId: string | null;
  ipAddress: string | null;
  rootPassword: string | null;
  osTemplate: string;
  status: string;
  category: string;
  nextBillDate: string;
  priceAmount: number;
  expiresAt: string;
}

export default function ServerDetailClient() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const serverId = id as string;

  const [server, setServer] = useState<ServerInstance | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [additionalIps, setAdditionalIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [osTemplate, setOsTemplate] = useState("ubuntu22.04");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!serverId) return;

    Promise.all([
      api.server.details(serverId),
      api.server.metrics(serverId),
      api.server.metricsHistory(serverId),
      api.server.additionalIps(serverId),
    ])
      .then(([s, m, h, ips]) => {
        setServer(s);
        setDetail(s);
        setMetrics(m);
        setMetricsHistory(h || []);
        setAdditionalIps(ips || []);
        setOsTemplate(s?.osTemplate || "ubuntu22.04");
      })
      .catch((err) => {
        showToast(err.message || "Failed to load server", "error");
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [serverId, router, showToast]);

  // Live metrics polling
  useEffect(() => {
    if (!serverId || loading) return;
    const interval = setInterval(() => {
      api.server
        .metrics(serverId)
        .then((m) => setMetrics(m))
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [serverId, loading]);

  const handlePower = async (action: string) => {
    if (!server) return;
    setActionLoading(action);
    try {
      const res = await api.server.power(server.id, action);
      setServer(res.server);
      showToast(`Server ${action} successful`, "success");
    } catch (err: any) {
      showToast(err.message || `Failed to ${action} server`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstall = async () => {
    if (!server) return;
    if (!confirm(`Reinstall OS to ${osTemplate}? This will wipe all data.`)) return;
    setActionLoading("reinstall");
    try {
      const res = await api.server.reinstall(server.id, osTemplate);
      setServer(res.server);
      showToast("OS reinstall initiated", "success");
    } catch (err: any) {
      showToast(err.message || "Reinstall failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fcff] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00b7ff]" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-[#f8fcff] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Server not found</p>
        <Link href="/dashboard" className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const statusColor =
    server.status === "ACTIVE" || server.status === "RUNNING"
      ? "bg-green-100 text-green-700"
      : server.status === "SUSPENDED" || server.status === "STOPPED"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0f172a] transition">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-[#00b7ff]" />
            <span className="font-bold">GHC Control Panel</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        {/* Server Header */}
        <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">{server.name}</h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                  {server.status}
                </span>
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100/50 text-slate-500">
                  {server.category || "VPS"}
                </span>
                {detail?.location && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" /> {detail.location.datacenter}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" /> Expires {new Date(server.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Next Bill</p>
              <p className="text-sm text-[#0f172a]">
                {server.nextBillDate ? new Date(server.nextBillDate).toLocaleDateString() : "N/A"}
              </p>
              <p className="text-xs text-[#00b7ff] mt-1">${server.priceAmount?.toFixed(2)}/mo</p>
            </div>
          </div>
        </div>

        {/* Power Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Power className="w-4 h-4 text-[#00b7ff]" /> Power Controls
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { action: "start", icon: Play, color: "#00ff88" },
              { action: "stop", icon: Square, color: "#ef4444" },
              { action: "reboot", icon: RotateCcw, color: "#00b7ff" },
            ].map(({ action, icon: Icon, color }) => (
              <button
                key={action}
                onClick={() => handlePower(action)}
                disabled={actionLoading === action}
                className="flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-xs font-medium transition-all capitalize disabled:opacity-50"
                style={{ borderColor: `${color}33`, color }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${color}1a`)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {actionLoading === action ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Box with show/hide toggle */}
        <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00b7ff]" /> Access Credentials
          </h2>
          <div className="space-y-3">
            {/* IP Address */}
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Public IP Address</p>
                <p className="text-sm font-mono text-[#00b7ff]">{server.ipAddress || "Provisioning..."}</p>
              </div>
              {server.ipAddress && (
                <button
                  onClick={() => copyToClipboard(server.ipAddress!, "ip")}
                  className="text-slate-500 hover:text-[#0f172a] transition"
                  title="Copy"
                >
                  {copied === "ip" ? <CheckIcon /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            {/* Root Password with toggle */}
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Root Password</p>
                <p className="text-sm font-mono text-[#00b7ff] truncate">
                  {server.rootPassword
                    ? showPassword
                      ? server.rootPassword
                      : "•".repeat(Math.min(20, server.rootPassword.length))
                    : "Provisioning..."}
                </p>
              </div>
              {server.rootPassword && (
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-slate-500 hover:text-[#0f172a] transition"
                    title={showPassword ? "Hide" : "Show"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(server.rootPassword!, "pass")}
                    className="text-slate-500 hover:text-[#0f172a] transition"
                    title="Copy"
                  >
                    {copied === "pass" ? <CheckIcon /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Network Details */}
        {detail?.network && (
          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <Network className="w-4 h-4 text-[#00b7ff]" /> Network Details
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">IPv4</p>
                <p className="text-sm font-mono text-[#00b7ff]">{detail.network.ipv4}</p>
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">IPv6</p>
                <p className="text-sm font-mono text-[#00b7ff] truncate">{detail.network.ipv6}</p>
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Gateway</p>
                <p className="text-sm font-mono text-[#0f172a]">{detail.network.gateway}</p>
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Reverse DNS</p>
                <p className="text-sm font-mono text-[#0f172a]">{detail.network.reverseDns || "—"}</p>
              </div>
            </div>
            {/* Bandwidth usage */}
            {metrics && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Bandwidth In
                  </p>
                  <p className="text-sm font-bold text-[#00ff88]">{metrics.netIn?.toFixed(2)} Mbps</p>
                </div>
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Bandwidth Out
                  </p>
                  <p className="text-sm font-bold text-[#00b7ff]">{metrics.netOut?.toFixed(2)} Mbps</p>
                </div>
              </div>
            )}
            {detail?.location && (
              <div className="mt-3 rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Datacenter Region
                </p>
                <p className="text-sm text-[#0f172a]">{detail.location.datacenter} • {detail.location.region}</p>
              </div>
            )}
          </div>
        )}

        {/* Additional IPs */}
        <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-[#00b7ff]" /> Additional IPs
          </h2>
          {additionalIps.length === 0 ? (
            <p className="text-xs text-slate-500">No additional IPs assigned to this server.</p>
          ) : (
            <div className="space-y-2">
              {additionalIps.map((ip) => (
                <div key={ip.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-mono text-[#00b7ff]">{ip.ipAddress || "Assigning..."}</p>
                    <p className="text-[10px] text-slate-500">{ip.status}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ip.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {ip.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Metrics */}
        {metrics && (
          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00b7ff]" /> Live Resource Monitor
              <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> Live
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "CPU", value: metrics.cpu, unit: "%", icon: Cpu, color: "#00b7ff" },
                { label: "RAM", value: metrics.ram, unit: "%", icon: HardDrive, color: "#7c3aed" },
                { label: "Disk", value: metrics.disk, unit: "%", icon: HardDrive, color: "#ff3d00" },
                { label: "Load", value: metrics.load, unit: "", icon: BarChart3, color: "#00ff88" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <m.icon className="w-4 h-4" style={{ color: m.color }} />
                      <span className="text-xs text-slate-500">{m.label}</span>
                    </div>
                    <span className="text-sm font-bold text-[#0f172a]">{m.value?.toFixed(1)}{m.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100/50 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, m.value)}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
            {metricsHistory.length > 0 && (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-2">CPU History (60 min)</p>
                <svg viewBox="0 0 300 60" className="w-full h-16">
                  {metricsHistory.map((pt, i) => {
                    const x = (i / (metricsHistory.length - 1)) * 300;
                    const y = 60 - (pt.cpu / 100) * 60;
                    return <circle key={i} cx={x} cy={y} r="1" fill="#00b7ff" opacity={0.6 + (i / metricsHistory.length) * 0.4} />;
                  })}
                  <polyline
                    points={metricsHistory.map((pt, i) => `${(i / (metricsHistory.length - 1)) * 300},${60 - (pt.cpu / 100) * 60}`).join(" ")}
                    fill="none"
                    stroke="#00b7ff"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Security & Protection */}
        {detail?.security && (
          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00b7ff]" /> Security & Protection
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "DDoS Protection", active: detail.security.ddosProtection, icon: ShieldCheck, color: "#00ff88" },
                { label: "Firewall", active: detail.security.firewall, icon: Lock, color: "#00b7ff" },
                { label: "Anti-DDoS", active: !!detail.security.antiDDoS, icon: ShieldAlert, color: "#7c3aed" },
                { label: "SSL", active: detail.security.ssl, icon: Lock, color: "#00ff88" },
                { label: "WAF", active: detail.security.waf, icon: Shield, color: "#00b7ff" },
                { label: "Backup", active: detail.security.backupEnabled, icon: HardDrive, color: "#00ff88" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.active ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-slate-100/50 opacity-50"}`}>
                  <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.active ? s.color : "#666" }} />
                  <p className={`text-xs font-medium ${s.active ? "text-[#0f172a]" : "text-slate-500"}`}>{s.label}</p>
                  {s.active && s.label === "Anti-DDoS" && <p className="text-[10px] text-slate-500">{detail.security.antiDDoS}</p>}
                  {s.active && s.label === "Backup" && <p className="text-[10px] text-slate-500">{detail.security.snapshotCount} snapshots</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OS Info */}
        {detail?.os && (
          <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#00b7ff]" /> Operating System
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">OS</p>
                <p className="text-sm font-medium text-[#0f172a]">{detail.os.name}</p>
              </div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Control Panel</p>
                <p className="text-sm font-medium text-[#0f172a]">{detail.os.panel}</p>
              </div>
            </div>
          </div>
        )}

        {/* OS Reinstall */}
        <div className="rounded-2xl border border-slate-200 bg-white backdrop-blur-xl p-6">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#00b7ff]" /> OS Reinstallation
          </h2>
          <div className="flex gap-3 flex-wrap">
            <select
              value={osTemplate}
              onChange={(e) => setOsTemplate(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
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
              onClick={handleReinstall}
              disabled={actionLoading === "reinstall"}
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
            >
              {actionLoading === "reinstall" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reinstall OS"}
            </button>
          </div>
        </div>

        {/* Rich Server Details */}
        <ServerDetailCards server={server} detail={detail} metrics={metrics} />
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-[#00ff88]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
