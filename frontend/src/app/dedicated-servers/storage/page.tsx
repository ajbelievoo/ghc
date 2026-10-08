import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function StorageServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="storage" ranges={["Storage"]} initialPlans={plans} />;
}
