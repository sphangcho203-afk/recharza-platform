import Image from "next/image";

type RecharzaMarkProps = {
  compact?: boolean;
};

export function RecharzaMark({ compact = false }: RecharzaMarkProps) {
  return (
    <span className="inline-flex min-w-0 items-center" aria-label="Recharza">
      <Image
        src="/assets/brand/recharza-mark.svg"
        alt="Recharza"
        width={64}
        height={64}
        priority={compact}
        className={`${compact ? "h-8 w-8" : "h-10 w-10"} object-contain`}
      />
    </span>
  );
}
