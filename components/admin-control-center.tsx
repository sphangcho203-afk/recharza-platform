"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  AdminControlSnapshot,
  AdminDataset,
  AdminMetric,
  AdminTableColumn,
  AdminTableValue,
} from "@/lib/admin-control-types";

type CommandState = "live" | "beta" | "planned" | "locked";
type CommandGroup = "Storefront" | "Commerce" | "Operations" | "Data" | "Security" | "System";

type AdminCommand = {
  id: string;
  label: string;
  description: string;
  group: CommandGroup;
  state: CommandState;
  href?: string;
  code: string;
  danger?: boolean;
};

const COMMAND_GROUPS: CommandGroup[] = [
  "Storefront",
  "Commerce",
  "Operations",
  "Data",
  "Security",
  "System",
];

const COMMANDS: AdminCommand[] = [
  { id: "open-store", label: "Open storefront", description: "Inspect the public customer experience.", group: "Storefront", state: "live", href: "/", code: "WEB" },
  { id: "interfaces", label: "Interface map", description: "Open every public and private route.", group: "Storefront", state: "live", href: "#interfaces", code: "MAP" },
  { id: "catalogue", label: "Game catalogue", description: "Publish, pause, rename, and review product media.", group: "Storefront", state: "live", href: "#catalogue", code: "CAT" },
  { id: "regional", label: "Regional versions", description: "Inspect game-market routes and localized pricing.", group: "Storefront", state: "beta", href: "/games/mobile-legends", code: "REG" },
  { id: "content", label: "Content studio", description: "Homepage sections, banners, copy, and announcements.", group: "Storefront", state: "planned", code: "CMS" },
  { id: "maintenance", label: "Maintenance mode", description: "Freeze public checkout without disabling admin access.", group: "Storefront", state: "locked", code: "MNT", danger: true },

  { id: "orders", label: "Order queue", description: "Review protected orders and status transitions.", group: "Commerce", state: "live", href: "#orders", code: "ORD" },
  { id: "pricing", label: "Pricing engine", description: "Control cost, margin, FX buffer, fees, and rounding.", group: "Commerce", state: "live", href: "#pricing", code: "PRC" },
  { id: "payments", label: "Payment events", description: "Inspect stored webhooks and reconciliation evidence.", group: "Commerce", state: "beta", href: "#database", code: "PAY" },
  { id: "tracking", label: "Order tracking", description: "Open the private customer tracking lookup.", group: "Commerce", state: "live", href: "/orders/lookup", code: "TRK" },
  { id: "promotions", label: "Promotions", description: "Vouchers, referrals, campaigns, and reward rules.", group: "Commerce", state: "planned", code: "PRO" },
  { id: "refunds", label: "Refund controls", description: "Provider-backed refunds with audit and approval gates.", group: "Commerce", state: "locked", code: "RFD", danger: true },

  { id: "suppliers", label: "Supplier health", description: "Review sync state, catalogue health, and write gates.", group: "Operations", state: "live", href: "#suppliers", code: "SUP" },
  { id: "fulfilment", label: "Fulfilment records", description: "Inspect dry-run and supplier-write attempts.", group: "Operations", state: "beta", href: "#database", code: "FUL" },
  { id: "staff", label: "Staff workspace", description: "Open protected order operations for staff.", group: "Operations", state: "live", href: "/staff", code: "STF" },
  { id: "operator", label: "Operator console", description: "Emergency token and session-backed order controls.", group: "Operations", state: "live", href: "/operator", code: "OPS" },
  { id: "support", label: "Support cases", description: "Tickets, attachments, assignments, and escalation queues.", group: "Operations", state: "planned", code: "TKT" },
  { id: "supplier-writes", label: "Enable supplier writes", description: "Unlock real supplier order submission.", group: "Operations", state: "locked", code: "WRT", danger: true },

  { id: "database", label: "Database explorer", description: "Search every admin-visible operational dataset.", group: "Data", state: "live", href: "#database", code: "DB" },
  { id: "customers", label: "Customer records", description: "Inspect identities, roles, sessions, and order counts.", group: "Data", state: "beta", href: "#database", code: "CUS" },
  { id: "audit", label: "Audit timeline", description: "Review administrator actions and actor evidence.", group: "Data", state: "beta", href: "#database", code: "LOG" },
  { id: "webhooks", label: "Webhook archive", description: "Search payment events and reconciliation failures.", group: "Data", state: "beta", href: "#database", code: "WHK" },
  { id: "csv", label: "CSV export", description: "Export the currently selected database view.", group: "Data", state: "live", href: "#database", code: "CSV" },
  { id: "backups", label: "Database backups", description: "Backup history, restore points, and integrity checks.", group: "Data", state: "planned", code: "BAK" },

  { id: "sessions", label: "Session monitor", description: "Inspect active, expired, and revoked sessions.", group: "Security", state: "beta", href: "#database", code: "SES" },
  { id: "rate-limits", label: "Rate-limit health", description: "Inspect protected-route abuse and throttling.", group: "Security", state: "planned", code: "RAT" },
  { id: "roles", label: "Roles and access", description: "Grant, review, and revoke staff permissions.", group: "Security", state: "planned", code: "ACL" },
  { id: "security-log", label: "Security evidence", description: "Review authentication and administrator activity.", group: "Security", state: "beta", href: "#database", code: "SEC" },
  { id: "secret-rotation", label: "Rotate secrets", description: "Controlled key rotation with service verification.", group: "Security", state: "locked", code: "KEY", danger: true },
  { id: "emergency-lock", label: "Emergency store lock", description: "Stop checkout, sessions, and supplier actions.", group: "Security", state: "locked", code: "LOCK", danger: true },

  { id: "integrations", label: "Integrations", description: "Supplier, email, payment, analytics, and webhook status.", group: "System", state: "planned", code: "INT" },
  { id: "domains", label: "Domains and routing", description: "Customer, admin, identity, and status hostnames.", group: "System", state: "planned", code: "DNS" },
  { id: "feature-flags", label: "Feature flags", description: "Enable private features without public release.", group: "System", state: "planned", code: "FLG" },
  { id: "ci", label: "Build health", description: "Inspect validation, schema, typecheck, lint, and build state.", group: "System", state: "beta", href: "https://github.com/sphangcho203-afk/recharza-platform/actions", code: "CI" },
  { id: "settings", label: "Platform settings", description: "Global defaults, maintenance, and environment policy.", group: "System", state: "planned", code: "CFG" },
  { id: "deploy", label: "Public deployment", description: "Publish the store to a production environment.", group: "System", state: "locked", code: "PUB", danger: true },
];

