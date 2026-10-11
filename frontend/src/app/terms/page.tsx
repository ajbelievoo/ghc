import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Terms of Service | GHC - Go Host Cloud",
  description: "Terms of Service for GHC cloud hosting — accounts, billing, services, suspension, liability and governing law. Operated by Believoo Private Limited.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="The legally binding agreement between you and Believoo Private Limited for the use of GHC — Go Host Cloud products and services."
      updated="11 October 2026"
      intro={
        <P>
          These Terms of Service ("Terms", "Agreement") govern your access to and use of the GHC — Go Host Cloud
          platform at <b>{COMPANY.site}</b>, including cloud VPS, dedicated servers, public cloud, private cloud,
          web hosting, domain registration, storage, networking, and all related services (collectively, the
          "Services") operated by <b>{COMPANY.name}</b> ("Believoo", "Company", "we", "us", "our"). By creating an
          account, placing an order, or using any Service you accept these Terms in full. If you do not agree, do
          not use the Services.
        </P>
      }
      sections={[
        {
          id: "definitions",
          title: "Definitions and interpretation",
          body: (
            <>
              <P>In these Terms, unless the context requires otherwise:</P>
              <UL
                items={[
                  <><b>"Account"</b> means the customer account registered on the GHC platform, including all sub-users and API keys associated with it.</>,
                  <><b>"Service"</b> means any product ordered through GHC — VPS, dedicated/bare-metal servers, public or private cloud resources, web hosting, domain names, SSL certificates, licences, IP addresses, backups, and managed options.</>,
                  <><b>"Customer Content"</b> means all data, software, websites, email, databases, virtual machine images and material you store, transmit or process on the Services.</>,
                  <><b>"Wallet"</b> means the prepaid account balance maintained in your GHC account, used to pay for orders and hourly/renewal billing.</>,
                  <><b>"Order"</b> means a request for a Service placed through the dashboard, website or API and accepted by us.</>,
                  <><b>"Billing Period"</b> means the period for which a Service is charged — hourly, monthly, quarterly, semi-annual, annual or multi-year as shown at checkout.</>,
                  <><b>"AUP"</b> means our Acceptable Use Policy, incorporated into these Terms by reference.</>,
                  <><b>"SLA"</b> means the Service Level Agreement describing uptime commitments and credits.</>,
                ]}
              />
              <P>
                Headings are for convenience only. References to statutes include amendments. "Including" means
                "including without limitation".
              </P>
            </>
          ),
        },
        {
          id: "eligibility",
          title: "Eligibility and account registration",
          body: (
            <>
              <UL
                items={[
                  <>You must be at least 18 years old and capable of forming a binding contract under the Indian Contract Act, 1872. If you register on behalf of a company or organisation, you represent that you are authorised to bind that entity.</>,
                  <>Registration information must be accurate, complete and kept up to date — including legal name, email address, phone number and billing address. Providing false identity or contact details is grounds for immediate termination.</>,
                  <>One person may not operate multiple accounts to circumvent suspension, abuse enforcement, or order limits.</>,
                  <>You are responsible for all activity under your Account, whether or not authorised by you. Keep your password, API keys and two-factor credentials confidential.</>,
                  <>Notify us immediately at {COMPANY.abuse} of any unauthorised use of your Account or breach of security.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "services",
          title: "The Services",
          body: (
            <>
              <P>GHC provides the following categories of services, each subject to product-specific conditions shown at order time:</P>
              <UL
                items={[
                  <><b>Virtual Private Servers (VPS)</b> — virtualised compute with dedicated resources, billed per billing period.</>,
                  <><b>Dedicated / Bare-Metal Servers</b> — physical machines provisioned under your name; provisioning times depend on datacenter availability.</>,
                  <><b>Public Cloud</b> — project-based compute instances, block/object storage, networking, load balancers, Kubernetes and related services, billed per hour of actual usage.</>,
                  <><b>Hosted Private Cloud</b> — dedicated hypervisor hosts and associated infrastructure.</>,
                  <><b>Web Hosting, Email and Domains</b> — shared hosting plans, mailboxes, DNS zones, and domain name registration/transfer/renewal through accredited upstream registrars.</>,
                  <><b>Add-ons</b> — additional IPs, storage, licences, control panels, backup options and bandwidth upgrades.</>,
                ]}
              />
              <P>
                Certain Services are provisioned through upstream infrastructure partners under white-label
                agreements. Service specifications, included features and available regions are those published on
                the site at the time of order. We may improve, modify or discontinue features with reasonable
                notice; material reductions during a paid term entitle you to a pro-rated service credit.
              </P>
            </>
          ),
        },
        {
          id: "orders",
          title: "Orders, activation and delivery",
          body: (
            <>
              <UL
                items={[
                  <>An Order is an offer to purchase. It becomes binding when payment is confirmed and the Service is activated. We may refuse or cancel orders that appear fraudulent, contain pricing errors, or violate export-control or sanctions rules.</>,
                  <>Activation times are estimates — VPS typically minutes, dedicated servers may take hours to several days depending on stock. Delays do not entitle cancellation fees but do extend the service end-date accordingly.</>,
                  <>Cloud instances and other pay-as-you-go resources start consuming billable time from the moment they are provisioned, whether or not you log in or use them.</>,
                  <>Domain registrations are processed in real time once payment clears. A domain that fails registration (registry rejection, premium-pricing mismatch, TLD unavailability) is refunded to your Wallet automatically.</>,
                  <>You must review order confirmations and report discrepancies within 72 hours.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "billing",
          title: "Pricing, billing and taxes",
          body: (
            <>
              <UL
                items={[
                  <>Prices are displayed in your selected currency and are <b>exclusive of taxes</b> unless stated otherwise. GST and other applicable Indian taxes are added at checkout per prevailing rates.</>,
                  <>Hourly-billed resources (public cloud instances, volumes, floating IPs, load balancers) are metered and debited from your Wallet. You must maintain sufficient balance; a negative balance may trigger automatic suspension after the stated grace period.</>,
                  <>Subscription services renew automatically at the end of each billing period unless you disable renewal or the payment method fails. Renewal prices may differ from promotional first-term pricing.</>,
                  <>Invoices are issued electronically in the dashboard. GST invoices carry our GSTIN {COMPANY.gstin}.</>,
                  <>Failed payments: we may retry the charge and suspend services for invoices unpaid past their due date. A reactivation fee may apply.</>,
                  <>Promotional credits, coupons and referral balances are non-refundable, non-transferable, and expire as stated in the offer.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "wallet",
          title: "Wallet and prepaid balance",
          body: (
            <>
              <UL
                items={[
                  <>The Wallet is a prepaid balance used for orders, renewals and hourly cloud billing. It is not a bank account and does not earn interest.</>,
                  <>Wallet top-ups are final and non-refundable except where required by law or where we terminate your account without cause — in which case unused balance is refunded to the original payment method.</>,
                  <>Wallet auto-pay, when enabled, automatically settles due invoices and hourly usage from your balance.</>,
                  <>Wallet balance cannot be transferred between accounts or redeemed for cash.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "acceptable-use",
          title: "Acceptable use",
          body: (
            <>
              <P>
                Your use of the Services is subject to our <a href="/acceptable-use" className="text-[#0050d7] font-semibold hover:underline">Acceptable Use Policy</a>.
                In summary and without limitation, you must not use the Services for: illegal content or activity;
                spam; malware, phishing or botnet command-and-control; unauthorised scanning, intrusion or DDoS
                attacks; cryptocurrency mining without a licence that permits it; IP spoofing; open relays/proxies
                used for abuse; or content that infringes intellectual property or violates Indian law.
              </P>
              <P>
                We monitor network-level abuse signals and respond to abuse reports. Verified violations may result
                in content removal, service suspension, bandwidth restriction, or account termination — without a
                refund where the violation is wilful.
              </P>
            </>
          ),
        },
        {
          id: "customer-obligations",
          title: "Your responsibilities",
          body: (
            <>
              <UL
                items={[
                  <>You are solely responsible for Customer Content — its legality, backups, security and licensing. We provide infrastructure; we do not warrant that your applications or data are error-free.</>,
                  <>Keep your software patched. Compromised services that threaten the network may be isolated without prior notice.</>,
                  <>You must maintain independent backups of critical data unless you have purchased a backup add-on. Backup add-ons are provided best-effort and are not a substitute for your own copies.</>,
                  <>You must comply with all laws applicable to your use — data protection (IT Act 2000, DPDP Act 2023), export controls, spam/telemarketing rules, and the laws of jurisdictions where your end-users reside.</>,
                  <>Access credentials for provisioned services (root passwords, panels) are delivered once; safeguarding and rotating them is your responsibility.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "sla",
          title: "Service levels",
          body: (
            <>
              <P>
                Uptime commitments and service credits are defined in our{" "}
                <a href="/sla" className="text-[#0050d7] font-semibold hover:underline">Service Level Agreement</a>.
                The headline commitment is 99.9% monthly network availability for VPS and cloud services. Credits
                under the SLA are your sole remedy for availability failures and are applied to your Wallet, not
                refunded as cash.
              </P>
            </>
          ),
        },
        {
          id: "suspension",
          title: "Suspension and termination",
          body: (
            <>
              <P>We may suspend Services, in whole or in part, when:</P>
              <UL
                items={[
                  <>Payment is overdue beyond the stated grace period, or the Wallet balance is insufficient to cover running hourly resources,</>,
                  <>An abuse report or security incident reasonably requires containment,</>,
                  <>Continued operation threatens the stability or security of the platform or other customers,</>,
                  <>Required by law enforcement, court order, or a competent authority,</>,
                  <>You breach these Terms or the AUP.</>,
                ]}
              />
              <P>
                Where feasible we will notify you before or promptly after suspension. Suspended services may be
                reactivated after the cause is resolved. Services suspended for non-payment are terminated after the
                data-retention window stated on the dashboard (typically 7–30 days), after which data is deleted
                and cannot be recovered.
              </P>
              <P>
                You may terminate any Service from the dashboard. Termination takes effect at the end of the current
                billing period for subscriptions and immediately for hourly resources. No partial-period refunds
                apply except as stated in the <a href="/refund" className="text-[#0050d7] font-semibold hover:underline">Refund Policy</a>.
              </P>
            </>
          ),
        },
        {
          id: "domains",
          title: "Domain names",
          body: (
            <>
              <UL
                items={[
                  <>Domain registrations are subject to the registry's and ICANN's policies for the relevant TLD, in addition to these Terms. By registering a domain you accept those policies.</>,
                  <>Registrant details must be accurate. ICANN requires verification of registrant email; unverified domains may be suspended by the registry — outside our control.</>,
                  <>Domain renewals processed after expiry may incur registry redemption/restore fees, which are substantially higher than renewal price and are non-refundable.</>,
                  <>Disputes over domain ownership are handled per our <a href="/domain-dispute" className="text-[#0050d7] font-semibold hover:underline">Domain Dispute Policy</a>, UDRP/INDRP and applicable registry rules.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "ip",
          title: "Intellectual property",
          body: (
            <>
              <P>
                The GHC platform, brand, logos, documentation and software are the property of {COMPANY.name} or its
                licensors. You retain all rights to your Customer Content. You grant us a limited licence to store,
                transmit and display Customer Content solely as needed to operate the Services.
              </P>
              <P>
                Nothing in these Terms transfers ownership of our IP to you. You may not copy, resell, or create
                derivative works of the platform itself, nor remove proprietary notices.
              </P>
            </>
          ),
        },
        {
          id: "privacy",
          title: "Privacy and data protection",
          body: (
            <>
              <P>
                Personal data is processed as described in our{" "}
                <a href="/privacy" className="text-[#0050d7] font-semibold hover:underline">Privacy Policy</a>, in
                compliance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act,
                2023. Where your Customer Content includes personal data of third parties, you are the data
                controller and warrant you have a lawful basis to process it on our infrastructure.
              </P>
            </>
          ),
        },
        {
          id: "warranties",
          title: "Disclaimers",
          body: (
            <>
              <P>
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE". TO THE MAXIMUM EXTENT PERMITTED BY LAW WE
                DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR
                PURPOSE, NON-INFRINGEMENT, AND UNINTERRUPTED OR ERROR-FREE OPERATION. WE DO NOT WARRANT THAT DATA
                WILL NOT BE LOST — MAINTAIN YOUR OWN BACKUPS.
              </P>
            </>
          ),
        },
        {
          id: "liability",
          title: "Limitation of liability",
          body: (
            <>
              <P>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY.name.toUpperCase()} SHALL NOT BE LIABLE FOR INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES — INCLUDING LOSS OF PROFITS, REVENUE, DATA,
                BUSINESS OR GOODWILL — ARISING FROM OR RELATED TO THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY.
              </P>
              <P>
                OUR TOTAL AGGREGATE LIABILITY FOR ANY CLAIM RELATING TO THE SERVICES IS LIMITED TO THE AMOUNT YOU
                PAID FOR THE AFFECTED SERVICE IN THE 30 DAYS PRECEDING THE EVENT GIVING RISE TO THE CLAIM. NOTHING
                IN THESE TERMS LIMITS LIABILITY FOR DEATH, PERSONAL INJURY, OR FRAUD WHERE SUCH LIMITATION IS
                PROHIBITED BY LAW.
              </P>
            </>
          ),
        },
        {
          id: "indemnity",
          title: "Indemnification",
          body: (
            <>
              <P>
                You agree to indemnify, defend and hold harmless {COMPANY.name}, its directors, employees and
                partners from all claims, damages, fines and expenses (including reasonable legal fees) arising
                from: your Customer Content; your use of the Services in violation of these Terms, the AUP or any
                law; infringement of third-party rights; or abuse reports attributable to your services.
              </P>
            </>
          ),
        },
        {
          id: "law",
          title: "Governing law and disputes",
          body: (
            <>
              <P>
                These Terms are governed by the laws of India. Courts at Budaun, Uttar Pradesh shall have exclusive
                jurisdiction, subject to any mandatory consumer-protection rights you hold. Before filing a claim,
                you agree to attempt good-faith resolution through our support and{" "}
                <a href="/grievance" className="text-[#0050d7] font-semibold hover:underline">Grievance Officer</a>{" "}
                for at least 30 days.
              </P>
            </>
          ),
        },
        {
          id: "misc",
          title: "General provisions",
          body: (
            <>
              <UL
                items={[
                  <><b>Entire agreement:</b> These Terms, the AUP, SLA, Privacy Policy and product-specific terms constitute the entire agreement and supersede prior communications.</>,
                  <><b>Severability:</b> If any provision is held unenforceable, the remainder continues in effect.</>,
                  <><b>No waiver:</b> Failure to enforce a provision is not a waiver of the right to enforce it later.</>,
                  <><b>Assignment:</b> You may not assign your Account without our written consent. We may assign to an affiliate or successor in a merger or sale.</>,
                  <><b>Force majeure:</b> We are not liable for failures caused by events beyond reasonable control — natural disasters, war, fibre cuts, datacenter power events, upstream provider failures, or government action.</>,
                  <><b>Notices:</b> Legal notices are sent to your registered account email and are deemed delivered when sent. Notices to us go to {COMPANY.support} or the registered office.</>,
                  <><b>Changes:</b> We may update these Terms with 15 days' notice via email or dashboard. Continued use after the effective date constitutes acceptance.</>,
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
                Questions about these Terms: <a href={`mailto:${COMPANY.support}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.support}</a> or{" "}
                {COMPANY.phone}. Registered office: {COMPANY.address}.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
