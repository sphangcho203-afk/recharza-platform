const STEP_LABELS = ["Package", "Player", "Billing", "Review", "Payment"] as const;

type CheckoutProgressRailProps = {
  current: number;
};

/**
 * Spec v2 progress rail — filled/unfilled SEGMENTS (not circles),
 * current step labeled inline above the rail, completed steps shown
 * with a checkmark instead of a number. Segments live directly under
 * each label so the rail reads as one continuous bar.
 */
export function CheckoutProgressRail({ current }: CheckoutProgressRailProps) {
  const total = STEP_LABELS.length;

  return (
    <div className="w-full">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[.68rem] font-bold uppercase tracking-[0.18em] text-violet-600/80">Checkout</p>
        <p className="text-[.72rem] font-bold text-slate-900">
          {STEP_LABELS[Math.min(current, total) - 1]} · <span className="text-slate-500">Step {Math.min(current, total)} of {total}</span>
        </p>
      </div>
      <div
        className="recharza-segment-rail"
        style={{ "--rcz-steps": total, "--rcz-current": current } as React.CSSProperties}
      >
        {STEP_LABELS.map((label, idx) => {
          const stepNo = idx + 1;
          const done = stepNo < current;
          const active = stepNo === current;
          return (
            <div key={label} className="recharza-segment-cell">
              <span
                className={`recharza-segment ${done ? "recharza-segment-done" : ""} ${active ? "recharza-segment-active" : ""}`}
                aria-current={active ? "step" : undefined}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3.5 w-3.5">
                    <path d="m6 12.5 4 4L18 8" />
                  </svg>
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                ) : null}
              </span>
              <span className={`recharza-segment-label ${done ? "text-emerald-600" : active ? "text-violet-900" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
