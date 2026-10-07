"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter your email address"); return; }
    setLoading(true);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const inputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const btnClass = "w-full rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] py-3 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your email and we'll send you a reset link."
      features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
      footer={
        <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#00b7ff] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-[#00ff88]/30 bg-[#00ff88]/10 p-6 text-center">
          <CheckCircle className="mx-auto h-10 w-10 text-[#00b7ff] mb-3" />
          <h2 className="text-lg font-bold text-[#0f172a]">Check your inbox</h2>
          <p className="mt-2 text-sm text-slate-500">If an account exists with this email, you will receive reset instructions.</p>
          <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-[#00b7ff] hover:underline">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} required />
            </div>
          </div>
          <button type="submit" disabled={loading} className={btnClass}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
