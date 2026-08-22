"use client";

import { useMemo, useRef, useState } from "react";

import { StorefrontIcon } from "@/components/storefront-icon";
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
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 shadow-inner";

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
        <div className="border-b border-slate-200 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Choose your route</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">What do you need help with?</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 font-medium">Pick an issue to create a trackable request, or contact the channel that works best for you.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Direct support channels">
          {channels.map((channel) => {
            const icon = channelIcons[channel.id];
            const available = Boolean(channel.href && channel.available);
            const content = (
              <>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 shadow-sm">
                  <SupportChannelIcon name={icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm font-bold text-slate-900 leading-tight">{channel.label}</strong>
                  <span className="mt-0.5 block text-[10px] text-slate-400 font-medium">{available ? "Open direct channel" : "Currently unavailable"}</span>
                </span>
                {available ? <StorefrontIcon name="arrow" className="recharza-nav-arrow h-4 w-4 shrink-0 text-slate-400 group-hover:text-slate-900" /> : null}
              </>
            );
            return available ? (
              <a
                key={channel.id}
                href={channel.href ?? undefined}
                target={channel.id === "email" ? undefined : "_blank"}
                rel={channel.id === "email" ? undefined : "noreferrer"}
                className="group flex min-h-[4rem] items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-600/50 hover:bg-violet-50"
              >
                {content}
              </a>
            ) : (
              <div key={channel.id} aria-disabled="true" className="flex min-h-[4rem] items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 opacity-50">
                {content}
              </div>
            );
          })}
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
                className={`min-h-24 rounded-xl border p-3.5 text-left transition-all duration-300 shadow-sm ${
                  active
                    ? "border-violet-600 bg-violet-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="block text-sm font-bold leading-5 text-slate-900">{category.label}</span>
                <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-slate-500 font-medium">{category.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      {selected ? (
        <section ref={formRef} className="scroll-mt-32 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          {success ? (
            <div className="mx-auto max-w-xl px-5 py-10 text-center sm:px-8">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100"><StorefrontIcon name="check" className="h-6 w-6" /></span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">Ticket {success.id}</h2>
              <p className="mt-2 text-sm text-slate-500 font-medium">Your request is in the support queue. Keep the ticket ID for follow-up.</p>
              {success.telegramConnectUrl ? (
                <a href={success.telegramConnectUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#229ED9] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#1e8dbf] hover:-translate-y-0.5">
                  <SupportChannelIcon name="telegram" className="h-5 w-5" />
                  Continue in Telegram
                </a>
              ) : null}
              {!success.persisted ? (
                <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700 font-medium">Ticket delivery was attempted, but persistent storage is not available on this deployment.</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setSelectedCategory(null);
                  setForm(initialForm);
                }}
                className="mt-6 block w-full text-xs font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Create another request
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6 bg-slate-50/50">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Selected issue</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">{selected.label}</h2>
                </div>
                <button type="button" onClick={() => setSelectedCategory(null)} className="text-xs font-bold text-slate-500 hover:text-slate-700 transition">Change</button>
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
                  <legend className="text-xs font-bold text-slate-500">Reply through</legend>
                  <div className="mt-2 flex gap-2">
                    {(["TELEGRAM", "EMAIL"] as const).map((channel) => (
                      <button
                        key={channel}
                        type="button"
                        onClick={() => update("replyChannel", channel)}
                        aria-pressed={form.replyChannel === channel}
                        className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition-all duration-300 shadow-sm ${
                          form.replyChannel === channel
                            ? "border-violet-600 bg-violet-50 text-violet-700 shadow-inner"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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

                {error ? <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-600 font-bold shadow-sm">{error}</p> : null}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] leading-5 text-slate-400 font-medium">Never include passwords, OTPs, UPI PINs, card PINs or remote-access codes.</p>
                  <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-violet-600 px-6 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-violet-700 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
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
      <span className="text-xs font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}