function metricClasses(metric: AdminMetric) {
  if (metric.tone === "positive") return "border-emerald-400/20 bg-emerald-400/[0.055]";
  if (metric.tone === "warning") return "border-amber-400/20 bg-amber-400/[0.055]";
  if (metric.tone === "danger") return "border-rose-400/20 bg-rose-400/[0.055]";
  return "border-white/10 bg-white/[0.025]";
}

function stateClasses(state: CommandState, danger = false) {
  if (state === "live") return "border-emerald-400/20 bg-emerald-400/[0.055] text-emerald-100";
  if (state === "beta") return "border-cyan-400/20 bg-cyan-400/[0.055] text-cyan-100";
  if (danger) return "border-rose-400/15 bg-rose-400/[0.035] text-rose-300/70";
  if (state === "planned") return "border-white/8 bg-white/[0.015] text-slate-500";
  return "border-white/8 bg-black/20 text-slate-600";
}

function alertClasses(severity: "info" | "warning" | "critical") {
  if (severity === "critical") return "border-rose-400/20 bg-rose-400/[0.07] text-rose-100";
  if (severity === "warning") return "border-amber-400/20 bg-amber-400/[0.07] text-amber-100";
  return "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-100";
}

function formatDate(value: AdminTableValue) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function formatMoney(value: AdminTableValue) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function displayValue(value: AdminTableValue, column?: AdminTableColumn) {
  if (value === null || value === "") return "—";
  if (column?.format === "money") return formatMoney(value);
  if (column?.format === "date") return formatDate(value);
  if (column?.format === "boolean") return value ? "Yes" : "No";
  if (column?.format === "status" && typeof value === "string") {
    return value.replaceAll("_", " ").toLowerCase();
  }
  return String(value);
}

