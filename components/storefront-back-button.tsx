"use client";

import { useRouter } from "next/navigation";

export function StorefrontBackButton({ fallbackHref = "/#games", className = "" }: { fallbackHref?: string; className?: string }) {
  const router = useRouter();

  function goBack() {
    const currentHref = window.location.href;
    if (window.history.length > 1) {
      window.history.back();
      window.setTimeout(() => {
        if (window.location.href === currentHref) router.push(fallbackHref);
      }, 350);
      return;
    }
    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className={`storefront-back-button ${className}`}
      aria-label="Go back to the previous store page"
    >
      <span aria-hidden="true" className="text-base leading-none">←</span>
      <span>Back</span>
    </button>
  );
}
