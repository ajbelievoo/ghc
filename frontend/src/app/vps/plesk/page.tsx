import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function PleskVpsPage() {
  const plans = await fetchPlans("VPS");
  return <CategoryPage categoryKey="VPS" subCategory="plesk" initialPlans={plans} />;
}
