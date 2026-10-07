import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Acceptable Use Policy | GHC - Go Host Cloud",
  description: "GHC acceptable use policy for customers using our cloud, VPS, dedicated and web hosting services.",
};

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Acceptable Use Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>This policy describes what activities are permitted and prohibited on GHC (Go Host Cloud) infrastructure. Violations may result in service suspension or termination.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">1. Lawful Use</h2>
          <p>You may use GHC services only for lawful purposes and in compliance with Indian law and the laws of any country from which you access the services.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">2. Prohibited Activities</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Spam, phishing, or bulk unsolicited email</li>
            <li>Malware, viruses, ransomware, or command-and-control infrastructure</li>
            <li>Distributed denial-of-service (DDoS) attacks or stress-testing of third-party targets</li>
            <li>Hacking, brute-force attacks, or unauthorized access attempts</li>
            <li>Hosting or distributing child sexual abuse material, hate speech, or extremist content</li>
            <li>Fraud, financial scams, or impersonation</li>
            <li>Cryptocurrency mining without explicit written permission</li>
            <li>Running Tor exit nodes or open proxies without approval</li>
            <li>Any activity that jeopardizes the security, stability, or reputation of GHC or its network</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">3. Email Use</h2>
          <p>Outbound email must follow best practices: valid SPF/DKIM/DMARC records, opt-in mailing lists, working unsubscribe links, and no deceptive headers.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">4. Resource Use</h2>
          <p>Fair-use limits apply to unmetered bandwidth and CPU. Sustained resource abuse that impacts other customers may result in throttling or suspension.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">5. Content Responsibility</h2>
          <p>You are responsible for all content and traffic originating from your services. Report abuse to <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a>.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">6. Enforcement</h2>
          <p>GHC may suspend, throttle, or terminate any service without prior notice in case of serious or repeated abuse. We will attempt to contact the account holder before action when feasible.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">7. Reporting Abuse</h2>
          <p>If you discover abuse originating from our network, email <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a> with relevant logs and timestamps.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">8. Policy Updates</h2>
          <p>This policy may be updated from time to time. Continued use of services means acceptance of the current version.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
