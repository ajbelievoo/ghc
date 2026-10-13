import { WebHostingHubPage } from "@/components/HostingRangePage";
import { fetchPlans } from "@/lib/plans";

export default async function WebHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <WebHostingHubPage plans={plans} />;
}
