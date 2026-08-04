import { ResilientImage } from "@/components/resilient-image";
import {
  getStorefrontArtworkStyle,
  type StorefrontArtworkKey,
} from "@/lib/storefront-artwork";

type StorefrontArtworkProps = {
  artworkKey?: StorefrontArtworkKey;
  sources: string[];
  alt: string;
  fallbackLabel: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
  objectPosition?: string;
};

export function StorefrontArtwork({
  artworkKey,
  sources,
  alt,
  fallbackLabel,
  className = "h-full w-full",
  fallbackClassName = "h-full w-full",
  loading = "lazy",
  objectPosition = "center",
}: StorefrontArtworkProps) {
  if (artworkKey) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`block bg-cover ${className}`}
        style={getStorefrontArtworkStyle(artworkKey)}
      />
    );
  }

  return (
    <ResilientImage
      sources={sources}
      alt={alt}
      fallbackLabel={fallbackLabel}
      loading={loading}
      className={className}
      style={{ objectPosition }}
      fallbackClassName={fallbackClassName}
    />
  );
}
