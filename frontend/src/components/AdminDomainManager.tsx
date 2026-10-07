"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { Globe, Search, Loader2, Plus, Pencil, Trash2, X, Save, RefreshCw } from "lucide-react";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"];

export default function AdminDomainManager() {
  const { showToast } = useToast();
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [newRecord, setNewRecord] = useState({ recordType: "A", subDomain: "@", target: "", ttl: 3600 });
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDomains(); }, []);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const d = await api.admin.getAdminDomains();
      setDomains(d || []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const fetchRecords = async (domain: string) => {
    setRecordsLoading(true);
    try {
      const r = await api.admin.getAdminDomainRecords(domain);
      setRecords(r.records || []);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setRecordsLoading(false); }
  };

  const selectDomain = (domain: string) => {
    setSelectedDomain(domain);
    fetchRecords(domain);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !newRecord.target) return;
    setSaving(true);
    try {
      await api.admin.createAdminDomainRecord({ domain: selectedDomain, ...newRecord, ttl: Number(newRecord.ttl) });
      showToast("Record created", "success");
      setNewRecord({ recordType: "A", subDomain: "@", target: "", ttl: 3600 });
      fetchRecords(selectedDomain);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDomain || !editing) return;
    setSaving(true);
    try {
      await api.admin.updateAdminDomainRecord(editing.id, { domain: selectedDomain, subDomain: editing.subDomain, target: editing.target, ttl: Number(editing.ttl) });
      showToast("Record updated", "success");
      setEditing(null);
      fetchRecords(selectedDomain);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (recordId: number) => {
    if (!selectedDomain) return;
    if (!confirm("Delete this record?")) return;
    setSaving(true);
    try {
      await api.admin.deleteAdminDomainRecord(recordId, selectedDomain);
      showToast("Record deleted", "success");
      fetchRecords(selectedDomain);
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-[#0f172a]">Customer Domains & DNS</h2>
        <button onClick={fetchDomains} className="flex items-center gap-2 rounded-lg bg-slate-100/50 border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100/80 transition-all"><RefreshCw className="w-4 h-4" />Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[#00b7ff] animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-[#00b7ff]" /> Domains</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {domains.map((d: any) => (
                <button key={d.id} onClick={() => selectDomain(d.domain)} className={`w-full text-left rounded-lg border px-4 py-3 transition-all ${selectedDomain === d.domain ? 'border-[#00b7ff] bg-[#00b7ff]/5' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'}`}>
                  <p className="text-sm font-medium text-[#0f172a]">{d.domain}</p>
                  <p className="text-[10px] text-slate-500">{d.status} · {d.years} yr · Exp {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'N/A'}</p>
                </button>
              ))}
              {domains.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No domains found.</p>}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!selectedDomain ? (
              <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 text-center text-slate-500">Select a domain to manage DNS.</div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[#00b7ff]" /> Add Record to {selectedDomain}</h3>
                  <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select value={newRecord.recordType} onChange={(e) => setNewRecord({ ...newRecord, recordType: e.target.value })} className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">{RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                    <input value={newRecord.subDomain} onChange={(e) => setNewRecord({ ...newRecord, subDomain: e.target.value })} placeholder="@ or host" className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm" />
                    <input value={newRecord.target} onChange={(e) => setNewRecord({ ...newRecord, target: e.target.value })} placeholder="Target" className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
                    <input type="number" value={newRecord.ttl} onChange={(e) => setNewRecord({ ...newRecord, ttl: Number(e.target.value) })} placeholder="TTL" className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm" />
                  </form>
                  <button type="submit" disabled={saving} onClick={handleCreate} className="mt-3 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2 text-sm text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> Add Record</button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-4">DNS Records</h3>
                  {recordsLoading ? <Loader2 className="w-5 h-5 text-[#00b7ff] animate-spin" /> : records.length === 0 ? <p className="text-sm text-slate-500">No records.</p> : (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100"><tr><th className="px-3 py-2 text-xs text-slate-500">Type</th><th className="px-3 py-2 text-xs text-slate-500">Host</th><th className="px-3 py-2 text-xs text-slate-500">Target</th><th className="px-3 py-2 text-xs text-slate-500">TTL</th><th></th></tr></thead>
                        <tbody>
                          {records.map((r: any) => (
                            <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                              {editing?.id === r.id ? (
                                <>
                                  <td className="px-3 py-2 text-xs font-medium">{r.recordType}</td>
                                  <td className="px-3 py-2"><input value={editing.subDomain} onChange={(e) => setEditing({ ...editing, subDomain: e.target.value })} className="w-full rounded bg-white border border-slate-200 px-2 py-1 text-xs" /></td>
                                  <td className="px-3 py-2"><input value={editing.target} onChange={(e) => setEditing({ ...editing, target: e.target.value })} className="w-full rounded bg-white border border-slate-200 px-2 py-1 text-xs" /></td>
                                  <td className="px-3 py-2"><input type="number" value={editing.ttl} onChange={(e) => setEditing({ ...editing, ttl: Number(e.target.value) })} className="w-20 rounded bg-white border border-slate-200 px-2 py-1 text-xs" /></td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                      <button onClick={handleUpdate} className="p-1 rounded hover:bg-green-100 text-green-600"><CheckIcon /></button>
                                      <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-3 py-2 text-xs font-medium text-[#0f172a]">{r.recordType}</td>
                                  <td className="px-3 py-2 text-xs font-mono text-slate-600">{r.subDomain || "@"}</td>
                                  <td className="px-3 py-2 text-xs font-mono text-slate-600 break-all max-w-[220px]">{r.target}</td>
                                  <td className="px-3 py-2 text-xs text-slate-500">{r.ttl}</td>
                                  <td className="px-3 py-2">
                                    <div className="flex gap-1">
                                      <button onClick={() => setEditing(r)} className="p-1 rounded hover:bg-slate-100 text-[#00b7ff]"><Pencil className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-100 text-red-600"><Trash2 className="w-4 h-4" /></button>
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
}
