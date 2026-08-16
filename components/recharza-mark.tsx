import Image from "next/image";

type RecharzaMarkProps = {
  compact?: boolean;
};

export function RecharzaMark({ compact = false }: RecharzaMarkProps) {
  return (
    <span className="recharza-mark-shell inline-flex min-w-0 items-center" aria-label="Recharza">
      <Image
        src="/assets/brand/recharza-electric-mark.png"
        alt="Recharza"
        width={64}
        height={64}
        priority={compact}
        className={`recharza-electric-mark ${compact ? "h-8 w-8" : "h-10 w-10"} object-contain`}
      />
    </span>
  );
}
