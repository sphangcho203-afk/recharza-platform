# Volsever verification notes

Source: https://volsever.com/ (retrieved Aug 14, 2026)

The public Volsever site describes a `Game ID Checker` validation API for validating player IDs, server IDs, nicknames, and regions before payment or delivery. It publicly states coverage of 200+ games, but does not expose a complete game-by-game endpoint list in the extracted page. The site states that services use authenticated API requests and that API keys are managed through its dashboard.

Repository-specific Volsever integration currently calls `https://gate.volsever.com/proxy/api/game/{providerSlug}` with query parameters `id` and optional `zone`, using the server-only `VOLSEVER_API_KEY` in the `X-API-Key` header. The existing adapter maps `free-fire` to `free-fire-india`, `pubg-mobile` to `pubg-mobile-global`, `valorant` to `valorant-indonesia`, and leaves `genshin-impact` unchanged. Mobile Legends already uses the same adapter through its dedicated route.

Because Volsever's public page does not list exact endpoint mappings or field contracts for every game, implementation must preserve a provider alias/configuration layer and treat any unsupported or provider-error response as a safe verification failure. No API key was accessed or written to this note.

## References

1. [Volsever Services](https://volsever.com/) — public description of the Game ID Checker validation API, authenticated API keys, and stated 200+ game coverage.
