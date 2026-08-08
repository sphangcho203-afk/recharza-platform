import { ResilientImage } from "@/components/resilient-image";
import type { StorefrontArtworkKey } from "@/lib/storefront-artwork";

type StorefrontArtworkProps = {
  artworkKey?: StorefrontArtworkKey;
  sources: string[];
  alt: string;
  fallbackLabel: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
  sizes?: string;
  objectPosition?: string;
  objectFit?: "cover" | "contain";
};

export function StorefrontArtwork({
  artworkKey,
  sources,
  alt,
  fallbackLabel,
  className = "h-full w-full",
  fallbackClassName = "h-full w-full",
  loading = "lazy",
  priority = false,
  sizes = "100vw",
  objectPosition = "center",
  objectFit = "cover",
}: StorefrontArtworkProps) {
  return (
    <span
      className={`relative block overflow-hidden ${className}`}
      data-artwork-key={artworkKey}
    >
      <ResilientImage
        sources={sources}
        alt={alt}
        fallbackLabel={fallbackLabel}
        loading={loading}
        priority={priority}
        fill
        sizes={sizes}
        className={objectFit === "contain" ? "object-contain" : "object-cover"}
        style={{ objectPosition }}
        fallbackClassName={fallbackClassName}
      />
    </span>
  );
}
