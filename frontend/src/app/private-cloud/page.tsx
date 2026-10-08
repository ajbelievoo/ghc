import PrivateCloudClient from "./PrivateCloudClient";
import { fetchPlans } from "@/lib/plans";

export default async function PrivateCloudPage() {
  const plans = await fetchPlans("PRIVATE_CLOUD");
  return <PrivateCloudClient initialPlans={plans} />;
}
