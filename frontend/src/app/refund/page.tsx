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
          <p>Believoo Pvt Ltd wants you to be satisfied with GHC services. This policy explains when refunds and cancellations are available.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Money-Back Guarantee</h2>
          <p>VPS and web hosting plans include a 7-day money-back guarantee from the date of first service activation, provided the service has not been abused or used for prohibited activities. Dedicated servers and domain registrations are non-refundable once ordered.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">2. Refund Eligibility</h2>
          <p>Refunds are issued to the original payment method or wallet when a qualifying request is made. Setup fees, domain fees, SSL certificates, and add-on IPs are non-refundable. Refunds exclude taxes already remitted to authorities.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Cancellation</h2>
          <p>You may cancel recurring services from the client dashboard. Cancellations take effect at the end of the current billing cycle. No partial-month credits are given for mid-cycle cancellations unless required by law.</p>
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
