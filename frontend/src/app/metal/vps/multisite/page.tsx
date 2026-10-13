import type { Metadata } from "next";
import MetalMultisitePage from "@/components/MetalMultisitePage";

export const metadata: Metadata = {
  title: "Host a multisite WordPress setup on a Metal VPS | GHC - Go Host Cloud",
  description:
    "Run an entire WordPress multisite network from one Metal VPS — dedicated resources, global datacentres, control panels like Plesk and cPanel, and easy scaling as your sites grow.",
};

export default function Page() {
  return <MetalMultisitePage />;
}
