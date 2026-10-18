import GameRangePage from "@/components/GameRangePage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Arena dedicated servers | GHC - Go Host Cloud",
  description: "A platform built for game hosting — AMD Ryzen 9000X 3D game servers with Arena DDoS protection for a lag-free experience.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <GameRangePage plans={plans} />;
}
