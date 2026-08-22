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
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
            🔐 Save your private tracking token
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-900/70 font-medium">
            You will need this token with your Order ID when checking status from another browser or in Telegram. It is shown only after order creation—Recharza stores only a protected hash.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyToken()}
          className="min-h-10 shrink-0 rounded-lg border border-amber-200 bg-white px-3 text-xs font-bold text-amber-700 shadow-sm transition hover:bg-amber-100"
        >
          {copied ? "Copied" : "Copy token"}
        </button>
      </div>
      <textarea
        readOnly
        rows={3}
        value={token}
        aria-label="Private order tracking token"
        className="mt-3 w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-3 font-mono text-xs text-amber-900 outline-none shadow-inner"
      />
      <p className="mt-2 text-[11px] leading-5 text-amber-900/50 font-medium">
        Keep it private. Never post it in a public Telegram group or share it with anyone you do not trust.
      </p>
    </div>
  );
}
