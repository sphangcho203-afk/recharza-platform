"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, type CSSProperties } from "react";

type ResilientImageProps = {
  sources: string[];
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: "eager" | "lazy";
  fallbackClassName?: string;
  fallbackLabel?: string;
};

export function ResilientImage({
  sources,
  alt,
  className = "",
  style,
  loading = "lazy",
  fallbackClassName = "",
  fallbackLabel = "R",
}: ResilientImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(sources.length === 0);

  if (failed) {
    return (
      <div
        aria-label={`${alt} unavailable`}
        role="img"
        className={`grid place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.24),transparent_42%),linear-gradient(135deg,rgba(124,58,237,0.24),rgba(15,23,42,0.92))] font-black text-white/80 ${fallbackClassName}`}
      >
        <span aria-hidden="true" className="text-2xl uppercase tracking-[-0.08em]">
          {fallbackLabel.slice(0, 2)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={sources[sourceIndex]}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
      style={style}
      onError={() => {
        if (sourceIndex + 1 < sources.length) {
          setSourceIndex((current) => current + 1);
          return;
        }

        setFailed(true);
      }}
    />
  );
}