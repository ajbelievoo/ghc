"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import {
  Server,
  Cpu,
  HardDrive,
  Monitor,
  Network,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Clock,
  Activity,
  Terminal,
  AlertCircle,
  Pencil,
  Check,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface ServerDetailCardsProps {
  server: any;
  detail?: any;
  metrics?: any;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

function formatBytes(bytes?: number, unit = "B") {
  if (bytes === undefined || bytes === null) return "—";
  if (unit === "B") {
    if (bytes >= 1099511627776) return `${(bytes / 1099511627776).toFixed(2)} TB`;
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${bytes} B`;
  }
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} GB`;
  return `${bytes} MB`;
}

function formatMb(bytes?: number) {
  if (!bytes) return "—";
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} GB`;
  return `${bytes} MB`;
}

function percentage(used?: number, total?: number) {
  if (!used || !total) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

export default function ServerDetailCards({ server, detail, metrics }: ServerDetailCardsProps) {
  const { showToast } = useToast();
  const [bandwidth, setBandwidth] = useState<any>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState(false);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [reverseIp, setReverseIp] = useState<string>("");
  const [reverseValue, setReverseValue] = useState<string>("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [editingReverse, setEditingReverse] = useState<string | null>(null);

  const hardware = detail?.hardware || {};
  const serviceInfo = detail?.serviceInfo || {};
  const location = detail?.location || {};
  const network = detail?.network || {};
  const security = detail?.security || {};
  const os = detail?.os || {};
  const ipmi = detail?.ipmi || {};
  const tasks = detail?.tasks || [];
  const category = server?.category || detail?.category;

  useEffect(() => {
    if (server?.id && category === "DEDICATED") {
      setBandwidthLoading(true);
      api.server
        .bandwidth(server.id)
        .then(setBandwidth)
        .catch(() => {})
        .finally(() => setBandwidthLoading(false));
    }
  }, [server?.id, category]);

  useEffect(() => {
    if (network.ipv4) setReverseIp(network.ipv4);
  }, [network.ipv4]);

  const openConsole = async () => {
    setConsoleLoading(true);
    try {
      const res = await api.server.console(server.id);
      if (res.consoleUrl) {
        window.open(res.consoleUrl, "_blank", "noopener,noreferrer");
      } else {
        showToast(res.error || "Console URL not available", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Failed to open console", "error");
    } finally {
      setConsoleLoading(false);
    }
  };

  const toggleRescue = async (enabled: boolean) => {
    if (!confirm(enabled ? "Enable rescue mode and reboot? Server will boot into Debian rescue." : "Disable rescue mode and restore normal boot?")) return;
    setRescueLoading(true);
    try {
      await api.server.rescue(server.id, { enabled, reboot: enabled });
      showToast(enabled ? "Rescue mode enabled. Reboot in progress." : "Normal boot restored.", "success");
    } catch (e: any) {
      showToast(e.message || "Rescue mode action failed", "error");
    } finally {
      setRescueLoading(false);
    }
  };

  const saveReverse = async (ip: string, value: string) => {
    if (!value.trim()) return;
    setReverseLoading(true);
    try {
      await api.server.reverseDns(server.id, { ip, reverse: value.trim() });
      showToast("Reverse DNS updated", "success");
      setEditingReverse(null);
    } catch (e: any) {
      showToast(e.message || "Reverse DNS update failed", "error");
    } finally {
      setReverseLoading(false);
    }
  };

  const deleteReverse = async (ip: string) => {
    if (!confirm("Delete reverse DNS for " + ip + "?")) return;
    setReverseLoading(true);
    try {
      await api.server.reverseDns(server.id, { ip, delete: true });
      showToast("Reverse DNS deleted", "success");
      setEditingReverse(null);
    } catch (e: any) {
      showToast(e.message || "Reverse DNS delete failed", "error");
    } finally {
      setReverseLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hardware */}
      {(hardware.vcores || hardware.commercialRange || hardware.os || hardware.ramGb || hardware.cpu) && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#00b7ff]" /> Hardware
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Model / Range</p>
              <p className="text-sm font-medium text-[#0f172a]">{hardware.commercialRange || hardware.model || hardware.offer || "—"}</p>
            </div>
            {(hardware.vcores !== undefined || hardware.coresPerProcessor !== undefined) && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Cores</p>
                <p className="text-sm font-medium text-[#0f172a]">{hardware.cpu || `${hardware.vcores || hardware.coresPerProcessor} cores`}</p>
              </div>
            )}
            {(hardware.memoryMb !== undefined || hardware.ramGb !== undefined) && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">RAM</p>
                <p className="text-sm font-medium text-[#0f172a]">
                  {hardware.ramGb !== undefined ? `${hardware.ramGb} GB` : formatMb(hardware.memoryMb)}
                </p>
              </div>
            )}
            {hardware.threadsPerProcessor !== undefined && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Threads / Processor</p>
                <p className="text-sm font-medium text-[#0f172a]">{hardware.threadsPerProcessor}</p>
              </div>
            )}
            {hardware.diskGroups && hardware.diskGroups.length > 0 ? (
              hardware.diskGroups.map((g: any, i: number) => (
                <div key={i} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Storage {i + 1}</p>
                  <p className="text-sm font-medium text-[#0f172a]">
                    {g.numberOfDisks || 1} x {g.diskSize?.value} {g.diskSize?.unit} {g.diskType} {g.description ? `(${g.description})` : ""}
                  </p>
                </div>
              ))
            ) : (
              hardware.diskGb !== undefined &&
              hardware.diskGb !== null && (
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Storage</p>
                  <p className="text-sm font-medium text-[#0f172a]">{hardware.diskGb} GB SSD</p>
                </div>
              )
            )}
            {hardware.linkSpeed !== undefined && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Link Speed</p>
                <p className="text-sm font-medium text-[#0f172a]">{hardware.linkSpeed} Mbps</p>
              </div>
            )}
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Operating System</p>
              <p className="text-sm font-medium text-[#0f172a]">{os.name || hardware.os || server?.osTemplate || "—"}</p>
            </div>
            {hardware.serverId !== undefined && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Server ID</p>
                <p className="text-sm font-mono text-[#0f172a]">{hardware.serverId}</p>
              </div>
            )}
            {hardware.motherboard && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Motherboard</p>
                <p className="text-sm font-medium text-[#0f172a]">{hardware.motherboard}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bandwidth Usage */}
      {category === "DEDICATED" && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00b7ff]" /> Bandwidth
          </h3>
          {bandwidthLoading ? (
            <Loader2 className="w-5 h-5 text-[#00b7ff] animate-spin" />
          ) : bandwidth?.available ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Connection</p>
                  <p className="text-sm font-bold text-[#0f172a]">{bandwidth.connectionMbps || bandwidth.downstreamMbps || "—"} Mbps</p>
                </div>
                <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                  <p className="text-xs text-slate-500 mb-1">Quota Reset</p>
                  <p className="text-sm font-medium text-[#0f172a]">{formatDate(bandwidth.resetQuotaDate)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Inbound</span>
                    <span className="text-[#0f172a]">{formatBytes(bandwidth.inputUsedBytes)} / {formatBytes(bandwidth.inputLimitBytes)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00ff88]"
                      style={{ width: `${percentage(bandwidth.inputUsedBytes, bandwidth.inputLimitBytes)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Outbound</span>
                    <span className="text-[#0f172a]">{formatBytes(bandwidth.outputUsedBytes)} / {formatBytes(bandwidth.outputLimitBytes)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00b7ff]"
                      style={{ width: `${percentage(bandwidth.outputUsedBytes, bandwidth.outputLimitBytes)}%` }}
                    />
                  </div>
                </div>
              </div>
              {bandwidth.isThrottled && <p className="text-xs text-red-600">Bandwidth throttled</p>}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-slate-500">
              {bandwidth?.error || "Bandwidth data not available for this service."}
            </div>
          )}
        </div>
      )}

      {/* Service Info */}
      {serviceInfo.serviceId && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00b7ff]" /> Service Information
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Service ID</p>
              <p className="text-sm font-mono text-[#0f172a]">{serviceInfo.serviceId}</p>
            </div>
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className="text-sm font-medium text-[#0f172a] capitalize">{serviceInfo.status}</p>
            </div>
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Created</p>
              <p className="text-sm font-medium text-[#0f172a]">{formatDate(serviceInfo.creation)}</p>
            </div>
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Expiration</p>
              <p className="text-sm font-medium text-[#0f172a]">{formatDate(serviceInfo.expiration)}</p>
            </div>
            {serviceInfo.renew && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Renewal</p>
                <p className="text-sm font-medium text-[#0f172a]">
                  {serviceInfo.renew.automatic ? "Automatic" : "Manual"} · {serviceInfo.renew.period} month
                </p>
              </div>
            )}
            {serviceInfo.contactAdmin && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Admin Contact</p>
                <p className="text-sm font-medium text-[#0f172a]">{serviceInfo.contactAdmin}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location */}
      {(location.datacenter || location.region) && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00b7ff]" /> Location
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Datacenter</p>
              <p className="text-sm font-medium text-[#0f172a]">{location.datacenter || "—"}</p>
            </div>
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">Region</p>
              <p className="text-sm font-medium text-[#0f172a]">{location.region || "—"}</p>
            </div>
            {location.zone && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Zone</p>
                <p className="text-sm font-medium text-[#0f172a]">{location.zone}</p>
              </div>
            )}
            {location.availabilityZone && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Availability Zone</p>
                <p className="text-sm font-medium text-[#0f172a]">{location.availabilityZone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network with reverse DNS */}
      {(network.ipv4 || network.ipv6) && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Network className="w-4 h-4 text-[#00b7ff]" /> Network
          </h3>
          <div className="space-y-3">
            {network.ipv4 && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">IPv4</p>
                  <button
                    onClick={() => { setEditingReverse(network.ipv4); setReverseValue(network.reverseDns || ""); }}
                    className="text-[10px] text-[#00b7ff] hover:underline"
                  >
                    Edit Reverse DNS
                  </button>
                </div>
                <p className="text-sm font-mono text-[#00b7ff]">{network.ipv4}</p>
                <p className="text-xs text-slate-500 mt-1">Gateway: {network.gateway || "—"}</p>
                {network.reverseDns && <p className="text-xs text-slate-500">Reverse: {network.reverseDns}</p>}
              </div>
            )}
            {network.ipv6 && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">IPv6</p>
                <p className="text-sm font-mono text-[#00b7ff] break-all">{network.ipv6}</p>
                {network.ipv6Gateway && <p className="text-xs text-slate-500 mt-1">Gateway: {network.ipv6Gateway}</p>}
              </div>
            )}
            {network.ips && network.ips.length > 0 && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">All IPs</p>
                <div className="flex flex-wrap gap-2">
                  {network.ips.map((ip: string, i: number) => (
                    <span key={i} className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">{ip}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reverse DNS editor */}
          {editingReverse && (
            <div className="mt-3 rounded-xl border border-[#00b7ff]/20 bg-[#00b7ff]/5 p-3">
              <p className="text-xs text-slate-500 mb-2">Reverse DNS for {editingReverse}</p>
              <input
                type="text"
                value={reverseValue}
                onChange={(e) => setReverseValue(e.target.value)}
                placeholder="e.g. server.yourdomain.com"
                className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => saveReverse(editingReverse, reverseValue)}
                  disabled={reverseLoading || !reverseValue.trim()}
                  className="flex-1 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {reverseLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                </button>
                <button
                  onClick={() => deleteReverse(editingReverse)}
                  disabled={reverseLoading}
                  className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  onClick={() => setEditingReverse(null)}
                  disabled={reverseLoading}
                  className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-200 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monitoring */}
      {(!metrics || metrics === null) && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#00b7ff]" /> Live Monitoring
          </h3>
          <div className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-sm text-[#0f172a]">Live CPU/RAM metrics are not available from OVH for this service range.</p>
              <p className="text-xs text-slate-500 mt-1">Install an RTM/monitoring agent or check OVH Manager for advanced graphs.</p>
            </div>
          </div>
        </div>
      )}

      {/* Security */}
      {security && Object.keys(security).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00b7ff]" /> Security & Protection
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "DDoS Protection", active: security.ddosProtection, icon: ShieldCheck, color: "#00ff88" },
              { label: "Monitoring", active: security.monitoring, icon: Activity, color: "#00b7ff" },
              { label: "Proactive Intervention", active: security.proactiveIntervention, icon: ShieldAlert, color: "#b500ff" },
              { label: "Firewall", active: security.firewall, icon: Lock, color: "#00b7ff" },
              { label: "Anti-DDoS", active: !!security.antiDDoS, icon: Shield, color: "#00f0ff" },
              { label: "Backup", active: security.backupEnabled, icon: HardDrive, color: "#00ff88" },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border px-3 py-3 text-center ${s.active ? "border-slate-200 bg-slate-100" : "border-slate-200 bg-slate-100/50 opacity-50"}`}>
                <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.active ? s.color : "#666" }} />
                <p className={`text-xs font-medium ${s.active ? "text-[#0f172a]" : "text-slate-500"}`}>{s.label}</p>
                {s.active && s.label === "Anti-DDoS" && security.antiDDoS && <p className="text-[10px] text-slate-500">{security.antiDDoS}</p>}
                {s.active && s.label === "Monitoring" && security.supportLevel && <p className="text-[10px] text-slate-500">{security.supportLevel}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Console */}
      {ipmi.consoleAvailable !== undefined && ipmi.consoleAvailable && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00b7ff]" /> {ipmi.consoleType || "Remote Console"}
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Open a one-time remote console session. The link expires shortly after creation.
          </p>
          <button
            onClick={openConsole}
            disabled={consoleLoading}
            className="w-full rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {consoleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Terminal className="w-4 h-4" />}
            {consoleLoading ? "Opening..." : "Open Console"}
          </button>
        </div>
      )}

      {/* Rescue Mode */}
      {category === "DEDICATED" && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-red-600" /> Rescue Mode
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Rescue mode boots the server into a temporary Debian rescue system for maintenance.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleRescue(true)}
              disabled={rescueLoading}
              className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {rescueLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Enable Rescue
            </button>
            <button
              onClick={() => toggleRescue(false)}
              disabled={rescueLoading}
              className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {rescueLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />}
              Normal Boot
            </button>
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#00b7ff]" /> Recent Tasks
          </h3>
          <div className="space-y-2">
            {tasks.map((t: any, i: number) => (
              <div key={i} className="rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{t.function}</p>
                  <p className="text-[10px] text-slate-500">ID: {t.id}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    t.status === "done"
                      ? "bg-[#00ff88]/10 text-[#00ff88]"
                      : t.status === "error"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-yellow-500/10 text-yellow-700"
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
