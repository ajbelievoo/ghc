"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { Globe, Plus, Pencil, Trash2, X, Loader2, Save, RefreshCw } from "lucide-react";

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

        <p className="text-[10px] text-slate-500 mt-4">
          Use @ for the root domain. Changes are applied to the zone immediately.
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
