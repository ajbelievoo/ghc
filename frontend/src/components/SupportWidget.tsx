"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Mail, BookOpen, LifeBuoy } from "lucide-react";
import { useGhcSettings } from "@/lib/ghcSettings";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const ghc = useGhcSettings();
  const wa = (ghc.whatsapp_number || "").replace(/[^0-9]/g, "");
  const email = ghc.support_email || "support@believoo.com";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0f0c29] to-[#302b63] px-4 py-3">
            <p className="text-sm font-bold text-white">Need help?</p>
            <p className="text-[11px] text-slate-300">We usually reply within minutes</p>
          </div>
          <div className="divide-y divide-slate-100">
            {wa && (
              <a
                href={`https://wa.me/${wa}?text=${encodeURIComponent("Hi GHC team, I need help with ")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0f172a]">WhatsApp</span>
                  <span className="block text-[11px] text-slate-500">Chat with us instantly</span>
                </span>
              </a>
            )}
            <Link href="/support" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00b7ff]/15 text-[#00b7ff]">
                <LifeBuoy className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#0f172a]">Support ticket</span>
                <span className="block text-[11px] text-slate-500">Trackable, prioritized queue</span>
              </span>
            </Link>
            <a href={`mailto:${email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8b5cf6]/15 text-[#8b5cf6]">
                <Mail className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#0f172a]">Email us</span>
                <span className="block text-[11px] text-slate-500">{email}</span>
              </span>
            </a>
            <Link href="/kb" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                <BookOpen className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#0f172a]">Knowledge base</span>
                <span className="block text-[11px] text-slate-500">Guides &amp; how-tos</span>
              </span>
            </Link>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Support chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#0f0c29] to-[#302b63] text-white shadow-lg shadow-[#00b7ff]/25 transition hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
