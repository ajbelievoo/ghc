"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { getCurrencySymbol, useCurrency } from "@/components/CurrencyProvider";
import { Network, Server, MapPin, Minus, Plus, Check, Globe, Shield, ArrowRight, ArrowLeft, X, Loader2 } from "lucide-react";

interface NetworkHubProps {
  servers: any[];
  user?: any;
  onManageServer?: (id: string) => void;
}

function StepCard({ children, title, back, next, nextLabel, nextDisabled, loading }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>
        {back && <button onClick={back} className="text-sm text-slate-500 hover:text-[#0f172a] flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</button>}
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

const GEO = ["Singapore (SGP) - Singapore", "Mumbai (BOM) - India", "Sydney (SYD) - Australia", "London (UK) - United Kingdom", "Frankfurt (DE) - Germany", "Paris (FR) - France", "Montreal (CA) - Canada", "Vint Hill (US) - USA"];

export default function NetworkHub({ servers, user, onManageServer }: NetworkHubProps) {
  const { showToast } = useToast();
  const { currency } = useCurrency();
  const [step, setStep] = useState<"list" | "order" | "select-service" | "version" | "solution" | "geolocation" | "summary" | "processing">("list");
  const [selectedServer, setSelectedServer] = useState<any>(null);
  const [ipVersion, setIpVersion] = useState<"IPv4" | "IPv6">("IPv4");
  const [quantity, setQuantity] = useState(1);
  const [solution, setSolution] = useState<"single" | "block">("single");
  const [geolocation, setGeolocation] = useState(GEO[0]);
  const [gateway, setGateway] = useState("razorpay");
  const [pendingIp, setPendingIp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeGateways, setActiveGateways] = useState<string[]>(["razorpay"]);

  useEffect(() => {
    api.server.gateways().then((g) => setActiveGateways(g.map((x: any) => x.name))).catch(() => {});
  }, []);

  const additionalIps = servers.reduce((acc: any[], s) => acc.concat(s.additional_ips || []), []);

  const requestNetworkService = async (service: string) => {
    if (!user) { showToast("Please log in", "error"); return; }
    try {
      const form = new FormData();
      form.append("name", user.name || "Customer");
      form.append("email", user.email);
      form.append("category", "Network Services");
      form.append("subject", `Request: ${service}`);
      form.append("message", `Customer wants to set up ${service} for their GHC account.`);
      await api.support.createTicket(form);
      showToast(`Request for ${service} sent`, "success");
    } catch (e: any) { showToast(e.message, "error"); }
  };

  const startOrder = () => {
    if (servers.length === 0) { showToast("No active services to attach an IP", "error"); return; }
    setStep("select-service");
    setSelectedServer(servers[0]);
  };

  const reserveIp = async () => {
    if (!selectedServer) { showToast("Select a service first", "error"); return; }
    setLoading(true);
    try {
      const res = await api.server.purchaseAdditionalIp(selectedServer.id, { currency });
      if (!res.success) throw new Error("Could not reserve IP");
      const price = res.ip;
      setPendingIp(price);
      setStep("summary");
    } catch (e: any) { showToast(e.message, "error"); setStep("geolocation"); }
    finally { setLoading(false); }
  };

  const continueOrder = async () => {
    if (!pendingIp) { showToast("Reserve IP first", "error"); return; }
    setLoading(true);
    try {
      const res = await api.payments.createCheckoutSession({
        type: "ADDITIONAL_IP",
        amount: pendingIp.totalAmount,
        gateway,
        ipId: pendingIp.id,
        subscriptionId: selectedServer.id,
        currency,
      });
      if (res.paid) {
        showToast("IP purchased from wallet", "success");
        setStep("list");
        onManageServer?.(selectedServer.id);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        showToast("Payment could not be initiated", "error");
      }
    } catch (e: any) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  const perIpPrice = ipVersion === "IPv4" ? 3.99 : 0;
  const total = solution === "single" ? perIpPrice * quantity : perIpPrice * quantity * 8;

  if (step === "list") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5"><Network className="w-8 h-8 text-[#00b7ff] mb-3" /><p className="text-sm font-medium text-[#0f172a]">Public IP Addresses</p><p className="text-2xl font-bold text-[#0f172a] mt-1">{servers.reduce((acc, s) => acc + (1 + (s.additional_ips?.length || 0)), 0)}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5"><Server className="w-8 h-8 text-[#00ff88] mb-3" /><p className="text-sm font-medium text-[#0f172a]">Linked Services</p><p className="text-2xl font-bold text-[#0f172a] mt-1">{servers.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5"><Shield className="w-8 h-8 text-[#b500ff] mb-3" /><p className="text-sm font-medium text-[#0f172a]">Anti-DDoS</p><p className="text-sm text-slate-500 mt-1">Enabled</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5"><Globe className="w-8 h-8 text-yellow-500 mb-3" /><p className="text-sm font-medium text-[#0f172a]">Network Status</p><p className="text-sm text-[#00ff88] mt-1">Operational</p></div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0f172a]">Public IP Addresses</h3>
          <button onClick={startOrder} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2 text-sm font-semibold hover:bg-[#009fe0] transition-all flex items-center gap-2"><Plus className="w-4 h-4" /> Order an IP</button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-100/50"><th className="px-5 py-3 text-xs font-semibold text-slate-500">IP</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Type</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Linked Service</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Reverse DNS</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Status</th><th className="px-5 py-3 text-xs font-semibold text-slate-500">Actions</th></tr></thead>
              <tbody>
                {servers.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="px-5 py-4 text-sm font-mono text-[#0f172a]">{s.ipAddress || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{s.category}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{s.displayName || s.name || s.planCode}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{s.reverseDns || "—"}</td>
                    <td className="px-5 py-4"><span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#00ff88]/10 text-[#00ff88]">Primary</span></td>
                    <td className="px-5 py-4"><button onClick={() => onManageServer?.(s.id)} className="rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 px-3 py-1.5 text-xs text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Manage</button></td>
                  </tr>
                ))}
                {additionalIps.map((ip: any) => (
                  <tr key={ip.id} className="border-b border-slate-100">
                    <td className="px-5 py-4 text-sm font-mono text-[#0f172a]">{ip.ipAddress || "Pending"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">Additional IP</td>
                    <td className="px-5 py-4 text-sm text-slate-600">{ip.subscription_id?.slice(0,8) || "—"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">—</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ip.status === 'ACTIVE' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-yellow-500/10 text-yellow-700'}`}>{ip.status}</span></td>
                    <td className="px-5 py-4">—</td>
                  </tr>
                ))}
                {servers.length === 0 && additionalIps.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-500">No IP addresses yet. Order your first IP above.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#0f172a] mb-4">Network Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "vRack private network", desc: "Create private networks between your GHC services across datacentres.", icon: Network },
              { title: "Load Balancer", desc: "Distribute traffic across multiple instances with health checks.", icon: ArrowRight },
              { title: "Network Security Dashboard", desc: "Anti-DDoS reports, firewall rules and traffic analytics.", icon: Shield },
            ].map((svc) => {
              const Icon = svc.icon;
              return (
                <div key={svc.title} className="rounded-2xl border border-slate-200 bg-white/60 backdrop-blur-xl p-5">
                  <Icon className="w-8 h-8 text-[#00b7ff] mb-3" />
                  <h4 className="font-bold text-[#0f172a] text-sm mb-1">{svc.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">{svc.desc}</p>
                  <button onClick={() => requestNetworkService(svc.title)} className="w-full rounded-lg bg-[#00b7ff]/10 border border-[#00b7ff]/30 py-2 text-sm font-semibold text-[#00b7ff] hover:bg-[#00b7ff]/20 transition-all">Request</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (step === "select-service") {
    return (
      <StepCard title="Select the service for which you want to order additional IPs" next={() => setStep("version")} back={() => setStep("list")} nextDisabled={!selectedServer}>
        <p className="text-sm text-slate-500 mb-2">Service</p>
        <select value={selectedServer?.id} onChange={(e) => setSelectedServer(servers.find((s) => s.id === e.target.value))} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-4 py-3 text-sm text-[#0f172a] focus:border-[#00b7ff]/50 outline-none">
          {servers.map((s) => <option key={s.id} value={s.id}>{s.displayName || s.name || s.planCode} — {s.ipAddress || s.planCode} ({s.datacenter || s.region || "—"})</option>)}
        </select>
        <p className="text-sm text-slate-500">Region: {selectedServer?.datacenter || selectedServer?.region || "—"}</p>
      </StepCard>
    );
  }

  if (step === "version") {
    return (
      <StepCard title="Select the IP address version" next={() => setStep("solution")} back={() => setStep("select-service")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setIpVersion("IPv4")} className={`text-left rounded-xl border p-5 transition-all ${ipVersion === "IPv4" ? 'border-[#00b7ff] bg-[#00b7ff]/5' : 'border-slate-200 hover:border-[#00b7ff]/50'}`}>
            <div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full border ${ipVersion === "IPv4" ? 'border-[#00b7ff] bg-[#00b7ff]' : 'border-slate-300'}`} /> <span className="font-semibold text-[#0f172a]">IPv4</span></div>
            <p className="text-xs text-slate-500 mb-3">Internet standard. The most widely used addressing protocol on the internet, and thus the most commonly supported.</p>
            <p className="text-sm font-semibold text-[#0f172a]">From {getCurrencySymbol(currency)}3.99/month/IP</p>
          </button>
          <button onClick={() => setIpVersion("IPv6")} className={`text-left rounded-xl border p-5 transition-all ${ipVersion === "IPv6" ? 'border-[#00b7ff] bg-[#00b7ff]/5' : 'border-slate-200 hover:border-[#00b7ff]/50'}`}>
            <div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full border ${ipVersion === "IPv6" ? 'border-[#00b7ff] bg-[#00b7ff]' : 'border-slate-300'}`} /> <span className="font-semibold text-[#0f172a]">IPv6</span></div>
            <p className="text-xs text-slate-500 mb-3">IPv6 is the most suitable option when large IP blocks are required and a hierarchical addressing scheme is in place.</p>
            <p className="text-sm font-semibold text-[#00b7ff]">Free</p>
          </button>
        </div>
      </StepCard>
    );
  }

  if (step === "solution") {
    return (
      <StepCard title="Choose your solution" next={() => setStep("geolocation")} back={() => setStep("version")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button onClick={() => setSolution("single")} className={`text-left rounded-xl border p-5 transition-all ${solution === "single" ? 'border-[#00b7ff] bg-[#00b7ff]/5' : 'border-slate-200 hover:border-[#00b7ff]/50'}`}>
            <p className="font-semibold text-[#0f172a] mb-1">Additional IP</p>
            <p className="text-sm text-slate-600">{getCurrencySymbol(currency)}3.99/month/IP</p>
            <p className="text-xs text-slate-500 mt-2">Add one or more individual IPv4 addresses to your service.</p>
            {solution === "single" && (
              <div className="flex items-center gap-3 mt-4">
                <button onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Minus className="w-4 h-4" /></button>
                <span className="font-semibold text-[#0f172a]">{quantity}</span>
                <button onClick={(e) => { e.stopPropagation(); setQuantity(Math.min(10, quantity + 1)); }} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Plus className="w-4 h-4" /></button>
              </div>
            )}
          </button>
          <button onClick={() => setSolution("block")} className={`text-left rounded-xl border p-5 transition-all ${solution === "block" ? 'border-[#00b7ff] bg-[#00b7ff]/5' : 'border-slate-200 hover:border-[#00b7ff]/50'}`}>
            <p className="font-semibold text-[#0f172a] mb-1">Additional IP block</p>
            <p className="text-sm text-slate-600">From {getCurrencySymbol(currency)}3.99/month/IP</p>
            <p className="text-xs text-slate-500 mt-2">IPv4 address block. The available block sizes will vary depending on the associated service.</p>
            {solution === "block" && (
              <select className="mt-4 w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">
                <option>/29 (8 IPs)</option>
                <option>/28 (16 IPs)</option>
                <option>/27 (32 IPs)</option>
              </select>
            )}
          </button>
        </div>
      </StepCard>
    );
  }

  if (step === "geolocation") {
    return (
      <StepCard title="IP address geolocation" next={reserveIp} back={() => setStep("solution")} nextLabel="Continue my order" nextDisabled={!geolocation}>
        <p className="text-sm text-slate-500 mb-2">Geolocation information may not be changed for only one IP address.</p>
        <div className="flex items-center gap-2 mb-4"><MapPin className="w-4 h-4 text-[#00b7ff]" /><select value={geolocation} onChange={(e) => setGeolocation(e.target.value)} className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">
          {GEO.map((g) => <option key={g} value={g}>{g}</option>)}
        </select></div>
      </StepCard>
    );
  }

  if (step === "summary") {
    return (
      <StepCard title="Order summary" next={continueOrder} back={() => setStep("geolocation")} nextLabel={gateway === "wallet" ? "Pay from wallet" : "Continue to payment"}>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Service</span><span className="text-[#0f172a] font-medium">{selectedServer?.displayName || selectedServer?.name || selectedServer?.planCode}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">IP version</span><span className="text-[#0f172a] font-medium">{ipVersion}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Quantity / block</span><span className="text-[#0f172a] font-medium">{solution === "single" ? `${quantity} IP(s)` : `1 block`}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Geolocation</span><span className="text-[#0f172a] font-medium">{geolocation}</span></div>
          <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Price</span><span className="text-[#0f172a] font-medium">{getCurrencySymbol(pendingIp?.currency || currency)}{pendingIp?.totalAmount?.toFixed(2) || total.toFixed(2)} {pendingIp?.currency || currency}</span></div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-slate-500 mb-1.5">Payment gateway</label>
          <select value={gateway} onChange={(e) => setGateway(e.target.value)} className="w-full rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-sm">
            {activeGateways.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </StepCard>
    );
  }

  return null;
}
