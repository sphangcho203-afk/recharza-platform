# Diagnosis of Shared Issues - Recharza

## PART 1: The Recurring Text-Wrap Bug
- **Root Cause**: The issue is not caused by a global `word-break` utility. Instead, it stems from **narrow layout geometry** combined with a lack of `min-width: 0` or improper flex/grid behavior in consuming components.
- **Affected Components**:
  1. `components/cart-item-row.tsx`: The delivery tag `Delivers {deliveredAmountLabel(...)}` (line 94) is inside a `min-w-0 flex-1` container, but the horizontal space is shared with a non-shrinking "Remove" button.
  2. `components/customer-dashboard.tsx`: The order title `order.package.name` (line 406) is inside a `min-w-0` container but lacks a specific width constraint or safe wrapping in its parent flex layout.
  3. `app/games/mobile-legends/page.tsx`: The market label `market.label` (line 111) is truncated, but if the note below it (line 114) wraps, it might cause height issues or split text if the container is too narrow.
- **Shared Pattern**: All these use a `min-w-0 flex-1` pattern but are squeezed by sibling elements in a flex container without sufficient horizontal breathing room for the font size.

## PART 2: Contrast Bug
- **Root Cause**: The "Open admin workspace" button in `components/customer-dashboard.tsx` (lines 275-280) uses `text-violet-100` on a `bg-violet-400/10` background, which is extremely low contrast.
- **Affected Component**: `components/customer-dashboard.tsx`.

## PART 3: Professional Polish (Button Hierarchy & Icons)
- **Button Hierarchy**: Currently, most buttons use the same `bg-violet-600` solid pill style. Need to introduce secondary (outline) and tertiary (text) button styles.
- **Icon Treatment**: Icons are currently wrapped in pale circular badges (e.g., in `GameEducationSection`). Need to move to inline icons that support text rather than being the main event.
- **Typography**: Headlines are too heavy throughout. Need to differentiate weight between hero/key headlines and structural labels.
- **Layout Scannability**: "How it works" and other step-based content need to be more compact/horizontal.
- **Corner Radius**: Need to vary corner radius based on role (cards vs buttons).
