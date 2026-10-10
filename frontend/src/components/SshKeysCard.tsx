"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { KeyRound, Plus, Trash2, Loader2, Copy } from "lucide-react";

export default function SshKeysCard() {
  const { showToast } = useToast();
  const [keys, setKeys] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.auth.sshKeys()
      .then((r: any) => { setKeys(r.keys || []); setError(""); })
      .catch((e: any) => { setError(e.message || "Failed to load SSH keys"); setKeys([]); });
  };
  useEffect(load, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !pubkey.trim()) return;
    setSaving(true);
    try {
      await api.auth.createSshKey(name.trim(), pubkey.trim());
      showToast("SSH key added — pick it at reinstall/deploy time", "success");
      setName(""); setPubkey("");
      load();
    } catch (err: any) {
      showToast(err.message || "Failed to add key", "error");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (keyName: string) => {
    if (!confirm(`Delete SSH key "${keyName}"?`)) return;
    try {
      await api.auth.deleteSshKey(keyName);
      showToast("SSH key deleted", "success");
      setKeys((k) => (k || []).filter((x) => x.name !== keyName));
    } catch (err: any) {
      showToast(err.message || "Delete failed", "error");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6">
      <h3 className="text-sm font-semibold text-[#0f172a] mb-1 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#00b7ff]" /> SSH Keys
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Keys are injected into your server during OS reinstall — no password login needed.
      </p>

      {keys === null ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-[#00b7ff]" /></div>
      ) : error ? (
        <p className="text-xs text-red-500 py-2">{error}</p>
      ) : (
        <div className="space-y-2 mb-4">
          {keys.length === 0 && <p className="text-xs text-slate-400 py-2">No keys yet — generate one with <code className="font-mono">ssh-keygen</code> and paste the .pub contents below.</p>}
          {keys.map((k) => (
            <div key={k.name} className="flex items-center justify-between rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-[#0f172a] font-medium truncate">{k.name}</p>
                  {k.default && <span className="rounded bg-[#00b7ff]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#00b7ff]">DEFAULT</span>}
                </div>
                {k.fingerprint && <p className="text-[10px] font-mono text-slate-500 truncate">{k.fingerprint}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {k.key && (
                  <button onClick={() => { navigator.clipboard.writeText(k.key); showToast("Public key copied", "success"); }}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-500" title="Copy public key">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => remove(k.name)} className="p-1.5 rounded hover:bg-red-100 text-red-500" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="space-y-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name (e.g. laptop, ci-runner)"
          className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
        <textarea value={pubkey} onChange={(e) => setPubkey(e.target.value)} rows={2}
          placeholder="ssh-ed25519 AAAA… or ssh-rsa AAAA…"
          className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-mono text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
        <button type="submit" disabled={saving || !name.trim() || !pubkey.trim()}
          className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-4 py-2.5 text-sm font-medium text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all disabled:opacity-50 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add SSH Key
        </button>
      </form>
    </div>
  );
}
