import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function RiseServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="rise" ranges={["Rise"]} initialPlans={plans} />;
}
