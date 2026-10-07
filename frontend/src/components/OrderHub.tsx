"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Server, ArrowLeft, ArrowRight, Check, Cpu, HardDrive, Globe, Shield, Activity, Loader2, Monitor } from "lucide-react";

interface OrderHubProps {
  category?: string; // VPS, DEDICATED, WEB_HOSTING, etc.
  user?: any;
  onBack?: () => void;
  onComplete?: () => void;
}

function StepCard({ title, children, next, nextLabel, nextDisabled, back, loading, user }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {back && <button onClick={back} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"><ArrowLeft className="w-4 h-4" /></button>}
          <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>
        </div>
        <span className="text-xs text-slate-400">{user?.name}</span>
      </div>
      <div className="space-y-4">{children}</div>
      {next && (
        <div className="flex justify-end mt-6">
          <button onClick={next} disabled={nextDisabled || loading} className="rounded-lg bg-[#00b7ff] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#009fe0] disabled:opacity-50 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {nextLabel || "Continue"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  { id: "VPS", label: "Virtual Private Server", icon: Server, desc: "Scalable cloud VMs" },
  { id: "DEDICATED", label: "Dedicated Server", icon: Cpu, desc: "Bare metal power" },
  { id: "WEB_HOSTING", label: "Web Hosting", icon: Globe, desc: "cPanel/Plesk hosting" },
  { id: "PUBLIC_CLOUD", label: "Public Cloud", icon: Monitor, desc: "Compute on demand" },
];

const DURATIONS: Record<string, string> = {
  monthly: "1 month",
  quarterly: "3 months",
  biannual: "6 months",
  yearly: "12 months",
};

export default function OrderHub({ category: initialCategory, user, onBack, onComplete }: OrderHubProps) {
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const [step, setStep] = useState<"category" | "plan" | "config" | "summary" | "processing">(initialCategory ? "plan" : "category");
  const [category, setCategory] = useState<string>(initialCategory || "VPS");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [duration, setDuration] = useState<string>("");
  const [configOptions, setConfigOptions] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [gateway, setGateway] = useState("razorpay");
  const [loading, setLoading] = useState(false);
  const [activeGateways, setActiveGateways] = useState<string[]>(["razorpay"]);
  const [price, setPrice] = useState<any>(null);

  useEffect(() => {
    api.server.gateways().then((g: any[]) => setActiveGateways(g.map((x: any) => x.name))).catch(() => {});
  }, []);

  useEffect(() => {
    if (step === "plan" || (category && step !== "category")) {
      setLoading(true);
      api.server.plans(category).then((data: any[]) => {
        setPlans(data);
        setSelectedPlan(null);
        setDuration("");
        setConfig({});
        setConfigOptions([]);
        setPrice(null);
        if (data.length === 1) selectPlan(data[0]);
      }).catch((e) => showToast(e.message, "error")).finally(() => setLoading(false));
    }
  }, [category]);

  const selectPlan = async (p: any) => {
    setSelectedPlan(p);
    setDuration("");
    setConfig({});
    setPrice(null);
    try {
      const cfg = await api.server.planConfiguration({ planCode: p.planCode, category });
      setConfigOptions(cfg.configurations || []);
      if (p.durations?.length) setDuration(p.durations[0].durationLabel);
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const durationPrice = (plan: any, dur: string) => {
    const d = plan.durations?.find((x: any) => x.durationLabel === dur);
    if (!d) return plan.durations?.[0]?.finalPrice || 0;
    return d.finalPrice;
  };

  const getConfiguration = () => {
    const base = { ...config };
    if (duration) base.duration = duration;
    return base;
  };

  const proceedToSummary = () => {
    if (!selectedPlan) return;
    const total = durationPrice(selectedPlan, duration);
    setPrice({ total, currency });
    setStep("summary");
  };

  const checkout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const res = await api.payments.createCheckoutSession({
        type: "ORDER",
        amount: price.total,
        gateway,
        planCode: selectedPlan.planCode,
        durationLabel: duration,
        category,
        configuration: getConfiguration(),
        currency,
      });
      if (res.paid) {
        showToast("Order placed from wallet", "success");
        onComplete?.();
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Payment could not be initiated", "error");
      }
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };



  if (step === "category") {
    return (
      <StepCard title="What do you want to order?" next={() => setStep("plan")} nextDisabled={!category} nextLabel="Browse plans" back={onBack}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} className={`text-left rounded-xl border p-5 transition-all ${category === c.id ? "border-[#00b7ff] bg-[#00b7ff]/5" : "border-slate-200 hover:border-[#00b7ff]/50"}`}>
                <div className="flex items-center gap-3 mb-2"><Icon className="w-5 h-5 text-[#00b7ff]" /><span className="font-semibold text-[#0f172a]">{c.label}</span></div>
                <p className="text-sm text-slate-500">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </StepCard>
    );
  }

  if (step === "plan") {
    return (
      <StepCard title="Choose your plan" next={() => selectPlanAndConfig()} nextDisabled={!selectedPlan} nextLabel="Configure" back={() => { if (initialCategory) onBack?.(); else setStep("category"); }}>
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-[#00b7ff] mx-auto" /><p className="text-sm text-slate-500 mt-2">Loading plans...</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((p) => (
              <button key={p.planCode} onClick={() => selectPlan(p)} className={`text-left rounded-xl border p-5 transition-all relative ${selectedPlan?.planCode === p.planCode ? "border-[#00b7ff] bg-[#00b7ff]/5" : "border-slate-200 hover:border-[#00b7ff]/50"}`}>
                {selectedPlan?.planCode === p.planCode && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#00b7ff] text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                <p className="font-bold text-[#0f172a] text-sm mb-1">{p.invoiceName || p.planCode}</p>
                <p className="text-xs text-slate-500 mb-3">{p.description || p.category}</p>
                <div className="space-y-1.5 mb-4">
                  {p.cpuCores && <p className="text-xs text-slate-600 flex items-center gap-1"><Cpu className="w-3 h-3" /> {p.cpuCores} vCPU</p>}
                  {p.ramGb && <p className="text-xs text-slate-600 flex items-center gap-1"><Activity className="w-3 h-3" /> {p.ramGb} GB RAM</p>}
                  {p.diskGb && <p className="text-xs text-slate-600 flex items-center gap-1"><HardDrive className="w-3 h-3" /> {p.diskGb} GB {p.diskType || ""}</p>}
                  {p.bandwidthMbps && <p className="text-xs text-slate-600 flex items-center gap-1"><Globe className="w-3 h-3" /> {p.bandwidthMbps} Mbps</p>}
                </div>
                <p className="text-sm font-bold text-[#00b7ff]">From {getCurrencySymbol(currency)}{p.durations?.[0]?.monthlyPrice?.toFixed(2) || "0.00"}/mo</p>
              </button>
            ))}
            {plans.length === 0 && <div className="col-span-full py-8 text-center text-sm text-slate-500">No plans available in this category. Try syncing the catalog from the admin panel.</div>}
          </div>
        )}
      </StepCard>
    );
  }

  const selectPlanAndConfig = () => {
    if (!selectedPlan) return;
    setStep("config");
  };

  if (step === "config") {
    const hasDurations = selectedPlan?.durations?.length > 0;
    return (
      <StepCard title="Configure your service" next={proceedToSummary} nextDisabled={hasDurations && !duration} nextLabel="Review order" back={() => setStep("plan")}>
        {hasDurations && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#0f172a] mb-2">Billing duration</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedPlan.durations.map((d: any) => (
                <button key={d.durationLabel} onClick={() => setDuration(d.durationLabel)} className={`rounded-lg border p-3 text-left transition-all ${duration === d.durationLabel ? "border-[#00b7ff] bg-[#00b7ff]/5" : "border-slate-200 hover:border-[#00b7ff]/50"}`}>
                  <p className="text-xs text-slate-500">{DURATIONS[d.durationLabel] || d.durationLabel}</p>
                  <p className="font-bold text-[#0f172a] text-sm">{getCurrencySymbol(currency)}{d.finalPrice.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {configOptions.length > 0 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#0f172a]">Configuration</label>
            {configOptions.map((cfg: any) => (
              <div key={cfg.name}>
                <p className="text-xs text-slate-500 mb-1.5">{cfg.name}</p>
                <div className="flex flex-wrap gap-2">
                  {cfg.values.map((v: string) => (
                    <button key={v} onClick={() => setConfig((p) => ({ ...p, [cfg.name]: v }))} className={`rounded-lg border px-3 py-1.5 text-sm transition-all ${config[cfg.name] === v ? "border-[#00b7ff] bg-[#00b7ff]/10 text-[#00b7ff]" : "border-slate-200 text-slate-600 hover:border-[#00b7ff]/50"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasDurations && configOptions.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-500">No additional configuration required.</div>
        )}
      </StepCard>
    );
  }

  if (step === "summary") {
    const total = durationPrice(selectedPlan, duration);
    return (
      <StepCard title="Order summary" next={checkout} nextLabel={gateway === "wallet" ? "Pay from wallet" : "Continue to payment"} nextDisabled={!price} back={() => setStep("config")}>
        <div className="space-y-3 text-sm mb-4">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Plan</span><span className="text-[#0f172a] font-medium">{selectedPlan.invoiceName || selectedPlan.planCode}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Category</span><span className="text-[#0f172a] font-medium">{selectedPlan.category}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Duration</span><span className="text-[#0f172a] font-medium">{duration}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Configuration</span><span className="text-[#0f172a] font-medium text-right">{Object.entries(config).map(([k, v]) => `${k}: ${v}`).join(", ") || "Default"}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Total</span><span className="text-[#0f172a] font-bold">{getCurrencySymbol(currency)}{total.toFixed(2)} {currency}</span></div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1.5">Payment gateway</label>
          <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">
            {activeGateways.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <p className="text-xs text-slate-500 flex items-start gap-2"><Shield className="w-4 h-4 text-[#00ff88] shrink-0" /> Your service will be provisioned automatically after payment. OVH branding is not shown to customers.</p>
      </StepCard>
    );
  }

  return null;
}
