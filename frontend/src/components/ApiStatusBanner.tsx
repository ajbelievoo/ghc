"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { WifiOff, AlertTriangle } from "lucide-react";

export default function ApiStatusBanner() {
  const [offline, setOffline] = useState(false);
  const [limited, setLimited] = useState(false);

  useEffect(() => {
    let limitedTimer: ReturnType<typeof setTimeout> | null = null;
    const onOffline = () => setOffline(true);
    const onOk = () => setOffline(false);
    const onLimited = () => {
      setLimited(true);
      if (limitedTimer) clearTimeout(limitedTimer);
      limitedTimer = setTimeout(() => setLimited(false), 8000);
    };
    window.addEventListener("ghc:api-offline", onOffline);
    window.addEventListener("ghc:api-ok", onOk);
    window.addEventListener("ghc:api-limited", onLimited);

    // Global error capture → backend system_logs (best-effort, deduped)
    const seen = new Set<string>();
    const report = (message: string, stack?: string) => {
      if (!localStorage.getItem("token")) return;
      const key = message.slice(0, 120);
      if (seen.has(key)) return;
      seen.add(key);
      api.clientError({ message: message.slice(0, 480), stack, url: window.location.pathname });
    };
    const onError = (e: ErrorEvent) => report(e.message || "unknown error", e.error?.stack);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r: any = e.reason;
      const msg = r?.message || String(r);
      // API request errors are surfaced via toasts already — only report unexpected crashes
      if (r instanceof TypeError || r instanceof SyntaxError || r instanceof ReferenceError) report(msg, r?.stack);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      window.removeEventListener("ghc:api-offline", onOffline);
      window.removeEventListener("ghc:api-ok", onOk);
      window.removeEventListener("ghc:api-limited", onLimited);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      if (limitedTimer) clearTimeout(limitedTimer);
    };
  }, []);

  if (offline) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm text-red-700">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span><b>Connection lost</b> — can't reach GHC services. Retrying automatically…</span>
      </div>
    );
  }
  if (limited) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>You're being rate-limited — please wait a few seconds before retrying.</span>
      </div>
    );
  }
  return null;
}
