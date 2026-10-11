import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Copyright / DMCA Policy | GHC - Go Host Cloud",
  description: "How to report copyright infringement on GHC infrastructure — takedown notices, counter-notices and repeat-infringer policy.",
};

export default function DmcaPage() {
  return (
    <LegalPage
      title="Copyright / DMCA Policy"
      subtitle="How rights-holders report infringement on GHC-hosted content, and how customers respond."
      updated="11 October 2026"
      intro={
        <P>
          {COMPANY.name} respects intellectual property rights and expects its customers to do the same. This page
          explains how to submit copyright takedown notices for content hosted on GHC infrastructure, and how our
          customers can respond with a counter-notice. We process notices consistent with the US DMCA (17 U.S.C.
          §512) framework and Indian copyright law (Copyright Act, 1957; IT Act, 2000).
        </P>
      }
      sections={[
        {
          id: "notice",
          title: "Filing a takedown notice",
          body: (
            <>
              <P>
                If you believe content hosted on GHC services infringes your copyright, send a written notice to{" "}
                <a href={`mailto:${COMPANY.dmca}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.dmca}</a>{" "}
                (or use the <a href="/abuse" className="text-[#0050d7] font-semibold hover:underline">abuse form</a>,
                category "Copyright"). Your notice must include:
              </P>
              <UL
                items={[
                  <>Your name, organisation (if an agent), postal address, email and phone number.</>,
                  <>Identification of the copyrighted work claimed to be infringed (title, registration number, or URL of the authorised original).</>,
                  <>Identification of the infringing material — the exact URL(s), IP address, or domain name, with enough detail for us to locate it.</>,
                  <>A statement that you have a good-faith belief the use is not authorised by the rights owner, its agent, or the law.</>,
                  <>A statement, under penalty of perjury, that the information in the notice is accurate and that you are the rights owner or authorised to act on their behalf.</>,
                  <>Your physical or electronic signature (typed full name suffices for email).</>,
                ]}
              />
              <P>
                Incomplete notices cannot be actioned — we will reply asking for the missing elements rather than
                guessing. Notices sent to the wrong channel (e.g. regular support) may be delayed.
              </P>
            </>
          ),
        },
        {
          id: "process",
          title: "What happens after a valid notice",
          body: (
            <>
              <UL
                items={[
                  <><b>Acknowledgement</b> within 24 hours with a case reference.</>,
                  <><b>Review</b> — we verify the notice is complete and the material is actually hosted on our infrastructure.</>,
                  <><b>Action</b> — for hosted/shared content we disable access to the identified material. For VPS/dedicated servers we forward the notice to the customer and require removal within 48 hours.</>,
                  <><b>Customer notification</b> — the affected customer receives the notice details and a deadline to remove the content or file a counter-notice.</>,
                  <><b>Escalation</b> — content not removed by the deadline is disabled or the service suspended.</>,
                  <><b>Confirmation</b> — we inform the complainant of the outcome.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "counter",
          title: "Counter-notice (for customers)",
          body: (
            <>
              <P>
                If you believe material was removed or disabled by mistake or misidentification (e.g. you hold a
                licence, fair use applies, or the complainant identified the wrong work), you may file a
                counter-notice to {COMPANY.dmca} containing:
              </P>
              <UL
                items={[
                  <>Your name, address, phone number and email.</>,
                  <>Identification of the removed material and where it appeared before removal.</>,
                  <>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</>,
                  <>A statement consenting to the jurisdiction of the courts at your address (or, if outside India, the courts at Budaun, UP, India) and accepting service of process from the complainant.</>,
                  <>Your physical or electronic signature.</>,
                ]}
              />
              <P>
                On receipt of a valid counter-notice we forward it to the complainant. Unless the complainant files
                a court action within 10–14 business days, the material may be restored. Restoration is not
                guaranteed where the content also violates the AUP for other reasons.
              </P>
            </>
          ),
        },
        {
          id: "repeat",
          title: "Repeat infringer policy",
          body: (
            <>
              <UL
                items={[
                  <>Accounts receiving multiple substantiated copyright complaints may be required to demonstrate remediation or face suspension.</>,
                  <>Customers who repeatedly host infringing content are terminated without refund.</>,
                  <>We track complaints per account and per service; distributing infringing content across multiple services does not reset the count.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "trademark",
          title: "Trademark and other IP complaints",
          body: (
            <>
              <P>
                Trademark, patent, design and publicity-right complaints follow the same process — send details to{" "}
                {COMPANY.dmca} identifying the protected right, its registration (where applicable), and the
                infringing use. Domain-name disputes are handled under the{" "}
                <a href="/domain-dispute" className="text-[#0050d7] font-semibold hover:underline">Domain Dispute Policy</a>,
                UDRP or INDRP as applicable.
              </P>
            </>
          ),
        },
        {
          id: "misuse",
          title: "Misuse of the process",
          body: (
            <>
              <P>
                Knowingly false or bad-faith takedown notices and counter-notices expose the sender to liability
                under 17 U.S.C. §512(f) and applicable Indian law, including costs and damages. We may ignore
                notices that are abusive, automated without verification, or outside our infrastructure.
              </P>
            </>
          ),
        },
        {
          id: "agent",
          title: "Designated contact",
          body: (
            <>
              <P>
                Copyright Agent: {COMPANY.name}, {COMPANY.address}. Email:{" "}
                <a href={`mailto:${COMPANY.dmca}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.dmca}</a> —
                phone {COMPANY.phone}.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
