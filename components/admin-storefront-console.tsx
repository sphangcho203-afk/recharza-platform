"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type {
  AdminStorefrontSnapshot,
  StorefrontContent,
  StorefrontPolicyKey,
} from "@/lib/storefront-content";

type EditorTab =
  | "overview"
  | "hero"
  | "sections"
  | "games"
  | "navigation"
  | "policies"
  | "flags"
  | "history";

type ApiResponse = {
  ok: boolean;
  message?: string;
  snapshot?: AdminStorefrontSnapshot;
};

const TABS: Array<{ id: EditorTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "hero", label: "Hero & notice" },
  { id: "sections", label: "Sections" },
  { id: "games", label: "Games" },
  { id: "navigation", label: "Navigation" },
  { id: "policies", label: "Policies" },
  { id: "flags", label: "Flags" },
  { id: "history", label: "History" },
];

const POLICY_KEYS: StorefrontPolicyKey[] = [
  "terms",
  "privacy",
  "refunds",
  "cookies",
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function deepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 4,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block min-w-0">
      <Label>{label}</Label>
      {multiline ? (
        <textarea
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-400/50"
        />
      ) : (
        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-400/50"
        />
      )}
    </label>
  );
}

function Toggle({
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
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-20 rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "border-fuchsia-300/25 bg-fuchsia-300/[0.08]"
          : "border-white/8 bg-black/15 hover:border-white/15 hover:bg-white/[0.035]"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-black text-white">{label}</span>
        <span
          className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${
            active
              ? "bg-fuchsia-300/15 text-fuchsia-100"
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>
    </div>
  );
}

function policyTone(status: string) {
  if (status === "APPROVED") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  }
  if (status === "REVIEW") {
    return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  }
  return "border-white/10 bg-white/5 text-slate-400";
}

