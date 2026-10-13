import type { Metadata } from "next";
import MetalResellerPage from "@/components/MetalResellerPage";

export const metadata: Metadata = {
  title: "VPS Reseller — scalable, flexible and competitive VPS | GHC Metal",
  description:
    "Offer your customers reliable VPS hosting at a competitive price. Metal VPS with NVMe storage, unlimited traffic, Plesk/cPanel options and 99.9% SLA.",
};

export default function Page() {
  return <MetalResellerPage />;
}
