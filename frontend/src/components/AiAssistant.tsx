"use client";

import { useEffect, useState } from "react";
import { MessageSquare, X, Send, Bot, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AiAssistant() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("ghc-open-ai", handler);
    return () => window.removeEventListener("ghc-open-ai", handler);
  }, []);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([
    { sender: "bot", text: "Hi! I am your GHC assistant. Ask me about servers, domains, billing, or support." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { sender: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await api.ai.ask(userMsg);
      setMessages((m) => [...m, { sender: "bot", text: res.reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { sender: "bot", text: "Sorry, I could not process that. Please try again or contact support." }]);
    } finally { setLoading(false); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="fixed bottom-[5.5rem] right-4 z-50 rounded-full w-11 h-11 sm:bottom-6 sm:right-6 sm:w-14 sm:h-14 bg-[#00b7ff] text-[#0f172a] shadow-2xl flex items-center justify-center hover:scale-105 transition-transform">
        <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-50 w-[calc(100vw-2rem)] max-w-sm sm:bottom-6 sm:right-6 sm:w-96 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-[#0f0c29] text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2"><Bot className="w-5 h-5" /><span className="font-semibold text-sm">GHC AI Assistant</span></div>
        <button onClick={() => setOpen(false)} className="hover:text-slate-300"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.sender === "user" ? "bg-[#00b7ff] text-white rounded-br-none" : "bg-slate-100 text-[#0f172a] rounded-bl-none"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-slate-100 text-[#0f172a] rounded-xl rounded-bl-none px-4 py-2 text-sm flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> typing...</div></div>}
      </div>
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask something..." className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none" />
        <button onClick={send} disabled={loading || !input.trim()} className="rounded-lg bg-[#00b7ff] text-white px-3 py-2 hover:bg-[#009fe0] disabled:opacity-50"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
