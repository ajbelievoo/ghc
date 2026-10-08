import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Copyright & DMCA Policy | GHC - Go Host Cloud",
  description: "How to report copyright infringement hosted on GHC infrastructure.",
};

export default function DmcaPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Copyright &amp; DMCA Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>Believoo Pvt Ltd respects intellectual property rights and responds to valid copyright complaints in line with the Digital Millennium Copyright Act (DMCA) and applicable Indian law.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">Filing a copyright complaint</h2>
          <p>Send a notice to <a href="mailto:abuse@believoo.com" className="text-[#00b7ff] hover:underline">abuse@believoo.com</a> containing all of the following:</p>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>Your physical or electronic signature (typed name acceptable)</li>
            <li>Identification of the copyrighted work claimed to be infringed</li>
            <li>The exact URL, domain, or IP where the infringing material is hosted</li>
            <li>Your name, address, telephone number, and email</li>
            <li>A statement that you have a good-faith belief the use is not authorized</li>
            <li>A statement, under penalty of perjury, that the information is accurate and you are the owner or authorized to act for the owner</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">What happens next</h2>
          <ul className="list-disc space-y-1.5 pl-6">
            <li>We acknowledge valid notices within 24–48 hours</li>
            <li>We forward the notice to the customer operating the service</li>
            <li>Repeat infringers may have services suspended or terminated</li>
            <li>We may remove or disable access to clearly infringing material</li>
          </ul>
          <h2 className="text-lg font-bold text-[#0f172a]">Counter-notification</h2>
          <p>If your content was removed and you believe it was a mistake or misidentification, send a counter-notice with your signature, identification of the removed material, a good-faith statement, and consent to the jurisdiction of courts in New Delhi, India.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">Important</h2>
          <p>GHC acts as an infrastructure provider and cannot adjudicate ownership disputes. For legally contested matters we may require a court order before acting on customer content.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
