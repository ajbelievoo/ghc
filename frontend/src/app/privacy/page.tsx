import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | GHC - Go Host Cloud",
  description: "GHC privacy policy explains how we collect, use, store and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>Believoo Pvt Ltd (&quot;GHC&quot;, &quot;we&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and safeguard your personal information.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Information We Collect</h2>
          <p>We collect information you provide directly, such as name, email, phone, billing address, payment details, and service configuration choices. We also collect technical data including IP address, browser type, and usage logs for security and performance.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">2. How We Use Information</h2>
          <p>We use your data to provide and manage services, process payments, send transactional emails, verify identity, prevent fraud, improve our platform, and comply with legal obligations.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Cookies</h2>
          <p>We use cookies to remember your preferences, keep you signed in, and analyze traffic. You can control cookies through your browser settings. Our cookie banner lets you accept or decline non-essential cookies.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">4. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with trusted providers (payment gateways, email, domain registries) necessary to deliver our services, or when required by law.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">5. Data Security</h2>
          <p>We implement industry-standard security measures including TLS encryption, access controls, and regular monitoring. However, no online service can be 100% secure.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">6. Your Rights</h2>
          <p>You can access, update, or delete your account data from the client dashboard. You may also request a copy or deletion of your data by contacting support.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">7. Data Retention</h2>
          <p>We retain data as long as needed for service delivery, billing, legal compliance, and fraud prevention. After account closure, some data may be retained for the legally required period.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">8. Children</h2>
          <p>GHC services are not intended for children under 18. We do not knowingly collect data from minors.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">9. Policy Changes</h2>
          <p>We may update this Privacy Policy. Significant changes will be communicated via email or a notice on the website.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">10. Contact</h2>
          <p>For privacy questions, email <a href="mailto:support@believoo.com" className="text-[#00b7ff] hover:underline">support@believoo.com</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
