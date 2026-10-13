import CdnOptionPage from "@/components/CdnOptionPage";
import { fetchPlans } from "@/lib/plans";

export default async function CdnPage() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <CdnOptionPage plans={plans} />;
}
