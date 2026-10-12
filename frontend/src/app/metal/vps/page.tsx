import MetalVpsClient from "./MetalVpsClient";
import { fetchMetalVpsPlans } from "@/lib/plans";

export default async function MetalVpsPage() {
  const plans = await fetchMetalVpsPlans();
  return <MetalVpsClient initialPlans={plans} />;
}
