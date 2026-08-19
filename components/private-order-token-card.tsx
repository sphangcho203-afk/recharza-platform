"use client";

import { useState } from "react";

export function PrivateOrderTokenCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200">
            🔐 Save your private tracking token
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-100/75">
            You will need this token with your Order ID when checking status from another browser or in Telegram. It is shown only after order creation—Recharza stores only a protected hash.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyToken()}
          className="min-h-10 shrink-0 rounded-lg border border-amber-200/25 bg-amber-200/10 px-3 text-xs font-semibold text-amber-100 transition hover:bg-amber-200/20"
        >
          {copied ? "Copied" : "Copy token"}
        </button>
      </div>
      <textarea
        readOnly
        rows={3}
        value={token}
        aria-label="Private order tracking token"
        className="mt-3 w-full resize-none rounded-lg border border-amber-200/15 bg-black/25 px-3 py-3 font-mono text-xs text-amber-50 outline-none"
      />
      <p className="mt-2 text-[11px] leading-5 text-amber-100/60">
        Keep it private. Never post it in a public Telegram group or share it with anyone you do not trust.
      </p>
    </div>
  );
}
