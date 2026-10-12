import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function EcoServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="eco" ranges={["Eco", "Kimsufi", "So you Start"]} initialPlans={plans} />;
}
