import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function CpanelVpsPage() {
  const plans = await fetchPlans("VPS");
  return <CategoryPage categoryKey="VPS" subCategory="cpanel" initialPlans={plans} />;
}
