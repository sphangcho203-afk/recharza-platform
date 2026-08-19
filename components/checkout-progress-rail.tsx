const STEP_LABELS = ["Package", "Player", "Billing", "Review", "Payment"] as const;

type CheckoutProgressRailProps = {
  current: number;
};

/**
 * A proper progress component for the checkout flow — filled gradient
 * track, done/active node states, and small-caps labels sharing the
 * store's eyebrow treatment. `current` is 1-based.
 */
export function CheckoutProgressRail({ current }: CheckoutProgressRailProps) {
  const total = STEP_LABELS.length;
  const fillPct = Math.min(100, ((current - 1) / (total - 1)) * 100);

  return (
    <div
      className="relative"
      style={{ "--rcz-fill": `${fillPct}%` } as React.CSSProperties}
    >
      <div
        className="recharza-progress-rail"
        style={{ "--rcz-steps": total } as React.CSSProperties}
      >
        <div className="recharza-progress-track" />
        <div className="recharza-progress-fill" />
        {STEP_LABELS.map((label, idx) => {
          const stepNo = idx + 1;
          const done = stepNo < current;
          const active = stepNo === current;
          return (
            <div
              key={label}
              className="recharza-progress-step"
              data-active={active}
              data-done={done}
            >
              <div
                className={`recharza-progress-node ${done ? "recharza-progress-node-done" : ""} ${active ? "recharza-progress-node-active" : ""}`}
              />
              <div className="recharza-progress-label">{label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
