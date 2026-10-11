import LegalPage, { P, UL, COMPANY } from "@/components/LegalPage";

export const metadata = {
  title: "Service Level Agreement | GHC - Go Host Cloud",
  description: "GHC uptime commitments, service credits, maintenance windows and exclusions.",
};

export default function SlaPage() {
  return (
    <LegalPage
      title="Service Level Agreement"
      subtitle="Our uptime commitments for each GHC product, how credits work, and what is excluded."
      updated="11 October 2026"
      intro={
        <P>
          This Service Level Agreement ("SLA") is part of our <a href="/terms" className="text-[#0050d7] font-semibold hover:underline">Terms of Service</a> and
          defines the availability commitments {COMPANY.name} makes for GHC services, and your remedy when we miss
          them. SLA credits are issued to your Wallet and are the sole and exclusive remedy for availability
          failures.
        </P>
      }
      sections={[
        {
          id: "commitments",
          title: "Availability commitments",
          body: (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Service</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Monthly uptime target</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Measured at</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">VPS &amp; Cloud VPS</td><td className="px-4 py-2.5">99.9%</td><td className="px-4 py-2.5">Hypervisor network connectivity</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">Public Cloud instances</td><td className="px-4 py-2.5">99.9%</td><td className="px-4 py-2.5">Region network + instance reachable</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">Dedicated servers</td><td className="px-4 py-2.5">99.9% network / 99.5% power+network</td><td className="px-4 py-2.5">Datacenter edge connectivity</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">Hosted Private Cloud</td><td className="px-4 py-2.5">99.9%</td><td className="px-4 py-2.5">Host + vSphere reachability</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">Web hosting &amp; email</td><td className="px-4 py-2.5">99.9%</td><td className="px-4 py-2.5">HTTP(S) response / SMTP accept</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">Object storage</td><td className="px-4 py-2.5">99.9%</td><td className="px-4 py-2.5">API response</td></tr>
                    <tr><td className="px-4 py-2.5 font-semibold text-[#0f172a]">DNS resolution</td><td className="px-4 py-2.5">99.95%</td><td className="px-4 py-2.5">Authoritative nameserver answers</td></tr>
                  </tbody>
                </table>
              </div>
              <P>
                "Monthly uptime" = (total minutes in month − downtime minutes) ÷ total minutes. Downtime means the
                service is unreachable from the public internet due to causes within our infrastructure.
              </P>
            </>
          ),
        },
        {
          id: "credits",
          title: "Service credits",
          body: (
            <>
              <P>If a service misses its monthly uptime target, you are entitled to a credit on request:</P>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-left">
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Monthly uptime achieved</th>
                      <th className="px-4 py-2.5 font-bold text-[#0f172a]">Credit (% of the month's service fee)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr><td className="px-4 py-2.5">99.0% – 99.9%</td><td className="px-4 py-2.5">5%</td></tr>
                    <tr><td className="px-4 py-2.5">95.0% – 99.0%</td><td className="px-4 py-2.5">10%</td></tr>
                    <tr><td className="px-4 py-2.5">Below 95.0%</td><td className="px-4 py-2.5">25%</td></tr>
                  </tbody>
                </table>
              </div>
              <UL
                items={[
                  <>Credits are calculated on the monthly fee of the affected service only (excluding taxes, add-ons and one-time fees).</>,
                  <>For hourly-billed resources the credit applies to that resource's billed amount for the month.</>,
                  <>Maximum credit per service per month: 25% of its monthly fee. Credits are applied to your Wallet within one billing cycle.</>,
                  <>To claim: open a billing ticket within 30 days of the incident, stating the service and the affected period. We verify against our monitoring before approving.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "hardware",
          title: "Hardware replacement (dedicated)",
          body: (
            <>
              <P>
                For dedicated servers, failed hardware components covered by our responsibility (disk, RAM, PSU,
                motherboard, RAID card) are replaced free of charge — target replacement within 4 hours of
                diagnosis, 24 hours for rare/chassis-level components. Customer-supplied modifications, custom
                hardware and software-level failures are excluded.
              </P>
            </>
          ),
        },
        {
          id: "maintenance",
          title: "Scheduled maintenance",
          body: (
            <>
              <UL
                items={[
                  <>Planned maintenance is announced at least 48 hours in advance on the <a href="/status" className="text-[#0050d7] font-semibold hover:underline">status page</a> and, where it affects specific services, by email.</>,
                  <>Emergency maintenance (security patches, hardware failure prevention) may be performed with shorter notice — we announce it as soon as practical.</>,
                  <>Maintenance windows are typically scheduled between 01:00–05:00 local datacenter time to minimise impact.</>,
                  <>Downtime within a properly announced maintenance window does not count against the uptime target.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "exclusions",
          title: "What this SLA does not cover",
          body: (
            <>
              <P>Downtime does not count toward the SLA where caused by:</P>
              <UL
                items={[
                  <>Your software, OS, applications, misconfiguration, or the load on your own service exceeding its capacity.</>,
                  <>Your breach of the AUP/ToS leading to suspension or containment (e.g. outbound abuse triggering a block).</>,
                  <>DDoS attacks directed at your services beyond the capacity of standard mitigation.</>,
                  <>Actions of third parties — your ISP, backbone carriers beyond our network, DNS/registry failures of your domain registrar settings.</>,
                  <>Force majeure — natural disasters, war, power-grid failures at national scale, government orders.</>,
                  <>Beta, preview, trial or "best effort" services explicitly marked as excluded from SLA.</>,
                  <>Your request — reboots, reinstalls, maintenance you ask us to perform.</>,
                ]}
              />
            </>
          ),
        },
        {
          id: "measurement",
          title: "Measurement and disputes",
          body: (
            <>
              <P>
                Availability is measured by our monitoring systems at the infrastructure boundary. Independent
                third-party monitoring (e.g. your own uptime monitor) may be submitted with a claim and will be
                considered alongside our data. If measurements disagree materially, our Grievance Officer reviews
                the claim and both datasets before a decision.
              </P>
            </>
          ),
        },
        {
          id: "status-page",
          title: "Live status and incidents",
          body: (
            <>
              <P>
                Current platform status, ongoing incidents and 30-day uptime history are published at{" "}
                <a href="/status" className="text-[#0050d7] font-semibold hover:underline">{COMPANY.site}/status</a>.
                Subscribe there for incident notifications by email.
              </P>
            </>
          ),
        },
      ]}
    />
  );
}
