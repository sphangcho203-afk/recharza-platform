import Link from "next/link";

export type SystemStateTone = "neutral" | "info" | "warning" | "danger";

const toneStyles: Record<SystemStateTone, string> = {
  neutral: "border-white/10 bg-white/[0.03] text-slate-300",
  info: "border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-100",
  warning: "border-amber-300/20 bg-amber-300/[0.07] text-amber-100",
  danger: "border-rose-300/20 bg-rose-300/[0.07] text-rose-100",
};

export function SystemState({
  eyebrow,
  title,
  description,
  tone = "neutral",
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: SystemStateTone;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-2xl rounded-3xl border p-6 shadow-2xl shadow-black/20 sm:p-8 ${toneStyles[tone]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-75">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">{title}</h1>
      <p className="mt-4 text-sm leading-7 opacity-80 sm:text-base">{description}</p>
      {actionHref || secondaryHref ? (
        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
          {actionHref && actionLabel ? (
            <Link href={actionHref} className="min-h-12 rounded-xl bg-white px-5 py-3.5 text-center text-sm font-black text-slate-950 transition hover:bg-violet-200">
              {actionLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="min-h-12 rounded-xl border border-white/15 bg-black/15 px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.06]">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
