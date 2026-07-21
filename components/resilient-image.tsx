"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type CSSProperties } from "react";

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
  fallbackLabel,
}: ResilientImageProps) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(sources.length === 0);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(sources.length === 0);
  }, [sources]);

  if (failed) {
    return (
      <div
        aria-label={`${alt} unavailable`}
        role="img"
        className={`grid place-items-center bg-[radial-gradient(circle_at_25%_20%,rgba(124,58,237,0.28),transparent_48%),linear-gradient(145deg,#151522,#090910)] px-4 text-center text-sm font-black text-white/80 ${fallbackClassName}`}
      >
        <span className="max-w-full leading-tight">{fallbackLabel ?? alt}</span>
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
