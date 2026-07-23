import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ResilientImage } from "@/components/resilient-image";
import { SiteHeader } from "@/components/site-header";
import { getGameCheckoutDefinition } from "@/lib/commerce/game-checkout";
import { mainGames } from "@/lib/games";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}): Promise<Metadata> {
  const { gameSlug } = await params;
  const definition = getGameCheckoutDefinition(gameSlug);
  return definition
    ? {
        title: `${definition.title} Checkout`,
        description: definition.readinessNote,
      }
    : { title: "Game checkout" };
}

export default async function GameCheckoutPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = await params;
  const definition = getGameCheckoutDefinition(gameSlug);
  const game = mainGames.find((item) => item.slug === gameSlug);
  if (!definition || !game || gameSlug === "mobile-legends") notFound();

  const lifecycleLabel =
    definition.lifecycle === "beta"
      ? "Architecture beta"
      : definition.lifecycle === "live"
        ? "Checkout live"
        : "Planned checkout";

  return (
    <main className="min-h-screen bg-[#06060f] pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-9rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-violet-600/16 blur-[120px]" />
          <div className="absolute right-[-7rem] top-0 h-[25rem] w-[25rem] rounded-full bg-cyan-500/10 blur-[120px]" />
          <div className="hero-grid absolute inset-0 opacity-20" />
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1fr_20rem] lg:items-center lg:px-8">
          <div>
            <Link href="/#games" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
              ← Back to games
            </Link>
            <div className="mt-7 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.15em] text-violet-100">
              {lifecycleLabel}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
              {definition.title} checkout contract.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              {definition.readinessNote}
            </p>
          </div>

          <div className="aspect-square overflow-hidden rounded-3xl border border-white/10 bg-[#10101a] shadow-2xl shadow-black/30">
            <ResilientImage
              sources={game.artworkSources}
              alt={game.artworkAlt}
              fallbackLabel={game.title.slice(0, 2).toUpperCase()}
              loading="eager"
              className="h-full w-full object-cover"
              fallbackClassName="h-full w-full"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-9 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-12">
        <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Identity contract</p>
          <h2 className="mt-2 text-2xl font-black">Required player fields</h2>
          <div className="mt-5 grid gap-3">
            {definition.fields.length ? (
              definition.fields.map((field) => (
                <div key={field.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{field.label}</strong>
                    <span className="text-xs font-bold text-slate-500">{field.required ? "Required" : "Optional"}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{field.help}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                This product uses voucher delivery, so account fields remain disabled until regional delivery rules are approved.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Catalogue contract</p>
          <h2 className="mt-2 text-2xl font-black">Planned package families</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {definition.packageFamilies.map((family) => (
              <span key={family} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-200">
                {family}
              </span>
            ))}
          </div>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-slate-500">Checkout mode</dt>
              <dd className="font-bold text-slate-200">{definition.checkoutMode}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-slate-500">Market required</dt>
              <dd className="font-bold text-slate-200">{definition.marketRequired ? "Yes" : "No"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/10 pt-3">
              <dt className="text-slate-500">Order API</dt>
              <dd className={definition.orderApiEnabled ? "font-bold text-emerald-200" : "font-bold text-amber-100"}>
                {definition.orderApiEnabled ? "Enabled" : "Locked"}
              </dd>
            </div>
          </dl>
          {!definition.orderApiEnabled ? (
            <p className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
              Orders cannot be submitted yet. This page exposes the real architecture state instead of presenting a decorative button that does nothing.
            </p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
