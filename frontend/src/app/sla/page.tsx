import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Service Level Agreement | GHC - Go Host Cloud",
  description: "GHC SLA, uptime commitment and service credits for cloud hosting customers.",
};

export default function SlaPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Service Level Agreement</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>This Service Level Agreement (&quot;SLA&quot;) applies to VPS and dedicated server services provided by GHC (Go Host Cloud), a brand of Believoo Pvt Ltd, where the SLA option is included in the plan.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Uptime Commitment</h2>
          <p>We target 99.95% monthly uptime for covered services, measured as the percentage of minutes in a calendar month during which the host node and core network are available. This excludes scheduled maintenance and events outside our control.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">2. Scheduled Maintenance</h2>
          <p>Routine maintenance is scheduled during off-peak hours with at least 72 hours notice. Emergency maintenance is announced as soon as practical.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Service Credits</h2>
          <p>If monthly uptime falls below 99.95%, you may request a credit equal to a percentage of the affected service fee for that month:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>&lt; 99.95% but ≥ 99.0% — 5% credit</li>
            <li>&lt; 99.0% but ≥ 95.0% — 15% credit</li>
            <li>&lt; 95.0% — 30% credit</li>
          </ul>
          <p className="text-xs text-slate-500">Credits are not cash refunds; they are applied to future invoices or wallet. Maximum monthly credit is 30% of the affected service fee.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">4. Exclusions</h2>
          <p>This SLA does not cover downtime caused by customer actions, third-party software, upstream provider outages, internet congestion outside our network, DDoS attacks exceeding protected thresholds, or scheduled maintenance.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">5. Support Response Times</h2>
          <p>Critical issues (service down): 1 hour. High priority: 4 hours. Standard: 24 hours. Times are targets, not guarantees.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">6. Data Backup</h2>
          <p>Customers are responsible for their own backups. Optional managed backup services are available for purchase.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">7. Credit Request</h2>
          <p>To request a credit, open a support ticket within 7 days of the incident with timestamps and details. Credits are usually applied within one billing cycle.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">8. Contact</h2>
          <p>For SLA issues, contact <a href="mailto:support@believoo.com" className="text-[#00b7ff] hover:underline">support@believoo.com</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
