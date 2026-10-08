import DedicatedServersClient from "./DedicatedServersClient";
import { fetchPlans } from "@/lib/plans";

export default async function DedicatedServersPage() {
  const plans = await fetchPlans("DEDICATED");
  return <DedicatedServersClient initialPlans={plans} />;
}
