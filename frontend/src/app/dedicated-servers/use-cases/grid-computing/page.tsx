import GridComputingPage from "@/components/GridComputingPage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Grid computing | GHC - Go Host Cloud",
  description: "Deploy compute-intensive models on dedicated servers designed for grid computing — high core counts, predictable pricing, global infrastructure.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <GridComputingPage plans={plans} />;
}
