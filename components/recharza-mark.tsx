import Image from "next/image";

type RecharzaMarkProps = {
  compact?: boolean;
};

export function RecharzaMark({ compact = false }: RecharzaMarkProps) {
  return (
    <span className="inline-flex min-w-0 items-center" aria-label="Recharza">
      <Image
        src="/assets/brand/recharza-official-lockup.png"
        alt="Recharza"
        width={914}
        height={592}
        priority={compact}
        className={`${compact ? "h-8 max-w-[9rem]" : "h-10 max-w-[11rem]"} w-auto object-contain object-left`}
      />
    </span>
  );
}
