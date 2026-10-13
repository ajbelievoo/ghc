import HostingRangePage from "@/components/HostingRangePage";
import { fetchPlans } from "@/lib/plans";

export default async function AgencyHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <HostingRangePage range="agency" plans={plans} />;
}
