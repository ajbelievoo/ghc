"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { CheckCircle2, XCircle, Loader2, Clock, RefreshCw, AlertTriangle } from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  CREATE_CART: "Preparing order",
  ASSIGN_CART: "Linking your account",
  ADD_ITEM: "Adding service to order",
  ADD_OPTION: "Adding options",
  CONFIGURE_ITEM: "Configuring service",
  DRY_CHECKOUT: "Verifying checkout",
  CHECKOUT: "Placing order with provider",
  PAY_ORDER: "Charging provider",
  DELIVERY: "Deploying service",
  ORDER_UPGRADE: "Ordering upgrade",
  ORDER_DISK: "Ordering additional disk",
  ORDER_BACKUP: "Ordering automated backup",
  OPTION_ORDER_FAILED: "Option order failed",
};

export default function OrderProgress({ orderId, onRetryDone }: { orderId: string; onRetryDone?: () => void }) {
  const { showToast } = useToast();
  const [order, setOrder] = useState<any>(null);
  const [retrying, setRetrying] = useState(false);

  const load = () => api.orders.get(orderId).then(setOrder).catch(() => {});
  useEffect(() => {
    load();
    // keep polling while the order is still in-flight
    const t = setInterval(() => {
      setOrder((o: any) => {
        if (o && !["COMPLETED", "DELIVERED", "FAILED", "CANCELLED"].includes(o.status)) load();
        return o;
      });
    }, 10000);
    return () => clearInterval(t);
  }, [orderId]);

  if (!order) return <div className="py-3 flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading order details…</div>;

  const logs: any[] = order.ovhLogs || order.ovh_logs || [];
  const failed = order.status === "FAILED";
  const inFlight = ["PAYMENT_RECEIVED", "PROVISIONING"].includes(order.status);

  return (
    <div className="space-y-3">
      {/* status line */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-[#0f172a]">Provisioning progress</span>
        {inFlight && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-700">
            <Clock className="w-3 h-3" /> In progress — usually a few minutes, can take up to a few hours
          </span>
        )}
        {failed && (
          <button
            disabled={retrying}
            onClick={async () => {
              setRetrying(true);
              try {
                await api.orders.provision(orderId);
                showToast("Provisioning retried", "success");
                load(); onRetryDone?.();
              } catch (e: any) { showToast(e.message || "Retry failed", "error"); }
              finally { setRetrying(false); }
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1 text-[10px] font-bold text-[#00b7ff] hover:bg-[#00b7ff]/20 disabled:opacity-50"
          >
            {retrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Retry provisioning
          </button>
        )}
      </div>

      {/* failure reason */}
      {(failed && order.errorMessage) || (failed && order.error_message) ? (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{order.errorMessage || order.error_message}</span>
        </div>
      ) : null}
      {(order.ovh_order_url || order.ovhOrderUrl) && (
        <p className="text-[10px] text-slate-500">
          Provider order: <a href={order.ovh_order_url || order.ovhOrderUrl} target="_blank" rel="noreferrer" className="text-[#00b7ff] underline">{order.ovh_order_url || order.ovhOrderUrl}</a>
        </p>
      )}

      {/* step timeline */}
      {logs.length === 0 ? (
        <p className="text-xs text-slate-400">No provisioning steps yet — runs automatically after payment.</p>
      ) : (
        <ol className="relative border-l border-slate-200 ml-2 space-y-3">
          {logs.map((l: any) => (
            <li key={l.id} className="ml-4">
              <span className={`absolute -left-[9px] mt-0.5 flex h-4 w-4 items-center justify-center rounded-full ${l.isSuccess ?? l.is_success ? "bg-emerald-100" : "bg-red-100"}`}>
                {l.isSuccess ?? l.is_success
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  : <XCircle className="w-3.5 h-3.5 text-red-600" />}
              </span>
              <p className="text-xs font-medium text-[#0f172a]">{STEP_LABELS[l.step] || l.step}</p>
              <p className="text-[10px] text-slate-400">
                {l.createdAt ? new Date(l.createdAt).toLocaleString() : (l.created_at ? new Date(l.created_at).toLocaleString() : "")}
                {(l.errorMessage || l.error_message) && <span className="text-red-500"> — {l.errorMessage || l.error_message}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
