"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, MessageSquare } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("GHC page error:", error);
    try {
      import("@/lib/api").then(({ api }) =>
        api.clientError({
          message: (error.message || "route error").slice(0, 480),
          stack: (error.stack || "").slice(0, 2000),
          url: window.location.pathname,
          component: "error.tsx",
        })
      );
    } catch {
      /* best effort */
    }
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#f4f6fb] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-[#0f172a] mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-500 mb-6">
          An unexpected error occurred while loading this page. Our team has been notified automatically.
        </p>
        {error.digest && <p className="text-[10px] text-slate-400 font-mono mb-4">Ref: {error.digest}</p>}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[#00b7ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#009fe0] transition"
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/support"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-slate-50 transition"
          >
            <MessageSquare className="w-4 h-4 text-[#00b7ff]" /> Support
          </Link>
        </div>
      </div>
    </div>
  );
}
