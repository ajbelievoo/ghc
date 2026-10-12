"use client";

import { useState } from "react";
import CategoryPage from "@/components/CategoryPage";

const vpsTabs = [
  { key: "vps-2027", label: "Linux VPS" },
  { key: "os", label: "Operating Systems" },
];

export default function VpsClient({ initialPlans }: { initialPlans: any[] }) {
  const [activeTab, setActiveTab] = useState("vps-2027");
  return (
    <CategoryPage
      categoryKey="VPS"
      subCategory={activeTab}
      subTabs={vpsTabs}
      onSubTabChange={setActiveTab}
      initialPlans={initialPlans}
    />
  );
}
