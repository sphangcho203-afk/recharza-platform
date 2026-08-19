import type { Game } from "@/lib/games";

export function GameEducationSection({
  game,
}: {
  game: Game;
}) {
  if (!game.education) return null;
  const { about, currencyUses, findId, steps, regionNote } = game.education;

  return (
    <section className="mt-10" aria-label={`About ${game.title}`}>
      <div className="rounded-lg border border-white/[0.08] bg-[#0d0f16] p-5 sm:p-6">
        <h2 className="text-[15px] font-semibold text-white">
          About {game.title}
        </h2>
        <p className="mt-2 text-[13px] leading-[1.7] text-white/70">{about}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              What the currency is used for
            </h3>
            <p className="mt-1.5 text-[13px] leading-[1.7] text-white/70">
              {currencyUses}
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              How to find your ID
            </h3>
            <p className="mt-1.5 text-[13px] leading-[1.7] text-white/70">
              {findId}
            </p>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/50">
              How to purchase
            </h3>
            <ol className="mt-1.5 space-y-1.5">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-2 text-[13px] leading-[1.6] text-white/70">
                  <span
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-black"
                    style={{ backgroundColor: game.accent }}
                  >
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {regionNote ? (
          <div className="mt-5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] leading-[1.6] text-white/70">
            {regionNote}
          </div>
        ) : null}
      </div>
    </section>
  );
}
