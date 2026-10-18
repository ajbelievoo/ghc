import AdvanceRangePage from "@/components/AdvanceRangePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Core dedicated servers | GHC - Go Host Cloud",
  description: "Reliable performance for everyday workloads — AMD EPYC 4005 & Intel Xeon 6 dedicated servers with DDR5 ECC, NVMe and 25 Gbps private network.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <AdvanceRangePage plans={plans} />;
}
