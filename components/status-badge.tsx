export type BadgeState = "pending" | "success" | "error" | "info" | "neutral";

/**
 * Three color states only, per the v2 spec:
 * pending / awaiting / informational → amber, success / delivered → green,
 * error / failed → red. There is no cyan or grey state — any "other"
 * status is an order that is still in progress (amber) or broken (red).
 */
const STATE_CLASS: Record<BadgeState, string> = {
  pending: "recharza-state-amber",
  info: "recharza-state-amber",
  neutral: "recharza-state-amber",
  success: "recharza-state-green",
  error: "recharza-state-red",
};

type StatusBadgeProps = {
  state: BadgeState;
  label: string;
};

/**
 * One consistent pill badge across the store, colour-coded by state:
 * pending/awaiting → amber, success/delivered → green, error/failed → red.
 */
export function StatusBadge({ state, label }: StatusBadgeProps) {
  return (
    <span className={STATE_CLASS[state]}>{label}</span>
  );
}
