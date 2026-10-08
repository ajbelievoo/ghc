"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
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
  Zap,
  Globe,
  Database,
  Terminal,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  Info,
} from "lucide-react";

interface ServerInstance {
  id: string;
  name: string;
  ovhResourceId: string | null;
  serviceName?: string | null;
  planCode?: string;
  ipAddress: string | null;
  rootPassword: string | null;
  osTemplate: string;
  status: string;
  category: string;
  nextBillDate: string;
  priceAmount: number;
  currency?: string;
  autoRenew?: boolean;
  expiresAt: string;
}

const TABS = [
  { id: "home", label: "Home" },
  { id: "secondary-dns", label: "Secondary DNS", vpsOnly: true },
  { id: "backup", label: "Automated backup", vpsOnly: true },
  { id: "disk", label: "Additional disk", vpsOnly: true },
  { id: "monitoring", label: "Monitoring" },
  { id: "databases", label: "Databases" },
  { id: "management", label: "Management" },
] as const;

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
  const [tab, setTab] = useState<string>("home");

  const isVps = server?.category === "VPS";
  const tabs = TABS.filter((t) => !(t as any).vpsOnly || isVps);

  const load = useCallback(() => {
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
      })
      .catch((err) => {
        showToast(err.message || "Failed to load server", "error");
        router.push("/dashboard");
      })
      .finally(() => setLoading(false));
  }, [serverId, router, showToast]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!serverId) return;
    load();
  }, [serverId, router, load]);

  useEffect(() => {
    if (!serverId || loading) return;
    const interval = setInterval(() => {
      api.server.metrics(serverId).then(setMetrics).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [serverId, loading]);

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
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0f172a] transition">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ServerIcon className="w-5 h-5 text-[#00b7ff]" />
            <span className="font-bold">GHC Control Panel</span>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-1 overflow-x-auto -mb-px">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  tab === t.id
                    ? "border-[#00b7ff] text-[#00b7ff]"
                    : "border-transparent text-slate-500 hover:text-[#0f172a]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Server header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <ServerName server={server} onRenamed={(name) => setServer((s) => (s ? { ...s, name } : s))} />
            <div className="text-right">
              <p className="text-xs text-slate-500">Next payment</p>
              <p className="text-sm text-[#0f172a]">
                {server.nextBillDate ? new Date(server.nextBillDate).toLocaleDateString() : "N/A"}
              </p>
              <p className="text-xs text-[#00b7ff] mt-1">{getCurrencySymbol(server.currency || "USD")}{server.priceAmount?.toFixed(2)}/mo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>{server.status}</span>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100/50 text-slate-500">{server.category || "VPS"}</span>
            {detail?.location?.datacenter && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" /> {detail.location.datacenter}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" /> Expires {new Date(server.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {tab === "home" && (
          <HomeTab server={server} detail={detail} metrics={metrics} additionalIps={additionalIps} setTab={setTab} />
        )}
        {tab === "secondary-dns" && isVps && <SecondaryDnsTab server={server} />}
        {tab === "backup" && isVps && <BackupTab server={server} />}
        {tab === "disk" && isVps && <DiskTab server={server} />}
        {tab === "monitoring" && <MonitoringTab server={server} detail={detail} metrics={metrics} metricsHistory={metricsHistory} />}
        {tab === "databases" && <DatabasesTab server={server} />}
        {tab === "management" && (
          <ManagementTab server={server} detail={detail} setServer={setServer} isVps={isVps} />
        )}

        {tab === "home" && <ServerDetailCards server={server} detail={detail} metrics={metrics} />}
      </div>
    </div>
  );
}

/* ================= Server name (rename inline) ================= */

function ServerName({ server, onRenamed }: { server: ServerInstance; onRenamed: (n: string) => void }) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(server.name);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim() || name === server.name) return setEditing(false);
    setSaving(true);
    try {
      if (server.category === "VPS") {
        await api.server.vpsUpdate(server.id, { displayName: name.trim() });
      }
      onRenamed(name.trim());
      showToast("Server renamed", "success");
      setEditing(false);
    } catch (e: any) {
      showToast(e.message || "Rename failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {editing ? (
        <>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-lg font-bold text-[#0f172a] focus:border-[#00b7ff] outline-none"
            autoFocus
          />
          <button onClick={save} disabled={saving} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => { setEditing(false); setName(server.name); }} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50">
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-[#0f172a]">{server.name}</h1>
          {server.category === "VPS" && (
            <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-slate-400 hover:text-[#0f172a] hover:bg-slate-100" title="Rename">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ================= HOME TAB ================= */

function HomeTab({ server, detail, metrics, additionalIps, setTab }: any) {
  const { showToast } = useToast();
  const [ov, setOv] = useState<any>(null);
  const [ovError, setOvError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (server.category === "VPS") {
      api.server.vpsOverview(server.id).then(setOv).catch((e) => setOvError(e.message));
    }
  }, [server.id, server.category]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const hw = detail?.hardware || {};
  const net = detail?.network || {};
  const os = detail?.os || {};
  const svc = ov?.serviceInfo || detail?.serviceInfo || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Your VPS */}
      <Card title="Your VPS" icon={<ServerIcon className="w-4 h-4 text-[#00b7ff]" />}>
        <Row label="Status" value={<Badge ok={server.status === "ACTIVE"}>{server.status}</Badge>} />
        <Row label="Name" value={server.name} mono />
        {ov && <Row label="Boot" value={ov.netbootMode === "rescue" ? "Rescue mode" : "Local disk"} />}
        <Row label="OS / Distribution" value={os.name || ov?.image?.name || server.osTemplate || "—"} />
        <Row label="Zone / Location" value={[ov?.zone || detail?.location?.zone, detail?.location?.datacenter].filter(Boolean).join(" • ") || "—"} />
        {ov?.cluster && <Row label="Cluster" value={ov.cluster} mono />}
        {ovError && <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1"><Info className="w-3 h-3" /> Live provider data unavailable</p>}
      </Card>

      {/* Your configuration */}
      <Card title="Your configuration" icon={<Cpu className="w-4 h-4 text-[#00b7ff]" />}>
        <Row label="Model" value={hw.model || ov?.model?.name || server.planCode || "—"} />
        <Row label="vCores" value={hw.vcores ?? ov?.vcore ?? "—"} />
        <Row label="Memory" value={hw.memoryMb ? `${(hw.memoryMb / 1024).toFixed(0)} GB` : ov?.model?.memory ? `${(ov.model.memory / 1024).toFixed(0)} GB` : "—"} />
        <Row label="Storage" value={hw.diskGb ? `${hw.diskGb} GB` : ov?.model?.disk ? `${ov.model.disk} GB` : "—"} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setTab("disk")} className="rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/5 px-3 py-1.5 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/10">
            + Additional disk
          </button>
          <button onClick={() => setTab("backup")} className="rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/5 px-3 py-1.5 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/10">
            Backup options
          </button>
        </div>
      </Card>

      {/* IP addresses */}
      <Card title="IP addresses" icon={<Network className="w-4 h-4 text-[#00b7ff]" />}>
        <IpRow label="IPv4" value={net.ipv4 || server.ipAddress} onCopy={copyToClipboard} copied={copied === "ipv4"} copyKey="ipv4" />
        <IpRow label="IPv6" value={net.ipv6} onCopy={copyToClipboard} copied={copied === "ipv6"} copyKey="ipv6" />
        <Row label="Gateway" value={net.gateway || ov?.ips?.[0]?.gateway || "—"} mono />
        <Row label="Reverse DNS" value={net.reverseDns || ov?.ips?.[0]?.reverse || "—"} mono />
        {additionalIps?.length > 0 && (
          <div className="mt-2 space-y-1">
            {additionalIps.map((ip: any) => (
              <Row key={ip.id} label={`Failover IP (${ip.status})`} value={ip.ipAddress || "Assigning…"} mono />
            ))}
          </div>
        )}
      </Card>

      {/* Backup */}
      <Card title="Backup" icon={<HardDrive className="w-4 h-4 text-[#00b7ff]" />}>
        <BackupSummary serverId={server.id} isVps={server.category === "VPS"} />
      </Card>

      {/* Access credentials */}
      <Card title="Access credentials" icon={<Shield className="w-4 h-4 text-[#00b7ff]" />}>
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 mb-1">Public IP</p>
              <p className="text-sm font-mono text-[#00b7ff]">{server.ipAddress || "Provisioning…"}</p>
            </div>
            {server.ipAddress && (
              <button onClick={() => copyToClipboard(server.ipAddress!, "ip")} className="text-slate-500 hover:text-[#0f172a]">
                {copied === "ip" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-1">Root password</p>
              <p className="text-sm font-mono text-[#00b7ff] truncate">
                {server.rootPassword ? (showPassword ? server.rootPassword : "•".repeat(Math.min(20, server.rootPassword.length))) : "Not stored / managed by provider"}
              </p>
            </div>
            {server.rootPassword && (
              <div className="flex items-center gap-2 ml-3">
                <button onClick={() => setShowPassword((v) => !v)} className="text-slate-500 hover:text-[#0f172a]">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyToClipboard(server.rootPassword!, "pass")} className="text-slate-500 hover:text-[#0f172a]">
                  {copied === "pass" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* My offer */}
      <Card title="My offer" icon={<Clock className="w-4 h-4 text-[#00b7ff]" />}>
        <Row label="Plan" value={hw.model || server.planCode || "—"} />
        <Row label="Renewal" value={svc.renewalType || (server.autoRenew === false ? "Manual" : "Automatic")} />
        <Row label="Next payment" value={server.nextBillDate ? new Date(server.nextBillDate).toLocaleDateString() : "—"} />
        <Row label="Commitment / Expiry" value={server.expiresAt ? new Date(server.expiresAt).toLocaleDateString() : "—"} />
        <UpgradeBanner serverId={server.id} isVps={server.category === "VPS"} />
      </Card>
    </div>
  );
}

function BackupSummary({ serverId, isVps }: { serverId: string; isVps: boolean }) {
  const [bk, setBk] = useState<any>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!isVps) return;
    api.server.vpsBackups(serverId).then(setBk).catch(() => setErr(true));
  }, [serverId, isVps]);

  if (!isVps) return <p className="text-xs text-slate-500">Backup options are available on the backup tab for VPS services.</p>;
  if (err) return <p className="text-xs text-slate-500">Backup information is currently unavailable from the provider.</p>;
  if (!bk) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  return (
    <>
      <Row label="Snapshot" value={bk.snapshot ? `Created ${bk.snapshot.creationDate ? new Date(bk.snapshot.creationDate).toLocaleDateString() : ""}` : "No snapshot"} />
      <Row label="Automated backup" value={
        <Badge ok={bk.automatedBackup?.state === "enabled"}>{bk.automatedBackup?.state === "enabled" ? "Enabled" : "Not subscribed"}</Badge>
      } />
      {bk.automatedBackup?.rotation != null && <Row label="Retention" value={`${bk.automatedBackup.rotation} days`} />}
      {bk.automatedBackup?.schedule && <Row label="Schedule" value={bk.automatedBackup.schedule} />}
    </>
  );
}

function UpgradeBanner({ serverId, isVps }: { serverId: string; isVps: boolean }) {
  const { showToast } = useToast();
  const [opts, setOpts] = useState<any>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (isVps) api.server.vpsOptions(serverId).then(setOpts).catch(() => setOpts({ upgrades: [] }));
  }, [serverId, isVps]);

  if (!isVps || !opts || !opts.upgrades?.length) return null;
  return (
    <>
      <div className="mt-3 rounded-lg border border-[#00b7ff]/30 bg-[#00b7ff]/5 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00b7ff]" />
          <p className="text-xs font-medium text-[#0f172a]">{opts.upgrades.length} upgrade{opts.upgrades.length > 1 ? "s" : ""} available for this VPS</p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-lg bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0090cc]">
          Upgrade
        </button>
      </div>
      {open && <UpgradeModal serverId={serverId} upgrades={opts.upgrades} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ================= SECONDARY DNS TAB ================= */

function SecondaryDnsTab({ server }: { server: ServerInstance }) {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    api.server.vpsSecondaryDns(server.id).then(setData).catch((e) => setErr(e.message));
  }, [server.id]);
  useEffect(load, [load]);

  const act = async (action: "add" | "delete", d: string) => {
    setBusy(d || "add");
    try {
      await api.server.vpsSecondaryDnsAction(server.id, { action, domain: d });
      showToast(action === "add" ? "Domain added to secondary DNS" : "Domain removed", "success");
      setDomain("");
      load();
    } catch (e: any) {
      showToast(e.message || "Operation failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card title="Secondary DNS" icon={<Globe className="w-4 h-4 text-[#00b7ff]" />}>
      <p className="text-xs text-slate-500 mb-4">
        Use this VPS as a secondary DNS server{data?.nameServer ? <> via <b className="font-mono">{data.nameServer}</b></> : ""}.
      </p>
      <div className="flex gap-2 mb-4">
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
        />
        <button
          onClick={() => act("add", domain)}
          disabled={!domain.trim() || busy !== null}
          className="rounded-lg bg-[#00b7ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-50 flex items-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add domain
        </button>
      </div>
      {err ? (
        <p className="text-xs text-slate-500">Secondary DNS information unavailable: {err}</p>
      ) : !data ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : data.domains?.length ? (
        <div className="space-y-2">
          {data.domains.map((d: string) => (
            <div key={d} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
              <span className="text-sm font-mono text-[#0f172a]">{d}</span>
              <button onClick={() => act("delete", d)} disabled={busy === d} className="text-red-500 hover:text-red-400 p-1">
                {busy === d ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No secondary DNS domains configured.</p>
      )}
    </Card>
  );
}

/* ================= AUTOMATED BACKUP TAB ================= */

function BackupTab({ server }: { server: ServerInstance }) {
  const { showToast } = useToast();
  const [bk, setBk] = useState<any>(null);
  const [opts, setOpts] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const load = useCallback(() => {
    api.server.vpsBackups(server.id).then(setBk).catch((e) => setErr(e.message));
    api.server.vpsOptions(server.id).then(setOpts).catch(() => {});
  }, [server.id]);
  useEffect(load, [load]);

  const snapshot = async (action: "create" | "delete") => {
    setBusy(action);
    try {
      await api.server.vpsSnapshot(server.id, { action });
      showToast(action === "create" ? "Snapshot creation started" : "Snapshot deleted", "success");
      setTimeout(load, 3000);
    } catch (e: any) {
      showToast(e.message || "Snapshot action failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (rp: any) => {
    if (!confirm(`Restore VPS to backup point ${rp.restorePointId || rp.id}? Current data will be overwritten.`)) return;
    setBusy(String(rp.restorePointId || rp.id));
    try {
      await api.server.vpsBackupRestore(server.id, String(rp.restorePointId || rp.id));
      showToast("Restore started", "success");
    } catch (e: any) {
      showToast(e.message || "Restore failed", "error");
    } finally {
      setBusy(null);
    }
  };

  const backup = bk?.automatedBackup;
  const enabled = backup?.state === "enabled";

  return (
    <div className="space-y-6">
      <Card title="Automated backup" icon={<HardDrive className="w-4 h-4 text-[#00b7ff]" />}>
        {err ? (
          <p className="text-xs text-slate-500">Backup information unavailable: {err}</p>
        ) : !bk ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : enabled ? (
          <>
            <Row label="Status" value={<Badge ok>Enabled</Badge>} />
            {backup.rotation != null && <Row label="Retention" value={`${backup.rotation} days`} />}
            {backup.schedule && <Row label="Schedule" value={backup.schedule} />}
            <h3 className="text-xs font-semibold text-slate-500 mt-4 mb-2">Restore points</h3>
            {bk.restorePoints?.length ? (
              <div className="space-y-2">
                {bk.restorePoints.map((rp: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-mono text-[#0f172a]">{rp.restorePointId || rp.id || rp}</p>
                      {(rp.creationDate || rp.date) && <p className="text-[10px] text-slate-500">{new Date(rp.creationDate || rp.date).toLocaleString()}</p>}
                    </div>
                    <button onClick={() => restore(rp)} disabled={busy !== null} className="rounded-lg border border-[#00b7ff]/30 px-3 py-1 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/10">
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No restore points yet.</p>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <HardDrive className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500 mb-1">Automated backup is not enabled on this VPS.</p>
            <p className="text-xs text-slate-400 mb-4">Daily backups with up to 7 restore points, managed by the provider.</p>
            {opts?.automatedBackup ? (
              <button
                onClick={() => setOrder({ kind: "automated_backup", label: "Automated backup", ...opts.automatedBackup })}
                className="rounded-lg bg-[#00b7ff] px-4 py-2 text-sm font-bold text-white hover:bg-[#0090cc]"
              >
                Enable for {formatPrice(opts.automatedBackup)}
              </button>
            ) : (
              <p className="text-xs text-slate-400">Option pricing unavailable right now — try again later.</p>
            )}
          </div>
        )}
      </Card>

      <Card title="Snapshot" icon={<Activity className="w-4 h-4 text-[#00b7ff]" />}>
        {bk?.snapshot ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">{bk.snapshot.description || "Snapshot"}</p>
              <p className="text-[10px] text-slate-500">{bk.snapshot.creationDate ? new Date(bk.snapshot.creationDate).toLocaleString() : ""}</p>
            </div>
            <button onClick={() => snapshot("delete")} disabled={busy === "delete"} className="text-red-500 hover:text-red-400 p-1.5">
              {busy === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Take an instant snapshot of the entire VPS disk.</p>
            <button
              onClick={() => snapshot("create")}
              disabled={busy === "create"}
              className="rounded-lg border border-[#00b7ff]/30 px-4 py-2 text-xs font-bold text-[#00b7ff] hover:bg-[#00b7ff]/10 disabled:opacity-50"
            >
              {busy === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create snapshot"}
            </button>
          </div>
        )}
      </Card>

      {order && (
        <OptionOrderModal serverId={server.id} option={order} onClose={() => setOrder(null)} onDone={() => { setOrder(null); load(); }} />
      )}
    </div>
  );
}

/* ================= ADDITIONAL DISK TAB ================= */

function DiskTab({ server }: { server: ServerInstance }) {
  const { showToast } = useToast();
  const [disks, setDisks] = useState<any[] | null>(null);
  const [opts, setOpts] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  const load = useCallback(() => {
    api.server.vpsDisks(server.id).then(setDisks).catch((e) => setErr(e.message));
    api.server.vpsOptions(server.id).then(setOpts).catch(() => {});
  }, [server.id]);
  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <Card title="Additional disks" icon={<HardDrive className="w-4 h-4 text-[#00b7ff]" />}>
        {err ? (
          <p className="text-xs text-slate-500">Disk information unavailable: {err}</p>
        ) : disks === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : disks.length ? (
          <div className="space-y-2">
            {disks.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Disk #{d.id} — {d.size} GB</p>
                  <p className="text-[10px] text-slate-500">{d.type} • {d.state}</p>
                </div>
                <Badge ok={d.state === "connected" || d.state === "available"}>{d.state}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No additional disks attached to this VPS.</p>
        )}
      </Card>

      <Card title="Order an additional disk" icon={<Plus className="w-4 h-4 text-[#00b7ff]" />}>
        {opts?.additionalDisks?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {opts.additionalDisks.map((d: any) => (
              <button
                key={d.size}
                onClick={() => setOrder({ kind: "additional_disk", label: `Additional disk ${d.size} GB`, ...d })}
                className="rounded-xl border border-slate-200 bg-slate-100 p-4 text-center hover:border-[#00b7ff]/50 hover:bg-[#00b7ff]/5 transition"
              >
                <HardDrive className="w-5 h-5 mx-auto mb-2 text-[#00b7ff]" />
                <p className="text-sm font-bold text-[#0f172a]">{d.size} GB</p>
                <p className="text-xs text-[#00b7ff] mt-1">{formatPrice(d)}/mo</p>
              </button>
            ))}
          </div>
        ) : opts === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : (
          <p className="text-xs text-slate-500">Additional disk options are not available for this VPS right now.</p>
        )}
      </Card>

      {order && (
        <OptionOrderModal serverId={server.id} option={order} onClose={() => setOrder(null)} onDone={() => { setOrder(null); load(); }} />
      )}
    </div>
  );
}

/* ================= UPGRADE MODAL ================= */

function UpgradeModal({ serverId, upgrades, onClose }: { serverId: string; upgrades: any[]; onClose: () => void }) {
  const [order, setOrder] = useState<any>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0f172a] flex items-center gap-2"><Zap className="w-5 h-5 text-[#00b7ff]" /> Upgrade your VPS</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0f172a]"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2">
          {upgrades.map((u) => (
            <button
              key={u.planCode}
              onClick={() => setOrder({ kind: "upgrade", planCode: u.planCode, label: `Upgrade to ${u.productName}`, price: u.price, tax: u.tax, total: u.total, currency: u.currency })}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 hover:border-[#00b7ff]/50 hover:bg-[#00b7ff]/5 transition text-left"
            >
              <div>
                <p className="text-sm font-bold text-[#0f172a]">{u.productName || u.planCode}</p>
                {u.specs && (
                  <p className="text-xs text-slate-500">
                    {[u.specs.vcores && `${u.specs.vcores} vCores`, u.specs.memory && `${u.specs.memory}`, u.specs.storage && `${u.specs.storage}`].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#00b7ff]">{getCurrencySymbol(u.currency)}{u.total?.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">one-time upgrade</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {order && <OptionOrderModal serverId={serverId} option={order} onClose={() => setOrder(null)} onDone={() => { setOrder(null); onClose(); }} />}
    </div>
  );
}

/* ================= OPTION ORDER MODAL (upgrade / disk / backup) ================= */

function OptionOrderModal({ serverId, option, onClose, onDone }: { serverId: string; option: any; onClose: () => void; onDone: () => void }) {
  const { showToast } = useToast();
  const [gateways, setGateways] = useState<string[]>([]);
  const [gateway, setGateway] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api.server.gateways().then((g: any[]) => {
      const active = g.filter((x: any) => x.isActive).map((x: any) => x.name);
      setGateways(active);
      if (active.length) setGateway(active[0]);
    }).catch(() => {});
    api.billing.wallet().then(setWallet).catch(() => {});
  }, []);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await api.server.vpsOrderOption(serverId, {
        kind: option.kind,
        planCode: option.planCode,
        size: option.size,
        duration: option.duration,
      });
      const orderId = res.order.id;
      const session = await api.payments.createCheckoutSession({
        type: "ORDER",
        orderId,
        gateway: gateway || "wallet",
      });
      if (session.paid) {
        showToast(session.message || "Payment complete — option is being activated", "success");
        onDone();
      } else if (session.checkoutUrl) {
        window.location.href = session.checkoutUrl;
      } else if (session.manual) {
        showToast("Order created — complete the manual payment to activate", "success");
        onDone();
      } else {
        showToast("Payment session created but no checkout URL returned", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Order failed", "error");
    } finally {
      setPaying(false);
    }
  };

  const cur = option.currency || "USD";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0f172a]">Confirm order</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0f172a]"><X className="w-5 h-5" /></button>
        </div>
        <div className="rounded-lg bg-slate-100 border border-slate-200 p-4 mb-4">
          <p className="text-sm font-bold text-[#0f172a]">{option.label}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between"><span>Price</span><span>{getCurrencySymbol(cur)}{(option.price ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{getCurrencySymbol(cur)}{(option.tax ?? 0).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-[#0f172a]"><span>Total</span><span>{getCurrencySymbol(cur)}{(option.total ?? 0).toFixed(2)}</span></div>
          </div>
        </div>
        <label className="text-xs font-semibold text-slate-500">Payment method</label>
        <div className="mt-1 mb-4 space-y-2">
          {wallet && (
            <label className={`flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer text-sm ${gateway === "wallet" ? "border-[#00b7ff] bg-[#00b7ff]/5" : "border-slate-200"}`}>
              <span className="flex items-center gap-2"><input type="radio" name="gw" checked={gateway === "wallet"} onChange={() => setGateway("wallet")} /> Wallet</span>
              <span className="text-xs text-slate-500">{wallet.currency} {Number(wallet.balance).toFixed(2)}</span>
            </label>
          )}
          {gateways.filter((g) => g !== "wallet").map((g) => (
            <label key={g} className={`flex items-center rounded-lg border px-3 py-2.5 cursor-pointer text-sm capitalize ${gateway === g ? "border-[#00b7ff] bg-[#00b7ff]/5" : "border-slate-200"}`}>
              <input type="radio" name="gw" className="mr-2" checked={gateway === g} onChange={() => setGateway(g)} /> {g}
            </label>
          ))}
          {!gateways.length && !wallet && <p className="text-xs text-slate-500">Loading payment methods…</p>}
        </div>
        <button
          onClick={pay}
          disabled={paying || !gateway}
          className="w-full rounded-lg bg-[#00b7ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay ${getCurrencySymbol(cur)}${(option.total ?? 0).toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

/* ================= MONITORING TAB ================= */

function MonitoringTab({ server, detail, metrics, metricsHistory }: any) {
  const [ping, setPing] = useState<any>(null);
  useEffect(() => {
    api.server.ping(server.id).then(setPing).catch(() => {});
  }, [server.id]);

  return (
    <div className="space-y-6">
      <Card title="Live resource monitor" icon={<Activity className="w-4 h-4 text-[#00b7ff]" />} extra={
        <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" /> Live</span>
      }>
        {metrics ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { label: "CPU", value: metrics.cpu, unit: "%", icon: Cpu, color: "#00b7ff" },
                { label: "RAM", value: metrics.ram, unit: "%", icon: HardDrive, color: "#7c3aed" },
                { label: "Disk", value: metrics.disk, unit: "%", icon: HardDrive, color: "#ff3d00" },
                { label: "Load", value: metrics.load, unit: "", icon: BarChart3, color: "#00ff88" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><m.icon className="w-4 h-4" style={{ color: m.color }} /><span className="text-xs text-slate-500">{m.label}</span></div>
                    <span className="text-sm font-bold text-[#0f172a]">{m.value?.toFixed(1)}{m.unit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100/50 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, m.value || 0)}%`, backgroundColor: m.color }} />
                  </div>
                </div>
              ))}
            </div>
            {metricsHistory?.length > 0 && (
              <div className="rounded-xl bg-slate-100 border border-slate-200 p-4">
                <p className="text-xs text-slate-500 mb-2">CPU history</p>
                <svg viewBox="0 0 300 60" className="w-full h-16">
                  <polyline
                    points={metricsHistory.map((pt: any, i: number) => `${(i / (metricsHistory.length - 1)) * 300},${60 - (pt.cpu / 100) * 60}`).join(" ")}
                    fill="none" stroke="#00b7ff" strokeWidth="1.5" opacity="0.8"
                  />
                </svg>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Live monitoring data is not available for this service.</p>
            <p className="text-xs text-slate-400 mt-1">The provider does not expose real-time metrics for this range.</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Network" icon={<Network className="w-4 h-4 text-[#00b7ff]" />}>
          <Row label="Status" value={ping ? <Badge ok={ping.status === "UP"}>{ping.status}</Badge> : "—"} />
          <Row label="Latency" value={ping?.latencyMs != null ? `${ping.latencyMs} ms` : "—"} />
          <Row label="Packet loss" value={ping ? `${ping.packetLoss}%` : "—"} />
          <Row label="IP" value={ping?.ipAddress || server.ipAddress || "—"} mono />
        </Card>
        <Card title="Security" icon={<ShieldCheck className="w-4 h-4 text-[#00b7ff]" />}>
          <Row label="DDoS protection" value={<Badge ok>Enabled</Badge>} />
          <Row label="Anti-DDoS" value={detail?.security?.antiDDoS || "Automatic"} />
          <Row label="Monitoring" value={detail?.security?.monitoring ? "Enabled" : "—"} />
        </Card>
      </div>
    </div>
  );
}

/* ================= DATABASES TAB ================= */

function DatabasesTab({ server }: { server: ServerInstance }) {
  return (
    <div className="space-y-6">
      <Card title="Managed databases" icon={<Database className="w-4 h-4 text-[#00b7ff]" />}>
        <p className="text-xs text-slate-500 mb-4">
          Attach a fully managed MySQL, PostgreSQL, MongoDB, Redis or Kafka cluster to this server
          over the private network — no manual setup or maintenance.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {["MySQL", "PostgreSQL", "MongoDB", "Redis", "Kafka", "Valkey"].map((d) => (
            <div key={d} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-[#0f172a] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#00b7ff]" /> {d}
            </div>
          ))}
        </div>
        <Link
          href="/public-cloud?s=db-mysql"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00b7ff] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0090cc]"
        >
          <Plus className="w-4 h-4" /> Order a managed database
        </Link>
      </Card>
    </div>
  );
}

/* ================= MANAGEMENT TAB ================= */

function ManagementTab({ server, detail, setServer, isVps }: any) {
  const { showToast } = useToast();
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [osTemplate, setOsTemplate] = useState(server.osTemplate || "ubuntu22.04");
  const [images, setImages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [reverseIp, setReverseIp] = useState(detail?.network?.ipv4 || server.ipAddress || "");
  const [reverseValue, setReverseValue] = useState(detail?.network?.reverseDns || "");
  const [ov, setOv] = useState<any>(null);
  const [autoRenew, setAutoRenew] = useState<boolean>(server.autoRenew !== false);
  const [ipCountries, setIpCountries] = useState<string[]>([]);
  const [geoIp, setGeoIp] = useState(detail?.network?.ipv4 || server.ipAddress || "");
  const [geoCountry, setGeoCountry] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelText, setCancelText] = useState("");

  useEffect(() => {
    if (!isVps) return;
    api.server.vpsImages(server.id).then((d) => setImages(d.images || [])).catch(() => {});
    api.server.vpsTasks(server.id).then(setTasks).catch(() => {});
    api.server.vpsOverview(server.id).then(setOv).catch(() => {});
    api.server.vpsIpCountries(server.id).then((d) => setIpCountries(d.countries || [])).catch(() => {});
  }, [server.id, isVps]);

  const handlePower = async (action: string) => {
    setActionLoading(action);
    try {
      await api.server.power(server.id, action);
      showToast(`Server ${action} initiated`, "success");
      setTimeout(() => {
        api.server.details(server.id).then(setServer).catch(() => {});
      }, 3000);
    } catch (err: any) {
      showToast(err.message || `Failed to ${action} server`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReinstall = async () => {
    if (!confirm(`Reinstall OS to ${osTemplate}? This will wipe all data.`)) return;
    setActionLoading("reinstall");
    try {
      const res = await api.server.reinstall(server.id, osTemplate);
      showToast("OS reinstall initiated", "success");
    } catch (err: any) {
      showToast(err.message || "Reinstall failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openConsole = async () => {
    setConsoleLoading(true);
    try {
      const res = await api.server.console(server.id);
      if (res.consoleUrl) window.open(res.consoleUrl, "_blank", "noopener,noreferrer");
      else showToast(res.error || "Console URL not available", "error");
    } catch (e: any) {
      showToast(e.message || "Failed to open console", "error");
    } finally {
      setConsoleLoading(false);
    }
  };

  const toggleRescue = async () => {
    const rescue = ov?.netbootMode !== "rescue";
    if (!confirm(rescue ? "Enable rescue mode and reboot the VPS?" : "Disable rescue mode and boot from disk?")) return;
    setActionLoading("rescue");
    try {
      await api.server.rescue(server.id, { enabled: rescue, reboot: true });
      showToast(rescue ? "Rescue mode enabled — rebooting" : "Normal boot restored", "success");
      api.server.vpsOverview(server.id).then(setOv).catch(() => {});
    } catch (e: any) {
      showToast(e.message || "Rescue toggle failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const resetPassword = async () => {
    if (!confirm("Reset the root password? A new password will be emailed to your account email.")) return;
    setActionLoading("password");
    try {
      await api.server.vpsPasswordReset(server.id);
      showToast("Password reset initiated — check your email", "success");
    } catch (e: any) {
      showToast(e.message || "Password reset failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const saveReverse = async () => {
    setActionLoading("reverse");
    try {
      await api.server.reverseDns(server.id, { ip: reverseIp, reverse: reverseValue });
      showToast("Reverse DNS updated", "success");
    } catch (e: any) {
      showToast(e.message || "Reverse DNS update failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleAutoRenew = async () => {
    const next = !autoRenew;
    setActionLoading("autorenew");
    try {
      await api.server.setAutoRenew(server.id, next);
      setAutoRenew(next);
      setServer((s: any) => (s ? { ...s, autoRenew: next } : s));
      showToast(next ? "Automatic renewal enabled" : "Automatic renewal disabled", "success");
    } catch (e: any) {
      showToast(e.message || "Renewal change failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const saveGeolocation = async () => {
    if (!geoIp || !geoCountry) return;
    setActionLoading("geo");
    try {
      await api.server.vpsSetIpGeolocation(server.id, { ipAddress: geoIp, country: geoCountry });
      showToast("IP geolocation change requested", "success");
    } catch (e: any) {
      showToast(e.message || "Geolocation change failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmCancel = async () => {
    setActionLoading("cancel");
    try {
      await api.server.cancelService(server.id);
      showToast("Termination requested — the service ends at its expiry date", "success");
      setCancelOpen(false);
      router.push("/dashboard?tab=servers");
    } catch (e: any) {
      showToast(e.message || "Cancellation failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Power */}
      <Card title="Power controls" icon={<Power className="w-4 h-4 text-[#00b7ff]" />}>
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
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={openConsole}
            disabled={consoleLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-medium text-[#0f172a] hover:bg-slate-100 disabled:opacity-50"
          >
            {consoleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4 text-[#00b7ff]" />}
            KVM console
          </button>
          {isVps && (
            <button
              onClick={toggleRescue}
              disabled={actionLoading === "rescue"}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium disabled:opacity-50 ${
                ov?.netbootMode === "rescue" ? "border-red-300 text-red-500 hover:bg-red-50" : "border-slate-200 text-[#0f172a] hover:bg-slate-100"
              }`}
            >
              {actionLoading === "rescue" ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4 text-[#ff3d00]" />}
              {ov?.netbootMode === "rescue" ? "Exit rescue mode" : "Boot rescue mode"}
            </button>
          )}
        </div>
      </Card>

      {/* OS reinstall */}
      <Card title="OS reinstallation" icon={<Monitor className="w-4 h-4 text-[#00b7ff]" />}>
        <div className="flex gap-3 flex-wrap">
          <select
            value={osTemplate}
            onChange={(e) => setOsTemplate(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
          >
            {images.length ? (
              images.map((img: any) => <option key={img.id || img.name} value={img.name}>{img.name}</option>)
            ) : (
              <>
                <option value="ubuntu22.04">Ubuntu 22.04 LTS</option>
                <option value="ubuntu20.04">Ubuntu 20.04 LTS</option>
                <option value="debian12">Debian 12</option>
                <option value="debian11">Debian 11</option>
                <option value="centos9">CentOS Stream 9</option>
                <option value="windows2022">Windows Server 2022</option>
              </>
            )}
          </select>
          <button
            onClick={handleReinstall}
            disabled={actionLoading === "reinstall"}
            className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {actionLoading === "reinstall" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reinstall OS"}
          </button>
        </div>
      </Card>

      {/* Reverse DNS */}
      <Card title="Reverse DNS" icon={<Network className="w-4 h-4 text-[#00b7ff]" />}>
        <div className="flex gap-2 flex-wrap">
          <input
            value={reverseIp}
            onChange={(e) => setReverseIp(e.target.value)}
            placeholder="IP address"
            className="flex-1 min-w-[160px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
          />
          <input
            value={reverseValue}
            onChange={(e) => setReverseValue(e.target.value)}
            placeholder="host.example.com"
            className="flex-1 min-w-[160px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
          />
          <button
            onClick={saveReverse}
            disabled={actionLoading === "reverse" || !reverseIp || !reverseValue}
            className="rounded-lg bg-[#00b7ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-50"
          >
            {actionLoading === "reverse" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </Card>

      {/* Password reset */}
      {isVps && (
        <Card title="Root password" icon={<Lock className="w-4 h-4 text-[#00b7ff]" />}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Reset the root password. A new password will be emailed to you.</p>
            <button
              onClick={resetPassword}
              disabled={actionLoading === "password"}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-[#0f172a] hover:bg-slate-100 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading === "password" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Reset password
            </button>
          </div>
        </Card>
      )}

      {/* IP geolocation */}
      {isVps && ipCountries.length > 0 && (
        <Card title="IP geolocation" icon={<Globe className="w-4 h-4 text-[#00b7ff]" />}>
          <div className="flex gap-2 flex-wrap">
            <select
              value={geoIp}
              onChange={(e) => setGeoIp(e.target.value)}
              className="flex-1 min-w-[160px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
            >
              {(ov?.ips?.length ? ov.ips.map((i: any) => i.ipAddress || i) : [detail?.network?.ipv4 || server.ipAddress].filter(Boolean)).map((ip: string) => (
                <option key={ip} value={ip}>{ip}</option>
              ))}
            </select>
            <select
              value={geoCountry}
              onChange={(e) => setGeoCountry(e.target.value)}
              className="flex-1 min-w-[140px] rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
            >
              <option value="">Select country…</option>
              {ipCountries.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </select>
            <button
              onClick={saveGeolocation}
              disabled={actionLoading === "geo" || !geoIp || !geoCountry}
              className="rounded-lg bg-[#00b7ff] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0090cc] disabled:opacity-50"
            >
              {actionLoading === "geo" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Changes the geolocation registered for this IP — affects geo-targeting, not routing.</p>
        </Card>
      )}

      {/* Renewal */}
      <Card title="Renewal" icon={<RefreshCw className="w-4 h-4 text-[#00b7ff]" />}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#0f172a]">Automatic renewal</p>
            <p className="text-[10px] text-slate-400">
              {autoRenew ? "The service renews automatically at each billing cycle." : "The service will expire at the end of the current period."}
            </p>
          </div>
          <button
            onClick={toggleAutoRenew}
            disabled={actionLoading === "autorenew"}
            className={`relative h-6 w-11 rounded-full transition-colors ${autoRenew ? "bg-[#00b7ff]" : "bg-slate-300"} disabled:opacity-50`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${autoRenew ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card title="Cancel service" icon={<Trash2 className="w-4 h-4 text-red-500" />}>
        {!cancelOpen ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">Terminate this service at the end of its billing period.</p>
            <button
              onClick={() => setCancelOpen(true)}
              className="rounded-lg border border-red-300 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
            >
              Cancel service
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4">
            <p className="text-xs font-medium text-red-600 mb-2">
              Type <span className="font-mono font-bold">CANCEL</span> to confirm. The service will terminate at its expiry date — this cannot be undone from the panel.
            </p>
            <div className="flex gap-2">
              <input
                value={cancelText}
                onChange={(e) => setCancelText(e.target.value)}
                placeholder="CANCEL"
                className="flex-1 rounded-lg bg-white border border-red-300 px-4 py-2 text-sm text-[#0f172a] outline-none"
              />
              <button
                onClick={confirmCancel}
                disabled={actionLoading === "cancel" || cancelText !== "CANCEL"}
                className="rounded-lg bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm termination"}
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Tasks */}
      {isVps && tasks.length > 0 && (
        <Card title="Recent tasks" icon={<Clock className="w-4 h-4 text-[#00b7ff]" />}>
          <div className="space-y-2">
            {tasks.slice(0, 8).map((t: any, i: number) => (
              <div key={t.id || i} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium text-[#0f172a]">{t.type || t.function}</p>
                  <p className="text-[10px] text-slate-500">{t.date || t.lastUpdate ? new Date(t.date || t.lastUpdate).toLocaleString() : ""}</p>
                </div>
                <Badge ok={t.state === "done" || t.status === "done"}>{t.state || t.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ================= SHARED UI ================= */

function Card({ title, icon, extra, children }: { title: string; icon: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
        {icon} {title}
        {extra && <span className="ml-auto">{extra}</span>}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs text-[#0f172a] text-right ${mono ? "font-mono" : "font-medium"}`}>{value ?? "—"}</span>
    </div>
  );
}

function IpRow({ label, value, onCopy, copied, copyKey }: any) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-xs font-mono text-[#00b7ff]">{value || "—"}</span>
        {value && (
          <button onClick={() => onCopy(value, copyKey)} className="text-slate-400 hover:text-[#0f172a]">
            {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
          </button>
        )}
      </span>
    </div>
  );
}

function Badge({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ok ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
      {children}
    </span>
  );
}

function formatPrice(o: any) {
  if (!o) return "";
  return `${getCurrencySymbol(o.currency)}${(o.total ?? o.price ?? 0).toFixed(2)}`;
}
