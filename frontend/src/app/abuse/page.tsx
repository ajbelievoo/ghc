"use client";

import { useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldAlert, CheckCircle, Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function AbusePage() {
  const [form, setForm] = useState({ name: "", email: "", target: "", type: "spam", details: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");
    setErr("");
    try {
      const r = await fetch(`${API}/public/abuse-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.detail || "Submission failed");
      }
      setState("sent");
    } catch (e: any) {
      setErr(e.message || "Submission failed");
      setState("error");
    }
  };

  const inp = "w-full rounded-lg bg-white border border-slate-200 px-4 py-2.5 text-sm text-[#0f172a] outline-none focus:border-[#00b7ff]/60";

  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-[#00b7ff]" />
          <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Report Abuse</h1>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Report spam, phishing, malware, copyright infringement, or network abuse hosted on GHC infrastructure.
          Reports go directly to our abuse desk — acknowledged within 24 hours.
        </p>

        {state === "sent" ? (
          <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 font-bold text-emerald-700">Report received</p>
            <p className="mt-1 text-sm text-emerald-600">Our abuse team will review it shortly. Thank you.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input className={inp} placeholder="Your name (optional)" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className={inp} type="email" required placeholder="Your email *" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <select className={inp} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="spam">Spam / unsolicited email</option>
              <option value="phishing">Phishing / fraud site</option>
              <option value="malware">Malware / virus distribution</option>
              <option value="copyright">Copyright infringement (DMCA)</option>
              <option value="network">Network abuse (scans, attacks)</option>
              <option value="content">Illegal / harmful content</option>
              <option value="other">Other</option>
            </select>
            <input className={inp} required placeholder="URL, domain, or IP involved *" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
            <textarea className={inp} required rows={5} placeholder="Describe the abuse — evidence, headers, timestamps…" value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
            {state === "error" && <p className="text-sm font-semibold text-red-500">{err}</p>}
            <button type="submit" disabled={state === "sending"} className="w-full rounded-lg bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#1e3a8a] disabled:opacity-50">
              {state === "sending" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Submit report"}
            </button>
            <p className="text-xs text-slate-500">For legally binding requests also email <a className="text-[#00b7ff]" href="mailto:abuse@believoo.com">abuse@believoo.com</a> — see our <a className="text-[#00b7ff]" href="/grievance">Grievance Officer</a> and <a className="text-[#00b7ff]" href="/dmca">Copyright policy</a>.</p>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
