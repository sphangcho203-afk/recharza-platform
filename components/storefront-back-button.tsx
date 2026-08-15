"use client";

import { useRouter } from "next/navigation";

export function StorefrontBackButton({ fallbackHref = "/#games" }: { fallbackHref?: string }) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="storefront-back-button"
      aria-label="Go back to the previous store page"
    >
      <span aria-hidden="true" className="text-base leading-none">←</span>
      <span>Back</span>
    </button>
  );
}
