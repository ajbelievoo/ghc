import CreateYourWebsitePage from "@/components/CreateYourWebsitePage";
import { fetchPlans } from "@/lib/plans";

export default async function CreateYourWebsite() {
  const plans = await fetchPlans("WEB_HOSTING");
  return <CreateYourWebsitePage plans={plans} />;
}
