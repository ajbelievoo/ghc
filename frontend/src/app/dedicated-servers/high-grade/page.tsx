import HighGradeRangePage from "@/components/HighGradeRangePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Elite dedicated servers | GHC - Go Host Cloud",
  description: "Designed for the most demanding workloads — dual-socket EPYC/Xeon, hot-swap storage, liquid cooling, 99.99% SLA.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <HighGradeRangePage plans={plans} />;
}
