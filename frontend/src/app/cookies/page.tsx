import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Cookie Policy | GHC - Go Host Cloud",
  description: "How GHC uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#f8fcff] text-[#0f172a]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] md:text-4xl">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <p>Cookies are small text files stored on your device. GHC uses only the cookies necessary to run the platform — we do not sell tracking data.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">Cookies we use</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="border-b border-slate-200 text-left"><th className="py-2 pr-4 font-bold text-[#0f172a]">Type</th><th className="py-2 pr-4 font-bold text-[#0f172a]">Purpose</th><th className="py-2 font-bold text-[#0f172a]">Examples</th></tr></thead>
              <tbody className="text-slate-600">
                <tr className="border-b border-slate-100"><td className="py-2.5 pr-4 font-semibold">Strictly necessary</td><td className="py-2.5 pr-4">Authentication, session, CSRF protection, load balancing</td><td className="py-2.5">auth token, session id</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2.5 pr-4 font-semibold">Preferences</td><td className="py-2.5 pr-4">Theme (light/dark), currency, language choices</td><td className="py-2.5">theme, currency</td></tr>
                <tr className="border-b border-slate-100"><td className="py-2.5 pr-4 font-semibold">Security</td><td className="py-2.5 pr-4">Rate limiting and abuse prevention</td><td className="py-2.5">rate-limit tokens</td></tr>
              </tbody>
            </table>
          </div>
          <h2 className="text-lg font-bold text-[#0f172a]">Third-party cookies</h2>
          <p>Payment gateways (Razorpay, PayPal, Cashfree) may set their own cookies inside their checkout iframes. These are governed by the respective gateway privacy policies.</p>
          <h2 className="text-lg font-bold text-[#0f172a]">Managing cookies</h2>
          <p>You can block or delete cookies in your browser settings. Blocking strictly-necessary cookies will prevent login and checkout from working.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
