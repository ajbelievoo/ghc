import BareMetalWordPressPage from "@/components/BareMetalWordPressPage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Dedicated servers for WordPress | GHC - Go Host Cloud",
  description: "Expert-tested bare-metal servers recommended for WordPress workloads — benchmarked performance for hosting and business applications.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <BareMetalWordPressPage plans={plans} />;
}
