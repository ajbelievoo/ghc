import type { Metadata } from "next";
import MetalDevelopersPage from "@/components/MetalDevelopersPage";

export const metadata: Metadata = {
  title: "VPS for Developers — flexible VPS for faster deployment | GHC Metal",
  description:
    "Get a powerful, dedicated dev setup at a price you can't beat. Metal VPS with up to 3 Gbps bandwidth, root access, 30+ OS images and 99.9% SLA.",
};

export default function Page() {
  return <MetalDevelopersPage />;
}
