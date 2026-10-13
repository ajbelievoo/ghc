import type { Metadata } from "next";
import MetalOsDistributionsPage from "@/components/MetalOsDistributionsPage";

export const metadata: Metadata = {
  title: "VPS Distributions | OS, Apps & Control Panels | GHC Metal VPS",
  description:
    "Choose from 30+ operating systems, applications and web hosting control panels pre-installed on your Metal VPS — Linux, Windows Server, cPanel, Plesk, Docker, n8n and more.",
};

export default function Page() {
  return <MetalOsDistributionsPage />;
}
