# Recharza storefront UX redesign research

## Findings

Baymard’s 2025 checkout benchmark recommends making guest checkout prominent, minimizing account-creation friction, showing fulfillment timing clearly, using countdowns where cutoffs matter, explicitly labeling required and optional fields, and using adaptive validation errors. These findings support a checkout layout with a visible destination-verification step, clear delivery expectations, readable error copy, and a low-friction path to payment.

Baymard reports that 18% of surveyed shoppers abandoned an order because they did not want to create an account, and that its benchmark found 62% of sites fail to make guest checkout prominent. Recharza should therefore keep account creation secondary to the purchase path and make the game ID verification flow feel direct and recoverable.

For regional pricing, the redesign should keep the currency selector in the global header, use local currency formatting, show the selected region or market on the game-detail page, and distinguish display conversion from the currency ultimately charged. The selector should be discoverable on desktop and compact on mobile, with persistence between visits.

## Design implications for Recharza

1. Replace oversized repeated MLBB hero banners with a compact rotating campaign rail that cycles through trust, speed, seasonal offer, and regional-market messages.
2. Keep navigation persistent and task-oriented: Browse games, regions, offers, order tracking, and support.
3. Make the currency selector visually prominent but subordinate to the primary Browse games action.
4. Use supplied artwork as differentiated game and region identity, with Golden Month specifically assigned to MLBB India.
5. On game-detail pages, show the selected market, supported ID format, verification state, package grid, price display, and a sticky order summary.
6. Treat all region-specific information as contextual UI rather than forcing users through an extra region-picker step when the card already identifies the market.

## References

[1]: https://baymard.com/blog/current-state-of-checkout-ux "Baymard Institute — Checkout UX Best Practices 2025"
[2]: https://xsolla.com/blog/how-harnessing-regional-pricing-boosts-revenue-and-engagement "Xsolla — Regional pricing and engagement"
[3]: https://stripe.com/resources/more/geographic-pricing "Stripe — Geographic pricing in practice"
