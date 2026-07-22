"use client";

import { useEffect, useMemo, useState } from "react";

import { ResilientImage } from "@/components/resilient-image";
import { formatInr } from "@/lib/mobile-legends";

type CatalogueProduct = {
  id: string;
  provider: string;
  offerId: string;
  categoryId: string;
  gameSlug: string;
  name: string;
  region: string | null;
  retailPriceInPaise: number;
  available: boolean;
  published: boolean;
  syncedAt: string;
  media: {
    sources: string[];
    alt: string;
    source: "supplier" | "catalog" | "publisher";
  };
};

type CatalogueSnapshot = {
  ok: boolean;
  products: CatalogueProduct[];
  games: Array<{
    slug: string;
    title: string;
    status: string;
    available: boolean;
    href: string | null;
    mediaSources: string[];
  }>;
  markets: Array<{
    code: string;
    label: string;
    flag: string;
    href: string;
    defaultCurrency: string;
  }>;
  message?: string;
};

type EditState = {
  storefrontName: string;
  imageUrl: string;
  imageAlt: string;
};

async function readSnapshot() {
  const response = await fetch("/api/admin/catalogue", { cache: "no-store" });
  const result = (await response.json()) as CatalogueSnapshot;
  if (!response.ok || !result.ok) {
    throw new Error(result.message ?? "Catalogue controls could not be loaded.");
  }
  return result;
}

