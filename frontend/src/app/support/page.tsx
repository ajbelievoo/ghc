"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { MessageSquare, Mail, Server, CreditCard, Globe, Loader2, CheckCircle, ArrowRight } from "lucide-react";

const categories = [
  { icon: Server, label: "Server & Infrastructure", desc: "VPS, dedicated servers, power, networking" },
  { icon: CreditCard, label: "Billing & Payments", desc: "Invoices, wallet, refunds, payment issues" },
  { icon: Globe, label: "Domains & DNS", desc: "Domain registration, DNS, transfers" },
  { icon: MessageSquare, label: "Account & Security", desc: "Login issues, 2FA, profile changes" },
];

export default function SupportPage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.name) setName(u.name);
        if (u?.email) setEmail(u.email);
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) { showToast("Please fill in all fields", "error"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("email", email);
      form.append("category", category);
      form.append("subject", subject);
      form.append("message", message);
      if (files) for (let i = 0; i < Math.min(files.length, 3); i++) form.append("files", files[i]);
      await api.support.createTicket(form);
      setSent(true);
      showToast("Ticket submitted successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to submit ticket", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <h1 className="text-4xl font-black md:text-5xl">Support Center</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">Get help with your servers, billing, domains, and account. Average response time: under 4 hours.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-4">
          {categories.map((c) => (
            <div key={c.label} className="rounded-2xl border border-slate-200 p-6 hover:border-[#00b7ff]/30 transition-all">
              <c.icon className="h-6 w-6 text-[#00b7ff] mb-3" />
              <h3 className="font-bold text-sm">{c.label}</h3>
              <p className="mt-1 text-xs text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-8 pb-20">
        {sent ? (
          <div className="rounded-2xl border border-[#00ff88]/20 bg-[#f8faff] p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-[#00a832] mb-4" />
            <h2 className="text-2xl font-bold">Ticket Received</h2>
            <p className="mt-2 text-sm text-slate-600">Thank you for contacting us. A support agent will review your request and respond within 24 hours.</p>
            <p className="mt-4 text-xs text-slate-400">Reference: SUP-{Date.now().toString(36).toUpperCase()}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-[#f8faff] p-8">
            <h2 className="text-xl font-bold mb-6">Submit a Ticket</h2>
            <div className="grid gap-4 md:grid-cols-2 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]">
                <option value="">Select a category</option>
                {categories.map((c) => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Subject</label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff] resize-none" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5">Attachments (max 3)</label>
              <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#00b7ff]" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#0f0c29] py-3 text-sm font-bold text-white hover:bg-[#302b63] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
            </button>
          </form>
        )}
      </section>

      <Footer />
    </div>
  );
}
