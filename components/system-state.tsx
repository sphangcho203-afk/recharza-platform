import Link from "next/link";

export type SystemStateTone = "neutral" | "info" | "warning" | "danger";

const toneStyles: Record<SystemStateTone, string> = {
  neutral: "border-slate-200 bg-white text-slate-600",
  info: "border-cyan-200 bg-cyan-50 text-cyan-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
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
    <section className={`mx-auto w-full max-w-2xl rounded-2xl border p-6 shadow-xl shadow-slate-200/50 sm:p-8 ${toneStyles[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 text-sm font-medium leading-7 text-slate-500 sm:text-base">{description}</p>
      {actionHref || secondaryHref ? (
        <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row">
          {actionHref && actionLabel ? (
            <Link href={actionHref} className="min-h-12 rounded-xl bg-violet-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-violet-200 transition-all hover:bg-violet-700 hover:-translate-y-0.5">
              {actionLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="min-h-12 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-center text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:-translate-y-0.5">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
