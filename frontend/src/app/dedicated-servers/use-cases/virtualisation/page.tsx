import VirtualisationPage from "@/components/VirtualisationPage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Virtualisation, Containerisation & Orchestration | GHC - Go Host Cloud",
  description: "Run hypervisors, Kubernetes clusters and private clouds on bare-metal dedicated servers — full control of your technical platform.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <VirtualisationPage plans={plans} />;
}
