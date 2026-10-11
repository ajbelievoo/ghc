import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Grievance Officer | GHC - Go Host Cloud",
  description: "Contact details and process for the Grievance Officer of Believoo Private Limited under the IT Act, 2000.",
};

export default function GrievancePage() {
  return (
    <LegalPage
      title="Grievance Officer"
      subtitle="Appointed under the Information Technology Act, 2000 and IT (Intermediary Guidelines) Rules — your escalation point for unresolved complaints."
      updated="11 October 2026"
      intro={
        <P>
          As required by Rule 3 of the Information Technology (Intermediary Guidelines and Digital Media Ethics
          Code) Rules, {COMPANY.name} has appointed a Grievance Officer to receive and resolve complaints relating
          to content, account actions, privacy, billing disputes and violations of law or our policies on the GHC
          platform.
        </P>
      }
      sections={[
        {
          id: "officer",
          title: "Grievance Officer details",
          body: (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 space-y-2">
                <p><b className="text-[#0f172a]">Designation:</b> Grievance Officer</p>
                <p><b className="text-[#0f172a]">Organisation:</b> {COMPANY.name}</p>
                <p><b className="text-[#0f172a]">Email:</b> <a href={`mailto:${COMPANY.grievance}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.grievance}</a></p>
                <p><b className="text-[#0f172a]">Alternate (abuse/security):</b> <a href={`mailto:${COMPANY.abuse}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.abuse}</a></p>
                <p><b className="text-[#0f172a]">Phone:</b> {COMPANY.phone}</p>
                <p><b className="text-[#0f172a]">Postal address:</b> Grievance Officer, {COMPANY.name}, {COMPANY.address}</p>
                <p><b className="text-[#0f172a]">Working hours:</b> Monday–Saturday, 10:00–18:00 IST (emails monitored 24×7 for abuse)</p>
              </div>
            </>
          ),
        },
        {
          id: "when",
          title: "When to contact the Grievance Officer",
          body: (
            <>
              <P>Escalate to the Grievance Officer when:</P>
              <UL
                items={[
                  <>A support ticket or abuse report has not been resolved within the promised timeframe.</>,
                  <>You believe content hosted on our platform violates Indian law, or your content was removed/suspended wrongly.</>,
                  <>You have a complaint about privacy or personal-data handling that support could not resolve.</>,
                  <>Law-enforcement or government authorities need a designated point of contact for lawful requests.</>,
                  <>A billing or service dispute remains unresolved after normal support escalation.</>,
                  <>Your account was suspended or terminated and you believe the decision was in error.</>,
                ]}
              />
              <P>
                For routine issues (provisioning delays, password resets, invoice copies) please open a regular
                support ticket first — the Grievance channel is for escalations and statutory complaints.
              </P>
            </>
          ),
        },
        {
          id: "how",
          title: "How to file a grievance",
          body: (
            <>
              <P>Email {COMPANY.grievance} with the subject line <b>"Grievance — [topic]"</b> and include:</P>
              <UL
                items={[
                  <>Your full name, registered email address and contact number.</>,
                  <>Account ID, service name, domain name, IP address or URL involved (as applicable).</>,
                  <>Reference numbers of related tickets, orders or invoices.</>,
                  <>A clear description of the complaint, the outcome you seek, and supporting evidence (screenshots, headers, logs with timestamps and timezone).</>,
                  <>For legal requests: the statutory basis and issuing authority's reference.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "process",
          title: "Process and timelines",
          body: (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Stage</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr><td className="px-4 py-2.5">Acknowledgement of your grievance</td><td className="px-4 py-2.5">Within 24 hours</td></tr>
                    <tr><td className="px-4 py-2.5">Resolution of standard grievances</td><td className="px-4 py-2.5">Within 15 days</td></tr>
                    <tr><td className="px-4 py-2.5">Content complaints under IT Rules (unlawful content)</td><td className="px-4 py-2.5">Action/response within statutory period (72 hours where required)</td></tr>
                    <tr><td className="px-4 py-2.5">CSAM / imminent-harm reports</td><td className="px-4 py-2.5">Immediate — highest priority queue</td></tr>
                    <tr><td className="px-4 py-2.5">Complex billing/legal disputes</td><td className="px-4 py-2.5">Within 30 days, with progress updates</td></tr>
                  </tbody>
                </table>
              </div>
              <P>
                Every grievance receives a tracking reference. If the response does not satisfy you, reply to the
                same thread requesting a review — it is re-examined by senior management. Statutory escalation
                rights under Indian law remain unaffected.
              </P>
            </>
          ),
        },
        {
          id: "law-enforcement",
          title: "For law enforcement and government authorities",
          body: (
            <>
              <P>
                Law-enforcement agencies should send requests on official letterhead (or from an official .gov/.nic
                email address) to {COMPANY.grievance}, citing the legal basis (IT Act 2000 §69/79, CrPC §91,
                applicable rules). We respond to valid requests within statutory timelines and can preserve data
                pending formal process. Emergency disclosure requests involving imminent threats to life are
                handled 24×7.
              </P>
            </>
          ),
        },
        {
          id: "nodal",
          title: "Consumer grievance under e-commerce rules",
          body: (
            <>
              <P>
                For complaints under the Consumer Protection (E-Commerce) Rules, 2020, the Grievance Officer above
                serves as the designated nodal contact. Complaints are acknowledged within 48 hours and resolved
                within one month of receipt.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
