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

  if (!parts.length) return "R";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ResilientImage({
  sources,
  alt,
  className = "",
  style,
  loading = "lazy",
  fallbackClassName = "",
  fallbackLabel,
}: ResilientImageProps) {
  const usableSources = useMemo(() => sources.filter(Boolean), [sources]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(usableSources.length === 0);
  const initials = createInitials(fallbackLabel ?? alt);

  if (failed) {
    return (
      <div
        aria-label={`${alt} unavailable`}
        role="img"
        className={`grid place-items-center bg-[radial-gradient(circle_at_25%_20%,rgba(56,189,248,0.24),transparent_45%),linear-gradient(145deg,#171727,#090910)] text-center font-black text-white/85 ${fallbackClassName}`}
      >
        <span aria-hidden="true" className="text-2xl tracking-[-0.08em] sm:text-3xl">
          {initials}
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
      referrerPolicy="no-referrer"
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