import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00b7ff] border-t-transparent" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <PaymentClient />
    </Suspense>
  );
}
