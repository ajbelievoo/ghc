"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

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

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-[#00b7ff]" /></div>;
  }

  if (!id || !session) {
    return (
      <div className="min-h-screen bg-white text-[#0f172a]">
        <div className="mx-auto max-w-md px-6 py-20 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h1 className="mt-4 text-xl font-black">Payment session not found</h1>
          <p className="mt-2 text-sm text-slate-600">Please check the link or contact support.</p>
        </div>
      </div>
    );
  }

  const symbol = getCurrencySymbol(session?.currency || "USD");
  const isManual = gateway === "manual" || session?.gateway === "manual" || session?.checkout?.manual;

  return (
    <div className="min-h-screen bg-white text-[#0f172a]">
      <div className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-black">Complete payment</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gateway: <b className="text-[#0f172a]">{(gateway || session?.gateway) === "manual" ? "Manual / Bank Transfer" : (gateway || session?.gateway)}</b>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Amount: <b className="text-[#0f172a]">{symbol}{(session?.amount || 0).toFixed(2)}</b>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Status: <b className="text-[#0f172a]">{session?.status}</b>
          </p>

          {isManual && session?.status !== "COMPLETED" && (
            <div className="mt-6 space-y-3 rounded-lg border border-dashed border-[#00b7ff] bg-[#f8fcff] p-4 text-sm text-slate-600">
              <p className="font-bold text-[#0f172a]">Manual payment instructions</p>
              <p>{session?.checkout?.instructions || "Please complete payment via UPI / bank transfer / NEFT. The service will be activated after payment verification."}</p>
              <p className="text-xs text-slate-500">Save this page URL. Share the payment screenshot/reference with support to activate your service quickly.</p>
            </div>
          )}

          {session?.status === "COMPLETED" ? (
            <div className="mt-6 flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-bold">Payment completed</span>
            </div>
          ) : failed ? (
            <div className="mt-6 rounded bg-[#fff4ef] p-3 text-xs font-bold text-[#ff3d00] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> Payment was not completed. Please try again or contact support.
            </div>
          ) : returned ? (
            <div className="mt-6 flex items-center gap-2 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Confirming your payment with the gateway…</span>
            </div>
          ) : (
            <>
              {session?.checkout?.url && (
                <a
                  href={session.checkout.url}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#302b63]"
                >
                  Continue to payment <ExternalLink className="h-4 w-4" />
                </a>
              )}
              {["razorpay", "cashfree", "payu"].includes(gateway) && (
                <button
                  onClick={pay}
                  disabled={paying}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#302b63] disabled:opacity-50"
                >
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay now"}
                </button>
              )}
              {!session?.checkout?.url && !["razorpay", "cashfree", "payu"].includes(gateway) && !isManual && (
                <div className="mt-6 rounded bg-[#fff4ef] p-3 text-xs font-bold text-[#ff3d00] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" /> This payment session has no checkout link. Please contact support.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
