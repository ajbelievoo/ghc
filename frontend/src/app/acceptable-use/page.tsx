import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Acceptable Use Policy | GHC - Go Host Cloud",
  description: "Rules for using GHC infrastructure — prohibited content, network abuse, resource limits and enforcement.",
};

export default function AcceptableUsePage() {
  return (
    <LegalPage
      title="Acceptable Use Policy"
      subtitle="What you may and may not do on GHC infrastructure — and how enforcement works."
      updated="11 October 2026"
      intro={
        <P>
          This Acceptable Use Policy ("AUP") is part of our <a href="/terms" className="text-[#0050d7] font-semibold hover:underline">Terms of Service</a>.
          It protects our network, our customers, and the public. By using any GHC service you agree to it. If you
          are unsure whether a use case is permitted, ask us before deploying — {COMPANY.abuse}.
        </P>
      }
      sections={[
        {
          id: "illegal",
          title: "Illegal content and activity",
          body: (
            <>
              <P>You must not use the Services to store, publish, transmit or facilitate anything that is illegal under Indian law or the law of the jurisdiction where the service operates, including:</P>
              <UL
                items={[
                  <>Child sexual abuse material (CSAM) — reported to authorities immediately, zero tolerance, zero warning.</>,
                  <>Content promoting terrorism, extremist violence, or banned organisations.</>,
                  <>Fraud, scams, Ponzi schemes, fake shops, impersonation and identity theft.</>,
                  <>Sale of controlled substances, weapons, or goods illegal under the Drugs and Cosmetics Act, NDPS Act or Arms Act.</>,
                  <>Content that violates court orders, or incites violence or public disorder.</>,
                  <>Unlicensed gambling/betting services targeting Indian users where prohibited by state law.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "ip-infringement",
          title: "Intellectual property infringement",
          body: (
            <>
              <UL
                items={[
                  <>Do not host, distribute or link to pirated software, movies, music, games, e-books, "nulled" scripts/plugins, or IPTV restreams without rights.</>,
                  <>Do not operate torrent trackers, warez sites, streaming-ripping tools or copyright-circumvention services.</>,
                  <>Trademark infringement and counterfeit-goods sales are prohibited.</>,
                  <>Repeat copyright infringement leads to termination. Rights-holders: see our <a href="/dmca" className="text-[#0050d7] font-semibold hover:underline">Copyright / DMCA policy</a>.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "network-abuse",
          title: "Network and system abuse",
          body: (
            <>
              <P>The following are strictly prohibited on our network, whether or not directed at GHC itself:</P>
              <UL
                items={[
                  <>Denial-of-service and distributed denial-of-service attacks, amplification attacks (DNS, NTP, memcached, SSDP), and booter/stresser services.</>,
                  <>Port scanning, vulnerability scanning, brute-force attempts, or intrusion attempts against systems you do not own or lack written authorisation to test.</>,
                  <>Operating open mail relays, open DNS resolvers, open proxies, or unauthenticated public services used for abuse amplification.</>,
                  <>IP spoofing, BGP hijacking, or forging packet/headers to disguise origin.</>,
                  <>Botnet command-and-control, malware distribution, exploit kits, cryptojacking payloads, or hosting phishing pages.</>,
                  <>Credential stuffing, password spraying, or automated attacks on third-party services.</>,
                  <>Interfering with GHC's own infrastructure — attempting to access other customers' data or bypass isolation.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "spam",
          title: "Email and messaging abuse",
          body: (
            <>
              <UL
                items={[
                  <>No unsolicited bulk email (spam) — all recipients must have verifiably opted in.</>,
                  <>No purchased or scraped mailing lists. Mailing lists must honour unsubscribes within 72 hours.</>,
                  <>No forged headers, deceptive subject lines, or missing sender identity.</>,
                  <>Snowshoe spam (distributing volume across many IPs/domains) is prohibited.</>,
                  <>Outbound mail from VPS/dedicated servers must follow best practices (PTR, SPF, DKIM); accounts whose mail generates blocklist hits may have port 25 restricted.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "resource-abuse",
          title: "Resource and platform abuse",
          body: (
            <>
              <UL
                items={[
                  <>Do not consume shared infrastructure in a way that degrades other tenants — sustained CPU stealing on shared plans, deliberate I/O exhaustion, or memory abuse.</>,
                  <>Cryptocurrency mining is permitted only on dedicated/bare-metal servers and on VPS plans where explicitly allowed — never on shared web hosting or public cloud trial resources.</>,
                  <>Do not resell or share services outside your organisation unless your plan permits reselling.</>,
                  <>Do not run TOR exit nodes, public VPN endpoints marketed to evade law-enforcement, or IRC networks that attract DDoS, without prior written approval.</>,
                  <>Multiple accounts may not be used to bypass suspension, rate limits, or abuse enforcement.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "content-responsibility",
          title: "Your responsibility for third parties",
          body: (
            <>
              <P>
                You are responsible for abuse originating from your services — including abuse by your own
                customers, compromised applications, stolen credentials, or insecure scripts. "My WordPress was
                hacked" does not excuse a phishing page: keep software patched, use strong credentials, and enable
                two-factor authentication everywhere.
              </P>
            </>
          ),
        },
        {
          id: "enforcement",
          title: "Enforcement and response",
          body: (
            <>
              <P>When we detect or receive a credible report of a violation:</P>
              <UL
                items={[
                  <><b>Severe violations</b> (CSAM, active attacks, malware C2, imminent legal risk): immediate suspension without notice, evidence preserved for authorities.</>,
                  <><b>Standard violations:</b> notification with a remediation deadline (typically 24–72 hours). Failure to respond or remediate leads to suspension.</>,
                  <><b>Containment:</b> we may null-route IPs, filter ports, or isolate a VM while preserving the rest of your services.</>,
                  <><b>Repeat violations:</b> account termination and service deletion without refund.</>,
                  <><b>Appeals:</b> you may appeal enforcement via {COMPANY.abuse} — provide evidence and remediation steps.</>,
                ]}
              />
              <P>
                We are legally required to act on valid court orders and lawful government requests under the IT
                Act, 2000 and may preserve/share logs accordingly.
              </P>
            </>
          ),
        },
        {
          id: "reporting",
          title: "Reporting abuse",
          body: (
            <>
              <P>
                Report abuse originating from GHC services via our{" "}
                <a href="/abuse" className="text-[#0050d7] font-semibold hover:underline">abuse report form</a> or
                email <a href={`mailto:${COMPANY.abuse}`} className="text-[#0050d7] font-semibold hover:underline">{COMPANY.abuse}</a>.
                Include the offending IP/domain/URL, evidence (headers, logs, timestamps with timezone), and your
                contact details. Verified reports are actioned within 24 hours.
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
                This AUP may be updated as threats and laws evolve; material changes are announced 15 days in
                advance. The current version is always at {COMPANY.site}/acceptable-use.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
