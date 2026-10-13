import CreateWebsitePage from "@/components/CreateWebsitePage";
import { fetchPlans } from "@/lib/plans";

export default async function CreateWebsite() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <CreateWebsitePage plans={plans} />;
}
