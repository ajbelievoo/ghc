import DedicatedUseCasesPage from "@/components/DedicatedUseCasesPage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Dedicated server use cases | GHC - Go Host Cloud",
  description: "The right server for every use case — hosting, databases, AI, HPC, virtualisation, backup, 3-AZ resilience and more on GHC bare metal.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <DedicatedUseCasesPage plans={plans} />;
}
