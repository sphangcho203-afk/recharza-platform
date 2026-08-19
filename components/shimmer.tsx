export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`recharza-shimmer ${className}`}
    />
  );
}
