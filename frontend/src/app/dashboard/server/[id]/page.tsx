import { Suspense } from "react";
import ServerDetailClient from "./ServerDetailClient";

export function generateStaticParams() {
  return [{ id: "demo" }];
}

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fcff]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00b7ff] border-t-transparent" />
    </div>
  );
}

export default function ServerDetailPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <ServerDetailClient />
    </Suspense>
  );
}
