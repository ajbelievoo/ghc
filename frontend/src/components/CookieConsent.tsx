"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem("ghc_cookie_consent")) setShow(true);
    } catch {}
  }, []);
  if (!show) return null;
  const accept = () => {
    try { localStorage.setItem("ghc_cookie_consent", "accepted"); } catch {}
    setShow(false);
  };
  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <p className="flex-1 text-xs text-slate-600">
          We use essential cookies for login, security and preferences only — no advertising trackers.{" "}
          <Link href="/cookies" className="text-[#00b7ff] hover:underline">Cookie Policy</Link>
        </p>
        <button onClick={accept} className="rounded-lg bg-[#0f0c29] px-5 py-2 text-xs font-bold text-white hover:bg-[#1e3a8a]">
          Accept
        </button>
      </div>
    </div>
  );
}
