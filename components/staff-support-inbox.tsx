"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  SUPPORT_TICKET_STATUSES,
  supportTicketStatusLabel,
  type SupportTicketStatus,
} from "@/lib/support";

type SupportAssignee = {
  id: string;
  displayName: string | null;
  email: string | null;
  role: string;
};

type SupportStaffReply = {
  text: string;
  at: string;
  actor: string;
  actorLabel: string;
  channel: string;
  delivery: string;
  messageId: string | null;
};

type SupportTicketSummary = {
  publicId: string;
  status: SupportTicketStatus;
  category: string;
  categoryLabel: string;
  subject: string;
  source: string;
  replyChannel: string;
  requesterEmail: string | null;
  orderPublicId: string | null;
  gameSlug: string | null;
  assignee: {
    id: string;
    displayName: string | null;
    email: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  lastStaffReplyAt: string | null;
};

type SupportTicketDetail = SupportTicketSummary & {
  description: string;
  requesterName: string | null;
  telegramUsername: string | null;
  customer: { id: string; displayName: string | null; email: string | null } | null;
  order: { publicId: string; status: string } | null;
  assignee: { id: string; displayName: string | null; email: string | null; role: string } | null;
  delivery: { telegramStatus: string; emailStatus: string };
  replies: SupportStaffReply[];
  resolvedAt: string | null;
};

type TicketsResponse = {
  ok: boolean;
  message?: string;
  access?: { mode: string; role: string };
  tickets?: SupportTicketSummary[];
};

type DetailResponse = {
  ok: boolean;
  message?: string;
  ticket?: SupportTicketDetail;
};

type AssigneesResponse = {
  ok: boolean;
  assignees?: SupportAssignee[];
};

const FILTERS: Array<"all" | SupportTicketStatus> = [
  "all",
  ...SUPPORT_TICKET_STATUSES,
];

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-white/5 text-slate-400 border border-white/10",
  ASSIGNED: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  WAITING_CUSTOMER: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  RESOLVED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CLOSED: "bg-white/2 text-slate-600 border border-white/5",
};

const DELIVERY_BADGE: Record<string, string> = {
  SENT: "text-emerald-400",
  SKIPPED: "text-slate-500",
  FAILED: "text-rose-400",
};

