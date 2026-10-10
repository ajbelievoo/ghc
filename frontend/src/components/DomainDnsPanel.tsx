"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { Globe, Plus, Pencil, Trash2, X, Loader2, Save, RefreshCw, Lock, LockOpen, KeySquare } from "lucide-react";

interface DomainDnsPanelProps {
  domain: string;
  onClose: () => void;
}

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

export default function DomainDnsPanel({ domain, onClose }: DomainDnsPanelProps) {
  const { showToast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [newRecord, setNewRecord] = useState<{ recordType: string; subDomain: string; target: string; ttl: number }>({
    recordType: "A",
    subDomain: "@",
    target: "",
    ttl: 3600,
  });
  const [nsList, setNsList] = useState<string[]>([]);
  const [nsInput, setNsInput] = useState("");
  const [dnssec, setDnssec] = useState<any>(null);
  const [info, setInfo] = useState<any>(null);
  const [glue, setGlue] = useState<any[]>([]);
  const [glueHost, setGlueHost] = useState("");
  const [glueIps, setGlueIps] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.server.domainRecords(domain);
      setRecords(res.records || []);
    } catch (e: any) {
      showToast(e.message || "Failed to load DNS records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    api.server.domainNameservers(domain).then((r) => {
      const cur = Array.isArray(r.current) ? r.current : [];
      setNsList(cur);
      setNsInput(cur.join("\n"));
    }).catch(() => {});
    api.server.domainDnssec(domain).then((d) => setDnssec(d)).catch(() => {});
    api.server.domainInfo(domain).then(setInfo).catch(() => {});
    api.server.domainGlue(domain).then((r) => setGlue(r.glueRecords || [])).catch(() => {});
  }, [domain]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.target.trim()) return;
    setSaving(true);
    try {
      await api.server.createDomainRecord({
        domain,
        recordType: newRecord.recordType,
        subDomain: newRecord.subDomain,
        target: newRecord.target,
        ttl: Number(newRecord.ttl),
      });
      showToast("DNS record created", "success");
      setNewRecord({ recordType: "A", subDomain: "@", target: "", ttl: 3600 });
      fetchRecords();
    } catch (e: any) {
      showToast(e.message || "Failed to create record", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.target.trim()) return;
    setSaving(true);
    try {
      await api.server.updateDomainRecord(editing.id, {
        domain,
        subDomain: editing.subDomain,
        target: editing.target,
        ttl: Number(editing.ttl),
      });
      showToast("DNS record updated", "success");
      setEditing(null);
      fetchRecords();
    } catch (e: any) {
      showToast(e.message || "Failed to update record", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm("Delete this DNS record?")) return;
    setSaving(true);
    try {
      await api.server.deleteDomainRecord(recordId, domain);
      showToast("DNS record deleted", "success");
      fetchRecords();
    } catch (e: any) {
      showToast(e.message || "Failed to delete record", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#0f172a] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00b7ff]" /> DNS Management: {domain}
          </h3>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 transition-all">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* ===== Domain info / lock / authinfo ===== */}
        {info && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 rounded-xl bg-slate-100 border border-slate-200 p-4 text-xs">
            <div><p className="text-slate-500">Expires</p><p className="font-medium text-[#0f172a]">{info.expirationDate ? new Date(info.expirationDate).toLocaleDateString() : "—"}</p></div>
            <div><p className="text-slate-500">Registry status</p><p className="font-medium text-[#0f172a]">{info.status || "—"}</p></div>
            <div><p className="text-slate-500">NS type</p><p className="font-medium text-[#0f172a]">{info.nameServerType || "—"}</p></div>
            <div>
              <p className="text-slate-500">Transfer lock</p>
              <button
                onClick={async () => {
                  const want = info.transferLockStatus !== "locked";
                  setSaving(true);
                  try {
                    await api.server.setDomainLock(domain, want);
                    setInfo({ ...info, transferLockStatus: want ? "locked" : "unlocked" });
                    showToast(want ? "Transfer lock enabled" : "Transfer lock disabled", "success");
                  } catch (e: any) { showToast(e.message || "Lock update failed", "error"); }
                  finally { setSaving(false); }
                }}
                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  info.transferLockStatus === "locked" ? "bg-[#00ff88]/15 text-[#00a832]" : "bg-yellow-500/15 text-yellow-700"}`}
                title="Click to toggle"
              >
                {info.transferLockStatus === "locked" ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                {(info.transferLockStatus || "unknown").toUpperCase()}
              </button>
            </div>
          </div>
        )}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={async () => {
              if (!confirm(`Request the transfer (auth/EPP) code for ${domain}? It will be emailed to the registrant contact.`)) return;
              setSaving(true);
              try {
                const r = await api.server.domainAuthInfo(domain);
                showToast(r.message || "Auth code requested — check registrant email", "success");
              } catch (e: any) { showToast(e.message || "Request failed", "error"); }
              finally { setSaving(false); }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            <KeySquare className="w-3.5 h-3.5" /> Get transfer (auth) code
          </button>
          <span className="text-[10px] text-slate-400">Unlock the domain first, then request the code to transfer out.</span>
        </div>

        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-slate-100 border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-[#0f172a] mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#00b7ff]" /> Add Record
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={newRecord.recordType}
              onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })}
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <input
              value={newRecord.subDomain}
              onChange={(e) => setNewRecord({ ...newRecord, subDomain: e.target.value })}
              placeholder="@ or host"
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
            />
            <input
              value={newRecord.target}
              onChange={(e) => setNewRecord({ ...newRecord, target: e.target.value })}
              placeholder="Target"
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none md:col-span-2"
            />
            <input
              type="number"
              value={newRecord.ttl}
              onChange={(e) => setNewRecord({ ...newRecord, ttl: Number(e.target.value) })}
              placeholder="TTL"
              className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !newRecord.target.trim()}
            className="mt-3 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Add Record
          </button>
        </form>

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-[#0f172a]">Records</h4>
            <button
              onClick={fetchRecords}
              disabled={loading}
              className="text-xs flex items-center gap-1 text-[#00b7ff] hover:underline"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#00b7ff] animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No records found.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-xs text-slate-500">Type</th>
                    <th className="px-3 py-2 text-xs text-slate-500">Host</th>
                    <th className="px-3 py-2 text-xs text-slate-500">Target</th>
                    <th className="px-3 py-2 text-xs text-slate-500">TTL</th>
                    <th className="px-3 py-2 text-xs text-slate-500"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      {editing?.id === r.id ? (
                        <>
                          <td className="px-3 py-2">
                            <span className="text-xs font-medium text-[#0f172a]">{r.recordType}</span>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={editing.subDomain}
                              onChange={(e) => setEditing({ ...editing, subDomain: e.target.value })}
                              className="w-full rounded bg-white border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={editing.target}
                              onChange={(e) => setEditing({ ...editing, target: e.target.value })}
                              className="w-full rounded bg-white border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={editing.ttl}
                              onChange={(e) => setEditing({ ...editing, ttl: Number(e.target.value) })}
                              className="w-20 rounded bg-white border border-slate-200 px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={handleUpdate} disabled={saving} className="p-1 rounded hover:bg-green-100 text-green-600">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckIcon />}
                              </button>
                              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 text-xs font-medium text-[#0f172a]">{r.recordType}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-600">{r.subDomain || "@"}</td>
                          <td className="px-3 py-2 text-xs font-mono text-slate-600 break-all max-w-[200px]">{r.target}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{r.ttl}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditing(r)} className="p-1 rounded hover:bg-slate-100 text-[#00b7ff]">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-100 text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-slate-100 border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-[#0f172a] mb-1">Nameservers</h4>
          <p className="text-xs text-slate-500 mb-3">One hostname per line — e.g. dns1.example.com</p>
          <textarea
            value={nsInput}
            onChange={(e) => setNsInput(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none"
          />
          <button
            onClick={async () => {
              const list = nsInput.split("\n").map((s) => s.trim()).filter(Boolean);
              if (!list.length) return;
              setSaving(true);
              try {
                await api.server.setDomainNameservers(domain, list);
                setNsList(list);
                showToast("Nameservers updated — propagation may take up to 24h", "success");
              } catch (e: any) { showToast(e.message || "Update failed", "error"); }
              finally { setSaving(false); }
            }}
            disabled={saving}
            className="mt-3 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update nameservers
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-slate-100 border border-slate-200 p-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-[#0f172a]">DNSSEC</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {dnssec ? `Status: ${dnssec.status || "inactive"}` : "DNSSEC protects your zone from DNS spoofing."}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${dnssec?.status === "enabled" || dnssec?.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
            {dnssec?.status || "off"}
          </span>
        </div>

        {/* ===== Glue records ===== */}
        <div className="mt-4 rounded-xl bg-slate-100 border border-slate-200 p-4">
          <h4 className="text-sm font-medium text-[#0f172a] mb-1">Glue records</h4>
          <p className="text-xs text-slate-500 mb-3">
            Register host objects at the registry — needed when your nameservers are subdomains of this domain (e.g. ns1.{domain}).
          </p>
          {glue.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {glue.map((g) => (
                <div key={g.host} className="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
                  <div>
                    <span className="font-mono text-xs text-[#0f172a]">{g.host}</span>
                    <span className="ml-2 text-[10px] text-slate-500">{(g.ips || []).join(", ")}</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete glue record ${g.host}?`)) return;
                      setSaving(true);
                      try {
                        await api.server.deleteDomainGlue(domain, g.host);
                        setGlue(glue.filter((x) => x.host !== g.host));
                        showToast("Glue record deleted", "success");
                      } catch (e: any) { showToast(e.message || "Delete failed", "error"); }
                      finally { setSaving(false); }
                    }}
                    className="text-red-400 hover:text-red-600"
                  ><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={glueHost}
              onChange={(e) => setGlueHost(e.target.value)}
              placeholder="ns1"
              className="w-28 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-mono"
            />
            <span className="text-xs text-slate-400">.{domain}</span>
            <input
              value={glueIps}
              onChange={(e) => setGlueIps(e.target.value)}
              placeholder="IPs (comma separated)"
              className="flex-1 min-w-[160px] rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs font-mono"
            />
            <button
              disabled={saving || !glueHost.trim() || !glueIps.trim()}
              onClick={async () => {
                setSaving(true);
                try {
                  const host = glueHost.trim().endsWith(`.${domain}`) ? glueHost.trim() : `${glueHost.trim()}.${domain}`;
                  const ips = glueIps.split(",").map((s) => s.trim()).filter(Boolean);
                  await api.server.createDomainGlue(domain, host, ips);
                  setGlue([...glue, { host, ips }]);
                  setGlueHost(""); setGlueIps("");
                  showToast("Glue record created at registry", "success");
                } catch (e: any) { showToast(e.message || "Create failed", "error"); }
                finally { setSaving(false); }
              }}
              className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-2 text-xs font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50"
            >Add glue</button>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-4">
          Use @ for the root domain. DNS changes are applied to the zone immediately; nameserver changes propagate in up to 24h.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
