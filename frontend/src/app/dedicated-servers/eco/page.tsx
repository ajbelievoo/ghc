import EcoValuePage from "@/components/EcoValuePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Base dedicated servers — best value bare metal | GHC - Go Host Cloud",
  description: "Dedicated servers at the best value, without compromise — unbeatable prices across every range, anti-DDoS included.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <EcoValuePage plans={plans} />;
}
