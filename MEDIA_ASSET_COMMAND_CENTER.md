# Recharza Media Asset Command Center

The Media Asset Command Center is the protected image authority for Recharza. It stores uploaded image bytes, review metadata, approval state, placement assignments, and audit evidence without depending on a public deployment or external storage provider.

## Supported asset types

- General imagery
- Recharza brand assets
- Game logos
- Game artwork
- Storefront banners
- Social-media masters
- Product artwork prepared for future catalogue integration

Accepted file formats:

- PNG
- JPEG
- WebP
- GIF

Each upload is limited to 5 MB. SVG is intentionally excluded because active SVG content requires a separate sanitization and content-security review.

## Upload safety

The server validates image signatures instead of trusting the browser-provided file extension or MIME type.

Each asset stores:

- sanitized file name;
- verified MIME type;
- byte size;
- SHA-256 checksum;
- durable PostgreSQL image bytes;
- kind;
- review state;
- accessible alternative text;
- notes;
- tags;
- creator identity;
- timestamps;
- placement usage.

Exact duplicate files are detected by checksum and are not stored twice.

## Review workflow

```text
Draft → Review → Approved
   ↘ Archived
```

An approved asset cannot leave approved state while it is assigned to a placement. The administrator must unassign it first.

Every upload, duplicate detection, metadata update, review transition, assignment, and unassignment records an administrator audit event with a written reason.

## Delivery routes

### Administrator preview

`/api/admin/media/assets/:assetId`

- requires a verified administrator session;
- may serve draft, review, approved, or archived assets;
- uses private no-store caching;
- never exposes image bytes inside normal JSON snapshots.

### Public approved delivery

`/api/media/assets/:assetId`

- serves approved assets only;
- returns 404 for draft, review, archived, or unknown assets;
- uses checksum ETags;
- uses immutable public caching;
- sends `X-Content-Type-Options: nosniff`.

## Placement registry

The placement registry defines where approved master assets may be used.

Public storefront placements currently include:

- homepage hero background;
- logo override for each registered game;
- artwork override for each registered game.

Operational master slots also include:

- Recharza primary logo;
- Instagram square;
- Instagram story;
- YouTube banner;
- Facebook cover;
- Telegram post;
- WhatsApp Channel post.

Placement compatibility is enforced by asset kind. A social master cannot silently replace a game logo, for example, because apparently databases occasionally need to provide the adult supervision.

## Storefront integration

The homepage loads approved placements server-side.

Game placements can change only the presented logo or artwork. They do not change:

- game lifecycle;
- game availability;
- checkout routes;
- package availability;
- server-side order gates;
- pricing;
- payment state;
- supplier fulfilment.

The homepage hero background is optional. When no approved placement exists, the reviewed built-in visual system remains active.

## Administrator controls

The control center supports:

- real image uploads;
- search by name, tags, placement, state, kind, or checksum;
- kind and status filters;
- metadata editing;
- review-state transitions;
- accessible alt-text management;
- rights and usage notes;
- placement assignment and unassignment;
- public URL copying for approved assets;
- original-file preview;
- CSV metadata export;
- database-explorer views for assets and placements;
- storage, review, approval, and placement metrics.

## Deliberately locked actions

The first release does not provide:

- physical asset deletion;
- automatic resizing;
- automated cropping;
- format conversion;
- external URL imports;
- remote CDN synchronization;
- automatic social-media publishing.

Physical deletion requires backups, retention policy, and reference checks. Image transformation requires a dedicated rendering worker plus human crop review. External imports remain blocked to avoid SSRF and unreviewed remote content.

## Database models

### `MediaAsset`

Stores image bytes and review metadata.

### `MediaPlacement`

Stores one approved asset assignment per registered placement key.

The database migration is located at:

`prisma/migrations/20260724001000_media_asset_command_center/migration.sql`

## Future upgrades

- dedicated object storage and CDN adapter;
- image dimension extraction;
- reviewed crop variants;
- WebP and AVIF derivative generation;
- social export presets with real rendered sizes;
- scheduled banner activation;
- product-level media placement;
- localized asset variants;
- content-approval roles;
- retention and deletion workflow;
- backup-aware asset restore.
