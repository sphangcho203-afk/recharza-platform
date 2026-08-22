# Mobile Responsiveness & Accessibility Audit - Recharza

## Mobile Responsiveness (360x800 & 390x844)

### Account Page
- **Navigation**: The `SiteHeader` links (Games, Why Recharza, etc.) are visible but might be too crowded on very narrow screens.
- **Dashboard Grid**: The account tools grid (Cart, Start a top-up, etc.) uses `sm:grid-cols-2` and `lg:grid-cols-4`, but on mobile, it's a single column. This is safe, but the icons could be slightly smaller to save vertical space.
- **Stats Tiles**: The stats tiles (Total orders, etc.) are stacked vertically on mobile. This makes the page very long.
- **Billing Addresses**: The "Add billing address" button is full-width, which is good for touch targets.

### Cart Page
- **Item Rows**: The `CartItemRow` uses a flex layout. On mobile, the "Remove" button and quantity controls share space, which might lead to horizontal overflow or tight spacing.
- **Order Summary**: The summary is stacked below the items. The "Checkout all items" button is large and easy to tap.
- **Spacing**: The `max-w-[1240px]` container has `px-4` padding, which is appropriate for mobile.

## Accessibility Audit

### Contrast
- **Admin Button**: Fixed earlier (now `text-violet-700` on `bg-violet-50`).
- **Labels**: Some secondary labels use `text-slate-400` or `text-slate-500`. Need to verify if these meet WCAG AA (4.5:1).
- **Status Badges**: The `emerald-600` text on `emerald-50` background is generally safe, but `amber-700` on `amber-50` should be checked.

### Touch Targets
- **Cart Quantity Controls**: The +/- buttons are `min-h-9 min-w-9`. The recommended minimum is 44x44px (or 24x24px with 8px spacing). These are slightly small for some users.
- **Remove Button**: `min-h-9` is also slightly below the ideal touch target size.

### ARIA & Semantics
- **Cart Notice**: Uses `role="status"` and `aria-live="polite"`, which is correct.
- **Empty States**: Use `role="alert"` or appropriate headings.
- **Navigation**: The mobile nav menu needs to be checked for keyboard trap and focus management.
- **Quantity Labels**: Uses `sr-only` for labels, which is good for screen readers.

## Identified Issues to Fix
1.  **Touch Targets**: Increase size of quantity and remove buttons in `CartItemRow`.
2.  **Stats Layout**: Consider a 2-column grid for stats tiles on mobile to reduce vertical scrolling.
3.  **Contrast**: Check and bump contrast for `slate-400` labels.
4.  **Cart Item Layout**: Ensure the "Remove" button doesn't squeeze the item title on narrow screens.
