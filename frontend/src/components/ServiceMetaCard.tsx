"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { StickyNote, Tag, Plus, X, Pencil } from "lucide-react";

export default function ServiceMetaCard({ server, onUpdated }: { server: any; onUpdated?: (note: string | null, tags: string[]) => void }) {
  const { showToast } = useToast();
  const [note, setNote] = useState(server.customerNote || "");
  const [editingNote, setEditingNote] = useState(false);
  const [tags, setTags] = useState<string[]>(server.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (patch: { customerNote?: string | null; tags?: string[] }) => {
    setSaving(true);
    try {
      const r = await api.server.updateMeta(server.id, patch);
      onUpdated?.(r.customerNote, r.tags || []);
      return true;
    } catch (e: any) {
      showToast(e.message || "Could not save", "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (await save({ customerNote: note.trim() || null })) setEditingNote(false);
  };

  const updateTags = async (next: string[]) => {
    const prev = tags;
    setTags(next);
    if (!(await save({ tags: next }))) setTags(prev);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTagInput("");
    updateTags([...tags, t]);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5 space-y-3">
      {/* note */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 min-w-0">
          <StickyNote className="w-4 h-4 text-[#00b7ff] mt-0.5 shrink-0" />
          {editingNote ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                autoFocus
                placeholder="e.g. production database — do not reboot during business hours"
                className="w-full rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-xs text-[#0f172a] outline-none focus:border-[#00b7ff]/60"
              />
              <button onClick={saveNote} disabled={saving} className="rounded-lg bg-[#00b7ff] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Save</button>
              <button onClick={() => { setEditingNote(false); setNote(server.customerNote || ""); }} className="text-xs text-slate-400">Cancel</button>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xs text-slate-700 truncate">{server.customerNote || <span className="text-slate-400">Add a note — e.g. "production-db"</span>}</p>
            </div>
          )}
        </div>
        {!editingNote && (
          <button onClick={() => setEditingNote(true)} className="text-slate-400 hover:text-[#00b7ff] shrink-0">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* tags */}
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="w-3.5 h-3.5 text-slate-400" />
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-2 py-0.5 text-[10px] font-medium text-[#00b7ff]">
            {t}
            <button onClick={() => updateTags(tags.filter((x) => x !== t))} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            placeholder="tag"
            className="w-16 rounded bg-transparent border-b border-slate-200 px-1 py-0.5 text-[10px] text-[#0f172a] outline-none focus:border-[#00b7ff]"
          />
          {tagInput.trim() && <button onClick={addTag} className="text-[#00b7ff]"><Plus className="w-3 h-3" /></button>}
        </span>
      </div>
    </div>
  );
}