export function AdminStorefrontConsole({
  initialSnapshot,
}: {
  initialSnapshot: AdminStorefrontSnapshot;
}) {
  const [snapshot, setSnapshot] = useState<AdminStorefrontSnapshot>(initialSnapshot);
  const [draft, setDraft] = useState<StorefrontContent>(initialSnapshot.draft);
  const [tab, setTab] = useState<EditorTab>("overview");
  const [reason, setReason] = useState("");
  const [acting, setActing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    "Draft and published storefront versions loaded.",
  );

  const unsaved = !deepEqual(draft, snapshot.draft);
  const unpublished =
    snapshot.draftRevision !== snapshot.publishedRevision ||
    !deepEqual(snapshot.draft, snapshot.published);
  const visibleGames = useMemo(
    () =>
      snapshot.availableGames.filter(
        (game) => !draft.hiddenGameSlugs.includes(game.slug),
      ),
    [draft.hiddenGameSlugs, snapshot.availableGames],
  );
  const approvedPolicies = POLICY_KEYS.filter((key) => {
    const policy = draft.policies[key];
    return policy.status === "APPROVED" && policy.visible && Boolean(policy.body.trim());
  }).length;

  function setHero<K extends keyof StorefrontContent["hero"]>(
    key: K,
    value: StorefrontContent["hero"][K],
  ) {
    setDraft((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [key]: value,
      } as StorefrontContent["hero"],
    }));
  }

  function setAnnouncement<K extends keyof StorefrontContent["announcement"]>(
    key: K,
    value: StorefrontContent["announcement"][K],
  ) {
    setDraft((current) => ({
      ...current,
      announcement: {
        ...current.announcement,
        [key]: value,
      } as StorefrontContent["announcement"],
    }));
  }

  function setPolicy(
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

  function toggleGameHidden(slug: string) {
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

  function toggleFeatured(slug: string) {
    setDraft((current) => {
      const selected = current.featuredGameSlugs.includes(slug);
      if (selected) {
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

  function moveFeatured(slug: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.featuredGameSlugs.indexOf(slug);
      const destination = index + direction;
      if (
        index < 0 ||
        destination < 0 ||
        destination >= current.featuredGameSlugs.length
      ) {
        return current;
      }
      const next = [...current.featuredGameSlugs];
      const temporary = next[index];
      next[index] = next[destination];
      next[destination] = temporary;
      return { ...current, featuredGameSlugs: next };
    });
  }

  function toggleNavigation(id: string) {
    setDraft((current) => {
      const shown = current.navigation.visibleIds.includes(id);
      return {
        ...current,
        navigation: {
          ...current.navigation,
          visibleIds: shown
            ? current.navigation.visibleIds.filter((item) => item !== id)
            : [...current.navigation.visibleIds, id],
        },
      };
    });
  }

  async function applyAction(
    action: "save-draft" | "publish" | "restore-draft",
  ) {
    if (reason.trim().length < 8) {
      setIsError(true);
      setMessage("Add an audit reason of at least 8 characters first.");
      return;
    }

    setActing(true);
    setIsError(false);
    setMessage(`${action.replaceAll("-", " ")} in progress...`);
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
          ? `Published revision ${result.snapshot.publishedRevision}.`
          : `Draft is now revision ${result.snapshot.draftRevision}.`,
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
      const response = await fetch("/api/admin/storefront", { cache: "no-store" });
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
        error instanceof Error ? error.message : "Refresh failed.",
      );
    } finally {
      setActing(false);
    }
  }

  function renderOverview() {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.055] p-5">
          {draft.announcement.enabled ? (
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-cyan-100">
              <p className="text-xs font-black">{draft.announcement.title}</p>
              <p className="mt-1 text-sm opacity-80">{draft.announcement.message}</p>
            </div>
          ) : null}
          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-200">
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
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Visible games" value={visibleGames.length} />
            <Metric label="Featured" value={draft.featuredGameSlugs.length} />
            <Metric label="Policies" value={approvedPolicies} />
            <Metric label="Nav links" value={draft.navigation.visibleIds.length} />
          </div>
        </article>

        <article className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.035] p-5">
          <h3 className="text-lg font-black text-rose-100">Locked operational authority</h3>
          <p className="mt-2 text-xs leading-5 text-rose-200/55">
            Content controls never become a back door into commerce or deployment.
          </p>
          <div className="mt-4 grid gap-2">
            {[
              "Live payment mode",
              "Supplier writes",
              "Manual paid override",
              "Automatic refunds",
              "Public deployment",
              "Emergency checkout lock",
            ].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/10 bg-black/15 px-3 text-left text-xs font-black text-rose-300/40"
              >
                {item} · Locked
              </button>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderHero() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <Toggle
            active={draft.hero.enabled}
            label="Homepage hero"
            note="Show the primary storefront introduction."
            onClick={() => setHero("enabled", !draft.hero.enabled)}
          />
          <div className="mt-4 grid gap-4">
            <TextField label="Eyebrow" value={draft.hero.eyebrow} onChange={(value) => setHero("eyebrow", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Headline" value={draft.hero.title} onChange={(value) => setHero("title", value)} />
              <TextField label="Accent line" value={draft.hero.accent} onChange={(value) => setHero("accent", value)} />
            </div>
            <TextField multiline label="Description" value={draft.hero.description} onChange={(value) => setHero("description", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Primary label" value={draft.hero.primaryCtaLabel} onChange={(value) => setHero("primaryCtaLabel", value)} />
              <TextField label="Primary internal path" value={draft.hero.primaryCtaHref} onChange={(value) => setHero("primaryCtaHref", value)} />
              <TextField label="Secondary label" value={draft.hero.secondaryCtaLabel} onChange={(value) => setHero("secondaryCtaLabel", value)} />
              <TextField label="Secondary internal path" value={draft.hero.secondaryCtaHref} onChange={(value) => setHero("secondaryCtaHref", value)} />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <Toggle
            active={draft.announcement.enabled}
            label="Announcement bar"
            note="Show a controlled notice above the hero."
            onClick={() => setAnnouncement("enabled", !draft.announcement.enabled)}
          />
          <div className="mt-4 grid gap-4">
            <label>
              <Label>Tone</Label>
              <select
                value={draft.announcement.tone}
                onChange={(event) =>
                  setAnnouncement(
                    "tone",
                    event.target.value as StorefrontContent["announcement"]["tone"],
                  )
                }
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white"
              >
                <option value="info">Information</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
              </select>
            </label>
            <TextField label="Title" value={draft.announcement.title} onChange={(value) => setAnnouncement("title", value)} />
            <TextField multiline rows={3} label="Message" value={draft.announcement.message} onChange={(value) => setAnnouncement("message", value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Link label" value={draft.announcement.linkLabel} onChange={(value) => setAnnouncement("linkLabel", value)} />
              <TextField label="Internal path" value={draft.announcement.href} onChange={(value) => setAnnouncement("href", value)} />
            </div>
          </div>
        </article>
      </div>
    );
  }

  function renderSections() {
    return (
      <div className="grid gap-5">
        <article className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Toggle
            active={draft.catalogue.enabled}
            label="Game catalogue"
            note="Show the searchable game grid."
            onClick={() =>
              setDraft((current) => ({
                ...current,
                catalogue: { ...current.catalogue, enabled: !current.catalogue.enabled },
              }))
            }
          />
          <Toggle
            active={draft.catalogue.showRegionalMarkets}
            label="Regional selector"
            note="Show Mobile Legends market versions."
            onClick={() =>
              setDraft((current) => ({
                ...current,
                catalogue: {
                  ...current.catalogue,
                  showRegionalMarkets: !current.catalogue.showRegionalMarkets,
                },
              }))
            }
          />
          <Toggle
            active={draft.process.enabled}
            label="How it works"
            note="Show customer process cards."
            onClick={() =>
              setDraft((current) => ({
                ...current,
                process: { ...current.process, enabled: !current.process.enabled },
              }))
            }
          />
          <Toggle
            active={draft.benefits.enabled}
            label="Benefits"
            note="Show customer trust cards."
            onClick={() =>
              setDraft((current) => ({
                ...current,
                benefits: { ...current.benefits, enabled: !current.benefits.enabled },
              }))
            }
          />
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Catalogue eyebrow"
              value={draft.catalogue.eyebrow}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  catalogue: { ...current.catalogue, eyebrow: value },
                }))
              }
            />
            <TextField
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
          <div className="mt-4">
            <TextField
              multiline
              label="Catalogue description"
              value={draft.catalogue.description}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  catalogue: { ...current.catalogue, description: value },
                }))
              }
            />
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <h3 className="text-lg font-black text-white">How it works cards</h3>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {draft.process.steps.map((step, index) => (
              <div key={`${index}-${step.number}`} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                <div className="grid gap-3 sm:grid-cols-[5rem_minmax(0,1fr)]">
                  <TextField
                    label="Number"
                    value={step.number}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: current.process.steps.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, number: value } : item,
                          ),
                        },
                      }))
                    }
                  />
                  <TextField
                    label="Title"
                    value={step.title}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: current.process.steps.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: value } : item,
                          ),
                        },
                      }))
                    }
                  />
                </div>
                <div className="mt-3">
                  <TextField
                    multiline
                    rows={3}
                    label="Description"
                    value={step.description}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        process: {
                          ...current.process,
                          steps: current.process.steps.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: value }
                              : item,
                          ),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <h3 className="text-lg font-black text-white">Customer benefit cards</h3>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {draft.benefits.items.map((benefit, index) => (
              <div key={`${index}-${benefit.title}`} className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                <TextField
                  label="Title"
                  value={benefit.title}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      benefits: {
                        ...current.benefits,
                        items: current.benefits.items.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: value } : item,
                        ),
                      },
                    }))
                  }
                />
                <div className="mt-3">
                  <TextField
                    multiline
                    rows={3}
                    label="Description"
                    value={benefit.description}
                    onChange={(value) =>
                      setDraft((current) => ({
                        ...current,
                        benefits: {
                          ...current.benefits,
                          items: current.benefits.items.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: value }
                              : item,
                          ),
                        },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    );
  }

  function renderGames() {
    return (
      <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">Game presentation controls</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Hiding a card never changes checkout or supplier availability.
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
                    <p className="truncate text-sm font-black text-white">{game.title}</p>
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
                    onClick={() => toggleGameHidden(game.slug)}
                    className="min-h-10 rounded-lg border border-rose-300/15 bg-rose-300/[0.06] px-2 text-xs font-black text-rose-200"
                  >
                    {hidden ? "Show game" : "Hide game"}
                  </button>
                  <button
                    type="button"
                    disabled={!featured && draft.featuredGameSlugs.length >= 3}
                    onClick={() => toggleFeatured(game.slug)}
                    className="min-h-10 rounded-lg border border-violet-300/20 bg-violet-300/10 px-2 text-xs font-black text-violet-100 disabled:opacity-30"
                  >
                    {featured ? "Unfeature" : "Feature"}
                  </button>
                </div>
                {featured ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={featureIndex === 0}
                      onClick={() => moveFeatured(game.slug, -1)}
                      className="min-h-9 rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 disabled:opacity-25"
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      disabled={featureIndex === draft.featuredGameSlugs.length - 1}
                      onClick={() => moveFeatured(game.slug, 1)}
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
    );
  }

  function renderNavigation() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/15 p-5">
          <h3 className="text-lg font-black text-white">Customer navigation</h3>
          <div className="mt-4 grid gap-2">
            {snapshot.navigationOptions.map((item) => (
              <Toggle
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
            <Toggle
              active={draft.navigation.ctaEnabled}
              label="Header action"
              note="Show one primary customer action in desktop and mobile navigation."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  navigation: {
                    ...current.navigation,
                    ctaEnabled: !current.navigation.ctaEnabled,
                  },
                }))
              }
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="CTA label"
                value={draft.navigation.ctaLabel}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    navigation: { ...current.navigation, ctaLabel: value },
                  }))
                }
              />
              <TextField
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
            <Toggle
              active={draft.footer.enabled}
              label="Storefront footer"
              note="Show the copyright, customer links, and approved policy links."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  footer: { ...current.footer, enabled: !current.footer.enabled },
                }))
              }
            />
            <div className="mt-4">
              <TextField
                multiline
                rows={3}
                label="Copyright line"
                value={draft.footer.copyright}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    footer: { ...current.footer, copyright: value },
                  }))
                }
              />
            </div>
          </article>
        </div>
      </div>
    );
  }

  function renderPolicies() {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        {POLICY_KEYS.map((key) => {
          const policy = draft.policies[key];
          return (
            <article key={key} className="rounded-2xl border border-white/10 bg-black/15 p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-black text-white">{policy.title}</h3>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${policyTone(policy.status)}`}>
                  {policy.status}
                </span>
              </div>
              <div className="mt-4 grid gap-4">
                <TextField label="Page title" value={policy.title} onChange={(value) => setPolicy(key, { title: value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <Label>Review state</Label>
                    <select
                      value={policy.status}
                      onChange={(event) =>
                        setPolicy(key, {
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
                  <Toggle
                    active={policy.visible}
                    label="Public visibility"
                    note="Also requires approved status and non-empty text."
                    onClick={() => setPolicy(key, { visible: !policy.visible })}
                  />
                </div>
                <TextField
                  multiline
                  rows={12}
                  label="Policy body"
                  value={policy.body}
                  placeholder="Write reviewed policy text here."
                  onChange={(value) => setPolicy(key, { body: value })}
                />
                <p className="rounded-xl border border-white/8 bg-white/[0.025] p-3 font-mono text-xs text-slate-500">
                  /policies/{key}
                </p>
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
          <h3 className="text-lg font-black text-white">Presentation-only flags</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Toggle
              active={draft.privateFlags.showDevelopmentBadges}
              label="Development badges"
              note="Show staged, beta, and coming-soon labels."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  privateFlags: {
                    ...current.privateFlags,
                    showDevelopmentBadges: !current.privateFlags.showDevelopmentBadges,
                  },
                }))
              }
            />
            <Toggle
              active={draft.privateFlags.showPricingSnapshots}
              label="Price snapshots"
              note="Show approved starting-price labels where available."
              onClick={() =>
                setDraft((current) => ({
                  ...current,
                  privateFlags: {
                    ...current.privateFlags,
                    showPricingSnapshots: !current.privateFlags.showPricingSnapshots,
                  },
                }))
              }
            />
            <Toggle
              active={draft.privateFlags.showPolicyLinks}
              label="Policy links"
              note="Show only approved, visible, non-empty policies."
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
          <h3 className="text-lg font-black text-rose-100">Separate protected systems</h3>
          <div className="mt-4 grid gap-2">
            {[
              "Payments",
              "Supplier writes",
              "Order state",
              "Refund execution",
              "Maintenance lock",
              "Deployment",
            ].map((item) => (
              <button
                key={item}
                type="button"
                disabled
                className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/10 bg-black/15 px-3 text-left text-xs font-black text-rose-300/40"
              >
                {item} · Not a content flag
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
          <h3 className="text-lg font-black text-white">Version ledger</h3>
          <p className="mt-1 text-xs text-slate-500">Newest evidence appears first.</p>
        </div>
        <div className="divide-y divide-white/8">
          {snapshot.history.length ? (
            snapshot.history.map((item, index) => (
              <div key={`${item.createdAt}-${index}`} className="grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start">
                <span className="w-fit rounded-full border border-violet-300/20 bg-violet-300/10 px-2.5 py-1 text-[9px] font-black uppercase text-violet-100">
                  {item.action.replaceAll("-", " ")}
                </span>
                <div>
                  <p className="text-sm font-black text-white">Revision {item.revision}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.reason}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.actorEmail ?? "Unknown administrator"}</p>
                </div>
                <time className="text-xs text-slate-600">{formatDate(item.createdAt)}</time>
              </div>
            ))
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">
              No saved storefront versions yet. Reviewed defaults remain active.
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
                Control customer-facing copy, announcements, sections, games, navigation,
                policies, and safe display flags through private drafts and explicit publication.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metric label="Draft" value={snapshot.draftRevision} />
              <Metric label="Published" value={snapshot.publishedRevision} />
              <Metric label="Games" value={visibleGames.length} />
              <Metric label="Policies" value={approvedPolicies} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <label>
              <Label>Required audit reason</Label>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this storefront version is changing"
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-400/50"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={acting} onClick={() => void refresh()} className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white disabled:opacity-40">
                Refresh
              </button>
              <button type="button" disabled={acting} onClick={() => void applyAction("restore-draft")} className="min-h-11 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 text-xs font-black text-amber-100 disabled:opacity-40">
                Restore published
              </button>
              <button type="button" disabled={acting || !unsaved} onClick={() => void applyAction("save-draft")} className="min-h-11 rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 text-xs font-black text-violet-100 disabled:opacity-30">
                Save draft
              </button>
              <button type="button" disabled={acting || unsaved || !unpublished} onClick={() => void applyAction("publish")} className="min-h-11 rounded-xl bg-white px-4 text-xs font-black text-slate-950 disabled:opacity-30">
                Publish saved draft
              </button>
            </div>
          </div>

          <p aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${isError ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-white/10 bg-black/20 text-slate-400"}`}>
            {message}{unsaved ? " Unsaved editor changes are present." : ""}
          </p>
        </div>

        <div className="border-b border-white/10 px-3 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-black ${
                  tab === item.id
                    ? "bg-white text-slate-950"
                    : "border border-white/10 bg-white/[0.035] text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {tab === "overview" ? renderOverview() : null}
          {tab === "hero" ? renderHero() : null}
          {tab === "sections" ? renderSections() : null}
          {tab === "games" ? renderGames() : null}
          {tab === "navigation" ? renderNavigation() : null}
          {tab === "policies" ? renderPolicies() : null}
          {tab === "flags" ? renderFlags() : null}
          {tab === "history" ? renderHistory() : null}
        </div>
      </div>
    </section>
  );
}
