"use client";

import { useMemo, useState } from "react";

import { ResilientImage } from "@/components/resilient-image";
import type {
  AdminMediaAsset,
  AdminMediaSnapshot,
  MediaPlacementDefinition,
} from "@/lib/media-assets";

type ApiResponse = {
  ok: boolean;
  message?: string;
  duplicate?: boolean;
  snapshot?: AdminMediaSnapshot;
};

type AssetKind = AdminMediaAsset["kind"];
type AssetStatus = AdminMediaAsset["status"];

const KIND_OPTIONS: Array<{ id: AssetKind; label: string }> = [
  { id: "GENERAL", label: "General" },
  { id: "BRAND", label: "Brand" },
  { id: "GAME_LOGO", label: "Game logo" },
  { id: "GAME_ARTWORK", label: "Game artwork" },
  { id: "BANNER", label: "Banner" },
  { id: "SOCIAL", label: "Social" },
  { id: "PRODUCT", label: "Product" },
];

const STATUS_OPTIONS: Array<{ id: AssetStatus; label: string }> = [
  { id: "DRAFT", label: "Draft" },
  { id: "REVIEW", label: "Review" },
  { id: "APPROVED", label: "Approved" },
  { id: "ARCHIVED", label: "Archived" },
];

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClasses(status: AssetStatus) {
  if (status === "APPROVED") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (status === "REVIEW") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (status === "ARCHIVED") return "border-white/8 bg-black/20 text-slate-600";
  return "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";
}

