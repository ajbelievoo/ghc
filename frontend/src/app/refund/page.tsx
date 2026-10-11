import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Refund Policy | GHC - Go Host Cloud",
  description: "Refund and cancellation rules for GHC services — VPS, dedicated servers, cloud, domains, licenses and wallet balance.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      subtitle="Clear rules on cancellations, refunds and credits for every GHC product — no surprises."
      updated="11 October 2026"
      intro={
        <P>
          This Refund Policy is part of our <a href="/terms" className="text-[#0050d7] font-semibold hover:underline">Terms of Service</a> and
          describes when {COMPANY.name} ("Believoo", "we") will refund payments made for GHC services. Because many
          hosting services involve irreversible third-party costs (domain registries, licences, datacenter
          provisioning), refund eligibility differs per product — please read the section for your service before
          ordering.
        </P>
      }
      sections={[
        {
          id: "general",
          title: "General principles",
          body: (
            <>
              <UL
                items={[
                  <>Refunds are issued to the original payment method where technically possible; otherwise they are credited to your GHC Wallet.</>,
                  <>Refund requests must be raised through a support ticket or by emailing {COMPANY.support} — include your account email, service name and invoice number.</>,
                  <>Approved refunds are processed within 5–10 business days; your bank or gateway may take additional time to post the credit.</>,
                  <>Services obtained fraudulently, or accounts terminated for AUP/ToS violations, are <b>not eligible</b> for any refund.</>,
                  <>Currency conversion differences, bank charges and payment-gateway fees deducted by the processor are outside our control and are not reimbursed.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "vps",
          title: "VPS and cloud VPS plans",
          body: (
            <>
              <UL
                items={[
                  <><b>72-hour money-back window:</b> first-time VPS orders may be cancelled for a full refund within 72 hours of activation, provided the service has not been used for abuse and bandwidth usage is reasonable.</>,
                  <>After 72 hours, VPS fees are non-refundable for the current billing period — you may cancel the renewal anytime and the service runs until the paid end-date.</>,
                  <>Promotional or discounted first-term prices are refunded at the amount actually paid, not list price.</>,
                  <>One 72-hour refund per customer — the guarantee cannot be re-used by ordering multiple VPS plans.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "public-cloud",
          title: "Public cloud (hourly billing)",
          body: (
            <>
              <UL
                items={[
                  <>Hourly-billed resources (instances, volumes, floating IPs, load balancers) are charged per hour consumed. Used hours are non-refundable — you simply stop billing by deleting the resource.</>,
                  <>Unused prepaid savings-plan commitments may be refunded pro-rata within 48 hours of purchase if the associated resources have not been used.</>,
                  <>Wallet balance consumed by hourly usage cannot be reversed — monitor usage from the dashboard.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "dedicated",
          title: "Dedicated / bare-metal servers",
          body: (
            <>
              <UL
                items={[
                  <>Dedicated server orders involve physical provisioning at the datacenter. Orders cancelled <b>before delivery</b> are refunded in full.</>,
                  <>Once a dedicated server is delivered, the first billing period is non-refundable — hardware allocation and datacenter commitments are irreversible for us.</>,
                  <>Setup fees and custom-configuration charges are always non-refundable.</>,
                  <>Renewals cancelled before the renewal invoice is paid simply lapse — no charge occurs.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "web-hosting",
          title: "Web hosting and email plans",
          body: (
            <>
              <UL
                items={[
                  <><b>7-day money-back guarantee:</b> shared web hosting and email plans may be cancelled for a full refund within 7 days of activation, once per customer.</>,
                  <>After 7 days, hosting fees are non-refundable for the current term.</>,
                  <>Free domains bundled with hosting: if the hosting plan is refunded, the domain's standard registration fee is deducted and the domain remains yours for its paid term.</>,
                ]}
              />
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
                  <>Domain registrations, renewals and transfers are <b>final and non-refundable</b> once submitted to the registry — registries do not reverse orders.</>,
                  <>If a registration <b>fails</b> on our side or the registry's (TLD unavailable, premium-price mismatch, registry rejection), the full amount is automatically refunded to your Wallet.</>,
                  <>Redemption/restore fees for expired domains are non-refundable under all circumstances.</>,
                  <>Premium-priced domains follow registry pricing confirmed before payment — once registered they cannot be refunded.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "licenses",
          title: "Licences, add-ons and one-time items",
          body: (
            <>
              <UL
                items={[
                  <>Software licences (cPanel, Plesk, Windows, control panels) are non-refundable once issued — licence keys cannot be unissued.</>,
                  <>Additional IP addresses, one-time setup fees and paid support/migration services are non-refundable once delivered or performed.</>,
                  <>SSL certificates are refundable only before issuance.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "wallet",
          title: "Wallet balance and credits",
          body: (
            <>
              <UL
                items={[
                  <>Wallet top-ups are prepaid and generally <b>non-refundable</b>, as the balance is consumed by orders and hourly billing.</>,
                  <>If we terminate your account without cause, or you close your account with unused purchased balance, the remaining paid balance (excluding promotional credits) is refunded to the original payment method on request.</>,
                  <>Promotional credits, coupons, referral bonuses and SLA credits are non-refundable and non-transferable.</>,
                  <>Duplicate or erroneous top-ups are refunded in full on verification.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "chargebacks",
          title: "Chargebacks and disputes",
          body: (
            <>
              <P>
                If you dispute a charge through your bank or payment gateway, the associated services may be
                suspended immediately and the account may be restricted until the dispute is resolved — this is
                standard fraud-control practice, not a penalty. Please contact us first at {COMPANY.support}: most
                billing issues are resolved faster through a ticket than a chargeback, and avoid service
                interruption.
              </P>
              <P>
                Chargebacks filed for services actually delivered constitute fraud and lead to account termination
                plus recovery of the disputed amount and processing costs.
              </P>
            </>
          ),
        },
        {
          id: "how-to",
          title: "How to request a refund",
          body: (
            <>
              <UL
                items={[
                  <>Log in to the dashboard and open a support ticket under <b>Billing</b>, or email {COMPANY.support} from your registered address.</>,
                  <>Include: service name, invoice/transaction ID, reason for refund, and (for bank refunds) your preferred method.</>,
                  <>We acknowledge within 24 hours and give a decision within 3 business days; approved refunds reach you in 5–10 business days.</>,
                  <>For unresolved disputes, escalate to our <a href="/grievance" className="text-[#0050d7] font-semibold hover:underline">Grievance Officer</a> — {COMPANY.grievance}.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "statutory",
          title: "Statutory rights",
          body: (
            <>
              <P>
                Nothing in this policy limits any non-waivable consumer rights you hold under the Consumer
                Protection Act, 2019 or other applicable Indian law. Where this policy conflicts with a mandatory
                statutory right, the statute prevails.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
