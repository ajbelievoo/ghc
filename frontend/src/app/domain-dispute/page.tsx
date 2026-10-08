import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Domain Dispute Policy (UDRP) | GHC - Go Host Cloud",
  description: "How domain name disputes are handled under ICANN's UDRP and registrar rules.",
};

export default function DomainDisputePage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Domain Dispute Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>Domain names registered through GHC are subject to ICANN&apos;s Uniform Domain-Name Dispute-Resolution Policy (UDRP) and the rules of the upstream registrar and registry.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">When the UDRP applies</h2>
          <p>The UDRP covers disputes where a complainant claims a domain:</p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>Is identical or confusingly similar to their trademark</li>
            <li>Was registered by someone with no legitimate rights to it</li>
            <li>Was registered and is being used in bad faith</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">How to file a dispute</h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li><b>UDRP complaints</b> must be filed with an approved dispute provider (WIPO, FORUM/NAF, ADNDRC, CAC). GHC cannot decide trademark ownership.</li>
            <li><b>Accuracy/whois issues</b> — report to <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a></li>
            <li><b>Phishing/fraud on a domain</b> — use the <a href="/abuse" className="text-[#00b7ff] hover:underline">abuse form</a>; we can suspend DNS for clear abuse</li>
            <li><b>Ownership disputes between two parties</b> — resolved by courts or UDRP, not by the registrar</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">What we do when a dispute is filed</h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>Lock the domain against transfer while the proceeding is active (per UDRP rules)</li>
            <li>Comply with the panel&apos;s decision — transfer, cancel, or maintain the registration</li>
            <li>Notify the registrant of proceedings and decisions we receive</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">Registrant rights</h2>
          <p>If a UDRP complaint is filed against your domain, you may respond to the dispute provider within the period stated in the provider&apos;s notice. Court action filed within 10 business days of a UDRP decision stays the decision&apos;s implementation.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
