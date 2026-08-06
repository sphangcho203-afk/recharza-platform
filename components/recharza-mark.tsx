type RecharzaMarkProps = {
  compact?: boolean;
  wordmark?: boolean;
};

export function RecharzaMark({
  compact = false,
  wordmark = true,
}: RecharzaMarkProps) {
  const size = compact ? "h-9 w-9" : "h-11 w-11";

  return (
    <span className="inline-flex min-w-0 items-center gap-3" aria-label="Recharza">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className={`${size} shrink-0 drop-shadow-[0_0_24px_rgba(124,58,237,0.4)]`}
      >
        <defs>
          <linearGradient id="rz-shell" x1="9" y1="7" x2="55" y2="57">
            <stop stopColor="#67e8f9" />
            <stop offset="0.46" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="rz-core" x1="20" y1="18" x2="42" y2="49">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#dbeafe" />
          </linearGradient>
        </defs>
        <path
          d="M12 8h30.4C51 8 57 13.5 57 22c0 6.8-3.7 11.7-10.2 14.1L55 56H41.3l-8.1-17H27l-9.7 17H7l14.7-26h19.7c2.7 0 4.6-1.5 4.6-3.9 0-2.5-1.9-4.1-4.6-4.1H12V8Z"
          fill="url(#rz-shell)"
        />
        <path
          d="M29 22 18.4 39H29l-4.4 14L47 29H35.6L41 22H29Z"
          fill="url(#rz-core)"
        />
        <path
          d="M12 8h30.4C51 8 57 13.5 57 22c0 6.8-3.7 11.7-10.2 14.1"
          fill="none"
          stroke="rgba(255,255,255,.45)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {wordmark ? (
        <span className="min-w-0 leading-none">
          <span
            className={`block font-black uppercase tracking-[-0.055em] text-white ${
              compact ? "text-[1.05rem]" : "text-xl"
            }`}
          >
            Recharza
          </span>
          {!compact ? (
            <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.24em] text-violet-300">
              Play. Pay. Delivered.
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}
