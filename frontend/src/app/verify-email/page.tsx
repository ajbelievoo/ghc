"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token found.");
      return;
    }

    api.auth.verifyEmail({ token })
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [token]);

  return (
    <AuthShell
      title={status === "loading" ? "Verifying Email" : status === "success" ? "Email Verified!" : "Verification Failed"}
      subtitle={message}
      features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00b7ff]/20 to-[#0f0c29]/10 border border-[#00b7ff]/30 flex items-center justify-center">
          {status === "loading" && <Loader2 className="w-8 h-8 text-[#00b7ff] animate-spin" />}
          {status === "success" && <CheckCircle className="w-8 h-8 text-[#00b7ff]" />}
          {status === "error" && <XCircle className="w-8 h-8 text-red-500" />}
        </div>

        {status === "error" && (
          <p className="text-xs text-slate-500">The verification link may have expired or is invalid.</p>
        )}

        {status !== "loading" && (
          <Link
            href="/login"
            className="inline-block rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] px-8 py-2.5 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition"
          >
            Go to Login
          </Link>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fcff] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00b7ff] animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
