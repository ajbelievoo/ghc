import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";

export default async function VideoHostingPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <CategoryPage categoryKey="WEB_HOSTING" subCategory="video" initialPlans={plans} />;
}
