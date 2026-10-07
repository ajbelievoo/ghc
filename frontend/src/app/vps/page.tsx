import VpsClient from "./VpsClient";
import { fetchPlans } from "@/lib/plans";

export default async function VpsPage() {
  const plans = await fetchPlans("VPS");
  return <VpsClient initialPlans={plans} />;
}
