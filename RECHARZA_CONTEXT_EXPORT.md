# Recharza — Project Context Export (August 2026)

## 1. Repository & Stack
- **Repository**: Private Git repository (`https://github.com/sphangcho203-afk/recharza-platform.git`).
- **Framework**: Next.js 16.3.0, React 19.2.7, Node.js 22.x.
- **Styling**: Tailwind CSS 4.3.3 with PostCSS, using CSS variables for semantic tokens.
- **Hosting**: Vercel (Production URL: `https://recharza-platform.vercel.app`).
- **Database**: Prisma ORM 7.x with PostgreSQL (Neon).

## 2. Design Tokens — Real Current Values
- **Background/Surface Colors**:
  - Light Theme: `--background: #ffffff`, `--surface-0: #ffffff`, `--surface-1: #f8fafc`, `--surface-2: #f1f5f9`.
  - Dark Atmosphere (Game Checkout): `#05060a` (forced via `.recharza-dark-atmosphere`).
  - Dark Hero Gradient: `radial-gradient(circle at 50% 50%, #1a1b2e 0%, #05060a 100%)`.
- **Text Colors**:
  - Primary: `--text-primary: #0f172a`.
  - Secondary: `--text-secondary: #475569`.
  - Muted: `--text-muted: #64748b`.
  - Dark Mode Text: `#ffffff` (forced).
- **Border/Divider Colors**:
  - Subtle: `--border-subtle: rgba(15, 23, 42, 0.06)`.
  - Strong: `--border-strong: rgba(15, 23, 42, 0.12)`.
  - Interactive: `--border-interactive: rgba(15, 23, 42, 0.06)`.
- **Brand/Accent Colors**:
  - Primary: `--brand-primary: #7c3aed` (Violet).
  - Secondary: `--brand-secondary: #d946ef` (Magenta).
  - Cyan/Trust: `--brand-cyan: #0891b2`.
- **Status Colors**:
  - Success: `--status-success: #10b981`.
  - Warning: `--status-warning: #f59e0b`.
  - Danger: `--status-danger: #ef4444`.
- **Spacing Scale**:
  - Tailwind 4px base (`p-1` to `p-24`).
  - Custom: `--storefront-page-pad: clamp(1rem, 3vw, 2rem)`.
- **Type Scale**:
  - Font Family: `Inter, Geist, sans-serif`.
  - Display/Hero: `clamp(2.5rem, 8vw, 4.5rem)`, Weight 900.
  - Section Head: `clamp(1.75rem, 5vw, 2.75rem)`, Weight 850.
  - Card Title: `1.1rem`, Weight 800.
  - Body: `16px`, Line-height 1.6.
- **Corner Radius**:
  - `radius-sm: 0.75rem`, `radius-md: 1rem`, `radius-lg: 1.5rem`, `radius-xl: 2rem`.
- **File Paths**: `app/globals.css`, `app/storefront-redesign.css`.

## 3. Fable 5 Mega Skill Content
The platform is governed by the `fable-5-mega-skill` (path: `/home/ubuntu/skills/fable-5-mega-skill/SKILL.md`).
> "All-in-one website-building skill. Combines premium visual design, accessibility compliance, SEO structure, motion and micro-interaction standards, on-brand copywriting, and a reusable component library into a single governing skill."

## 4. Component/File Map
- **Text Wrapping Bug (Titles)**:
  - **Order Titles**: `components/customer-dashboard.tsx` (renders `order.package.name` in a `<p>` with `text-xl font-black break-words`).
  - **Cart Titles**: `components/cart-item-row.tsx` (renders `item.package.name` in an `<h3>` with `text-[15px] font-black line-clamp-2`).
  - **Catalogue Titles**: `components/game-card.tsx` (renders `title` in an `<h3>` with `truncate text-[1rem] font-black`).
  - **Note**: These are three separate implementations, not a shared component.
- **Game/Market Template**:
  - MLBB: `app/games/mobile-legends/[market]/page.tsx`.
  - Generic: `app/games/[gameSlug]/page.tsx`.
- **Bottom Nav Bar**: `components/mobile-bottom-nav.tsx`.
- **Checkout Stepper**: `components/checkout-progress-rail.tsx`.
- **Cart Page**: `app/cart/page.tsx` (using `CartItemRow`).
- **Identity Verification**: `components/mobile-legends-checkout-shell.tsx` and `components/supplier-game-checkout-shell.tsx`.

## 5. Known Issues
- **Visibility Regression (Aug 2026)**: Resolved by forcing opaque backgrounds on dark game shells via `.recharza-dark-atmosphere`.
- **Prisma Security Pin**: `package.json` override for `deepmerge-ts` to resolve Prisma 7 vulnerabilities.
- **Volsever Mapping**: Generic game slugs must be manually verified in `lib/volsever.ts`.

## 6. Additional Context
Future engineers should prioritize **visual contrast verification** via browser screenshots after any CSS change. The platform uses a "fail-closed" logic for player verification—do not bypass `verifyPlayer` calls in checkout shells.
