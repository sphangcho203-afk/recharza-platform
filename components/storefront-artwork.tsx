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
  return (
    <span className={`relative block overflow-hidden ${className}`}>
      <ResilientImage
        sources={sources}
        alt={alt}
        fallbackLabel={fallbackLabel}
        loading={loading}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        fallbackClassName={fallbackClassName}
      />
      {artworkKey ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 block bg-cover"
          style={getStorefrontArtworkStyle(artworkKey)}
        />
      ) : null}
    </span>
  );
}
