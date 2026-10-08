import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function WordpressVpsPage() {
  const plans = await fetchPlans("VPS");
  return <CategoryPage categoryKey="VPS" subCategory="wordpress" initialPlans={plans} />;
}
