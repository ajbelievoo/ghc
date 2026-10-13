import { Suspense } from "react";
import MetalDedicatedClient from "./MetalDedicatedClient";
import { fetchMetalDedicatedPlans } from "@/lib/plans";

export const metadata = {
  title: "Metal Dedicated Servers — bare metal power | GHC - Go Host Cloud",
  description: "Raw dedicated performance forged for production — Advance, Game, Scale, Scale GPU and High Grade bare metal servers with anti-DDoS included.",
};

export default async function MetalDedicatedPage() {
  const plans = await fetchMetalDedicatedPlans();
  return (
    <Suspense>
      <MetalDedicatedClient initialPlans={plans} />
    </Suspense>
  );
}
