import AzResiliencePage from "@/components/AzResiliencePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "AZ and resilience | GHC - Go Host Cloud",
  description: "Improve the resilience of your services with multi-AZ dedicated server deployment — independent zones, low-latency private network.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <AzResiliencePage plans={plans} />;
}
