import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | GHC - Go Host Cloud",
  description: "GHC terms of service, acceptable use, billing and cancellation rules.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>These Terms of Service (&quot;Terms&quot;) govern your use of the GHC (Go Host Cloud) website, services, and infrastructure provided by Believoo Pvt Ltd (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;).</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Acceptance</h2>
          <p>By creating an account or using any GHC service, you agree to these Terms and our Acceptable Use Policy. If you do not agree, do not use our services.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">2. Services</h2>
          <p>GHC provides cloud hosting, virtual private servers, dedicated servers, web hosting, domain registration, and related infrastructure services. All services are provided on a best-effort basis unless a specific Service Level Agreement has been purchased.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Account and Security</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us immediately of any unauthorized access.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">4. Payments and Billing</h2>
          <p>All charges are in the currency selected at checkout. Prices shown are exclusive of applicable taxes such as GST, which will be added at checkout where required. Invoices are generated once payment is confirmed.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">5. Refunds and Cancellations</h2>
          <p>Refunds are provided according to our Refund Policy. You may cancel services from the client dashboard. Cancellations take effect at the end of the current billing period.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">6. Acceptable Use</h2>
          <p>You may not use GHC services for illegal activities, spam, malware, DDoS attacks, cryptocurrency mining without approval, or any content that violates Indian or applicable international laws. See the Acceptable Use Policy for details.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">7. Limitation of Liability</h2>
          <p>Our liability is limited to the fees paid for the affected service in the 30 days prior to the incident. We are not liable for indirect, incidental, or consequential damages.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">8. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the services after changes constitutes acceptance of the updated Terms.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">9. Governing Law</h2>
          <p>These Terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in New Delhi, India.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">10. Contact</h2>
          <p>For questions, contact support at <a href="mailto:support@believoo.com" className="text-[#00b7ff] hover:underline">support@believoo.com</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
