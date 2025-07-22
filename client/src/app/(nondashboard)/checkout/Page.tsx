import { Suspense } from "react";
import Loading from "@/components/Loading";
import Checkoutwizard from "./CheckoutWizard"; // adjust path if needed

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Checkoutwizard />
    </Suspense>
  );
}
