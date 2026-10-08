import PublicCloudClient from "./PublicCloudClient";
import { fetchPlans } from "@/lib/plans";

export default async function PublicCloudPage() {
  const plans = await fetchPlans("PUBLIC_CLOUD");
  return <PublicCloudClient initialPlans={plans} />;
}
