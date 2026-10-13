import WebCloudDatabasesPage from "@/components/WebCloudDatabasesPage";
import { fetchPlans } from "@/lib/plans";

export default async function DatabasesPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <WebCloudDatabasesPage plans={plans} />;
}
