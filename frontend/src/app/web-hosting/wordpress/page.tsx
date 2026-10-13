import ManagedWordPressPage from "@/components/ManagedWordPressPage";
import { fetchPlans } from "@/lib/plans";

export default async function WordPressHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <ManagedWordPressPage plans={plans} />;
}
