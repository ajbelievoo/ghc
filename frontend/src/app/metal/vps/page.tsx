import { Suspense } from "react";
import MetalVpsClient from "./MetalVpsClient";
import { fetchMetalVpsPlans } from "@/lib/plans";

export default async function MetalVpsPage() {
  const plans = await fetchMetalVpsPlans();
  return (
    <Suspense>
      <MetalVpsClient initialPlans={plans} />
    </Suspense>
  );
}
