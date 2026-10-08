"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import AuthShell from "@/components/AuthShell";
import { CaptchaField, useCaptcha } from "@/components/CaptchaField";
import { Eye, EyeOff, Mail, Lock, User, Loader2, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { captcha, setCaptcha, image: captchaImage, refresh: refreshCaptcha } = useCaptcha();

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
              text: "signup_with",
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
      setError(err.message || "Google sign-up failed");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.register({ name: name.trim(), email: email.trim(), password, captchaId: captcha.captchaId, captchaAnswer: captcha.captchaAnswer });
      if (res.token) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        const pendingCheckout = localStorage.getItem("pendingCheckout");
        if (pendingCheckout && res.user.role !== "ADMIN") {
          localStorage.removeItem("pendingCheckout");
          window.location.href = pendingCheckout;
        } else {
          window.location.href = res.user.role === "ADMIN" ? "/admin" : "/dashboard";
        }
        return;
      }
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const pwdInputClass = "w-full rounded-[10px] border border-slate-200 bg-slate-50 pl-10 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#00b7ff] focus:ring-[#00b7ff]/20 focus:ring-1 outline-none transition";
  const btnClass = "w-full rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] py-3 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition disabled:opacity-50";

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a verification link to ${email}. Click it to activate your account.`}
        features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
      >
        <div className="rounded-2xl border border-[#00b7ff]/20 bg-[#00b7ff]/5 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#00b7ff]/10 border border-[#00b7ff]/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-[#00b7ff]" />
          </div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Email sent</h2>
          <p className="text-sm text-slate-500 mb-6">Click the verification link to activate your account.</p>
          <Link href="/login" className="inline-block rounded-[10px] bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] px-6 py-2.5 text-sm font-bold text-white hover:shadow-[0_8px_22px_rgba(0,183,255,.35)] transition">
            Go to Login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Start your cloud infrastructure journey"
      features={["Enterprise Cloud VPS", "NVMe SSD Storage", "99.99% Uptime SLA"]}
      footer={
        <p className="text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#00b7ff] hover:underline">Sign in</Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className={inputClass}
              placeholder="John Doe"
            />
          </div>
        </div>

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
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
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

        <div>
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={`${pwdInputClass} ${
                confirmPassword && confirmPassword !== password
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                  : ""
              }`}
              placeholder="••••••••"
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#0f172a] mb-1.5">Human check</label>
          <CaptchaField captcha={captcha} image={captchaImage} onChange={setCaptcha} onRefresh={refreshCaptcha} />
        </div>

        <button
          type="submit"
          disabled={loading || (confirmPassword.length > 0 && confirmPassword !== password)}
          className={btnClass}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
          {loading ? "Creating account..." : "Create Account"}
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
    </AuthShell>
  );
}