export function AdminCatalogueConsole() {
  const [snapshot, setSnapshot] = useState<CatalogueSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({
    storefrontName: "",
    imageUrl: "",
    imageAlt: "",
  });
  const [message, setMessage] = useState("Loading catalogue controls...");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setMessage("Loading catalogue controls...");
    try {
      const result = await readSnapshot();
      setSnapshot(result);
      setMessage(`${result.products.length} supplier products loaded.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Catalogue controls could not be loaded.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const products = snapshot?.products ?? [];
  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) =>
      [
        product.name,
        product.gameSlug,
        product.region ?? "",
        product.offerId,
        product.categoryId,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [products, query]);

  const selected = products.find((product) => product.id === selectedId) ?? null;

  function openEditor(product: CatalogueProduct) {
    setSelectedId(product.id);
    setEdit({
      storefrontName: product.name,
      imageUrl: product.media.sources[0] ?? "",
      imageAlt: product.media.alt,
    });
  }

  async function patchProduct(
    productId: string,
    patch: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusyId(productId);
    setMessage("Saving catalogue change...");
    try {
      const response = await fetch("/api/admin/catalogue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...patch }),
      });
      const result = (await response.json()) as {
        ok: boolean;
        product?: CatalogueProduct;
        message?: string;
      };
      if (!response.ok || !result.ok || !result.product) {
        throw new Error(result.message ?? "Catalogue change was rejected.");
      }

      setSnapshot((current) =>
        current
          ? {
              ...current,
              products: current.products.map((product) =>
                product.id === productId ? result.product! : product,
              ),
            }
          : current,
      );
      setMessage(successMessage);
      if (selectedId === productId) openEditor(result.product);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Catalogue change failed.");
    } finally {
      setBusyId(null);
    }
  }

  const publishedCount = products.filter((product) => product.published).length;
  const availableCount = products.filter((product) => product.available).length;
  const supplierMediaCount = products.filter((product) => product.media.source === "supplier").length;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Supplier products", String(products.length), "Synced catalogue records"],
          ["Published", String(publishedCount), "Visible to customers"],
          ["Available", String(availableCount), "Eligible for checkout"],
          ["Supplier media", String(supplierMediaCount), "Products with upstream artwork"],
        ].map(([label, value, note]) => (
          <article key={label} className="system-card p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs text-slate-600">{note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section className="system-panel overflow-hidden">
          <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <h3 className="text-lg font-black text-white">Product catalogue</h3>
              <p className="mt-1 text-sm text-slate-500">Publish, pause, inspect and open the media editor.</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-black text-slate-300 hover:bg-white/5"
            >
              Refresh
            </button>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, regions or offer IDs"
              className="min-h-12 rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400 sm:col-span-2"
            />
          </div>

          <div className="max-h-[46rem] divide-y divide-white/8 overflow-y-auto">
            {visibleProducts.map((product) => (
              <article key={product.id} className="grid gap-4 p-4 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:items-center">
                <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  <ResilientImage
                    sources={product.media.sources}
                    alt={product.media.alt}
                    fallbackLabel={product.name}
                    className="h-full w-full object-contain p-2"
                    fallbackClassName="h-full w-full"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-black text-white">{product.name}</h4>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-bold uppercase text-slate-400">
                      {product.region ?? "Global"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-violet-200">{formatInr(product.retailPriceInPaise)}</p>
                  <p className="mt-1 truncate font-mono text-[10px] text-slate-600">{product.offerId}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => void patchProduct(product.id, { published: !product.published }, product.published ? "Product unpublished." : "Product published.")}
                    className={`min-h-10 rounded-xl border px-3 text-[11px] font-black ${product.published ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-400"}`}
                  >
                    {product.published ? "Published" : "Unpublished"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === product.id}
                    onClick={() => void patchProduct(product.id, { available: !product.available }, product.available ? "Product paused." : "Product activated.")}
                    className={`min-h-10 rounded-xl border px-3 text-[11px] font-black ${product.available ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100" : "border-rose-300/20 bg-rose-300/10 text-rose-200"}`}
                  >
                    {product.available ? "Available" : "Paused"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditor(product)}
                    className="min-h-10 rounded-xl bg-white px-3 text-[11px] font-black text-slate-950 hover:bg-violet-200"
                  >
                    Edit media
                  </button>
                </div>
              </article>
            ))}
            {!visibleProducts.length ? (
              <div className="p-10 text-center text-sm text-slate-600">No catalogue product matched.</div>
            ) : null}
          </div>
        </section>

        <aside className="system-panel h-fit p-5 xl:sticky xl:top-24">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">Media and display override</p>
          {selected ? (
            <div className="mt-4 grid gap-4">
              <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                <ResilientImage
                  sources={selected.media.sources}
                  alt={selected.media.alt}
                  fallbackLabel={selected.name}
                  className="h-full w-full object-contain p-4"
                  fallbackClassName="h-full w-full"
                />
              </div>
              <label className="text-xs font-bold text-slate-300">
                Storefront name
                <input
                  value={edit.storefrontName}
                  onChange={(event) => setEdit((current) => ({ ...current, storefrontName: event.target.value }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </label>
              <label className="text-xs font-bold text-slate-300">
                Primary image URL
                <input
                  value={edit.imageUrl}
                  onChange={(event) => setEdit((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="https://reviewed-cdn.example/product.png"
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </label>
              <label className="text-xs font-bold text-slate-300">
                Image description
                <input
                  value={edit.imageAlt}
                  onChange={(event) => setEdit((current) => ({ ...current, imageAlt: event.target.value }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-violet-400"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void patchProduct(selected.id, edit, "Storefront media updated.")}
                  className="min-h-11 rounded-xl bg-violet-500 px-3 text-xs font-black text-white hover:bg-violet-400 disabled:opacity-50"
                >
                  Save override
                </button>
                <button
                  type="button"
                  disabled={busyId === selected.id}
                  onClick={() => void patchProduct(selected.id, { imageUrl: "", storefrontName: "" }, "Overrides cleared.")}
                  className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-black text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Clear override
                </button>
              </div>
              <p className="text-xs leading-5 text-slate-600">
                Only HTTPS media from reviewed publisher, supplier, or configured CDN hosts is accepted.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-600">
              Select a product to edit its storefront name and real media source.
            </div>
          )}
        </aside>
      </div>

      <p aria-live="polite" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-400">
        {message}
      </p>
    </div>
  );
}
