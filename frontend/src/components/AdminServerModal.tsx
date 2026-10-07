"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { X, Loader2, Power, RotateCcw, Terminal, Save, Check } from "lucide-react";

interface AdminServerModalProps {
  subscriptionId: string;
  onClose: () => void;
}

export default function AdminServerModal({ subscriptionId, onClose }: AdminServerModalProps) {
  const { showToast } = useToast();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [reverseIp, setReverseIp] = useState("");
  const [reverseValue, setReverseValue] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);

  useEffect(() => { fetchDetails(); }, [subscriptionId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getSubscriptionDetails(subscriptionId);
      setDetails(res);
      if (res?.details?.network?.ipv4) setReverseIp(res.details.network.ipv4);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const doPower = async (action: string) => {
    if (!confirm(`Are you sure you want to ${action} this server?`)) return;
    setActionLoading(action);
    try {
      await api.admin.subscriptionPower(subscriptionId, action);
      showToast(`${action} sent`, "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setActionLoading(null); }
  };

  const doRescue = async (enabled: boolean) => {
    if (!confirm(enabled ? "Enable rescue mode and reboot?" : "Restore normal boot?")) return;
    setActionLoading(enabled ? "rescue" : "normal");
    try {
      await api.admin.subscriptionRescue(subscriptionId, { enabled, reboot: enabled });
      showToast(enabled ? "Rescue enabled" : "Normal boot restored", "success");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setActionLoading(null); }
  };

  const openConsole = async () => {
    setConsoleLoading(true);
    try {
      const res = await api.admin.subscriptionConsole(subscriptionId);
      if (res.consoleUrl) window.open(res.consoleUrl, "_blank", "noopener,noreferrer");
      else showToast(res.error || "Console not available", "error");
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setConsoleLoading(false); }
  };

  const saveReverse = async () => {
    if (!reverseIp || !reverseValue) return;
    setReverseLoading(true);
    try {
      await api.admin.updateSubscriptionReverseDns(subscriptionId, { ip: reverseIp, reverse: reverseValue });
      showToast("Reverse DNS updated", "success");
      setReverseValue("");
      fetchDetails();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setReverseLoading(false); }
  };

  const deleteReverse = async () => {
    if (!reverseIp) return;
    if (!confirm("Delete reverse DNS for " + reverseIp + "?")) return;
    setReverseLoading(true);
    try {
      await api.admin.updateSubscriptionReverseDns(subscriptionId, { ip: reverseIp, delete: true });
      showToast("Reverse DNS deleted", "success");
      fetchDetails();
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setReverseLoading(false); }
  };

  const sub = details?.subscription || {};
  const d = details?.details || {};
  const hw = d.hardware || {};
  const net = d.network || {};
  const bw = details?.bandwidth || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">Server: {sub.displayName || sub.serviceName || subscriptionId.slice(0, 8)}</h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#00b7ff] animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">Category</p><p className="text-sm font-medium text-[#0f172a]">{sub.category}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">Status</p><p className="text-sm font-medium text-[#0f172a]">{sub.status}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">IP</p><p className="text-sm font-mono text-[#00b7ff]">{net.ipv4 || "—"}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">IPv6</p><p className="text-sm font-mono text-[#00b7ff] truncate">{net.ipv6 || "—"}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">CPU</p><p className="text-sm font-medium text-[#0f172a]">{hw.cpu || hw.commercialRange || "—"}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">RAM</p><p className="text-sm font-medium text-[#0f172a]">{hw.ramGb ? `${hw.ramGb} GB` : hw.memoryMb ? `${hw.memoryMb} MB` : "—"}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">OS</p><p className="text-sm font-medium text-[#0f172a]">{d.os?.name || hw.os || "—"}</p></div>
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3"><p className="text-[10px] text-slate-500">Datacenter</p><p className="text-sm font-medium text-[#0f172a]">{d.location?.datacenter || "—"}</p></div>
            </div>

            {bw.available && (
              <div className="rounded-lg bg-slate-100 border border-slate-200 p-3">
                <p className="text-[10px] text-slate-500 mb-1">Bandwidth</p>
                <p className="text-sm text-[#0f172a]">Connection: {bw.connectionMbps} Mbps · In: {formatBytes(bw.inputUsedBytes)} / {formatBytes(bw.inputLimitBytes)} · Out: {formatBytes(bw.outputUsedBytes)} / {formatBytes(bw.outputLimitBytes)}</p>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-medium text-[#0f172a] mb-3">Power & Rescue</h4>
              <div className="flex flex-wrap gap-2">
                {["start", "reboot", "shutdown"].map((a) => (
                  <button key={a} onClick={() => doPower(a)} disabled={actionLoading === a} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50 flex items-center gap-1"><Power className="w-3 h-3" /> {actionLoading === a ? <Loader2 className="w-3 h-3 animate-spin" /> : a}</button>
                ))}
                <button onClick={() => doRescue(true)} disabled={actionLoading === "rescue"} className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/20 disabled:opacity-50 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Rescue</button>
                <button onClick={() => doRescue(false)} disabled={actionLoading === "normal"} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Normal Boot</button>
                <button onClick={openConsole} disabled={consoleLoading} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50 flex items-center gap-1"><Terminal className="w-3 h-3" /> {consoleLoading ? "Opening..." : "Console"}</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h4 className="text-sm font-medium text-[#0f172a] mb-3">Reverse DNS</h4>
              <div className="flex flex-col md:flex-row gap-2">
                <input value={reverseIp} onChange={(e) => setReverseIp(e.target.value)} placeholder="IP" className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm" />
                <input value={reverseValue} onChange={(e) => setReverseValue(e.target.value)} placeholder="e.g. server.yourdomain.com" className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm" />
                <button onClick={saveReverse} disabled={reverseLoading} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50 flex items-center gap-1">{reverseLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save</button>
                <button onClick={deleteReverse} disabled={reverseLoading} className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 hover:bg-red-500/20 disabled:opacity-50">Delete</button>
              </div>
              {net.reverseDns && <p className="text-[10px] text-slate-500 mt-2">Current: {net.reverseDns}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatBytes(bytes?: number) {
  if (bytes === undefined || bytes === null) return "—";
  if (bytes >= 1099511627776) return `${(bytes / 1099511627776).toFixed(2)} TB`;
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
  return `${bytes} B`;
}
