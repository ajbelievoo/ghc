import HostingRangePage from "@/components/HostingRangePage";
import { fetchPlans } from "@/lib/plans";

export default async function EcoHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <HostingRangePage range="eco" plans={plans} />;
}
