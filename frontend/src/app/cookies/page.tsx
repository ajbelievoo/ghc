import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Cookie Policy | GHC - Go Host Cloud",
  description: "What cookies and similar technologies GHC uses, why, and how to control them.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="The cookies and similar technologies we use on ghc.believoo.com, what each does, and your choices."
      updated="11 October 2026"
      intro={
        <P>
          Cookies are small text files stored on your device that help websites function and remember preferences.
          This policy explains the cookies used on {COMPANY.site}, their purpose, lifespan, and how you can control
          them. It is part of our <a href="/privacy" className="text-[#0050d7] font-semibold hover:underline">Privacy Policy</a>.
        </P>
      }
      sections={[
        {
          id: "types",
          title: "Types of cookies we use",
          body: (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Category</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Purpose</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Can be refused?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-[#0f172a]">Strictly necessary</td>
                      <td className="px-4 py-2.5">Authentication sessions, CSRF protection, load balancing, cookie-consent memory, security checks.</td>
                      <td className="px-4 py-2.5">No — the site cannot function without them</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-[#0f172a]">Functional / preferences</td>
                      <td className="px-4 py-2.5">Language, currency and theme (light/dark) selection, dashboard layout choices.</td>
                      <td className="px-4 py-2.5">Yes — but preferences won't persist</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-[#0f172a]">Analytics</td>
                      <td className="px-4 py-2.5">Anonymous usage statistics — page popularity, load performance, error rates.</td>
                      <td className="px-4 py-2.5">Yes — via cookie banner or browser settings</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-[#0f172a]">Marketing</td>
                      <td className="px-4 py-2.5">Campaign attribution (which link brought you), referral tracking.</td>
                      <td className="px-4 py-2.5">Yes — via cookie banner</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "specific",
          title: "Specific cookies and storage",
          body: (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Name / mechanism</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Type</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Purpose</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Lifespan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr><td className="px-4 py-2.5 font-mono">ghc_token</td><td className="px-4 py-2.5">Necessary</td><td className="px-4 py-2.5">Dashboard authentication session (HttpOnly, Secure)</td><td className="px-4 py-2.5">Session / up to 7 days</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">ghc-theme</td><td className="px-4 py-2.5">Functional</td><td className="px-4 py-2.5">Light/dark theme preference</td><td className="px-4 py-2.5">1 year</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">ghc-locale / currency</td><td className="px-4 py-2.5">Functional</td><td className="px-4 py-2.5">Language and currency selection</td><td className="px-4 py-2.5">1 year</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">localStorage: user, pendingCheckout</td><td className="px-4 py-2.5">Necessary</td><td className="px-4 py-2.5">Cached profile, checkout-in-progress state</td><td className="px-4 py-2.5">Until cleared / login</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">cookie-consent</td><td className="px-4 py-2.5">Necessary</td><td className="px-4 py-2.5">Remembers your cookie choice</td><td className="px-4 py-2.5">1 year</td></tr>
                    <tr><td className="px-4 py-2.5 font-mono">payment gateway cookies</td><td className="px-4 py-2.5">Third-party</td><td className="px-4 py-2.5">Set by Razorpay/Cashfree/PayPal during checkout for fraud checks — governed by their own policies</td><td className="px-4 py-2.5">Session</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "third-party",
          title: "Third-party technologies",
          body: (
            <>
              <P>
                During checkout, payment gateways set their own cookies on their pages/SDKs — we do not control
                these; see the respective gateway's privacy policy. We do not embed advertising trackers, social
                media pixels, or third-party analytics beacons that build cross-site profiles.
              </P>
            </>
          ),
        },
        {
          id: "control",
          title: "How to control cookies",
          body: (
            <>
              <UL
                items={[
                  <><b>Cookie banner:</b> on first visit you can Accept or Decline non-essential cookies; your choice is remembered for one year and can be changed by clearing the consent cookie.</>,
                  <><b>Browser settings:</b> all major browsers let you block or delete cookies (Settings → Privacy → Cookies). Blocking strictly-necessary cookies will prevent login.</>,
                  <><b>Private/Incognito mode:</b> cookies are not persisted after the session ends.</>,
                  <><b>Do Not Track:</b> we honour standard opt-outs for non-essential cookies made via the banner.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes and contact",
          body: (
            <>
              <P>
                This Cookie Policy may be updated as the platform evolves — the current version is always at{" "}
                {COMPANY.site}/cookies. Questions: <a href={`mailto:${COMPANY.privacy}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.privacy}</a>.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
