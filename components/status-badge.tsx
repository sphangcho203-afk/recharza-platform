export type BadgeState = "pending" | "success" | "error" | "info" | "neutral";

const STATE_CLASS: Record<BadgeState, string> = {
  pending: "recharza-badge-pending",
  success: "recharza-badge-success",
  error: "recharza-badge-error",
  info: "recharza-badge-info",
  neutral: "recharza-badge-neutral",
};

type StatusBadgeProps = {
  state: BadgeState;
  label: string;
};

/**
 * One consistent pill badge across the store, colour-coded by state:
 * pending = amber, success = green, error = red, info = cyan,
 * neutral = grey.
 */
export function StatusBadge({ state, label }: StatusBadgeProps) {
  return (
    <span className={`recharza-badge ${STATE_CLASS[state]}`}>{label}</span>
  );
}
