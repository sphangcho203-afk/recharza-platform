type RecharzaMarkProps = {
  compact?: boolean;
};

export function RecharzaMark({ compact = false }: RecharzaMarkProps) {
  return (
    <div className="flex items-center gap-3" aria-label="Recharza">
      <svg
        aria-hidden="true"
        viewBox="0 0 48 48"
        className={`${compact ? "h-9 w-9" : "h-11 w-11"} shrink-0 drop-shadow-[0_0_18px_rgba(139,92,246,0.55)]`}
      >
        <defs>
          <linearGradient id="recharza-mark-gradient" x1="4" y1="4" x2="44" y2="44">
            <stop stopColor="#22d3ee" />
            <stop offset="0.42" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        <path
          d="M8 7h24c6.4 0 10.8 4 10.8 10 0 5-3 8.5-8.2 9.7L42 41h-9.6l-8.1-13.1H18L11.4 41H4l11.2-21.3H31c2.3 0 3.8-1.1 3.8-3 0-1.8-1.5-2.8-3.8-2.8H8V7Z"
          fill="url(#recharza-mark-gradient)"
        />
        <path d="m21 22-8 12h7l-3 8 13-15h-7l4-5h-6Z" fill="#fff" fillOpacity="0.95" />
      </svg>
      <span className="min-w-0">
        <span className={`block font-black tracking-[-0.04em] text-white ${compact ? "text-lg" : "text-xl"}`}>
          Recharza
        </span>
        {!compact ? (
          <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-violet-300">
            Multi-game top-up
          </span>
        ) : null}
      </span>
    </div>
  );
}
