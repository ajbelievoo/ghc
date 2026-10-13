import HostWordPressPage from "@/components/HostWordPressPage";
import { fetchPlans } from "@/lib/plans";

export default async function HostWordPress() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <HostWordPressPage plans={plans} />;
}
