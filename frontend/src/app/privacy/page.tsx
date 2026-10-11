import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Privacy Policy | GHC - Go Host Cloud",
  description: "How Believoo Private Limited collects, uses, stores and protects your personal data on GHC — Go Host Cloud.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Believoo Private Limited collects, uses, shares and protects your personal data when you use GHC — Go Host Cloud."
      updated="11 October 2026"
      intro={
        <P>
          {COMPANY.name} ("Believoo", "we", "us") is committed to protecting your privacy. This Privacy Policy
          explains what personal data we collect through the GHC platform ({COMPANY.site}), why we collect it, how
          long we keep it, who we share it with, and the rights you have under the Information Technology Act, 2000,
          the SPDI Rules, 2011 and the Digital Personal Data Protection Act, 2023 ("DPDP Act").
        </P>
      }
      sections={[
        {
          id: "controller",
          title: "Data controller and scope",
          body: (
            <>
              <P>
                For your account data, billing data and platform-usage data, {COMPANY.name} is the data fiduciary
                (controller). This policy covers the GHC website, client dashboard, APIs, support channels and
                emails. It does not cover third-party websites you reach through links, or content you host on your
                servers — for customer-hosted content, <b>you are the controller</b> and we act as processor under
                our Terms.
              </P>
            </>
          ),
        },
        {
          id: "data-collected",
          title: "Data we collect",
          body: (
            <>
              <P><b>Account and identity data</b></P>
              <UL
                items={[
                  <>Full name, email address, phone number, country — at registration and profile updates.</>,
                  <>Password (stored only as a one-way bcrypt hash — we cannot read it), two-factor authentication secrets, SSH public keys you upload.</>,
                  <>Government identifiers where required for invoicing — e.g. your GSTIN for B2B billing.</>,
                ]}
              />
              <P><b>Billing and transaction data</b></P>
              <UL
                items={[
                  <>Billing name, billing address (street, city, state, PIN code), invoice history, payment method type (card brand / UPI / wallet — never full card numbers, which are handled by PCI-DSS certified gateways).</>,
                  <>Transaction references from payment gateways (Razorpay, Cashfree, PayPal, PayU) needed to verify and reconcile payments.</>,
                  <>Wallet balance, credit movements and usage-billing records for hourly cloud resources.</>,
                ]}
              />
              <P><b>Service and technical data</b></P>
              <UL
                items={[
                  <>Services you order — server names, configurations, IP addresses, domain names, DNS records, resource identifiers and their lifecycle events.</>,
                  <>Support tickets, live-chat transcripts, abuse reports and the communications you send us.</>,
                  <>Server monitoring metrics for services you enable monitoring on (CPU, RAM, disk, ping latency).</>,
                ]}
              />
              <P><b>Automatic usage data</b></P>
              <UL
                items={[
                  <>Log data: IP address, browser type, device identifiers, pages visited, timestamps, referring URLs.</>,
                  <>Authentication events: sign-in timestamps, IP addresses and session metadata shown in "Recent sign-ins".</>,
                  <>Cookies and similar technologies — see our <a href="/cookies" className="text-[#0050d7] font-semibold hover:underline">Cookie Policy</a>.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "purposes",
          title: "Why we process your data",
          body: (
            <>
              <UL
                items={[
                  <><b>Service delivery (contract):</b> create and manage your account, provision and operate servers/domains/cloud resources, process payments, issue invoices, deliver renewal reminders and service notices.</>,
                  <><b>Security and abuse prevention (legitimate interest & legal obligation):</b> fraud screening, DDoS/abuse mitigation, audit logs, rate-limiting, and investigating AUP violations.</>,
                  <><b>Support (contract/legitimate interest):</b> answering tickets, troubleshooting, service notices and status updates.</>,
                  <><b>Legal compliance:</b> tax records (GST), statutory registers under the Companies Act, responding to lawful requests from Indian authorities and courts.</>,
                  <><b>Communications:</b> transactional emails (verification, invoices, security alerts) are mandatory; product updates and offers are sent only where permitted and you can opt out at any time via the unsubscribe link or notification preferences.</>,
                  <><b>Analytics and improvement (legitimate interest):</b> aggregate, de-identified usage statistics to improve performance, capacity planning and product design.</>,
                ]}
              />
              <P>
                We do not use your Customer Content (the data you host on your servers) for any purpose other than
                operating the infrastructure, and we do not sell personal data to anyone.
              </P>
            </>
          ),
        },
        {
          id: "legal-bases",
          title: "Lawful bases (DPDP Act 2023)",
          body: (
            <>
              <UL
                items={[
                  <><b>Consent:</b> given when you register and agree to these terms, and for optional cookies/marketing.</>,
                  <><b>Performance of a contract:</b> provisioning, billing and supporting the services you ordered.</>,
                  <><b>Legal obligation:</b> tax, company-law and lawful-interception obligations.</>,
                  <><b>Legitimate uses under Section 7 DPDP Act:</b> security of the platform, fraud prevention, and enforcement of legal claims.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who we share data with",
          body: (
            <>
              <P>We share personal data only where necessary, under contract, and limited to the purpose:</P>
              <UL
                items={[
                  <><b>Infrastructure & registry partners:</b> upstream datacenter, cloud and domain-registry providers that physically host or register the services you buy (server allocation, domain WHOIS as required by ICANN — which may make registrant data publicly visible depending on TLD rules).</>,
                  <><b>Payment processors:</b> Razorpay, Cashfree, PayPal, PayU — to execute your payments (they receive only what the transaction needs).</>,
                  <><b>Email delivery:</b> our transactional mail infrastructure for account/service emails.</>,
                  <><b>Professional advisers:</b> auditors, lawyers and accountants bound by confidentiality.</>,
                  <><b>Authorities:</b> Indian law-enforcement, courts and regulators where legally required; records may include logs and account data.</>,
                  <><b>Group operations:</b> affiliated Believoo entities operating the same platform, under this same policy.</>,
                ]}
              />
              <P>We do not sell, rent, or trade your personal data to advertisers or data brokers — ever.</P>
            </>
          ),
        },
        {
          id: "transfers",
          title: "International transfers",
          body: (
            <>
              <P>
                Some infrastructure partners and the jurisdictions where servers are deployed may be located outside
                India (e.g. datacenters in Europe, Canada, Singapore). When you order a service in such a region,
                the technical data needed to run it is processed there. Domain WHOIS data is published globally by
                registries as required by ICANN. All transfers are limited to what the service requires and are
                protected by contract and industry-standard security controls.
              </P>
            </>
          ),
        },
        {
          id: "security",
          title: "How we protect your data",
          body: (
            <>
              <UL
                items={[
                  <>TLS encryption in transit; encryption at rest for sensitive fields and credentials.</>,
                  <>Passwords stored as bcrypt hashes; secrets and tokens stored hashed where possible.</>,
                  <>Role-based access control — employees access customer data only on a need-to-know basis, under confidentiality obligations.</>,
                  <>Anti-DDoS network protection, firewalls and continuous monitoring.</>,
                  <>Two-factor authentication available for all accounts — enable it in Security settings.</>,
                  <>Regular backups of platform databases, encrypted and access-restricted.</>,
                ]}
              />
              <P>
                No system is perfectly secure. If a breach occurs that is likely to harm you, we will notify you and
                the Data Protection Board of India as required by the DPDP Act, with remediation steps.
              </P>
            </>
          ),
        },
        {
          id: "retention",
          title: "Data retention",
          body: (
            <>
              <UL
                items={[
                  <><b>Account data:</b> kept while your account is active, plus up to 5 years after closure for dispute, tax and audit purposes.</>,
                  <><b>Invoices & tax records:</b> 8 years as required by Indian tax law.</>,
                  <><b>Server/application logs:</b> typically 30–90 days, unless required longer for an abuse investigation or legal hold.</>,
                  <><b>Support tickets:</b> retained for the life of the account; anonymised extracts may be kept for quality analysis.</>,
                  <><b>Service data:</b> when a service is terminated, VM/host data is wiped from hypervisors within the stated retention window (usually 7–30 days) and is then unrecoverable.</>,
                  <><b>Marketing consents:</b> until you withdraw.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <P>Under the DPDP Act and SPDI Rules you have the right to:</P>
              <UL
                items={[
                  <><b>Access</b> a summary of your personal data and processing activities.</>,
                  <><b>Correction</b> of inaccurate or incomplete data — most fields are editable in your profile.</>,
                  <><b>Erasure</b> of your personal data where it is no longer needed for the purpose collected, subject to statutory retention (tax/company records cannot be deleted early).</>,
                  <><b>Grievance redressal</b> via our Grievance Officer — response within statutory timelines.</>,
                  <><b>Withdraw consent</b> for optional processing (marketing, optional cookies) at any time; withdrawal does not affect prior lawful processing.</>,
                  <><b>Nominate</b> a representative to exercise rights in case of death or incapacity.</>,
                ]}
              />
              <P>
                To exercise any right, email <a href={`mailto:${COMPANY.privacy}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.privacy}</a> or
                contact the Grievance Officer. We may verify your identity before acting. Requests are answered
                free of charge within the statutory period.
              </P>
            </>
          ),
        },
        {
          id: "children",
          title: "Children's data",
          body: (
            <>
              <P>
                The Services are not directed at persons under 18. We do not knowingly collect personal data of
                children without verifiable parental/guardian consent. If we learn that a child's data was provided
                without such consent, we will delete it. Parents may contact {COMPANY.grievance}.
              </P>
            </>
          ),
        },
        {
          id: "your-data-controller",
          title: "Your role as controller of hosted data",
          body: (
            <>
              <P>
                If you host personal data of your own users/customers on GHC infrastructure, you are the data
                controller for that data. You must: have a lawful basis for processing, publish your own privacy
                notice, honour data-subject requests, and configure your services securely. We process such data
                only on your documented instructions (running the service you ordered). You must not use the
                Services to process special categories of data in violation of applicable law.
              </P>
            </>
          ),
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: (
            <>
              <P>
                We may update this Privacy Policy to reflect legal or operational changes. Material changes are
                announced by email or dashboard notice 15 days before taking effect. The current version is always
                at {COMPANY.site}/privacy.
              </P>
            </>
          ),
        },
        {
          id: "contact",
          title: "Contact & grievance",
          body: (
            <>
              <P>
                Privacy questions and rights requests: <a href={`mailto:${COMPANY.privacy}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.privacy}</a>.
              </P>
              <P>
                Grievance Officer (as required by the IT Act): see our{" "}
                <a href="/grievance" className="text-[#0050d7] font-semibold hover:underline">Grievance Officer page</a> —
                email <a href={`mailto:${COMPANY.grievance}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.grievance}</a>,{" "}
                {COMPANY.name}, {COMPANY.address}.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
