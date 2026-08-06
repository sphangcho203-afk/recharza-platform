type RecharzaMarkProps = {
  compact?: boolean;
  wordmark?: boolean;
};

export function RecharzaMark({
  compact = false,
  wordmark = true,
}: RecharzaMarkProps) {
  const size = compact ? "h-8 w-8" : "h-10 w-10";

  return (
    <span className="inline-flex min-w-0 items-center gap-2.5" aria-label="Recharza">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={`${size} shrink-0 drop-shadow-[0_0_18px_rgba(34,211,238,0.24)]`}
      >
        <defs>
          <linearGradient id="recharza-rz-frame" x1="8" y1="8" x2="56" y2="56">
            <stop stopColor="#5ee7f7" />
            <stop offset="0.52" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="recharza-rz-type" x1="16" y1="17" x2="50" y2="48">
            <stop stopColor="#e6fbff" />
            <stop offset="0.48" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>

        <path
          d="M18 4h28l14 14v28L46 60H18L4 46V18L18 4Z"
          fill="#070b14"
          stroke="url(#recharza-rz-frame)"
          strokeWidth="2.5"
        />
        <path
          d="M17 46V18h14.5C38.2 18 42 21.2 42 26.5S38.2 35 31.5 35H17m14.5 0L43 46"
          fill="none"
          stroke="url(#recharza-rz-type)"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="5"
        />
        <path
          d="M40 18h9L36 46h13"
          fill="none"
          stroke="#ffffff"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="4.5"
        />
        <path d="M9 24V19L19 9h5" fill="none" stroke="#67e8f9" strokeWidth="2" />
        <path d="M55 40v5L45 55h-5" fill="none" stroke="#a78bfa" strokeWidth="2" />
      </svg>

      {wordmark ? (
        <span className="min-w-0 leading-none">
          <span
            className={`block whitespace-nowrap font-black uppercase tracking-[-0.055em] ${
              compact ? "text-[0.92rem]" : "text-lg"
            }`}
          >
            <span className="text-white">Rechar</span>
            <span className="text-cyan-300">za</span>
          </span>
          {!compact ? (
            <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.23em] text-slate-500">
              Play · Pay · Delivered
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
