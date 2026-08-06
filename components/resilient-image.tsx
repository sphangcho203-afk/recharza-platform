"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState, type CSSProperties } from "react";

type ResilientImageProps = {
  sources: string[];
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  fallbackClassName?: string;
  fallbackLabel?: string;
};

function createInitials(value: string) {
  const parts = value
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "RZ";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function isSafeImageSource(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ResilientImage(props: ResilientImageProps) {
  const usableSources = useMemo(
    () => Array.from(new Set(props.sources.filter(isSafeImageSource))),
    [props.sources],
  );
  const sourceKey = usableSources.join("\n") || "no-source";

  return (
    <ResolvedImage
      key={sourceKey}
      {...props}
      usableSources={usableSources}
    />
  );
}

function ResolvedImage({
  usableSources,
  alt,
  className = "",
  style,
  loading = "lazy",
  fallbackClassName = "",
  fallbackLabel,
}: Omit<ResilientImageProps, "sources"> & { usableSources: string[] }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(usableSources.length === 0);
  const initials = createInitials(fallbackLabel ?? alt);

  if (failed) {
    return (
      <div
        aria-label={`${alt} unavailable`}
        role="img"
        className={`grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.12),transparent_42%),radial-gradient(circle_at_80%_75%,rgba(139,92,246,0.13),transparent_46%),linear-gradient(145deg,#111522,#070910)] text-center ${fallbackClassName}`}
      >
        <span className="flex flex-col items-center gap-2.5 px-4" aria-hidden="true">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.045] text-xs font-black tracking-[-0.04em] text-cyan-100 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            {initials}
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-600">
            Artwork unavailable
          </span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={usableSources[sourceIndex]}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="strict-origin-when-cross-origin"
      className={className}
      style={style}
      onError={() => {
        if (sourceIndex + 1 < usableSources.length) {
          setSourceIndex((current) => current + 1);
          return;
        }

        setFailed(true);
      }}
    />
  );
}
