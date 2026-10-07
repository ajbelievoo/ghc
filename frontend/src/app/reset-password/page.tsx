"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Invalid or missing reset token.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await api.auth.resetPassword({ token, newPassword });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Reset failed");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const btnClass = "w-full rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] py-3 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <AuthShell
      title="Set New Password"
      subtitle="Enter your new password below."
      features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#00b7ff] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      }
    >
      {done ? (
        <div className="rounded-2xl border border-[#00ff88]/30 bg-[#00ff88]/10 p-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-[#00b7ff] mb-3" />
          <h2 className="text-lg font-bold text-[#0f172a]">Password Updated</h2>
          <p className="mt-2 text-sm text-slate-500">Your password has been reset successfully.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-[#00b7ff] hover:underline">Log in now</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={loading || !token} className={btnClass}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fcff] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#00b7ff] animate-spin" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
