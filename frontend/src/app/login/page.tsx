"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import AuthShell from "@/components/AuthShell";
import { Eye, EyeOff, Mail, Lock, Shield, KeyRound, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [notVerified, setNotVerified] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.auth.getConfig()
      .then((config: any) => {
        const clientId = config.googleClientId;
        setGoogleClientId(clientId);
        if (!clientId || !googleBtnRef.current) return;

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if ((window as any).google && googleBtnRef.current) {
            (window as any).google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleResponse,
              auto_select: false,
            });
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              width: 320,
              text: "signin_with",
              shape: "rectangular",
            });
          }
        };
        document.body.appendChild(script);
      })
      .catch(() => setGoogleClientId(""));
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.google({ credential: response.credential });
      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempToken(res.tempToken);
        setLoading(false);
        return;
      }
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      const pendingCheckout = localStorage.getItem("pendingCheckout");
      if (pendingCheckout && res.user.role !== "ADMIN") {
        localStorage.removeItem("pendingCheckout");
        window.location.href = pendingCheckout;
      } else {
        window.location.href = res.user.role === "ADMIN" ? "/admin" : "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "Google login failed");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotVerified(false);
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempToken(res.tempToken);
        setLoading(false);
        return;
      }
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      const pendingCheckout = localStorage.getItem("pendingCheckout");
      if (pendingCheckout && res.user.role !== "ADMIN") {
        localStorage.removeItem("pendingCheckout");
        window.location.href = pendingCheckout;
      } else {
        window.location.href = res.user.role === "ADMIN" ? "/admin" : "/dashboard";
      }
    } catch (err: any) {
      const msg = err.message || "Login failed";
      if (msg.toLowerCase().includes("verify")) setNotVerified(true);
      setError(msg);
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login2FA({ tempToken, code: twoFactorCode });
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      const pendingCheckout = localStorage.getItem("pendingCheckout");
      if (pendingCheckout && res.user.role !== "ADMIN") {
        localStorage.removeItem("pendingCheckout");
        window.location.href = pendingCheckout;
      } else {
        window.location.href = res.user.role === "ADMIN" ? "/admin" : "/dashboard";
      }
    } catch (err: any) {
      setError(err.message || "2FA verification failed");
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setLoading(true);
    try {
      await api.auth.resendVerification({ email });
      setError("");
      showToast("Verification email sent! Please check your inbox.", "success");
    } catch (err: any) {
      setError(err.message || "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const pwdInputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const btnClass = "w-full rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] py-3 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition disabled:opacity-50";

  const title = twoFactorRequired ? "Two-Factor Authentication" : "Welcome Back";
  const subtitle = twoFactorRequired
    ? "Enter the 6-digit code from your authenticator app"
    : "Sign in to your cloud dashboard";

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
      footer={
        !twoFactorRequired ? (
          <p className="text-slate-500">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold text-[#00b7ff] hover:underline">Create one</Link>
          </p>
        ) : (
          <button
            type="button"
            onClick={() => { setTwoFactorRequired(false); setTempToken(""); setTwoFactorCode(""); setError(""); }}
            className="text-sm text-slate-500 hover:text-[#00b7ff] transition-colors"
          >
            Back to login
          </button>
        )
      }
    >
      {twoFactorRequired ? (
        <form onSubmit={handle2FASubmit} className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00b7ff]" />
            </div>
            <p className="text-sm text-slate-500">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-1.5">6-Digit Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                required
                className={`${inputClass} tracking-widest text-center`}
                placeholder="000000"
                autoFocus
              />
            </div>
          </div>

          <button type="submit" disabled={loading || twoFactorCode.length !== 6} className={btnClass}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
        </form>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notVerified && (
            <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-4 py-3 text-sm text-yellow-700">
              <p className="mb-2">Your email is not verified yet.</p>
              <button onClick={handleResendVerification} disabled={loading} className="text-xs font-semibold text-[#00b7ff] hover:underline">
                {loading ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#0f172a]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#00b7ff] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={pwdInputClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00b7ff]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or continue with</span>
            </div>
          </div>

          <div ref={googleBtnRef} className="mt-4 flex justify-center" />
          {googleClientId === "" && (
            <p className="mt-2 text-center text-[10px] text-slate-400">Google Sign-In not configured by admin</p>
          )}
        </>
      )}
    </AuthShell>
  );
}
