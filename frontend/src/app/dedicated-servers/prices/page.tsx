import { Suspense } from "react";
import DedicatedRangeList from "@/components/DedicatedRangeList";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Full dedicated server range | GHC - Go Host Cloud",
  description: "Compare every GHC dedicated server — filter by region, hardware, network, price and use case, then configure in a few clicks.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return (
    <Suspense fallback={null}>
      <DedicatedRangeList plans={plans} />
    </Suspense>
  );
}
