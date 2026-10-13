import HostingRangePage from "@/components/HostingRangePage";
import { fetchPlans } from "@/lib/plans";

export default async function BusinessHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <HostingRangePage range="business" plans={plans} />;
}
