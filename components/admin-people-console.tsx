"use client";

import { useEffect, useMemo, useState } from "react";

type AccessStatus =
  | "ACTIVE"
  | "ORDER_RESTRICTED"
  | "SIGN_IN_RESTRICTED"
  | "SUSPENDED";
type AccountRole = "CUSTOMER" | "STAFF" | "ADMIN";

type PermissionDefinition = {
  id: string;
  label: string;
  description: string;
};

type Person = {
  id: string;
  email: string;
  displayName: string | null;
  username: string | null;
  role: AccountRole;
  accessStatus: AccessStatus;
  restrictionReason: string | null;
  restrictionUpdatedAt: string | null;
  permissions: string[];
  permissionsConfigured: boolean;
  verifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  counts: {
    orders: number;
    sessions: number;
    activeSessions: number;
  };
};

type PeopleResponse = {
  ok: boolean;
  message?: string;
  currentAdminId?: string;
  permissionDefinitions?: PermissionDefinition[];
  people?: Person[];
  customer?: Person;
  revokedSessions?: number;
};

const ACCESS_OPTIONS: Array<{ value: AccessStatus; label: string; note: string }> = [
  { value: "ACTIVE", label: "Active", note: "Normal sign-in and order access." },
  {
    value: "ORDER_RESTRICTED",
    label: "Order restricted",
    note: "Can sign in and inspect history, but new orders are blocked.",
  },
  {
    value: "SIGN_IN_RESTRICTED",
    label: "Sign-in restricted",
    note: "New and existing sessions are blocked until restored.",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
    note: "Full account suspension with active-session revocation.",
  },
];

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function accessTone(status: AccessStatus) {
  if (status === "ACTIVE") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-200";
  if (status === "ORDER_RESTRICTED") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  return "border-rose-300/20 bg-rose-300/10 text-rose-100";
}

function roleTone(role: AccountRole) {
  if (role === "ADMIN") return "border-violet-300/20 bg-violet-300/10 text-violet-200";
  if (role === "STAFF") return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
  return "border-white/10 bg-white/5 text-slate-300";
}

