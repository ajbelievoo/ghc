import WebsiteBusinessPage from "@/components/WebsiteBusinessPage";
import { fetchPlans } from "@/lib/plans";

export const metadata = {
  title: "Website Business Applications | GHC - Go Host Cloud",
  description: "Host websites and business applications on a bare-metal dedicated server — stable resources, predictable pricing, cPanel & Plesk support.",
};

export default async function Page() {
  const plans = await fetchPlans("DEDICATED");
  return <WebsiteBusinessPage plans={plans} />;
}
