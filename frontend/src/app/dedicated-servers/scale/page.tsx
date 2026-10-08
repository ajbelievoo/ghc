import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function ScaleServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="scale" ranges={["Scale", "Scale GPU"]} initialPlans={plans} />;
}