function csvCell(value: string | number | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadAssetIndex(assets: AdminMediaAsset[]) {
  const rows = [
    ["id", "name", "fileName", "kind", "status", "mimeType", "byteSize", "checksum", "tags", "placements", "createdAt"],
    ...assets.map((asset) => [
      asset.id,
      asset.name,
      asset.fileName,
      asset.kind,
      asset.status,
      asset.mimeType,
      asset.byteSize,
      asset.checksum,
      asset.tags.join("|"),
      asset.placements.join("|"),
      asset.createdAt,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => csvCell(cell)).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recharza-media-assets-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function AdminMediaConsole({
  initialSnapshot,
}: {
  initialSnapshot: AdminMediaSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AssetKind | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<AssetStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSnapshot.assets[0]?.id ?? null,
  );
  const [edit, setEdit] = useState({
    name: initialSnapshot.assets[0]?.name ?? "",
    altText: initialSnapshot.assets[0]?.altText ?? "",
    notes: initialSnapshot.assets[0]?.notes ?? "",
    tags: initialSnapshot.assets[0]?.tags.join(", ") ?? "",
    kind: initialSnapshot.assets[0]?.kind ?? ("GENERAL" as AssetKind),
    status: initialSnapshot.assets[0]?.status ?? ("DRAFT" as AssetStatus),
  });
  const [upload, setUpload] = useState({
    file: null as File | null,
    name: "",
    altText: "",
    notes: "",
    tags: "",
    kind: "GENERAL" as AssetKind,
  });
  const [placementKey, setPlacementKey] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Media library ready.");
  const [isError, setIsError] = useState(false);

  const selected = snapshot.assets.find((asset) => asset.id === selectedId) ?? null;
  const filteredAssets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return snapshot.assets.filter((asset) => {
      if (kindFilter !== "ALL" && asset.kind !== kindFilter) return false;
      if (statusFilter !== "ALL" && asset.status !== statusFilter) return false;
      if (!normalized) return true;
      return [
        asset.name,
        asset.fileName,
        asset.altText,
        asset.kind,
        asset.status,
        asset.tags.join(" "),
        asset.placements.join(" "),
        asset.checksum,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [kindFilter, query, snapshot.assets, statusFilter]);

  const compatiblePlacements = useMemo(() => {
    if (!selected) return [];
    return snapshot.placementDefinitions.filter((definition) =>
      definition.allowedKinds.includes(selected.kind),
    );
  }, [selected, snapshot.placementDefinitions]);

  function selectAsset(asset: AdminMediaAsset) {
    setSelectedId(asset.id);
    setEdit({
      name: asset.name,
      altText: asset.altText,
      notes: asset.notes ?? "",
      tags: asset.tags.join(", "),
      kind: asset.kind,
      status: asset.status,
    });
    setPlacementKey("");
    setMessage(`${asset.name} selected.`);
    setIsError(false);
  }

  function requireReason() {
    if (reason.trim().length < 8) {
      setIsError(true);
      setMessage("Add an audit reason of at least 8 characters.");
      return false;
    }
    return true;
  }

  async function refresh() {
    setBusy(true);
    setIsError(false);
    setMessage("Refreshing media library...");
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Media library could not be refreshed.");
      }
      setSnapshot(result.snapshot);
      setMessage("Media library refreshed.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Media library could not be refreshed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAsset() {
    if (!upload.file || !requireReason()) return;
    setBusy(true);
    setIsError(false);
    setMessage("Verifying and storing image...");
    try {
      const form = new FormData();
      form.set("file", upload.file);
      form.set("name", upload.name);
      form.set("altText", upload.altText);
      form.set("notes", upload.notes);
      form.set("tags", upload.tags);
      form.set("kind", upload.kind);
      form.set("reason", reason.trim());
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Image upload failed.");
      }
      setSnapshot(result.snapshot);
      setUpload({ file: null, name: "", altText: "", notes: "", tags: "", kind: "GENERAL" });
      setReason("");
      setMessage(result.message ?? "Image uploaded.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function patchMedia(payload: Record<string, unknown>, successMessage: string) {
    if (!requireReason()) return;
    setBusy(true);
    setIsError(false);
    setMessage("Applying media change...");
    try {
      const response = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, reason: reason.trim() }),
      });
      const result = (await response.json()) as ApiResponse;
      if (!response.ok || !result.ok || !result.snapshot) {
        throw new Error(result.message ?? "Media change was rejected.");
      }
      setSnapshot(result.snapshot);
      setReason("");
      setMessage(successMessage);
      const nextSelected = result.snapshot.assets.find((asset) => asset.id === selectedId);
      if (nextSelected) selectAsset(nextSelected);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Media change failed.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPublicUrl(asset: AdminMediaAsset) {
    if (!asset.publicUrl) return;
    await navigator.clipboard.writeText(`${window.location.origin}${asset.publicUrl}`);
    setMessage("Approved public media URL copied.");
  }

  return (
    <section id="media" className="mt-8 scroll-mt-24">
      <div className="overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-[radial-gradient(circle_at_top_left,rgba(217,70,239,0.13),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.012))]">
        <div className="border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">Media authority</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Media Asset Command Center</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Upload, review, approve, classify, search, assign, export, and inspect every store, game, brand, banner, and social-media image from one durable library.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void refresh()} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-black text-slate-300 hover:bg-white/5 disabled:opacity-40">Refresh</button>
              <button type="button" onClick={() => downloadAssetIndex(snapshot.assets)} className="min-h-11 rounded-xl border border-white/10 px-4 text-xs font-black text-slate-300 hover:bg-white/5">Export CSV</button>
              <button type="button" disabled className="min-h-11 cursor-not-allowed rounded-xl border border-rose-300/15 bg-rose-300/[0.035] px-4 text-xs font-black text-rose-300/50">Delete assets locked</button>
            </div>
          </div>
          <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${isError ? "border-rose-300/20 bg-rose-300/10 text-rose-100" : "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-100"}`}>{message}</div>
        </div>

        <div className="grid gap-3 border-b border-white/10 p-5 sm:grid-cols-2 xl:grid-cols-5 sm:p-7">
          {[
            ["Assets", snapshot.metrics.totalAssets, "Stored image records"],
            ["Approved", snapshot.metrics.approvedAssets, "Publicly deliverable"],
            ["In review", snapshot.metrics.reviewAssets, "Awaiting approval"],
            ["Placements", snapshot.metrics.assignedPlacements, "Assigned master slots"],
            ["Storage", formatBytes(snapshot.metrics.storedBytes), "PostgreSQL image bytes"],
          ].map(([label, value, note]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-slate-600">{note}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-5 border-b border-white/10 p-5 xl:grid-cols-[0.8fr_1.2fr] sm:p-7">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-black text-white">Upload intake</h3>
            <p className="mt-1 text-sm text-slate-500">PNG, JPEG, WebP or GIF. Maximum 5 MB. Every upload begins as a private draft.</p>
            <div className="mt-5 grid gap-3">
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setUpload((current) => ({ ...current, file: event.target.files?.[0] ?? null }))} className="min-h-12 rounded-xl border border-dashed border-white/15 bg-black/20 p-3 text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-xs file:font-black file:text-slate-950" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={upload.name} onChange={(event) => setUpload((current) => ({ ...current, name: event.target.value }))} placeholder="Asset name" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
                <select value={upload.kind} onChange={(event) => setUpload((current) => ({ ...current, kind: event.target.value as AssetKind }))} className="min-h-11 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-sm text-white outline-none focus:border-fuchsia-300/50">
                  {KIND_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </div>
              <input value={upload.altText} onChange={(event) => setUpload((current) => ({ ...current, altText: event.target.value }))} placeholder="Accessible image description" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
              <input value={upload.tags} onChange={(event) => setUpload((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags: brand, launch, mlbb" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
              <textarea value={upload.notes} onChange={(event) => setUpload((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Rights, source, crop, or usage notes" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
              <button type="button" disabled={busy || !upload.file} onClick={() => void uploadAsset()} className="min-h-12 rounded-xl bg-white px-4 text-sm font-black text-slate-950 hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:opacity-40">Upload private draft</button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, tags, placements or checksums" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
              <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as AssetKind | "ALL")} className="min-h-11 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-xs font-bold text-white">
                <option value="ALL">All kinds</option>
                {KIND_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as AssetStatus | "ALL")} className="min-h-11 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-xs font-bold text-white">
                <option value="ALL">All states</option>
                {STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </div>
            <p className="mt-3 text-xs text-slate-600">{filteredAssets.length} of {snapshot.assets.length} assets</p>
            <div className="mt-4 grid max-h-[36rem] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
              {filteredAssets.map((asset) => (
                <button key={asset.id} type="button" onClick={() => selectAsset(asset)} className={`overflow-hidden rounded-2xl border text-left transition ${selectedId === asset.id ? "border-fuchsia-300/50 bg-fuchsia-300/[0.08]" : "border-white/10 bg-white/[0.025] hover:border-white/20"}`}>
                  <div className="aspect-square overflow-hidden bg-black/30">
                    <ResilientImage sources={[asset.previewUrl]} alt={asset.altText} fallbackLabel={asset.name} className="h-full w-full object-cover" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-black text-white">{asset.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[9px] font-bold uppercase text-slate-500">{asset.kind.replaceAll("_", " ")}</span>
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-black uppercase ${statusClasses(asset.status)}`}>{asset.status}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 p-5 xl:grid-cols-[1.1fr_0.9fr] sm:p-7">
          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-black text-white">Asset inspector</h3>
            {selected ? (
              <div className="mt-4 grid gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
                <div>
                  <div className="aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <ResilientImage sources={[selected.previewUrl]} alt={selected.altText} fallbackLabel={selected.name} className="h-full w-full object-contain" fallbackClassName="h-full w-full" />
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-slate-500">
                    <p>{selected.mimeType} · {formatBytes(selected.byteSize)}</p>
                    <p>{selected.fileName}</p>
                    <p>Added {formatDate(selected.createdAt)}</p>
                    <p className="truncate font-mono text-[10px]">SHA-256 {selected.checksum}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={selected.previewUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-slate-300 hover:bg-white/5">Open original</a>
                    <button type="button" disabled={!selected.publicUrl} onClick={() => void copyPublicUrl(selected)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-slate-300 hover:bg-white/5 disabled:opacity-35">Copy public URL</button>
                  </div>
                </div>
                <div className="grid content-start gap-3">
                  <input value={edit.name} onChange={(event) => setEdit((current) => ({ ...current, name: event.target.value }))} placeholder="Asset name" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
                  <input value={edit.altText} onChange={(event) => setEdit((current) => ({ ...current, altText: event.target.value }))} placeholder="Accessible description" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select value={edit.kind} onChange={(event) => setEdit((current) => ({ ...current, kind: event.target.value as AssetKind }))} className="min-h-11 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-sm text-white">
                      {KIND_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                    <select value={edit.status} onChange={(event) => setEdit((current) => ({ ...current, status: event.target.value as AssetStatus }))} className="min-h-11 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-sm text-white">
                      {STATUS_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                    </select>
                  </div>
                  <input value={edit.tags} onChange={(event) => setEdit((current) => ({ ...current, tags: event.target.value }))} placeholder="Tags" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
                  <textarea value={edit.notes} onChange={(event) => setEdit((current) => ({ ...current, notes: event.target.value }))} rows={4} placeholder="Rights and usage notes" className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-fuchsia-300/50" />
                  <button type="button" disabled={busy} onClick={() => void patchMedia({ action: "update", assetId: selected.id, ...edit }, "Asset metadata and review state updated.")} className="min-h-12 rounded-xl bg-white px-4 text-sm font-black text-slate-950 hover:bg-fuchsia-200 disabled:opacity-40">Save asset review</button>
                  {selected.placements.length ? <p className="text-xs leading-5 text-amber-200">Assigned to {selected.placements.join(", ")}. Unassign it before removing approved status.</p> : null}
                </div>
              </div>
            ) : <p className="mt-4 text-sm text-slate-600">Select an asset from the library.</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="text-lg font-black text-white">Placement matrix</h3>
            <p className="mt-1 text-sm text-slate-500">Only approved and type-compatible assets may occupy a master slot.</p>
            {selected ? (
              <div className="mt-4 grid gap-3">
                <select value={placementKey} onChange={(event) => setPlacementKey(event.target.value)} className="min-h-12 rounded-xl border border-white/10 bg-[#0a0a11] px-3 text-sm text-white">
                  <option value="">Choose compatible placement</option>
                  {compatiblePlacements.map((definition) => <option key={definition.key} value={definition.key}>{definition.group} · {definition.label}</option>)}
                </select>
                <button type="button" disabled={busy || selected.status !== "APPROVED" || !placementKey} onClick={() => void patchMedia({ action: "assign", assetId: selected.id, placementKey }, "Approved asset assigned to placement.")} className="min-h-12 rounded-xl bg-fuchsia-200 px-4 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-35">Assign selected asset</button>
              </div>
            ) : null}
            <div className="mt-5 max-h-[31rem] space-y-2 overflow-y-auto pr-1">
              {snapshot.placementDefinitions.map((definition: MediaPlacementDefinition) => {
                const placement = snapshot.placements.find((item) => item.placementKey === definition.key);
                return (
                  <article key={definition.key} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-wider text-fuchsia-300">{definition.group}</p>
                        <p className="mt-1 truncate text-sm font-black text-white">{definition.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{definition.description}</p>
                        <p className="mt-2 truncate text-[10px] font-bold text-slate-400">{placement ? placement.assetName : "Unassigned"}</p>
                      </div>
                      {placement ? <button type="button" disabled={busy} onClick={() => void patchMedia({ action: "unassign", placementKey: definition.key }, `${definition.label} unassigned.`)} className="shrink-0 rounded-lg border border-rose-300/20 px-2 py-2 text-[9px] font-black text-rose-200 hover:bg-rose-300/10 disabled:opacity-40">Unassign</button> : <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[8px] font-black uppercase text-slate-600">Empty</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 p-5 sm:p-7">
          <label className="block max-w-3xl">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Audit reason for the next upload or change</span>
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Example: Approved new MLBB artwork after publisher-source review" className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-fuchsia-300/50" />
          </label>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["Automatic resizing", "Locked until an image-rendering worker and crop review exist."],
              ["Physical deletion", "Locked until backups, retention rules, and reference checks exist."],
              ["External URL imports", "Locked to prevent SSRF and unreviewed remote content ingestion."],
            ].map(([title, note]) => <article key={title} className="rounded-xl border border-rose-300/12 bg-rose-300/[0.025] p-3"><p className="text-xs font-black text-rose-200/70">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{note}</p></article>)}
          </div>
        </div>
      </div>
    </section>
  );
}
