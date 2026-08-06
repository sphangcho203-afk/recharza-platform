"use client";

import { useMemo, useRef, useState } from "react";

import {
  SupportChannelIcon,
  type SupportChannelIconName,
} from "@/components/support-channel-icon";
import {
  SUPPORT_CATEGORIES,
  type SupportCategory,
  type SupportReplyChannel,
} from "@/lib/support";
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

const channelTone: Record<
  PublicSupportChannel["id"],
  { icon: SupportChannelIconName; className: string }
> = {
  telegram: {
    icon: "telegram",
    className: "border-sky-300/20 bg-sky-300/[0.07] text-sky-200",
  },
  whatsapp: {
    icon: "whatsapp",
    className: "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200",
  },
  instagram: {
    icon: "instagram",
    className: "border-pink-300/20 bg-pink-300/[0.07] text-pink-200",
  },
  email: {
    icon: "email",
    className: "border-red-300/20 bg-red-300/[0.07] text-red-200",
  },
};

export function SupportCenter({
  channels,
}: {
  channels: PublicSupportChannel[];
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const selected = useMemo(
    () =>
      SUPPORT_CATEGORIES.find(
        (category) => category.value === selectedCategory,
      ) ?? null,
    [selectedCategory],
  );

  function chooseCategory(category: SupportCategory) {
    const categoryDetails = SUPPORT_CATEGORIES.find(
      (item) => item.value === category,
    );
    setSelectedCategory(category);
    setSuccess(null);
    setError(null);
    setForm((current) => ({
      ...current,
      category,
      subject:
        category === "OTHER" ? "" : categoryDetails?.label ?? current.subject,
    }));
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
        | {
            ok?: boolean;
            message?: string;
            ticket?: SuccessState;
          }
        | null;

      if (!response.ok || !payload?.ok || !payload.ticket) {
        throw new Error(
          payload?.message || "The support request could not be submitted.",
        );
      }

      setSuccess(payload.ticket);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "The support request could not be submitted.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="support-problems-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Support topics
            </p>
            <h2
              id="support-problems-title"
              className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl"
            >
              What went wrong?
            </h2>
          </div>
          <a
            href="#contact-channels"
            className="hidden text-xs font-black text-slate-400 transition hover:text-white sm:inline"
          >
            Direct contact
          </a>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {SUPPORT_CATEGORIES.map((category) => {
            const active = selectedCategory === category.value;
            return (
              <button
                key={category.value}
                type="button"
                onClick={() => chooseCategory(category.value)}
                aria-pressed={active}
                className={`min-h-20 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                  active
                    ? "border-cyan-300/35 bg-cyan-300/[0.09]"
                    : "border-white/[0.08] bg-[#090b12] hover:border-white/[0.16] hover:bg-white/[0.035]"
                }`}
              >
                <span className="block text-sm font-black leading-5 text-white">
                  {category.label}
                </span>
                <span className="mt-1.5 line-clamp-2 block text-[11px] leading-4 text-slate-500">
                  {category.description}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selected ? (
        <section
          ref={formRef}
          aria-labelledby="support-form-title"
          className="scroll-mt-32 rounded-3xl border border-white/[0.09] bg-[#090b12] p-4 sm:p-6"
        >
          {success ? (
            <div className="mx-auto max-w-xl py-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-emerald-300/25 bg-emerald-300/[0.09] text-xl font-black text-emerald-200">
                ✓
              </span>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-emerald-300">
                Request received
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Ticket {success.id}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Keep this ID for follow-up.
              </p>

              {success.telegramConnectUrl ? (
                <a
                  href={success.telegramConnectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#229ED9] px-5 text-sm font-black text-white"
                >
                  <SupportChannelIcon name="telegram" className="h-5 w-5" />
                  Connect Telegram bot
                </a>
              ) : null}

              {!success.persisted ? (
                <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.07] px-3 py-2 text-xs leading-5 text-amber-100">
                  Delivery was attempted, but persistent ticket storage is not deployed yet.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setSuccess(null);
                  setSelectedCategory(null);
                  setForm(initialForm);
                }}
                className="mt-5 block w-full text-xs font-black text-slate-500 hover:text-white"
              >
                Create another request
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="grid gap-5">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-300">
                    Selected issue
                  </p>
                  <h2
                    id="support-form-title"
                    className="mt-1 text-xl font-black text-white"
                  >
                    {selected.label}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-black text-slate-500 hover:text-white"
                >
                  Change
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Issue title" htmlFor="support-subject">
                  <input
                    id="support-subject"
                    value={form.subject}
                    onChange={(event) => update("subject", event.target.value)}
                    required
                    maxLength={120}
                    className={inputClassName}
                    placeholder="Short summary"
                  />
                </Field>

                <Field label="Order ID — optional" htmlFor="support-order-id">
                  <input
                    id="support-order-id"
                    value={form.orderId}
                    onChange={(event) => update("orderId", event.target.value)}
                    maxLength={32}
                    className={inputClassName}
                    placeholder="RZ-XXXXXXXXXXXX"
                    autoCapitalize="characters"
                  />
                </Field>

                <Field label="Game or product — optional" htmlFor="support-game">
                  <input
                    id="support-game"
                    value={form.game}
                    onChange={(event) => update("game", event.target.value)}
                    maxLength={80}
                    className={inputClassName}
                    placeholder="Mobile Legends"
                  />
                </Field>

                <Field label="Your name — optional" htmlFor="support-name">
                  <input
                    id="support-name"
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    maxLength={80}
                    className={inputClassName}
                    placeholder="Name"
                    autoComplete="name"
                  />
                </Field>
              </div>

              <Field label="Describe the problem" htmlFor="support-description">
                <textarea
                  id="support-description"
                  value={form.description}
                  onChange={(event) => update("description", event.target.value)}
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={6}
                  className={`${inputClassName} resize-y py-3`}
                  placeholder="Tell us what happened, what you expected, and any error shown."
                />
              </Field>

              <fieldset>
                <legend className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Where should we reply?
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["TELEGRAM", "EMAIL"] as const).map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => update("replyChannel", channel)}
                      aria-pressed={form.replyChannel === channel}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-black transition ${
                        form.replyChannel === channel
                          ? "border-violet-300/30 bg-violet-300/[0.1] text-white"
                          : "border-white/[0.08] text-slate-500 hover:text-white"
                      }`}
                    >
                      <SupportChannelIcon
                        name={channel === "TELEGRAM" ? "telegram" : "email"}
                        className="h-4 w-4"
                      />
                      {channel === "TELEGRAM" ? "Telegram" : "Email"}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    form.replyChannel === "EMAIL"
                      ? "Email address"
                      : "Email — optional backup"
                  }
                  htmlFor="support-email"
                >
                  <input
                    id="support-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    required={form.replyChannel === "EMAIL"}
                    maxLength={254}
                    className={inputClassName}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </Field>

                <Field
                  label="Telegram username — optional"
                  htmlFor="support-telegram"
                >
                  <input
                    id="support-telegram"
                    value={form.telegramUsername}
                    onChange={(event) =>
                      update("telegramUsername", event.target.value)
                    }
                    maxLength={33}
                    className={inputClassName}
                    placeholder="@username"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </Field>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300/20 bg-red-300/[0.07] px-3 py-2.5 text-sm text-red-100"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-slate-600">
                  Never include passwords, OTPs, UPI PINs, or card PINs.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 rounded-xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit support request"}
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      <section id="contact-channels" aria-labelledby="support-channels-title">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
          Direct contact
        </p>
        <h2
          id="support-channels-title"
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl"
        >
          Reach Recharza another way
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {channels.map((channel) => {
            const tone = channelTone[channel.id];
            const content = (
              <>
                <span
                  className={`grid h-10 w-10 place-items-center rounded-xl border ${tone.className}`}
                >
                  <SupportChannelIcon name={tone.icon} className="h-5 w-5" />
                </span>
                <span className="mt-3 block font-black text-white">
                  {channel.label}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  {channel.available ? channel.detail : "Not configured yet"}
                </span>
              </>
            );

            return channel.href && channel.available ? (
              <a
                key={channel.id}
                href={channel.href}
                target={channel.id === "email" ? undefined : "_blank"}
                rel={channel.id === "email" ? undefined : "noreferrer"}
                className="rounded-2xl border border-white/[0.08] bg-[#090b12] p-4 transition hover:border-white/[0.16] hover:bg-white/[0.035]"
              >
                {content}
              </a>
            ) : (
              <div
                key={channel.id}
                className="rounded-2xl border border-white/[0.06] bg-[#090b12] p-4 opacity-60"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const inputClassName =
  "min-h-11 w-full rounded-xl border border-white/[0.09] bg-[#05070d] px-3.5 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/10";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
