import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Domain Dispute Policy | GHC - Go Host Cloud",
  description: "How domain ownership disputes, UDRP/INDRP proceedings and court orders are handled for GHC-registered domains.",
};

export default function DomainDisputePage() {
  return (
    <LegalPage
      title="Domain Dispute Policy"
      subtitle="How disputes over domain names registered through GHC are handled — UDRP, INDRP, court orders and transfer locks."
      updated="11 October 2026"
      intro={
        <P>
          Domain names registered through GHC are subject to the dispute-resolution policies of the applicable
          registry and ICANN (for generic TLDs) or the national registry (for country-code TLDs like .in). This
          page explains what happens when a third party disputes a domain, when we lock a domain, and how
          court/authority orders are handled.
        </P>
      }
      sections={[
        {
          id: "frameworks",
          title: "Applicable dispute frameworks",
          body: (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Domain type</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Dispute policy</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Forum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr><td className="px-4 py-2.5">gTLDs (.com, .net, .org, new gTLDs)</td><td className="px-4 py-2.5">UDRP — Uniform Domain-Name Dispute-Resolution Policy</td><td className="px-4 py-2.5">WIPO, NAF, other ICANN-approved providers</td></tr>
                    <tr><td className="px-4 py-2.5">.in / .co.in (India)</td><td className="px-4 py-2.5">INDRP — .IN Dispute Resolution Policy</td><td className="px-4 py-2.5">NIXI-approved arbitrators</td></tr>
                    <tr><td className="px-4 py-2.5">Other ccTLDs</td><td className="px-4 py-2.5">The registry's own policy (varies)</td><td className="px-4 py-2.5">Registry-designated forum</td></tr>
                    <tr><td className="px-4 py-2.5">URS (new gTLDs)</td><td className="px-4 py-2.5">Uniform Rapid Suspension for clear-cut cases</td><td className="px-4 py-2.5">ICANN-approved URS providers</td></tr>
                  </tbody>
                </table>
              </div>
              <P>
                By registering a domain you agreed to be bound by the applicable policy. These policies are
                administered by independent providers — we implement their outcomes but do not decide who is right.
              </P>
            </>
          ),
        },
        {
          id: "what-we-do",
          title: "What happens during a dispute",
          body: (
            <>
              <UL
                items={[
                  <><b>Notification:</b> when a UDRP/INDRP/URS complaint or court order naming your domain is received, we email the registrant contact on file immediately — keep your WHOIS email current.</>,
                  <><b>Registrar lock:</b> the domain is placed under lock — it cannot be transferred, deleted, or have its registrant changed until the proceeding ends. DNS keeps working unless the order says otherwise.</>,
                  <><b>No editorial judgment:</b> we do not evaluate who has the better claim — the dispute provider decides. We implement the decision (transfer, cancellation, or status quo).</>,
                  <><b>Timeline:</b> UDRP respondents typically have 20 days to respond to the provider; missing the deadline usually means a default decision.</>,
                  <><b>Outcome:</b> if the panel orders a transfer or cancellation, we implement it 10 business days after notification unless you file a lawsuit in a competent court within that window and notify us.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "court-orders",
          title: "Court and government orders",
          body: (
            <>
              <UL
                items={[
                  <>Valid orders from competent Indian courts, tribunals, or government authorities (including orders under the IT Act, 2000) are implemented as directed — suspension, transfer, or DNS block.</>,
                  <>Foreign court orders are evaluated for enforceability; we may require local enforcement before acting, except where the domain registry is in that jurisdiction.</>,
                  <>Emergency seizure/takedown orders are actioned immediately; the registrant is notified unless the order prohibits disclosure.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "private-disputes",
          title: "Disputes between private parties",
          body: (
            <>
              <UL
                items={[
                  <>If two private parties dispute domain ownership (e.g. a business split), we will not act on either party's word alone — provide a court order, or use the UDRP/INDRP process.</>,
                  <>Allegations that a domain was registered through account hijacking are investigated as security incidents — supply evidence via {COMPANY.abuse} and file a police/cybercrime complaint where applicable.</>,
                  <>We may place a disputed domain under lock while ownership evidence is examined, preventing transfer or deletion by either party.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "whois",
          title: "Registrant accuracy and verification",
          body: (
            <>
              <UL
                items={[
                  <>ICANN requires accurate registrant data. Domains with unverified or demonstrably false WHOIS data may be suspended by the registry — outside our control and not refundable.</>,
                  <>WHOIS privacy/proxy, where offered for a TLD, does not shield a domain from UDRP/INDRP or legal process — the underlying registrant is revealed to the dispute provider when required.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "reporting",
          title: "How to file a dispute",
          body: (
            <>
              <UL
                items={[
                  <><b>UDRP complaint:</b> file with WIPO (wipo.int/amc) or NAF — they serve the complaint on us as registrar of record.</>,
                  <><b>INDRP complaint:</b> file with NIXI per the .IN Dispute Resolution Policy.</>,
                  <><b>Court order / government request:</b> serve on the Grievance Officer — {COMPANY.grievance} — with the legal basis cited.</>,
                  <><b>Ownership/security issues:</b> email {COMPANY.abuse} with evidence; for compromised accounts also open a support ticket.</>,
                  <><b>Our role is technical implementation</b> — for who owns a name, the dispute provider or court decides.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact",
          body: (
            <>
              <P>
                Domain dispute notices: <a href={`mailto:${COMPANY.grievance}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.grievance}</a>.
                Abuse/security reports: <a href={`mailto:${COMPANY.abuse}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.abuse}</a>.
                Postal: {COMPANY.name}, {COMPANY.address}.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