export function AdminPeopleConsole({ currentAdminId }: { currentAdminId: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [permissionDefinitions, setPermissionDefinitions] = useState<PermissionDefinition[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | AccountRole>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AccessStatus>("ALL");
  const [reason, setReason] = useState("");
  const [draftRole, setDraftRole] = useState<"CUSTOMER" | "STAFF">("CUSTOMER");
  const [draftStatus, setDraftStatus] = useState<AccessStatus>("ACTIVE");
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState("Loading protected customer and staff records...");
  const [isError, setIsError] = useState(false);

  const selected = people.find((person) => person.id === selectedId) ?? null;

  const visiblePeople = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return people.filter((person) => {
      if (roleFilter !== "ALL" && person.role !== roleFilter) return false;
      if (statusFilter !== "ALL" && person.accessStatus !== statusFilter) return false;
      if (!normalized) return true;
      return [person.email, person.displayName, person.username, person.role, person.accessStatus]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [people, query, roleFilter, statusFilter]);

  const totals = useMemo(
    () => ({
      customers: people.filter((person) => person.role === "CUSTOMER").length,
      staff: people.filter((person) => person.role === "STAFF").length,
      restricted: people.filter((person) => person.accessStatus !== "ACTIVE").length,
      sessions: people.reduce((total, person) => total + person.counts.activeSessions, 0),
    }),
    [people],
  );

  async function loadPeople(preferredId?: string) {
    setLoading(true);
    setIsError(false);
    try {
      const response = await fetch("/api/admin/people", { cache: "no-store" });
      const result = (await response.json()) as PeopleResponse;
      if (!response.ok || !result.ok || !result.people || !result.permissionDefinitions) {
        throw new Error(result.message ?? "People and access records could not be loaded.");
      }

      setPeople(result.people);
      setPermissionDefinitions(result.permissionDefinitions);
      const nextId =
        preferredId && result.people.some((person) => person.id === preferredId)
          ? preferredId
          : selectedId && result.people.some((person) => person.id === selectedId)
            ? selectedId
            : result.people[0]?.id ?? "";
      setSelectedId(nextId);
      setMessage(`${result.people.length} protected account record(s) loaded.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "People and access records are unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPeople();
    // Initial protected load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraftRole(selected.role === "STAFF" ? "STAFF" : "CUSTOMER");
    setDraftStatus(selected.accessStatus);
    setDraftPermissions(selected.permissions);
    setReason("");
  }, [selectedId, selected?.updatedAt]);

  function replacePerson(person: Person) {
    setPeople((current) => current.map((item) => (item.id === person.id ? person : item)));
  }

  async function runOperation(payload: Record<string, unknown>, successMessage: string) {
    if (!selected) return;
    if (reason.trim().length < 8) {
      setIsError(true);
      setMessage("Add an audit reason of at least 8 characters before changing access.");
      return;
    }

    setActing(true);
    setIsError(false);
    setMessage("Applying protected access change...");
    try {
      const response = await fetch("/api/admin/people", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selected.id,
          reason: reason.trim(),
          ...payload,
        }),
      });
      const result = (await response.json()) as PeopleResponse;
      if (!response.ok || !result.ok || !result.customer) {
        throw new Error(result.message ?? "The access change was rejected.");
      }

      replacePerson(result.customer);
      setReason("");
      setMessage(
        `${successMessage}${
          typeof result.revokedSessions === "number"
            ? ` ${result.revokedSessions} active session(s) revoked.`
            : ""
        }`,
      );
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "The access change failed.");
    } finally {
      setActing(false);
    }
  }

  const protectedTarget = Boolean(
    selected && (selected.id === currentAdminId || selected.role === "ADMIN"),
  );

  return (
    <section id="customers" className="mt-10 scroll-mt-24">
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            People, roles, sessions, and restrictions
          </p>
          <h2 className="mt-1 text-2xl font-black">People &amp; access authority</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Inspect every verified account, control customer access, promote trusted staff,
            grant exact operator permissions, and terminate active sessions with a permanent
            audit reason.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPeople(selectedId)}
          disabled={loading || acting}
          className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh people database"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Customers", totals.customers],
          ["Staff", totals.staff],
          ["Restricted", totals.restricted],
          ["Active sessions", totals.sessions],
        ].map(([label, value]) => (
          <article key={label} className="system-card p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </article>
        ))}
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
      </p>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(22rem,0.8fr)_minmax(0,1.2fr)]">
        <article className="system-panel min-w-0 overflow-hidden">
          <div className="grid gap-3 border-b border-white/10 p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email, name, role, or status"
              className="min-h-11 min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
            />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
              className="min-h-11 rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white"
            >
              <option value="ALL">All roles</option>
              <option value="CUSTOMER">Customers</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admins</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="min-h-11 rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white"
            >
              <option value="ALL">All access states</option>
              {ACCESS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="max-h-[44rem] overflow-y-auto p-2">
            {visiblePeople.map((person) => {
              const active = person.id === selectedId;
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedId(person.id)}
                  className={`mb-2 grid w-full min-w-0 gap-3 rounded-xl border p-3 text-left transition sm:grid-cols-[minmax(0,1fr)_auto] ${
                    active
                      ? "border-violet-300/40 bg-violet-300/10"
                      : "border-white/8 bg-black/15 hover:border-white/15 hover:bg-white/[0.035]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-white">{person.email}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {person.displayName ?? person.username ?? "No public profile name"}
                    </span>
                    <span className="mt-2 block text-[10px] text-slate-600">
                      {person.counts.orders} orders · {person.counts.activeSessions} active sessions
                    </span>
                  </span>
                  <span className="flex flex-wrap items-start gap-1.5 sm:justify-end">
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${roleTone(person.role)}`}>
                      {person.role}
                    </span>
                    <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${accessTone(person.accessStatus)}`}>
                      {person.accessStatus.replaceAll("_", " ")}
                    </span>
                  </span>
                </button>
              );
            })}
            {!visiblePeople.length ? (
              <p className="p-8 text-center text-sm text-slate-500">No account matched those filters.</p>
            ) : null}
          </div>
        </article>

        <article id="staff" className="system-panel min-w-0 p-5 sm:p-6">
          {!selected ? (
            <p className="py-20 text-center text-sm text-slate-500">Select an account to inspect access.</p>
          ) : (
            <div className="grid gap-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-xl font-black text-white">{selected.email}</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-600">{selected.id}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Verified {formatDate(selected.verifiedAt)} · Last login {formatDate(selected.lastLoginAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${roleTone(selected.role)}`}>
                    {selected.role}
                  </span>
                  <span className={`rounded-full border px-3 py-1.5 text-xs font-black ${accessTone(selected.accessStatus)}`}>
                    {selected.accessStatus.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              {protectedTarget ? (
                <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
                  This administrator account is protected. Role, permissions, restrictions, and sessions require a separate dual-approval workflow.
                </div>
              ) : null}

              <label className="text-sm font-bold text-slate-200">
                Required audit reason
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={protectedTarget || acting}
                  placeholder="Explain why this access change is necessary"
                  className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-normal text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50 disabled:opacity-40"
                />
              </label>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <h3 className="text-sm font-black text-white">Account access state</h3>
                  <select
                    value={draftStatus}
                    onChange={(event) => setDraftStatus(event.target.value as AccessStatus)}
                    disabled={protectedTarget || acting}
                    className="mt-3 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white disabled:opacity-40"
                  >
                    {ACCESS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {ACCESS_OPTIONS.find((option) => option.value === draftStatus)?.note}
                  </p>
                  <button
                    type="button"
                    disabled={protectedTarget || acting || draftStatus === selected.accessStatus}
                    onClick={() => void runOperation(
                      { operation: "set-access", accessStatus: draftStatus },
                      `Access changed to ${draftStatus.replaceAll("_", " ")}.`,
                    )}
                    className="mt-4 min-h-11 w-full rounded-xl bg-white px-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Apply access state
                  </button>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <h3 className="text-sm font-black text-white">Role authority</h3>
                  <select
                    value={draftRole}
                    onChange={(event) => setDraftRole(event.target.value as "CUSTOMER" | "STAFF")}
                    disabled={protectedTarget || acting}
                    className="mt-3 min-h-11 w-full rounded-xl border border-white/10 bg-[#11111a] px-3 text-sm text-white disabled:opacity-40"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="STAFF">Staff</option>
                  </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Role changes revoke active sessions so the new authority cannot continue under stale access.
                  </p>
                  <button
                    type="button"
                    disabled={
                      protectedTarget ||
                      acting ||
                      selected.role === "ADMIN" ||
                      draftRole === selected.role
                    }
                    onClick={() => void runOperation(
                      { operation: "set-role", role: draftRole },
                      `Role changed to ${draftRole}.`,
                    )}
                    className="mt-4 min-h-11 w-full rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 text-sm font-black text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Apply role and revoke sessions
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Scoped staff permissions</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Backend operator routes enforce these permissions. Empty configured access means the staff account cannot operate protected tools.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {draftPermissions.length}/{permissionDefinitions.length} selected
                  </span>
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {permissionDefinitions.map((permission) => {
                    const checked = draftPermissions.includes(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className={`flex gap-3 rounded-xl border p-3 ${
                          checked ? "border-violet-300/25 bg-violet-300/10" : "border-white/8 bg-white/[0.02]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={protectedTarget || acting || selected.role !== "STAFF"}
                          onChange={(event) => {
                            setDraftPermissions((current) =>
                              event.target.checked
                                ? [...current, permission.id]
                                : current.filter((item) => item !== permission.id),
                            );
                          }}
                          className="mt-1 h-4 w-4 accent-violet-500"
                        />
                        <span>
                          <span className="block text-sm font-black text-white">{permission.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">{permission.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={protectedTarget || acting || selected.role !== "STAFF"}
                  onClick={() => void runOperation(
                    { operation: "set-permissions", permissions: draftPermissions },
                    "Staff permissions updated.",
                  )}
                  className="mt-4 min-h-11 rounded-xl border border-violet-300/25 bg-violet-300/10 px-4 text-sm font-black text-violet-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Save enforced permissions
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="rounded-xl border border-white/10 bg-black/15 p-4">
                  <p className="text-sm font-black text-white">Session authority</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selected.counts.activeSessions} active of {selected.counts.sessions} stored sessions.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={protectedTarget || acting || selected.counts.activeSessions === 0}
                  onClick={() => void runOperation(
                    { operation: "revoke-sessions" },
                    "All active sessions revoked.",
                  )}
                  className="min-h-12 rounded-xl border border-rose-300/25 bg-rose-300/10 px-5 text-sm font-black text-rose-100 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Revoke all sessions
                </button>
              </div>

              {selected.restrictionReason ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Current restriction evidence</p>
                  <p className="mt-2 text-sm text-slate-300">{selected.restrictionReason}</p>
                  <p className="mt-2 text-xs text-slate-600">Updated {formatDate(selected.restrictionUpdatedAt)}</p>
                </div>
              ) : null}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
