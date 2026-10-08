import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function HighGradeServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <CategoryPage categoryKey="DEDICATED" subCategory="high-grade" ranges={["High Grade HCI", "High Grade AI", "High Grade SAP", "High Grade SDS"]} initialPlans={plans} />;
}
