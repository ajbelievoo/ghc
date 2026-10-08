import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function AdvanceServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="advance" ranges={["Advance"]} initialPlans={plans} />;
}
