import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Refund Policy | GHC - Go Host Cloud",
  description: "GHC refund, cancellation and money-back guarantee policy.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Refund & Cancellation Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>Believoo Pvt Ltd wants you to be satisfied with GHC services. This policy explains when refunds and cancellations are available. GHC services are provisioned on upstream provider infrastructure (OVHcloud); our refund terms therefore follow the upstream provider's terms so that we can continue offering services at low margin-based prices.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Refund Eligibility</h2>
          <p>Refunds are issued only in these cases:</p>
          <ul className="ml-5 list-disc space-y-1">
            <li><strong>Provisioning failure:</strong> if a paid service cannot be provisioned or activated, the payment is refunded in full.</li>
            <li><strong>Duplicate or incorrect charges:</strong> accidental double payments or billing errors are refunded in full.</li>
            <li><strong>Pre-provisioning cancellation:</strong> if you cancel before the service is provisioned at the upstream provider, a full refund applies.</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">2. Non-Refundable Services</h2>
          <p>Once provisioned or activated, the following are strictly non-refundable because the upstream provider does not refund them to us: VPS, dedicated servers, cloud instances, web hosting plans, domain registrations/transfers/renewals, SSL certificates, licenses, add-on IPs, and setup fees. Upstream provider (OVHcloud) terms apply to service delivery, suspension, and termination.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Cancellation</h2>
          <p>You may cancel recurring services from the client dashboard. Cancellations take effect at the end of the current billing cycle. No partial-period credits are given for mid-cycle cancellations unless required by law. Turning off auto-renewal before the renewal date avoids further charges.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">4. Overpayments and Duplicate Payments</h2>
          <p>Overpayments or duplicate payments caused by technical errors will be refunded in full to the original payment source or added to your wallet, at your choice.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">5. Wallet Withdrawals</h2>
          <p>Wallet credits are non-withdrawable except in case of billing errors or when required by law. Wallet funds can be used for future purchases and renewals.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">6. Fraud and Abuse</h2>
          <p>Accounts suspended for fraud, spam, or Acceptable Use Policy violations are not eligible for refunds.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">7. Processing Time</h2>
          <p>Approved refunds are processed within 5-10 business days. The time to reach your account depends on the payment method and bank.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">8. Policy Changes</h2>
          <p>We may update this policy. Changes apply to new orders and renewals after the update date.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">9. Contact</h2>
          <p>To request a refund or ask questions, contact <a href="mailto:billing@believoo.com" className="text-[#00b7ff] hover:underline">billing@believoo.com</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
