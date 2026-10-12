"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, Loader2, Package, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol } from "@/components/CurrencyProvider";

export default function CartPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[] | null>(null);
  const [gateways, setGateways] = useState<string[]>([]);
  const [gateway, setGateway] = useState("");
  const [wallet, setWallet] = useState<any>(null);
  const [paying, setPaying] = useState(false);
  const [manual, setManual] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState(true);
  useEscapeKey(() => setManual(null), !!manual);

  const load = useCallback(() => {
    api.cart.list().then((d) => setItems(d.items || [])).catch((e) => {
      if (/401|unauthor|token/i.test(e.message || "")) setLoggedIn(false);
      setItems([]);
    });
  }, []);

  useEffect(() => {
    load();
    api.server.gateways().then((g: any[]) => {
      const active = (g || []).filter((x: any) => x.isActive).map((x: any) => x.name);
      setGateways(active);
      if (active.length) setGateway(active[0]);
    }).catch(() => {});
    api.billing.wallet().then(setWallet).catch(() => {});
  }, [load]);

  const remove = async (id: string) => {
    try {
      await api.cart.remove(id);
      setItems((i) => (i || []).filter((x) => x.id !== id));
      window.dispatchEvent(new CustomEvent("ghc:cart-updated"));
    } catch (e: any) {
      showToast(e.message || "Remove failed", "error");
    }
  };

  const checkout = async () => {
    if (!items?.length) return;
    setPaying(true);
    try {
      const res = await api.cart.checkout({ gateway: gateway || "wallet" });
      if (res.paid) {
        showToast("Payment complete — your services are being provisioned", "success");
        window.location.href = "/dashboard";
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else if (res.manual) {
        setManual(res);
      } else {
        showToast("Payment session created but no checkout URL returned", "error");
      }
    } catch (e: any) {
      showToast(e.message || "Checkout failed", "error");
    } finally {
      setPaying(false);
    }
  };

  const cur = items?.[0]?.currency || "USD";
  const sym = getCurrencySymbol(cur);
  const total = (items || []).reduce((s, i) => s + (i.unitPrice || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="flex items-center gap-3 text-2xl font-black">
          <ShoppingCart className="w-7 h-7 text-[#00b7ff]" /> Your cart
        </h1>

        {!loggedIn && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-600">Sign in to view your cart.</p>
            <Link href="/login" className="mt-4 inline-block rounded-lg bg-[#00b7ff] px-5 py-2 text-sm font-bold text-white">Sign in</Link>
          </div>
        )}

        {loggedIn && items === null && (
          <div className="mt-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#00b7ff]" /></div>
        )}

        {loggedIn && items !== null && items.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center">
            <Package className="mx-auto w-10 h-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">Your cart is empty.</p>
            <Link href="/vps" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00b7ff] px-5 py-2 text-sm font-bold text-white">
              Browse plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {loggedIn && items && items.length > 0 && (
          <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-bold">{i.displayName || i.planCode}</p>
                    <p className="text-xs text-slate-500">
                      {[i.category, i.durationLabel, i.configuration?.os, i.configuration?.datacenter].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-[#00b7ff]">{i.unitPrice != null ? `${getCurrencySymbol(i.currency || cur)}${i.unitPrice.toFixed(2)}` : "—"}</p>
                    <button onClick={() => remove(i.id)} className="text-slate-400 hover:text-red-500" aria-label="Remove">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-fit rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-sm font-bold">Order summary</h2>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex justify-between"><span>{items.length} item{items.length > 1 ? "s" : ""}</span><span>{sym}{total.toFixed(2)}</span></div>
                <p className="text-[10px] text-slate-400">Taxes and per-plan pricing are calculated at checkout.</p>
              </div>
              <div className="mt-4">
                <label className="text-[11px] font-semibold text-slate-500">Payment method</label>
                <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs">
                  {wallet && <option value="wallet">Wallet ({wallet.currency} {wallet.balance?.toFixed(2)})</option>}
                  {gateways.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <button
                onClick={checkout}
                disabled={paying || !items.length}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f0c29] px-5 py-3 text-sm font-bold text-white hover:bg-[#302b63] disabled:opacity-50"
              >
                {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Checkout — pay once for all items</>}
              </button>
            </div>
          </div>
        )}

        {manual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6">
              <h3 className="text-lg font-bold">Manual payment</h3>
              <p className="mt-2 text-sm text-slate-600">Amount: <b>{getCurrencySymbol(manual.currency)}{manual.amount?.toFixed(2)}</b></p>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-100 p-3 text-xs text-slate-700">{manual.instructions || "Contact support for payment instructions."}</pre>
              <button onClick={() => { setManual(null); window.location.href = "/dashboard"; }} className="mt-4 w-full rounded-lg bg-[#00b7ff] py-2.5 text-sm font-bold text-white">Done</button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
