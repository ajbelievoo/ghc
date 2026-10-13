import EcommerceHostingPage from "@/components/EcommerceHostingPage";
import { fetchPlans } from "@/lib/plans";

export default async function EcommercePage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <EcommerceHostingPage plans={plans} />;
}
