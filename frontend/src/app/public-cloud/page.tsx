import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function PublicCloudPage() {
  const plans = await fetchPlans("PUBLIC_CLOUD");
  return <CategoryPage categoryKey="PUBLIC_CLOUD" initialPlans={plans} />;
}
