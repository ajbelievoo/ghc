"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Loader2, Minus } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Floating live-chat panel. Opens via the "ghc:open-chat" window event
 * (dispatched from SupportWidget / dashboard links). Renders nothing until
 * opened and only for logged-in users.
 */
export default function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [status, setStatus] = useState("open");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const onOpen = () => {
      if (localStorage.getItem("token")) setOpen(true);
    };
    window.addEventListener("ghc:open-chat", onOpen);
    return () => window.removeEventListener("ghc:open-chat", onOpen);
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await api.chat.messages();
      setMessages(d.messages || []);
      setStatus(d.status || "open");
    } catch {
      /* chat unavailable */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    timerRef.current = setInterval(load, 12000);
    return () => clearInterval(timerRef.current);
  }, [open, load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const r = await api.chat.send(body);
      setMessages((m) => [...m, r.message]);
      setText("");
    } catch {
      /* silent — user can retry */
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-5 z-50 flex w-[340px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between bg-[#0b1020] px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-[#00b7ff]" />
          <div>
            <p className="text-sm font-bold text-white">Live support</p>
            <p className="text-[10px] text-slate-400">{status === "open" ? "We typically reply within minutes" : "Chat closed by support"}</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
          <Minus className="w-5 h-5" />
        </button>
      </div>
      <div ref={listRef} className="flex h-72 flex-col gap-2 overflow-y-auto bg-slate-50 p-3">
        {loading && messages.length === 0 && (
          <div className="flex h-full items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">Start a conversation — our team is here to help.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${m.sender === "user" ? "ml-auto bg-[#00b7ff] text-white" : "mr-auto bg-white border border-slate-200 text-slate-800"}`}>
            {m.sender === "admin" && <p className="text-[9px] font-bold text-[#00b7ff] mb-0.5">{m.senderName || "Support"}</p>}
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className={`mt-0.5 text-[9px] ${m.sender === "user" ? "text-white/70" : "text-slate-400"}`}>
              {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-200 p-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={status === "open" ? "Type a message…" : "This chat is closed"}
          disabled={status !== "open"}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-[#00b7ff] focus:outline-none disabled:bg-slate-50"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim() || status !== "open"}
          className="rounded-lg bg-[#00b7ff] p-2 text-white hover:bg-[#0090cc] disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
