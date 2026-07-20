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
};

export function ResilientImage({
  sources,
  alt,
  className = "",
  style,
  loading = "lazy",
  fallbackClassName = "",
}: ResilientImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(sources.length === 0);

  if (failed) {
    return (
      <div
        aria-label={`${alt} unavailable`}
        role="img"
        className={`grid place-items-center bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(15,23,42,0.75))] text-xs font-bold uppercase tracking-[0.16em] text-white/55 ${fallbackClassName}`}
      >
        Media unavailable
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
