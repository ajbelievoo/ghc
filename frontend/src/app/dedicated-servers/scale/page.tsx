import ScaleRangePage from "@/components/ScaleRangePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Flex dedicated servers | GHC - Go Host Cloud",
  description: "Built for eco-friendly performance — up to 384-core AMD EPYC 9004/9005 and Intel Xeon 6 servers with 2 TB DDR5 ECC and 4×25 Gbps networking.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <ScaleRangePage plans={plans} />;
}