function csvCell(value: AdminTableValue) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadDataset(dataset: AdminDataset, rows: AdminDataset["rows"]) {
  const header = dataset.columns.map((column) => csvCell(column.label)).join(",");
  const body = rows.map((row) => dataset.columns.map((column) => csvCell(row[column.key] ?? null)).join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recharza-${dataset.id}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminControlCenter({ snapshot }: { snapshot: AdminControlSnapshot }) {
  const router = useRouter();
  const [commandQuery, setCommandQuery] = useState("");
  const [activeDatasetId, setActiveDatasetId] = useState<AdminDataset["id"]>("orders");
  const [dataQuery, setDataQuery] = useState("");
  const [compact, setCompact] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, AdminTableValue> | null>(null);
  const [copyMessage, setCopyMessage] = useState("");

  const dataset = snapshot.datasets.find((item) => item.id === activeDatasetId) ?? snapshot.datasets[0];
  const normalizedCommandQuery = commandQuery.trim().toLowerCase();
  const visibleCommands = useMemo(
    () =>
      COMMANDS.filter((command) =>
        [command.label, command.description, command.group, command.state, command.code]
          .join(" ")
          .toLowerCase()
          .includes(normalizedCommandQuery),
      ),
    [normalizedCommandQuery],
  );

  const normalizedDataQuery = dataQuery.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      dataset.rows.filter((row) =>
        Object.values(row)
          .map((value) => (value === null ? "" : String(value)))
          .join(" ")
          .toLowerCase()
          .includes(normalizedDataQuery),
      ),
    [dataset, normalizedDataQuery],
  );

  async function copySelectedRow() {
    if (!selectedRow) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
    setCopyMessage("Record JSON copied");
    window.setTimeout(() => setCopyMessage(""), 1800);
  }

  return (
    <section id="control-center" className="mt-8 scroll-mt-24">
      <div className="overflow-hidden rounded-[2rem] border border-violet-400/20 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.16),transparent_36%),linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Master administration layer</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Recharza Control Center</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Store-wide commands, operational alerts, database records, security evidence, and every existing control surface in one protected workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.refresh()}
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.045] px-4 py-2 text-xs font-black text-white transition hover:bg-white/[0.08]"
              >
                Refresh live data
              </button>
              <a
                href="#database"
                className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-violet-200"
              >
                Open database
              </a>
            </div>
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
            Snapshot generated {formatDate(snapshot.generatedAt)} · Private admin session · No public deployment control enabled
          </p>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
          {snapshot.metrics.map((metric) => (
            <article key={metric.id} className={`rounded-2xl border p-4 ${metricClasses(metric)}`}>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{metric.label}</p>
              <p className="mt-3 text-2xl font-black text-white">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{metric.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="system-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Attention rail</p>
              <h3 className="mt-1 text-lg font-black">System alerts</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-black text-slate-400">
              {snapshot.alerts.length}
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {snapshot.alerts.map((alert) => {
              const content = (
                <>
                  <span className="text-sm font-black">{alert.title}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-70">{alert.detail}</span>
                </>
              );
              return alert.href ? (
                <a key={alert.id} href={alert.href} className={`rounded-xl border p-3 transition hover:brightness-110 ${alertClasses(alert.severity)}`}>
                  {content}
                </a>
              ) : (
                <div key={alert.id} className={`rounded-xl border p-3 ${alertClasses(alert.severity)}`}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>

        <section className="system-panel p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Command matrix</p>
              <h3 className="mt-1 text-lg font-black">Whole-store controls</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">Live controls navigate to working systems. Locked commands remain visibly unavailable until authorization, persistence, rollback, and audit behavior exist.</p>
            </div>
            <label className="block sm:w-72">
              <span className="sr-only">Search admin commands</span>
              <input
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Search commands, modules, states..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
              />
            </label>
          </div>

          <div className="mt-5 grid gap-5">
            {COMMAND_GROUPS.map((group) => {
              const commands = visibleCommands.filter((command) => command.group === group);
              if (!commands.length) return null;
              return (
                <div key={group}>
                  <div className="mb-2 flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{group}</p>
                    <span className="h-px flex-1 bg-white/8" />
                    <span className="font-mono text-[10px] text-slate-700">{commands.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {commands.map((command) => {
                      const inner = (
                        <>
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-mono text-[10px] font-black tracking-[0.12em] opacity-60">{command.code}</span>
                            <span className="rounded-full border border-current/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider opacity-75">{command.state}</span>
                          </span>
                          <span className="mt-3 block text-sm font-black text-white/95">{command.label}</span>
                          <span className="mt-1 block text-[11px] leading-4 opacity-65">{command.description}</span>
                        </>
                      );
                      return command.href ? (
                        <a
                          key={command.id}
                          href={command.href}
                          target={command.href.startsWith("http") ? "_blank" : undefined}
                          rel={command.href.startsWith("http") ? "noreferrer" : undefined}
                          className={`min-h-32 rounded-xl border p-3 transition hover:-translate-y-0.5 hover:brightness-110 ${stateClasses(command.state, command.danger)}`}
                        >
                          {inner}
                        </a>
                      ) : (
                        <button
                          key={command.id}
                          type="button"
                          disabled
                          title={command.state === "locked" ? "Locked until safety and approval requirements exist." : "Planned module."}
                          className={`min-h-32 cursor-not-allowed rounded-xl border p-3 text-left ${stateClasses(command.state, command.danger)}`}
                        >
                          {inner}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section id="database" className="mt-6 scroll-mt-24 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0b12]">
        <div className="border-b border-white/10 p-4 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">Operational database</p>
              <h3 className="mt-1 text-2xl font-black">Store data explorer</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Search the latest admin-visible records across every critical commerce table. This explorer is intentionally read-only; mutations stay inside audited domain-specific controls.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCompact((value) => !value)}
                className="min-h-11 rounded-xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-slate-300 hover:bg-white/[0.065]"
              >
                {compact ? "Comfortable rows" : "Compact rows"}
              </button>
              <button
                type="button"
                onClick={() => downloadDataset(dataset, filteredRows)}
                className="min-h-11 rounded-xl border border-violet-400/20 bg-violet-400/10 px-3 text-xs font-black text-violet-100 hover:bg-violet-400/15"
              >
                Export visible CSV
              </button>
              <button
                type="button"
                onClick={() => router.refresh()}
                className="min-h-11 rounded-xl bg-white px-3 text-xs font-black text-slate-950 hover:bg-violet-200"
              >
                Refresh snapshot
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {snapshot.datasets.map((item) => {
              const active = item.id === dataset.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveDatasetId(item.id);
                    setDataQuery("");
                    setSelectedRow(null);
                  }}
                  className={`min-h-12 shrink-0 rounded-xl border px-3 text-left transition ${
                    active
                      ? "border-white bg-white text-slate-950"
                      : "border-white/10 bg-white/[0.025] text-slate-400 hover:bg-white/[0.055] hover:text-white"
                  }`}
                >
                  <span className="block text-xs font-black">{item.label}</span>
                  <span className={`mt-0.5 block font-mono text-[9px] ${active ? "text-slate-500" : "text-slate-600"}`}>
                    {item.total} total · {item.rows.length} loaded
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <label className="block max-w-xl">
              <span className="sr-only">Search selected database</span>
              <input
                value={dataQuery}
                onChange={(event) => setDataQuery(event.target.value)}
                placeholder={`Search ${dataset.label.toLowerCase()} across every visible column`}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/25 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-400/40"
              />
            </label>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-600">
              {filteredRows.length} visible / {dataset.total} total
            </p>
          </div>
        </div>

        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 overflow-x-auto border-b border-white/10 xl:border-b-0 xl:border-r">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 z-10 bg-[#11111a] text-[9px] uppercase tracking-[0.12em] text-slate-500">
                <tr>
                  {dataset.columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap border-b border-white/10 px-3 py-3 font-black">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const selected = selectedRow === row;
                  return (
                    <tr
                      key={`${dataset.id}-${index}`}
                      onClick={() => setSelectedRow(row)}
                      className={`cursor-pointer border-b border-white/[0.055] transition hover:bg-violet-400/[0.055] ${selected ? "bg-violet-400/[0.09]" : ""}`}
                    >
                      {dataset.columns.map((column) => {
                        const value = row[column.key] ?? null;
                        const formatted = displayValue(value, column);
                        const status = column.format === "status";
                        const code = column.format === "code";
                        return (
                          <td key={column.key} className={`max-w-72 ${compact ? "px-3 py-2" : "px-3 py-3"}`}>
                            {status && value !== null ? (
                              <span className="inline-flex whitespace-nowrap rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-300">
                                {formatted}
                              </span>
                            ) : (
                              <span className={`${code ? "font-mono text-[10px] text-cyan-200/80" : "text-slate-300"} block truncate`} title={formatted}>
                                {formatted}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredRows.length ? (
              <div className="px-6 py-14 text-center">
                <p className="font-black text-white">No records matched this search</p>
                <p className="mt-2 text-sm text-slate-600">Clear the query or refresh the database snapshot.</p>
              </div>
            ) : null}
          </div>

          <aside className="min-w-0 bg-white/[0.018] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">Record inspector</p>
                <h4 className="mt-1 text-base font-black text-white">{selectedRow ? "Selected record" : "Choose a table row"}</h4>
              </div>
              {selectedRow ? (
                <button
                  type="button"
                  onClick={() => void copySelectedRow()}
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[10px] font-black text-slate-300 hover:bg-white/[0.08]"
                >
                  Copy JSON
                </button>
              ) : null}
            </div>
            {copyMessage ? <p className="mt-2 text-xs font-bold text-emerald-300">{copyMessage}</p> : null}
            {selectedRow ? (
              <dl className="mt-4 grid gap-2">
                {dataset.columns.map((column) => (
                  <div key={column.key} className="rounded-xl border border-white/8 bg-black/20 p-3">
                    <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-600">{column.label}</dt>
                    <dd className={`mt-1 break-words text-xs leading-5 ${column.format === "code" ? "font-mono text-cyan-200/80" : "text-slate-300"}`}>
                      {displayValue(selectedRow[column.key] ?? null, column)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-xs leading-5 text-slate-600">
                Select any record to inspect every visible field without leaving the control center.
              </div>
            )}
          </aside>
        </div>
      </section>
    </section>
  );
}
