"use client";

import { useMemo, useRef, useState } from "react";

import { SupportChannelIcon, type SupportChannelIconName } from "@/components/support-channel-icon";
import { SUPPORT_CATEGORIES, type SupportCategory, type SupportReplyChannel } from "@/lib/support";
import type { PublicSupportChannel } from "@/lib/support-config";

type FormState = {
  category: SupportCategory;
  subject: string;
  description: string;
  orderId: string;
  game: string;
  replyChannel: SupportReplyChannel;
  name: string;
  email: string;
  telegramUsername: string;
};

type SuccessState = {
  id: string;
  persisted: boolean;
  replyChannel: string;
  telegramConnectUrl: string | null;
};

const initialForm: FormState = {
  category: "OTHER",
  subject: "",
  description: "",
  orderId: "",
  game: "",
  replyChannel: "TELEGRAM",
  name: "",
  email: "",
  telegramUsername: "",
};

const channelIcons: Record<PublicSupportChannel["id"], SupportChannelIconName> = {
  telegram: "telegram",
  whatsapp: "whatsapp",
  instagram: "instagram",
  email: "email",
};

const inputClassName =
  "min-h-12 w-full rounded-lg border border-white/[0.09] bg-[#080a10] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10";

export function SupportCenter({ channels }: { channels: PublicSupportChannel[] }) {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<SupportCategory | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const selected = useMemo(
    () => SUPPORT_CATEGORIES.find((category) => category.value === selectedCategory) ?? null,
    [selectedCategory],
  );

  function chooseCategory(category: SupportCategory) {
    const details = SUPPORT_CATEGORIES.find((item) => item.value === category);
    setSelectedCategory(category);
    setSuccess(null);
    setError(null);
    setForm((current) => ({
      ...current,
      category,
      subject: category === "OTHER" ? "" : details?.label ?? current.subject,
    }));
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string; ticket?: SuccessState }
        | null;
      if (!response.ok || !payload?.ok || !payload.ticket) {
        throw new Error(payload?.message || "The support request could not be submitted.");
      }
      setSuccess(payload.ticket);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Choose the issue</h2>
            <p className="mt-1.5 text-sm text-slate-500">We route the ticket to the right support workflow automatically.</p>
          </div>
          <div className="flex gap-2" aria-label="Direct support channels">
            {channels.map((channel) => {
              const icon = channelIcons[channel.id];
              const className = "grid h-10 w-10 place-items-center rounded-lg border border-white/[0.09] bg-[#0d0f16] text-slate-400 transition hover:border-white/[0.18] hover:text-white";
              return channel.href && channel.available ? (
                <a
                  key={channel.id}
                  href={channel.href}
                  target={channel.id === "email" ? undefined : "_blank"}
                  rel={channel.id === "email" ? undefined : "noreferrer"}
                  aria-label={channel.label}
                  title={channel.label}
                  className={className}
                >
                  <SupportChannelIcon name={icon} className="h-5 w-5" />
                </a>
              ) : (
                <span key={channel.id} aria-label={`${channel.label} unavailable`} title={channel.label} className={`${className} opacity-35`}>
                  <SupportChannelIcon name={icon} className="h-5 w-5" />
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {SUPPORT_CATEGORIES.map((category) => {
            const active = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => chooseCategory(category.value)}
                aria-pressed={active}
                className={`min-h-24 rounded-xl border p-3.5 text-left transition ${
                  active
                    ? "border-violet-400/45 bg-violet-500/10"
                    : "border-white/[0.08] bg-[#0d0f16] hover:border-white/[0.17] hover:bg-white/[0.035]"
                }`}
              >
                <span className="block text-sm font-black leading-5 text-white">{category.label}</span>
                <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-slate-500">{category.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selected ? (
        <section ref={formRef} className="scroll-mt-32 overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0b0d13]">
          {success ? (
            <div className="mx-auto max-w-xl px-5 py-10 text-center sm:px-8">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">✓</span>
              <h2 className="mt-4 text-2xl font-black text-white">Ticket {success.id}</h2>
              <p className="mt-2 text-sm text-slate-500">Your request is in the support queue. Keep the ticket ID for follow-up.</p>
              {success.telegramConnectUrl ? (
                <a href={success.telegramConnectUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#229ED9] px-5 text-sm font-black text-white">
                  <SupportChannelIcon name="telegram" className="h-5 w-5" />
                  Continue in Telegram
                </a>
              ) : null}
              {!success.persisted ? (
                <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-xs leading-5 text-amber-100">Ticket delivery was attempted, but persistent storage is not available on this deployment.</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setSelectedCategory(null);
                  setForm(initialForm);
                }}
                className="mt-6 block w-full text-xs font-black text-slate-500 hover:text-white"
              >
                Create another request
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">Selected issue</p>
                  <h2 className="mt-1 text-lg font-black text-white">{selected.label}</h2>
                </div>
                <button type="button" onClick={() => setSelectedCategory(null)} className="text-xs font-black text-slate-500 hover:text-white">Change</button>
              </div>

              <div className="grid gap-5 p-4 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Issue title" htmlFor="support-subject">
                    <input id="support-subject" required maxLength={120} value={form.subject} onChange={(event) => update("subject", event.target.value)} className={inputClassName} placeholder="Short summary" />
                  </Field>
                  <Field label="Order ID (optional)" htmlFor="support-order-id">
                    <input id="support-order-id" maxLength={32} value={form.orderId} onChange={(event) => update("orderId", event.target.value)} className={inputClassName} placeholder="RZ-XXXXXXXXXXXX" autoCapitalize="characters" />
                  </Field>
                  <Field label="Game or product (optional)" htmlFor="support-game">
                    <input id="support-game" maxLength={80} value={form.game} onChange={(event) => update("game", event.target.value)} className={inputClassName} placeholder="Mobile Legends" />
                  </Field>
                  <Field label="Your name (optional)" htmlFor="support-name">
                    <input id="support-name" maxLength={80} value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClassName} placeholder="Name" autoComplete="name" />
                  </Field>
                </div>

                <Field label="Describe the problem" htmlFor="support-description">
                  <textarea id="support-description" required minLength={20} maxLength={2000} rows={6} value={form.description} onChange={(event) => update("description", event.target.value)} className={`${inputClassName} resize-y py-3`} placeholder="Tell us what happened, what you expected, and any error shown." />
                </Field>

                <fieldset>
                  <legend className="text-xs font-black text-slate-400">Reply through</legend>
                  <div className="mt-2 flex gap-2">
                    {(["TELEGRAM", "EMAIL"] as const).map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => update("replyChannel", channel)}
                        aria-pressed={form.replyChannel === channel}
                        className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-black transition ${
                          form.replyChannel === channel
                            ? "border-violet-400/40 bg-violet-500/12 text-white"
                            : "border-white/[0.08] text-slate-500 hover:text-white"
                        }`}
                      >
                        <SupportChannelIcon name={channel === "TELEGRAM" ? "telegram" : "email"} className="h-4 w-4" />
                        {channel === "TELEGRAM" ? "Telegram" : "Email"}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <Field label={form.replyChannel === "EMAIL" ? "Email address" : "Email (optional backup)"} htmlFor="support-email">
                  <input id="support-email" type="email" required={form.replyChannel === "EMAIL"} maxLength={254} value={form.email} onChange={(event) => update("email", event.target.value)} className={inputClassName} placeholder="you@example.com" autoComplete="email" />
                </Field>

                {error ? <p role="alert" className="rounded-lg border border-red-300/20 bg-red-300/[0.07] px-3 py-2.5 text-sm text-red-100">{error}</p> : null}

                <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-slate-600">Never include passwords, OTPs, UPI PINs, card PINs or remote-access codes.</p>
                  <button type="submit" disabled={submitting} className="min-h-11 rounded-lg bg-violet-500 px-5 text-sm font-black text-white transition hover:bg-violet-400 disabled:cursor-wait disabled:opacity-60">
                    {submitting ? "Submitting…" : "Submit request"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="grid gap-2">
      <span className="text-xs font-black text-slate-400">{label}</span>
      {children}
    </label>
  );
}
