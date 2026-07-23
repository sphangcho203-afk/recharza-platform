"use client";

import { useMemo, useState } from "react";

import type {
  AdminStorefrontSnapshot,
  StorefrontBenefit,
  StorefrontContent,
  StorefrontPolicyKey,
  StorefrontStep,
} from "@/lib/storefront-content";

const TABS = [
  ["overview", "Overview"],
  ["hero", "Hero & announcement"],
  ["catalogue", "Sections & games"],
  ["navigation", "Navigation & footer"],
  ["policies", "Policy pages"],
  ["flags", "Private flags"],
  ["history", "Version history"],
] as const;

type TabId = (typeof TABS)[number][0];
type StorefrontAction = "save-draft" | "publish" | "restore-draft";

type ApiResponse = {
  ok: boolean;
  message?: string;
  snapshot?: AdminStorefrontSnapshot;
};

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }
  if (status === "REVIEW") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-white/10 bg-white/5 text-slate-400";
}

function announcementTone(tone: StorefrontContent["announcement"]["tone"]) {
  if (tone === "success") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }
  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
}

function deepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
      />
    </label>
  );
}

function ToggleButton({
  active,
  label,
  note,
  onClick,
  disabled = false,
}: {
  active: boolean;
  label: string;
  note: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-20 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-violet-300/30 bg-violet-300/10"
          : "border-white/8 bg-black/15 hover:border-white/15 hover:bg-white/[0.035]"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{label}</span>
        <span
          className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
            active
              ? "bg-violet-300/15 text-violet-100"
              : "bg-white/5 text-slate-600"
          }`}
        >
          {active ? "On" : "Off"}
        </span>
      </span>
      <span className="mt-2 block text-xs leading-5 text-slate-500">{note}</span>
    </button>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const copy = [...items];
  [copy[index], copy[destination]] = [copy[destination], copy[index]];
  return copy;
}

export function AdminStorefrontConsole({
  initialSnapshot,
}: {
  initialSnapshot: AdminStorefrontSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [draft, setDraft] = useState(initialSnapshot.draft);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState(
    "Draft and published storefront versions loaded.",
  );
  const [isError, setIsError] = useState(false);

  const hasUnsavedChanges = !deepEqual(draft, snapshot.draft);
  const hasUnpublishedChanges =
    snapshot.draftRevision !== snapshot.publishedRevision ||
    !deepEqual(snapshot.draft, snapshot.published);

  const visibleGames = useMemo(
    () =>
      snapshot.availableGames.filter(
        (game) => !draft.hiddenGameSlugs.includes(game.slug),
      ),
    [draft.hiddenGameSlugs, snapshot.availableGames],
  );

  const approvedPolicies = Object.values(draft.policies).filter(
    (policy) => policy.status === "APPROVED" && policy.visible,
  ).length;

  async function runAction(action: StorefrontAction) {
    if (reason.trim().length < 8) {
      setIsError(true);
      setMessage(
        "Add an audit reason of at least 8 characters before changing storefront content.",
      );
      return;
    }

    setActing(true);
    setIsError(false);
    setMessage(
      action === "publish"
        ? "Publishing the reviewed storefront draft..."
        : action === "restore-draft"
          ? "Restoring the draft from the published version..."
          : "Saving the storefront draft...",
    );

    try {
      const response = await fetch("/api/admin/storefront", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: reason.trim(),
          content: action === "save-draft" ? draft : undefined,
        }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "The storefront action was rejected.");
      }

      setSnapshot(result.snapshot);
      setDraft(result.snapshot.draft);
      setReason("");
      setMessage(
        action === "publish"
          ? `Published storefront revision ${result.snapshot.publishedRevision}.`
          : action === "restore-draft"
            ? `Draft restored as revision ${result.snapshot.draftRevision}.`
            : `Draft saved as revision ${result.snapshot.draftRevision}.`,
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "The storefront action could not be completed.",
      );
    } finally {
      setActing(false);
    }
  }

  async function refresh() {
    setActing(true);
    setIsError(false);
    setMessage("Refreshing storefront versions...");
    try {
      const response = await fetch("/api/admin/storefront", {
        cache: "no-store",
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Storefront versions could not be loaded.");
      }
      setSnapshot(result.snapshot);
      setDraft(result.snapshot.draft);
      setMessage("Storefront versions refreshed.");
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Storefront versions could not be refreshed.",
      );
    } finally {
      setActing(false);
    }
  }

  function updateHero(
    key: keyof StorefrontContent["hero"],
    value: string | boolean,
  ) {
    setDraft((current) => ({
      ...current,
      hero: { ...current.hero, [key]: value },
    }));
  }

  function updateAnnouncement(
    key: keyof StorefrontContent["announcement"],
    value: string | boolean,
  ) {
    setDraft((current) => ({
      ...current,
      announcement: { ...current.announcement, [key]: value },
    }));
  }

  function updateStep(index: number, patch: Partial<StorefrontStep>) {
    setDraft((current) => ({
      ...current,
      process: {
        ...current.process,
        steps: current.process.steps.map((step, itemIndex) =>
          itemIndex === index ? { ...step, ...patch } : step,
        ),
      },
    }));
  }

  function updateBenefit(index: number, patch: Partial<StorefrontBenefit>) {
    setDraft((current) => ({
      ...current,
      benefits: {
        ...current.benefits,
        items: current.benefits.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, ...patch } : item,
        ),
      },
    }));
  }

  function updatePolicy(
    key: StorefrontPolicyKey,
    patch: Partial<StorefrontContent["policies"][StorefrontPolicyKey]>,
  ) {
    setDraft((current) => ({
      ...current,
      policies: {
        ...current.policies,
        [key]: { ...current.policies[key], ...patch },
      },
    }));
  }

  function toggleNavigation(id: string) {
    setDraft((current) => {
      const exists = current.navigation.visibleIds.includes(id);
      return {
        ...current,
        navigation: {
          ...current.navigation,
          visibleIds: exists
            ? current.navigation.visibleIds.filter((item) => item !== id)
            : [...current.navigation.visibleIds, id],
        },
      };
    });
  }

  function toggleHiddenGame(slug: string) {
    setDraft((current) => {
      const hidden = current.hiddenGameSlugs.includes(slug);
      return {
        ...current,
        hiddenGameSlugs: hidden
          ? current.hiddenGameSlugs.filter((item) => item !== slug)
          : [...current.hiddenGameSlugs, slug],
      };
    });
  }

  function toggleFeaturedGame(slug: string) {
    setDraft((current) => {
      const featured = current.featuredGameSlugs.includes(slug);
      if (featured) {
        return {
          ...current,
          featuredGameSlugs: current.featuredGameSlugs.filter(
            (item) => item !== slug,
          ),
        };
      }
      if (current.featuredGameSlugs.length >= 3) return current;
      return {
        ...current,
        featuredGameSlugs: [...current.featuredGameSlugs, slug],
      };
    });
  }

  function renderOverview() {
    const firstFeatured = snapshot.availableGames.find(
      (game) => game.slug === draft.featuredGameSlugs[0],
    );

    return (
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <article className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.055] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">
              Draft preview
            </p>
            {draft.announcement.enabled ? (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 ${announcementTone(
                  draft.announcement.tone,
                )}`}
              >
                <p className="text-xs font-black">{draft.announcement.title}</p>
                <p className="mt-1 text-sm opacity-80">
                  {draft.announcement.message}
                </p>
              </div>
            ) : null}
            <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-emerald-200">
              {draft.hero.eyebrow}
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">
              {draft.hero.title}
              <span className="block text-violet-300">{draft.hero.accent}</span>
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              {draft.hero.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-950">
                {draft.hero.primaryCtaLabel}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black text-white">
                {draft.hero.secondaryCtaLabel}
              </span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Featured first
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {firstFeatured?.title ?? "No game selected"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Visible games
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {visibleGames.length}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[9px] uppercase tracking-wider text-slate-600">
                  Approved policies
                </p>
                <p className="mt-1 text-sm font-black text-white">
                  {approvedPolicies}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
            <h3 className="text-sm font-black text-white">Publication safety</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                ["Save draft", "Stores a sanitized private version."],
                ["Publish draft", "Makes the last saved draft customer-visible."],
                ["Restore draft", "Copies the published version into a new draft."],
                ["Version history", "Preserves who changed what and why."],
              ].map(([label, note]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/8 bg-white/[0.025] p-3"
                >
                  <p className="text-xs font-black text-white">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{note}</p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid content-start gap-4">
          <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
            <h3 className="text-sm font-black text-white">Section state</h3>
            <div className="mt-4 grid gap-2">
              {[
                ["Hero", draft.hero.enabled],
                ["Catalogue", draft.catalogue.enabled],
                ["Regional markets", draft.catalogue.showRegionalMarkets],
                ["How it works", draft.process.enabled],
                ["Benefits", draft.benefits.enabled],
                ["Footer", draft.footer.enabled],
              ].map(([label, enabled]) => (
                <div
                  key={String(label)}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5"
                >
                  <span className="text-xs font-bold text-slate-300">{label}</span>
                  <span
                    className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                      enabled
                        ? "bg-emerald-300/10 text-emerald-200"
                        : "bg-white/5 text-slate-600"
                    }`}
                  >
                    {enabled ? "Visible" : "Hidden"}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-300/70">
              Locked commerce switches
            </p>
            <div className="mt-4 grid gap-2">
              {[
                "Enable live payments",
                "Enable supplier writes",
                "Mark all games available",
                "Publish without audit reason",
              ].map((label) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/10 bg-black/15 px-3 text-left text-xs font-black text-rose-300/40"
                >
                  {label} · Locked
                </button>
              ))}
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderHero() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">Hero content</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Main storefront message and customer entry actions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateHero("enabled", !draft.hero.enabled)}
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                draft.hero.enabled
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : "border-white/10 bg-white/5 text-slate-500"
              }`}
            >
              {draft.hero.enabled ? "Visible" : "Hidden"}
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            <TextInput
              label="Eyebrow"
              value={draft.hero.eyebrow}
              onChange={(value) => updateHero("eyebrow", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Headline"
                value={draft.hero.title}
                onChange={(value) => updateHero("title", value)}
              />
              <TextInput
                label="Accent line"
                value={draft.hero.accent}
                onChange={(value) => updateHero("accent", value)}
              />
            </div>
            <TextArea
              label="Description"
              value={draft.hero.description}
              onChange={(value) => updateHero("description", value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Primary CTA label"
                value={draft.hero.primaryCtaLabel}
                onChange={(value) => updateHero("primaryCtaLabel", value)}
              />
              <TextInput
                label="Primary internal path"
                value={draft.hero.primaryCtaHref}
                onChange={(value) => updateHero("primaryCtaHref", value)}
              />
              <TextInput
                label="Secondary CTA label"
                value={draft.hero.secondaryCtaLabel}
                onChange={(value) => updateHero("secondaryCtaLabel", value)}
              />
              <TextInput
                label="Secondary internal path"
                value={draft.hero.secondaryCtaHref}
                onChange={(value) => updateHero("secondaryCtaHref", value)}
              />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white">Announcement bar</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Controlled notice above the hero. It cannot link outside Recharza.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateAnnouncement("enabled", !draft.announcement.enabled)
              }
              className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                draft.announcement.enabled
                  ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-white/5 text-slate-500"
              }`}
            >
              {draft.announcement.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="mt-5 grid gap-4">
            <label>
              <FieldLabel>Tone</FieldLabel>
              <select
                value={draft.announcement.tone}
                onChange={(event) =>
                  updateAnnouncement("tone", event.target.value)
                }
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white"
              >
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>
            </label>
            <TextInput
              label="Announcement title"
              value={draft.announcement.title}
              onChange={(value) => updateAnnouncement("title", value)}
            />
            <TextArea
              label="Announcement message"
              value={draft.announcement.message}
              onChange={(value) => updateAnnouncement("message", value)}
              rows={3}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Link label"
                value={draft.announcement.linkLabel}
                onChange={(value) => updateAnnouncement("linkLabel", value)}
              />
              <TextInput
                label="Internal path"
                value={draft.announcement.href}
                onChange={(value) => updateAnnouncement("href", value)}
              />
            </div>
            <div
              className={`rounded-xl border px-4 py-3 ${announcementTone(
                draft.announcement.tone,
              )}`}
            >
              <p className="text-xs font-black">{draft.announcement.title}</p>
              <p className="mt-1 text-sm opacity-80">
                {draft.announcement.message}
              </p>
            </div>
          </div>
        </article>
      </div>
    );
  }

  function renderCatalogue() {
    return (
      <div className="grid gap-5">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="grid gap-3">
              <ToggleButton
                active={draft.catalogue.enabled}
                label="Game catalogue"
                note="Show the searchable game grid on the homepage."
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    catalogue: {
                      ...current.catalogue,
                      enabled: !current.catalogue.enabled,
                    },
                  }))
                }
              />
              <ToggleButton
                active={draft.catalogue.showRegionalMarkets}
                label="Regional MLBB panel"
                note="Show the market selector inside the game catalogue."
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    catalogue: {
                      ...current.catalogue,
                      showRegionalMarkets:
                        !current.catalogue.showRegionalMarkets,
                    },
                  }))
                }
              />
              <ToggleButton
                active={draft.process.enabled}
                label="How it works"
                note="Show the editable customer process cards."
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    process: {
                      ...current.process,
                      enabled: !current.process.enabled,
                    },
                  }))
                }
              />
              <ToggleButton
                active={draft.benefits.enabled}
                label="Customer benefits"
                note="Show the editable trust and benefit cards."
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    benefits: {
                      ...current.benefits,
                      enabled: !current.benefits.enabled,
                    },
                  }))
                }
              />
            </div>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Catalogue eyebrow"
                  value={draft.catalogue.eyebrow}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      catalogue: { ...current.catalogue, eyebrow: value },
                    }))
                  }
                />
                <TextInput
                  label="Catalogue title"
                  value={draft.catalogue.title}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      catalogue: { ...current.catalogue, title: value },
                    }))
                  }
                />
              </div>
              <TextArea
                label="Catalogue description"
                value={draft.catalogue.description}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    catalogue: { ...current.catalogue, description: value },
                  }))
                }
              />
              <TextInput
                label="Process section eyebrow"
                value={draft.process.eyebrow}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    process: { ...current.process, eyebrow: value },
                  }))
                }
              />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-white">Game presentation controls</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Hide catalogue cards or choose up to three homepage feature tiles. This never enables checkout.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {draft.featuredGameSlugs.length}/3 featured
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {snapshot.availableGames.map((game) => {
              const hidden = draft.hiddenGameSlugs.includes(game.slug);
              const featureIndex = draft.featuredGameSlugs.indexOf(game.slug);
              const featured = featureIndex >= 0;
              return (
                <div
                  key={game.slug}
                  className={`rounded-xl border p-4 ${
                    hidden
                      ? "border-rose-300/15 bg-rose-300/[0.035]"
                      : featured
                        ? "border-violet-300/25 bg-violet-300/[0.07]"
                        : "border-white/8 bg-white/[0.025]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        {game.title}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-600">
                        {game.status} · {game.available ? "entry enabled" : "catalogue only"}
                      </p>
                    </div>
                    {featured ? (
                      <span className="rounded-full bg-violet-300/15 px-2 py-1 text-[9px] font-black text-violet-100">
                        #{featureIndex + 1}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => toggleHiddenGame(game.slug)}
                      className={`min-h-10 rounded-lg border px-2 text-xs font-black ${
                        hidden
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                          : "border-rose-300/15 bg-rose-300/[0.06] text-rose-200"
                      }`}
                    >
                      {hidden ? "Show game" : "Hide game"}
                    </button>
                    <button
                      type="button"
                      disabled={!featured && draft.featuredGameSlugs.length >= 3}
                      onClick={() => toggleFeaturedGame(game.slug)}
                      className="min-h-10 rounded-lg border border-violet-300/20 bg-violet-300/10 px-2 text-xs font-black text-violet-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {featured ? "Unfeature" : "Feature"}
                    </button>
                  </div>
                  {featured ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={featureIndex === 0}
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            featuredGameSlugs: moveItem(
                              current.featuredGameSlugs,
                              featureIndex,
                              -1,
                            ),
                          }))
                        }
                        className="min-h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-25"
                      >
                        Move up
                      </button>
                      <button
                        type="button"
                        disabled={
                          featureIndex === draft.featuredGameSlugs.length - 1
                        }
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            featuredGameSlugs: moveItem(
                              current.featuredGameSlugs,
                              featureIndex,
                              1,
                            ),
                          }))
                        }
                        className="min-h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-25"
                      >
                        Move down
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">How it works cards</h3>
              <p className="mt-1 text-xs text-slate-500">Up to four customer steps.</p>
            </div>
            <button
              type="button"
              disabled={draft.process.steps.length >= 4}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  process: {
                    ...current.process,
                    steps: [
                      ...current.process.steps,
                      {
                        number: String(current.process.steps.length + 1).padStart(
                          2,
                          "0",
                        ),
                        title: "New customer step",
                        description: "Explain what the customer does here.",
                      },
                    ],
                  },
                }))
              }
              className="min-h-10 rounded-xl border border-violet-300/20 bg-violet-300/10 px-3 text-xs font-black text-violet-100 disabled:opacity-30"
            >
              Add step
            </button>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {draft.process.steps.map((step, index) => (
              <div
                key={`${index}-${step.number}`}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <TextInput
                    label="Number"
                    value={step.number}
                    onChange={(value) => updateStep(index, { number: value })}
                  />
                  <TextInput
                    label="Title"
                    value={step.title}
                    onChange={(value) => updateStep(index, { title: value })}
                  />
                </div>
                <div className="mt-3">
                  <TextArea
                    label="Description"
                    value={step.description}
                    onChange={(value) =>
                      updateStep(index, { description: value })
                    }
                    rows={3}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: moveItem(current.process.steps, index, -1),
                        },
                      }))
                    }
                    className="min-h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-25"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    disabled={index === draft.process.steps.length - 1}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: moveItem(current.process.steps, index, 1),
                        },
                      }))
                    }
                    className="min-h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-25"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    disabled={draft.process.steps.length <= 1}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: current.process.steps.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        },
                      }))
                    }
                    className="min-h-9 rounded-lg border border-rose-300/15 bg-rose-300/[0.06] text-xs font-bold text-rose-200 disabled:opacity-25"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-white">Customer benefit cards</h3>
              <p className="mt-1 text-xs text-slate-500">Up to six trust points.</p>
            </div>
            <button
              type="button"
              disabled={draft.benefits.items.length >= 6}
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  benefits: {
                    ...current.benefits,
                    items: [
                      ...current.benefits.items,
                      {
                        title: "New customer benefit",
                        description: "Explain the benefit without unsupported claims.",
                      },
                    ],
                  },
                }))
              }
              className="min-h-10 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-3 text-xs font-black text-cyan-100 disabled:opacity-30"
            >
              Add benefit
            </button>
          </div>
          <div className="mt-5 grid gap-3 xl:grid-cols-2">
            {draft.benefits.items.map((item, index) => (
              <div
                key={`${index}-${item.title}`}
                className="rounded-xl border border-white/8 bg-white/[0.025] p-4"
              >
                <TextInput
                  label="Title"
                  value={item.title}
                  onChange={(value) => updateBenefit(index, { title: value })}
                />
                <div className="mt-3">
                  <TextArea
                    label="Description"
                    value={item.description}
                    onChange={(value) =>
                      updateBenefit(index, { description: value })
                    }
                    rows={3}
                  />
                </div>
                <button
                  type="button"
                  disabled={draft.benefits.items.length <= 1}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      benefits: {
                        ...current.benefits,
                        items: current.benefits.items.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      },
                    }))
                  }
                  className="mt-3 min-h-9 rounded-lg border border-rose-300/15 bg-rose-300/[0.06] px-3 text-xs font-bold text-rose-200 disabled:opacity-25"
                >
                  Remove benefit
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderNavigation() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <h3 className="text-lg font-black text-white">Customer navigation</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Choose which registered customer links appear in desktop and mobile navigation.
          </p>
          <div className="mt-5 grid gap-2">
            {snapshot.navigationOptions.map((item) => (
              <ToggleButton
                key={item.id}
                active={draft.navigation.visibleIds.includes(item.id)}
                label={`${item.label} · ${item.state}`}
                note={item.description}
                onClick={() => toggleNavigation(item.id)}
              />
            ))}
          </div>
        </article>

        <div className="grid content-start gap-5">
          <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Header action</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Main customer action displayed in the header.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    navigation: {
                      ...current.navigation,
                      ctaEnabled: !current.navigation.ctaEnabled,
                    },
                  }))
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                  draft.navigation.ctaEnabled
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {draft.navigation.ctaEnabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextInput
                label="CTA label"
                value={draft.navigation.ctaLabel}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    navigation: { ...current.navigation, ctaLabel: value },
                  }))
                }
              />
              <TextInput
                label="Internal path"
                value={draft.navigation.ctaHref}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    navigation: { ...current.navigation, ctaHref: value },
                  }))
                }
              />
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Storefront footer</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Copyright and approved policy links.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    footer: { ...current.footer, enabled: !current.footer.enabled },
                  }))
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-black ${
                  draft.footer.enabled
                    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {draft.footer.enabled ? "Visible" : "Hidden"}
              </button>
            </div>
            <div className="mt-5">
              <TextArea
                label="Copyright line"
                value={draft.footer.copyright}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    footer: { ...current.footer, copyright: value },
                  }))
                }
                rows={3}
              />
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderPolicies() {
    const labels: Record<StorefrontPolicyKey, string> = {
      terms: "Terms",
      privacy: "Privacy",
      refunds: "Refunds",
      cookies: "Cookies",
    };

    return (
      <div className="grid gap-5 xl:grid-cols-2">
        {(Object.keys(draft.policies) as StorefrontPolicyKey[]).map((key) => {
          const policy = draft.policies[key];
          return (
            <article
              key={key}
              className="rounded-2xl border border-white/10 bg-black/15 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-violet-300">
                    {labels[key]} policy
                  </p>
                  <h3 className="mt-1 text-lg font-black text-white">
                    {policy.title}
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-black ${statusTone(
                    policy.status,
                  )}`}
                >
                  {policy.status}
                </span>
              </div>
              <div className="mt-5 grid gap-4">
                <TextInput
                  label="Page title"
                  value={policy.title}
                  onChange={(value) => updatePolicy(key, { title: value })}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <FieldLabel>Review state</FieldLabel>
                    <select
                      value={policy.status}
                      onChange={(event) =>
                        updatePolicy(key, {
                          status: event.target.value as typeof policy.status,
                        })
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Review</option>
                      <option value="APPROVED">Approved</option>
                    </select>
                  </label>
                  <ToggleButton
                    active={policy.visible}
                    label="Public visibility"
                    note="The page renders only when visible, approved, and non-empty."
                    onClick={() =>
                      updatePolicy(key, { visible: !policy.visible })
                    }
                  />
                </div>
                <TextArea
                  label="Policy body"
                  value={policy.body}
                  onChange={(value) => updatePolicy(key, { body: value })}
                  rows={12}
                  placeholder="Write reviewed policy text here. Blank drafts are never public."
                />
                <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3 text-xs leading-5 text-slate-500">
                  Public path: <span className="font-mono text-slate-300">/policies/{key}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderFlags() {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <h3 className="text-lg font-black text-white">Private presentation flags</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            These flags change server-rendered presentation only. They never unlock checkout, payments, or supplier writes.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ToggleButton
              active={draft.privateFlags.showDevelopmentBadges}
              label="Development badges"
              note="Show beta, staged, and coming-soon labels on game cards."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  privateFlags: {
                    ...current.privateFlags,
                    showDevelopmentBadges:
                      !current.privateFlags.showDevelopmentBadges,
                  },
                }))
              }
            />
            <ToggleButton
              active={draft.privateFlags.showPricingSnapshots}
              label="Pricing snapshots"
              note="Show approved starting-price labels where the catalogue has them."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  privateFlags: {
                    ...current.privateFlags,
                    showPricingSnapshots:
                      !current.privateFlags.showPricingSnapshots,
                  },
                }))
              }
            />
            <ToggleButton
              active={draft.privateFlags.showPolicyLinks}
              label="Approved policy links"
              note="Show only visible, approved, non-empty policy pages in the footer."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  privateFlags: {
                    ...current.privateFlags,
                    showPolicyLinks: !current.privateFlags.showPolicyLinks,
                  },
                }))
              }
            />
          </div>
        </article>

        <article className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-5">
          <h3 className="text-lg font-black text-rose-100">Protected operational flags</h3>
          <p className="mt-1 text-xs leading-5 text-rose-200/55">
            These require separate persistence, authorization, recovery, and approval systems. They are shown here so nobody invents them through a generic content flag.
          </p>
          <div className="mt-5 grid gap-2">
            {[
              "Live payment mode",
              "Supplier order writes",
              "Manual paid override",
              "Automatic refunds",
              "Public deployment",
              "Emergency maintenance lock",
            ].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/10 bg-black/15 px-3 text-left text-xs font-black text-rose-300/40"
              >
                {label} · Separate locked control
              </button>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderHistory() {
    return (
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-black/15">
        <div className="border-b border-white/10 p-5">
          <h3 className="text-lg font-black text-white">Storefront version ledger</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Append-only draft and publication evidence. Newer records appear first.
          </p>
        </div>
        <div className="divide-y divide-white/8">
          {snapshot.history.length ? (
            snapshot.history.map((item, index) => (
              <div
                key={`${item.createdAt}-${index}`}
                className="grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start"
              >
                <span
                  className={`w-fit rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${
                    item.action === "published"
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                      : item.action === "draft-restored"
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : "border-violet-300/20 bg-violet-300/10 text-violet-100"
                  }`}
                >
                  {item.action.replaceAll("-", " ")}
                </span>
                <div>
                  <p className="text-sm font-black text-white">
                    Revision {item.revision}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {item.reason}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.actorEmail ?? "Unknown administrator"}
                  </p>
                </div>
                <time className="text-xs text-slate-600">
                  {formatDate(item.createdAt)}
                </time>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              No storefront versions have been saved yet. Defaults remain active.
            </p>
          )}
        </div>
      </article>
    );
  }

  return (
    <section id="content" className="mt-10 scroll-mt-24">
      <div className="overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">
                Website presentation authority
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                Content &amp; Storefront Command Center
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Control customer-facing copy, announcements, sections, featured games, navigation, policies, and safe presentation flags through versioned drafts and explicit publication.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["Draft", snapshot.draftRevision],
                ["Published", snapshot.publishedRevision],
                ["Visible games", visibleGames.length],
                ["Policies", approvedPolicies],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center"
                >
                  <p className="text-lg font-black text-white">{value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <label>
              <FieldLabel>Required audit reason</FieldLabel>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this storefront version is changing"
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-400/50"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={acting}
                className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white disabled:opacity-40"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => void runAction("restore-draft")}
                disabled={acting}
                className="min-h-11 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 text-xs font-black text-amber-100 disabled:opacity-40"
              >
                Restore published
              </button>
              <button
                type="button"
                onClick={() => void runAction("save-draft")}
                disabled={acting || !hasUnsavedChanges}
                className="min-h-11 rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 text-xs font-black text-violet-100 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => void runAction("publish")}
                disabled={acting || hasUnsavedChanges || !hasUnpublishedChanges}
                className="min-h-11 rounded-xl bg-white px-4 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Publish saved draft
              </button>
            </div>
          </div>

          <p
            aria-live="polite"
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              isError
                ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                : "border-white/10 bg-black/20 text-slate-400"
            }`}
          >
            {message}
            {hasUnsavedChanges ? " Unsaved editor changes are present." : ""}
          </p>
        </div>

        <div className="border-b border-white/10 px-3 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-black transition ${
                  activeTab === id
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/[0.035] text-slate-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === "overview" ? renderOverview() : null}
          {activeTab === "hero" ? renderHero() : null}
          {activeTab === "catalogue" ? renderCatalogue() : null}
          {activeTab === "navigation" ? renderNavigation() : null}
          {activeTab === "policies" ? renderPolicies() : null}
          {activeTab === "flags" ? renderFlags() : null}
          {activeTab === "history" ? renderHistory() : null}
        </div>
      </div>
    </section>
  );
}
