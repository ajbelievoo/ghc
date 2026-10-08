import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function ComfortVpsPage() {
  const plans = await fetchPlans("VPS");
  return <CategoryPage categoryKey="VPS" subCategory="comfort" ranges={["Comfort"]} initialPlans={plans} />;
}
