import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function PrivateCloudPage() {
  const plans = await fetchPlans("PRIVATE_CLOUD");
  return <CategoryPage categoryKey="PRIVATE_CLOUD" initialPlans={plans} />;
}
