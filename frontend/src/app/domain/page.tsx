"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
import { Search, Globe, Loader2, Check, X, ChevronRight } from "lucide-react";

interface DomainResult {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
  tld?: string;
  reason?: string;
}

function fmtPrice(v?: number, currency?: string) {
  const cur = (currency || "USD").toUpperCase();
  const sym = getCurrencySymbol(cur);
  return `${sym}${(v || 0).toFixed(2)} ${cur}`;
}

function DomainPageContent() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params?.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [searched, setSearched] = useState(!!params?.get("q"));

  const doSearch = async (value: string) => {
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const list = await api.server.suggestDomains(value.trim());
      setResults((Array.isArray(list) ? list : []).map((r: any) => ({ ...r, currency: r.currency || "USD" })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = params?.get("q");
    if (q) doSearch(q);
  }, [params]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  return (
    <DomainPageShell>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter domain name..."
            className="w-full rounded border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#00b7ff]"
          />
        </div>
        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded bg-[#ff3d00] px-6 py-3 text-sm font-bold text-white hover:bg-[#e63700] disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Search
        </button>
      </form>

      {searched && !loading && results.length === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">No results found.</p>
      )}

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          {results.map((r) => (
            <div key={r.domain} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-[#f8faff] p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                {r.available ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-500" />}
                <div>
                  <p className="font-bold text-[#0f172a]">{r.domain}</p>
                  <p className="text-xs text-slate-500">{r.available ? "Available" : r.reason || "Taken / unavailable"}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {r.available ? (
                  <>
                    <span className="text-sm font-bold text-[#00b7ff]">{fmtPrice(r.price, r.currency)}</span>
                    <button
                      onClick={() => {
                        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                        const target = `/dashboard?tab=domains&domain=${encodeURIComponent(r.domain)}`;
                        if (token) {
                          window.location.href = target;
                        } else {
                          localStorage.setItem("pendingCheckout", target);
                          window.location.href = "/login";
                        }
                      }}
                      className="flex items-center gap-1 rounded bg-[#0f0c29] px-4 py-2 text-xs font-bold text-white hover:bg-[#302b63]"
                    >
                      Register <ChevronRight className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DomainPageShell>
  );
}

function DomainPageShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <Navbar />

      <section className="bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-[#00f0ff]">
            Premium Domains
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-5xl">Domain Names</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">Search and register domain names with instant pricing and availability.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {children}
      </section>
      <Footer />
    </div>
  );
}

export default function DomainPage() {
  return (
    <Suspense
      fallback={
        <DomainPageShell>
          <div className="flex items-center justify-center gap-2 rounded border border-slate-200 bg-[#f8faff] p-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-[#00b7ff]" /> Loading domain search...
          </div>
        </DomainPageShell>
      }
    >
      <DomainPageContent />
    </Suspense>
  );
}
