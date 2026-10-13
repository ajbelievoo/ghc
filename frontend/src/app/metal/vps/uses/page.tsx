import type { Metadata } from "next";
import MetalUsesPage from "@/components/MetalUsesPage";

export const metadata: Metadata = {
  title: "VPS uses — see what you can do with a Metal VPS | GHC - Go Host Cloud",
  description:
    "WordPress multisite, gaming, Minecraft, Forex trading, sandbox environments, web hosting, software and database hosting — see the uses for a Metal VPS.",
};

export default function Page() {
  return <MetalUsesPage />;
}
