"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, ShieldCheck, Lock, CreditCard, ArrowLeft, Wallet, Building2, BadgeCheck } from "lucide-react";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load payment SDK"));
    document.body.appendChild(s);
  });
}

export default function PaymentClient() {
  const search = useSearchParams();
  const id = search.get("tx") || search.get("id") || "";
  const gateway = (search.get("gateway") || "").toLowerCase();
  const returned = search.get("done") === "1";
  const failed = search.get("failed") === "1" || search.get("cancelled") === "1";
  const { showToast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    api.payments.getSession(id as string)
      .then((data: any) => setSession(data))
      .catch((e: any) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [id, showToast]);

  // After redirecting back from a gateway, poll session status
  useEffect(() => {
    if (!session || session.status === "COMPLETED" || !returned) return;
    const t = setInterval(() => {
      api.payments.getSession(id as string)
        .then((data: any) => {
          setSession(data);
          if (data.status === "COMPLETED") {
            clearInterval(t);
            setTimeout(() => (window.location.href = "/dashboard"), 1500);
          }
        })
        .catch(() => {});
    }, 3000);
    return () => clearInterval(t);
  }, [session, returned, id]);

  const payRazorpay = async () => {
    const checkout = session?.checkout || {};
    if (!checkout.orderId || !checkout.keyId) throw new Error("Razorpay order not initialized");
    await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    const rzp = new (window as any).Razorpay({
      key: checkout.keyId,
      order_id: checkout.orderId,
      amount: Math.round(session.amount * 100),
      currency: session.currency,
      name: "BelieVoo GHC",
      description: "Cloud services payment",
      handler: async (resp: any) => {
        try {
          await api.payments.verifyRazorpay(resp);
          showToast("Payment verified", "success");
          setSession((s: any) => ({ ...s, status: "COMPLETED" }));
          setTimeout(() => (window.location.href = "/dashboard"), 1500);
        } catch (e: any) {
          showToast(e.message || "Verification failed", "error");
        }
      },
      modal: { ondismiss: () => setPaying(false) },
    });
    rzp.open();
  };

  const payCashfree = async () => {
    const checkout = session?.checkout || {};
    if (!checkout.paymentSessionId) throw new Error("Cashfree session not initialized");
    await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
    const cf = (window as any).Cashfree({ mode: checkout.env === "production" ? "production" : "sandbox" });
    cf.checkout({ paymentSessionId: checkout.paymentSessionId, redirectTarget: "_self" });
  };

  const payPayu = () => {
    const checkout = session?.checkout || {};
    if (!checkout.url || !checkout.params) throw new Error("PayU session not initialized");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = checkout.url;
    Object.entries(checkout.params).forEach(([k, v]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  const pay = async () => {
    setPaying(true);
    try {
      if (gateway === "razorpay") await payRazorpay();
      else if (gateway === "cashfree") await payCashfree();
      else if (gateway === "payu") payPayu();
      else throw new Error("This gateway redirects you automatically — use the checkout link");
    } catch (e: any) {
      showToast(e.message, "error");
      setPaying(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-[#f4f7fc] text-[#0f172a] relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#00b7ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#7b2ff7]/10 blur-3xl" />
      <header className="relative border-b border-slate-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/images/ghc-icon.png" alt="GHC" className="h-8 w-8 rounded-lg" />
            <span className="text-sm font-black tracking-tight">GHC <span className="text-slate-400 font-medium">· Go Host Cloud</span></span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600"><Lock className="h-3.5 w-3.5" /> Secure payment</span>
            <a href="/dashboard" className="text-xs font-semibold text-slate-500 hover:text-[#0f172a] flex items-center gap-1"><ArrowLeft className="h-3.5 w-3.5" /> Exit</a>
          </div>
        </div>
      </header>
      <main className="relative mx-auto max-w-lg px-6 py-12">{children}</main>
    </div>
  );

  if (loading) {
    return <Shell><div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#00b7ff]" /></div></Shell>;
  }

  if (!id || !session) {
    return (
      <Shell>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-black">Payment session not found</h1>
          <p className="mt-2 text-sm text-slate-600">Please check the link or contact support.</p>
          <a href="/dashboard" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0050d7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0040aa]">Go to dashboard</a>
        </div>
      </Shell>
    );
  }

  const symbol = getCurrencySymbol(session?.currency || "USD");
  const isManual = gateway === "manual" || session?.gateway === "manual" || session?.checkout?.manual;
  const gwLabel = (gateway || session?.gateway || "") === "manual" ? "Manual / Bank Transfer" : ({ wallet: "GHC Wallet", paypal: "PayPal", razorpay: "Card / UPI — Razorpay", stripe: "Credit card — Stripe", cashfree: "UPI / Cards — Cashfree", payu: "UPI / Cards — PayU" } as Record<string, string>)[gateway || session?.gateway || ""] || (gateway || session?.gateway);
  const GwIcon = isManual ? Building2 : (gateway === "wallet" ? Wallet : CreditCard);
  const done = session?.status === "COMPLETED";

  return (
    <Shell>
      {/* amount card */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0050d7] to-[#003aad] text-white p-7 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Complete payment</p>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-4xl font-black">{symbol}{(session?.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${done ? "bg-emerald-400/20 text-emerald-200" : "bg-white/15 text-white/80"}`}>{session?.status}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
          <GwIcon className="h-4 w-4" /> {gwLabel}
          <span className="ml-auto font-mono text-[10px] text-white/40">#{id.slice(0, 8)}</span>
        </div>
      </div>

      {/* action card */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        {done ? (
          <div className="text-center py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle className="h-8 w-8 text-emerald-500" /></div>
            <p className="mt-3 text-lg font-black">Payment completed</p>
            <p className="text-xs text-slate-500 mt-1">Your service is being activated. Redirecting to dashboard…</p>
          </div>
        ) : failed ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-[#fff4ef] border border-[#ff3d00]/20 p-4 text-xs font-semibold text-[#ff3d00] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> Payment was not completed. Please try again or pick a different method.
            </div>
            {["razorpay", "cashfree", "payu"].includes(gateway) && (
              <button onClick={pay} disabled={paying} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0050d7] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#0040aa] disabled:opacity-50">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Retry payment
              </button>
            )}
          </div>
        ) : returned ? (
          <div className="text-center py-4">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#0050d7]" />
            <p className="mt-3 text-sm font-bold">Confirming your payment…</p>
            <p className="text-xs text-slate-500 mt-1">We are checking with the payment gateway. Do not close this page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Payment method</span><span className="font-semibold text-[#0f172a]">{gwLabel}</span></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Reference</span><span className="font-mono text-[#0f172a]">{id}</span></div>
              <div className="flex justify-between px-4 py-2.5"><span className="text-slate-500">Amount</span><span className="font-bold text-[#0f172a]">{symbol}{(session?.amount || 0).toFixed(2)} {session?.currency}</span></div>
            </div>

            {isManual && (
              <div className="space-y-2 rounded-xl border border-dashed border-[#00b7ff] bg-[#f8fcff] p-4 text-sm text-slate-600">
                <p className="font-bold text-[#0f172a] text-xs uppercase tracking-wide">Manual payment instructions</p>
                <p className="text-xs">{session?.checkout?.instructions || "Please complete payment via UPI / bank transfer / NEFT. The service will be activated after payment verification."}</p>
                <p className="text-[10px] text-slate-500">Save this page URL. Share the payment screenshot/reference with support to activate your service quickly.</p>
              </div>
            )}

            {session?.checkout?.url && (
              <a href={session.checkout.url} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0050d7] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#0040aa] transition-all">
                Continue to payment <ExternalLink className="h-4 w-4" />
              </a>
            )}
            {["razorpay", "cashfree", "payu"].includes(gateway) && (
              <button onClick={pay} disabled={paying} className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0050d7] px-5 py-3.5 text-sm font-bold text-white hover:bg-[#0040aa] disabled:opacity-50 transition-all">
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Pay {symbol}{(session?.amount || 0).toFixed(2)} securely
              </button>
            )}
            {!session?.checkout?.url && !["razorpay", "cashfree", "payu"].includes(gateway) && !isManual && (
              <div className="rounded-xl bg-[#fff4ef] p-3 text-xs font-bold text-[#ff3d00] flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> This payment session has no checkout link. Please contact support.
              </div>
            )}
          </div>
        )}
      </div>

      {/* trust strip */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] font-semibold text-slate-400">
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL encrypted</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> PCI-DSS compliant gateway</span>
        <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> GHC secure checkout</span>
      </div>
    </Shell>
  );
}