function timeAgo(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - Date.parse(value)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function StaffSupportInbox() {
  const [filter, setFilter] = useState<"all" | SupportTicketStatus>("all");
  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [assignees, setAssignees] = useState<SupportAssignee[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [detail, setDetail] = useState<SupportTicketDetail | null>(null);
  const [reason, setReason] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    "Loading the support inbox...",
  );
  const [isError, setIsError] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadTickets = useCallback(async (currentFilter = filter, currentSearch = search) => {
    setLoading(true);
    setIsError(false);
    setMessage("Loading support tickets...");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (currentFilter !== "all") params.set("status", currentFilter);
      if (currentSearch.trim()) params.set("q", currentSearch.trim());
      const response = await fetch(`/api/staff/support?${params.toString()}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as TicketsResponse;
      if (!response.ok || !result.ok || !result.tickets) {
        setTickets([]);
        setIsError(true);
        setMessage(
          result.message ??
            "Support access was not accepted. A support.manage staff permission is required.",
        );
        return;
      }
      setTickets(result.tickets);
      setMessage(
        `${result.tickets.length} support ticket(s) loaded through ${result.access?.mode ?? "protected access"}.`,
      );
    } catch {
      setTickets([]);
      setIsError(true);
      setMessage("The support service could not be reached.");
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  const loadDetail = useCallback(async (publicId: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/staff/support/${publicId}`, {
        cache: "no-store",
      });
      const result = (await response.json()) as DetailResponse;
      if (response.ok && result.ok && result.ticket) {
        setDetail(result.ticket);
      } else {
        setDetail(null);
        setActionNotice(result.message ?? "The ticket could not be loaded.");
      }
    } catch {
      setDetail(null);
      setActionNotice("The ticket could not be loaded.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadTickets());
  }, [loadTickets]);

  const loadAssignees = useCallback(async () => {
    try {
      const response = await fetch("/api/staff/support/assignees", {
        cache: "no-store",
      });
      const result = (await response.json()) as AssigneesResponse;
      if (response.ok && result.ok && result.assignees) {
        setAssignees(result.assignees);
      }
    } catch {
      setAssignees([]);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadAssignees());
  }, [loadAssignees]);

  async function selectTicket(publicId: string) {
    setSelected(publicId);
    await loadDetail(publicId);
  }

  async function runMutation(
    url: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setActionNotice(null);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const result = (await response.json()) as DetailResponse;
      if (!response.ok || !result.ok) {
        setActionNotice(result.message ?? "The action could not be completed.");
        return;
      }
      if (result.ticket) setDetail(result.ticket);
      setActionNotice(successMessage);
      await loadTickets();
      setReason("");
    } catch {
      setActionNotice("The action could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: SupportTicketStatus) {
    if (!selected) return;
    if (reason.trim().length < 5) {
      setActionNotice("Explain the status change in at least 5 characters.");
      return;
    }
    await runMutation(
      `/api/staff/support/${selected}/status`,
      { status, reason: reason.trim() },
      `Ticket moved to ${supportTicketStatusLabel(status)}.`,
    );
  }

  async function changeAssignee(assigneeCustomerId: string) {
    if (!selected) return;
    if (reason.trim().length < 5) {
      setActionNotice("Explain the assignment in at least 5 characters.");
      return;
    }
    await runMutation(
      `/api/staff/support/${selected}/assign`,
      {
        assigneeCustomerId: assigneeCustomerId || null,
        reason: reason.trim(),
      },
      assigneeCustomerId ? "Ticket assigned." : "Ticket unassigned.",
    );
  }

  async function sendReply() {
    if (!selected) return;
    if (!reply.trim()) {
      setActionNotice("Write a reply before sending it.");
      return;
    }
    setBusy(true);
    setActionNotice(null);
    try {
      const response = await fetch(`/api/staff/support/${selected}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply }),
        cache: "no-store",
      });
      const result = (await response.json()) as DetailResponse & { delivery?: string };
      if (!response.ok || !result.ok) {
        setActionNotice(result.message ?? "The reply could not be sent.");
        return;
      }
      if (result.ticket) setDetail(result.ticket);
      setReply("");
      setActionNotice(
        result.delivery === "sent"
          ? "Reply delivered to the customer."
          : result.delivery === "skipped"
            ? "Reply recorded, but no customer channel is connected yet."
            : "Reply recorded, but delivery failed. Review the delivery status.",
      );
      await loadTickets();
    } catch {
      setActionNotice("The reply could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  const visibleCount = useMemo(() => tickets.length, [tickets]);

  return (
    <section id="support" className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-400">
            Customer support cases
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Support inbox</h2>
          <p className="mt-2 text-sm font-medium text-slate-400">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadTickets()}
          disabled={loading}
          className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-slate-400 shadow-2xl transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`min-h-9 rounded-full px-3 text-xs font-bold transition-all ${
                filter === value
                  ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                  : "bg-white/5 text-slate-500 border border-white/10 hover:bg-white/10 hover:text-slate-300"
              }`}
            >
              {value === "all" ? "All" : supportTicketStatusLabel(value)}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 gap-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") loadTickets(filter, search);
            }}
            placeholder="Search tickets..."
            className="min-h-11 w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#06070d] px-3 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 lg:w-64"
            aria-label="Search support tickets"
          />
          <button
            type="button"
            onClick={() => loadTickets(filter, search)}
            className="min-h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-slate-400 shadow-2xl transition-all hover:bg-white/10 hover:text-white"
          >
            Search
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="system-panel overflow-hidden border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md rounded-[2.5rem]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              Tickets · {visibleCount}
            </p>
            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-500 border border-white/10">
              {filter === "all" ? "All statuses" : supportTicketStatusLabel(filter)}
            </span>
          </div>

          {isError ? (
            <div className="system-empty-state min-h-56">
              <div>
                <p className="font-bold text-slate-900">Support access unavailable</p>
                <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">{message}</p>
                <button
                  type="button"
                  onClick={() => loadTickets()}
                  className="mt-4 min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : tickets.length === 0 && !loading ? (
            <div className="system-empty-state min-h-56">
              <div>
                <p className="font-bold text-slate-900">No support tickets</p>
                <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">
                  No tickets match the current filter. New customer requests appear here as they arrive.
                </p>
              </div>
            </div>
          ) : (
            <ul className="max-h-[32rem] divide-y divide-slate-50 overflow-y-auto">
              {tickets.map((ticket) => (
                <li key={ticket.publicId}>
                  <button
                    type="button"
                    onClick={() => selectTicket(ticket.publicId)}
                    className={`w-full p-4 text-left transition-colors ${
                      selected === ticket.publicId
                        ? "bg-violet-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        {ticket.publicId}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.OPEN}`}
                      >
                        {supportTicketStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                      {ticket.subject}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-bold text-slate-400">
                      <span>{ticket.categoryLabel}</span>
                      <span>{ticket.source.toLowerCase()}</span>
                      <span>
                        {ticket.assignee?.displayName ?? "Unassigned"}
                      </span>
                      <span>{timeAgo(ticket.createdAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="system-panel min-h-72 overflow-hidden border border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-2xl">
          {detailLoading ? (
            <div className="system-empty-state min-h-72">
              <p className="text-sm font-bold text-slate-400">Loading ticket details...</p>
            </div>
          ) : !detail ? (
            <div className="system-empty-state min-h-72">
              <div>
                <p className="font-bold text-slate-900">Select a ticket</p>
                <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-slate-500">
                  {selected
                    ? "The selected ticket could not be loaded."
                    : "Choose a ticket from the list to review the conversation, assignment, and status controls."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="border-b border-slate-100 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {detail.publicId}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_BADGE[detail.status] ?? STATUS_BADGE.OPEN}`}
                  >
                    {supportTicketStatusLabel(detail.status)}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400 border border-slate-100">
                    {detail.categoryLabel}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-400 border border-slate-100">
                    {detail.replyChannel.toLowerCase()} replies
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold tracking-tight text-slate-900">{detail.subject}</h3>
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-slate-400 sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-slate-400 uppercase tracking-wider">Requester</dt>
                    <dd className="font-bold text-slate-900">
                      {detail.requesterName || "Not provided"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-slate-400 uppercase tracking-wider">Contact</dt>
                    <dd className="font-bold text-slate-900">
                      {detail.requesterEmail ?? detail.telegramUsername ?? "Not recorded"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-slate-400 uppercase tracking-wider">Source</dt>
                    <dd className="font-bold text-slate-900">{detail.source}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="font-bold text-slate-400 uppercase tracking-wider">Created</dt>
                    <dd className="font-bold text-slate-900">
                      {formatTime(detail.createdAt)}
                    </dd>
                  </div>
                  {detail.orderPublicId ? (
                    <div className="flex justify-between gap-2">
                      <dt className="font-bold text-slate-400 uppercase tracking-wider">Order</dt>
                      <dd className="font-mono font-bold text-cyan-600">
                        {detail.orderPublicId}
                      </dd>
                    </div>
                  ) : null}
                  {detail.gameSlug ? (
                    <div className="flex justify-between gap-2">
                      <dt className="font-bold text-slate-400 uppercase tracking-wider">Game</dt>
                      <dd className="font-bold text-slate-900">{detail.gameSlug}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Assigned staff
                  </span>
                  <select
                    value={detail.assignee?.id ?? ""}
                    onChange={(event) => changeAssignee(event.target.value)}
                    disabled={busy}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                  >
                    <option value="">Unassigned</option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.displayName ?? assignee.email ?? assignee.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Ticket status
                  </span>
                  <select
                    value={detail.status}
                    onChange={(event) =>
                      changeStatus(event.target.value as SupportTicketStatus)
                    }
                    disabled={busy}
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                  >
                    {SUPPORT_TICKET_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {supportTicketStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Reason (required for assignment and status changes)
                  </span>
                  <input
                    type="text"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={240}
                    placeholder="Short audit reason, e.g. claiming ticket"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </label>
              </div>

              <div className="flex-1 border-b border-slate-100 p-5 overflow-y-auto">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  Conversation
                </p>
                <ol className="mt-4 space-y-4">
                  <li className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-500">
                        Customer · {detail.categoryLabel}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {formatTime(detail.createdAt)}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                      {detail.description}
                    </p>
                  </li>
                  {detail.replies.map((replyRecord, index) => (
                    <li
                      key={`${replyRecord.at}-${index}`}
                      className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold text-cyan-700">
                          {replyRecord.actorLabel ?? "Staff"} reply
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[10px] font-bold ${DELIVERY_BADGE[replyRecord.delivery] ?? "text-slate-400"}`}
                          >
                            {replyRecord.delivery.toLowerCase()} ·{" "}
                            {replyRecord.channel.toLowerCase()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {formatTime(replyRecord.at)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">
                        {replyRecord.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-5 bg-slate-50/30">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    Reply to customer
                  </span>
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Write a clear reply for the customer..."
                    className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-400">
                    {detail.replyChannel === "TELEGRAM"
                      ? "Delivered to the customer's connected Telegram chat."
                      : "Delivered to the customer's email."}
                  </p>
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={busy || !reply.trim()}
                    className="min-h-11 rounded-xl bg-violet-600 px-5 text-xs font-bold uppercase tracking-[0.1em] text-white shadow-md transition-all hover:bg-violet-700 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy ? "Sending..." : "Send reply"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {actionNotice ? (
            <div className="border-t border-slate-100 bg-amber-50 p-3 text-xs font-bold text-amber-700">
              {actionNotice}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
