import CategoryPage from "@/components/CategoryPage";
import { fetchPlans } from "@/lib/plans";
import { notFound } from "next/navigation";

// slug -> OVH catalog category. Heroes live in CategoryPage's subCategoryHero map.
const SOLUTION_CATEGORIES: Record<string, string> = {
  // Speed up your websites and applications
  drupal: "VPS",
  prestashop: "VPS",
  magento: "VPS",
  // The ideal foundation for your VMs (bare metal)
  proxmox: "DEDICATED",
  kvm: "DEDICATED",
  "vmware-esxi": "DEDICATED",
  "hyper-v": "DEDICATED",
  // Your data, without data loss
  clickhouse: "DEDICATED",
  postgresql: "DEDICATED",
  cassandra: "DEDICATED",
  hbase: "DEDICATED",
  influxdb: "DEDICATED",
  // The power for your critical workloads
  gromacs: "DEDICATED",
  namd: "DEDICATED",
  // Blockchain infrastructure
  "validator-nodes": "DEDICATED",
  "rpc-nodes": "DEDICATED",
  "archive-nodes": "DEDICATED",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SOLUTION_CATEGORIES).map((slug) => ({ slug }));
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = SOLUTION_CATEGORIES[slug];
  if (!category) notFound();
  const plans = await fetchPlans(category);
  return <CategoryPage categoryKey={category} subCategory={slug} initialPlans={plans} />;
}
