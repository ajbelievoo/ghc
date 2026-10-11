"use client";

import { useState, FormEvent } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldAlert, CheckCircle, Loader2, Mail, Clock, Scale } from "lucide-react";

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

      {/* hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#131b3a] to-[#0b1020] text-white">
        <div className="pointer-events-none absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-[#00b7ff]/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#00b7ff]">
            <ShieldAlert className="h-4 w-4" /> Legal — Abuse Desk
          </div>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">Report Abuse</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
            Report spam, phishing, malware, copyright infringement or network abuse originating from GHC
            infrastructure. Verified reports are actioned within 24 hours — emergency cases immediately.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* form */}
          <div>
            {state === "sent" ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-3 text-lg font-black text-emerald-700">Report received</p>
                <p className="mt-1 text-sm text-emerald-600">
                  Our abuse desk will review it and may contact you for details. For urgent matters also email{" "}
                  <a href="mailto:abuse@believoo.com" className="font-semibold underline">abuse@believoo.com</a>.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black text-[#0f172a]">Abuse report</p>
                <p className="mt-1 text-xs text-slate-500">Fields marked * are required — more evidence = faster action.</p>
                <div className="mt-5 space-y-4">
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
                    <option value="trademark">Trademark infringement</option>
                    <option value="other">Other</option>
                  </select>
                  <input className={inp} required placeholder="URL, domain, or IP involved *" value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
                  <textarea className={inp} required rows={6} placeholder="Describe the abuse — include evidence: full email headers, log lines, timestamps with timezone, screenshots links…" value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} />
                  {state === "error" && <p className="text-sm font-semibold text-red-500">{err}</p>}
                  <button type="submit" disabled={state === "sending"} className="w-full rounded-xl bg-[#0050d7] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#0040aa] disabled:opacity-50 transition">
                    {state === "sending" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Submit report"}
                  </button>
                  <p className="text-xs text-slate-500">
                    For legally binding requests also email <a className="text-[#0050d7] font-semibold" href="mailto:abuse@believoo.com">abuse@believoo.com</a> —
                    see our <a className="text-[#0050d7] font-semibold" href="/grievance">Grievance Officer</a>,{" "}
                    <a className="text-[#0050d7] font-semibold" href="/dmca">Copyright policy</a> and{" "}
                    <a className="text-[#0050d7] font-semibold" href="/acceptable-use">Acceptable Use Policy</a>.
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* side info */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><Clock className="h-4 w-4 text-[#00b7ff]" /> Response times</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li className="flex justify-between"><span>CSAM / imminent harm</span><b className="text-red-600">Immediate</b></li>
                <li className="flex justify-between"><span>Active attacks / malware C2</span><b>&lt; 4 hours</b></li>
                <li className="flex justify-between"><span>Phishing / fraud</span><b>&lt; 24 hours</b></li>
                <li className="flex justify-between"><span>Spam / copyright / other</span><b>&lt; 48 hours</b></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><Mail className="h-4 w-4 text-[#00b7ff]" /> What to include</p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                <li>Exact URL, IP or domain involved</li>
                <li>Full email headers for spam reports</li>
                <li>Log lines with timestamps &amp; timezone</li>
                <li>Screenshots or packet captures</li>
                <li>Your contact email for follow-ups</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><Scale className="h-4 w-4 text-[#00b7ff]" /> Legal requests</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Law enforcement and court orders: serve the{" "}
                <a href="/grievance" className="text-[#0050d7] font-semibold">Grievance Officer</a> at{" "}
                <a href="mailto:grievance@believoo.com" className="text-[#0050d7] font-semibold">grievance@believoo.com</a>,
                Believoo Private Limited, 328KA Plot No 152, Rajpur, Budaun – 243633, UP, India.
              </p>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
