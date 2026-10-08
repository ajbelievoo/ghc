import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Grievance Officer | GHC - Go Host Cloud",
  description: "Grievance officer details and complaint redressal process under the Information Technology Act, 2000 and IT (Intermediary) Rules, 2021.",
};

export default function GrievancePage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Grievance Officer</h1>
        <p className="mt-2 text-sm text-slate-500">Appointed under the Information Technology Act, 2000 and IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <div className="rounded-xl border border-[#00b7ff]/30 bg-[#f0f9ff] p-6">
            <h2 className="text-lg font-bold text-[#0f172a]">Contact details</h2>
            <div className="mt-3 space-y-1.5">
              <p><b>Designation:</b> Grievance Officer, Believoo Pvt Ltd</p>
              <p><b>Email:</b> <a href="mailto:grievance@believoo.com" className="text-[#00b7ff] hover:underline">grievance@believoo.com</a></p>
              <p><b>Alternate:</b> <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a></p>
              <p><b>Address:</b> Believoo Pvt Ltd, India</p>
            </div>
          </div>
          <h2 className="text-lg font-bold text-[#0f172a]">How to file a grievance</h2>
          <p>If you believe any content hosted on our infrastructure violates law, infringes your rights, or breaches our Acceptable Use Policy, email the Grievance Officer with:</p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>Your name, email address, and contact number</li>
            <li>The URL, IP address, domain name, or service involved</li>
            <li>A description of the complaint and the grounds for it</li>
            <li>Any supporting evidence (screenshots, documents, court orders)</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">Resolution timelines</h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li><b>Acknowledgement:</b> within 24 hours of receiving the complaint</li>
            <li><b>Resolution:</b> within 15 days from the date of receipt</li>
            <li><b>Content removal requests (non-consensual intimate imagery, court orders):</b> acted upon within 24 hours</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">Escalation</h2>
          <p>If your grievance is not resolved within the stated timelines, you may escalate by replying to the acknowledgement email with &quot;ESCALATION&quot; in the subject line. Unresolved statutory complaints may also be raised with the appropriate government authorities.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">Abuse reports (non-legal)</h2>
          <p>For spam, phishing, malware, or network abuse hosted on our platform, use the <a href="/abuse" className="text-[#00b7ff] hover:underline">abuse report form</a> or email <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a>.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
