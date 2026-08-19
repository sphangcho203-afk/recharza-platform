# Prisma vulnerability dry-run — findings (branch dry-run/prisma-upgrade, local only, nothing pushed)

## Baseline (main, prisma 7.9.1)
`npm audit --omit=dev` → 3 HIGH: deepmerge-ts < 8.0.0 (GHSA-ggr8-5vv4-36mx, stack exhaustion on recursive merges) via chain prisma → @prisma/config@7.9.1 → deepmerge-ts@7.1.5.
Advisory "fix available via npm audit fix --force" installs prisma@6.12.0 (downgrade = breaking). No fixed version exists on the Prisma 7 line: @prisma/config@7.10.0-integration-prisma7-project-closeout.10 still pins deepmerge-ts@7.1.5.

## Experiment A — npm overrides (WORKS, recommended)
Added to package.json: `"overrides": { "deepmerge-ts": "8.0.1" }`
Results:
- `npm audit --omit=dev` → **found 0 vulnerabilities** (all 3 HIGH gone; prisma remains 7.9.1)
- `deepmerge-ts@8.0.1` resolved as overridden under prisma → @prisma/config → deepmerge-ts@8.0.1 overridden
- `npm run db:validate` → schema valid
- `npm run db:generate` → Prisma Client (7.9.1) generated successfully
- `npm run typecheck` → clean; `VERCEL=1 npm run build` → static pages 71/71 OK
- Diff: package.json (+4 lines, overrides block; lost trailing newline) and package-lock.json (+13/-3 lines). No source code changes.
Runtime risk: low — deepmerge-ts 8 keeps the same default API (deepMerge). Prisma's config loader only uses it for merging user+default config. Validate+generate+typecheck+build all pass locally.

## Experiment B — prisma CLI 8.0.0-rc.6 (DO NOT DO, failed)
- prisma@8 is a totally different product: unified `prisma` CLI (formerly prisma-cli), repo no longer publishes the ORM CLI. `prisma validate`/`generate` → "CLI.UNKNOWN_COMMAND" (commands unregistered).
- @prisma/client has NO 8.x versions on npm registry — our generated/prisma client + @prisma/client@^7.0.0 would break.
- Installing prisma@8 broke the dev CLI entirely; also left audit with MORE high vulns (@hono/node-server via @prisma/dev/alchemy/composer chain — dev-only but noisy).
- Prisma 8 config shape changed: requires prisma.config.ts envelope `definePrismaConfig({ orm: ormConfig(...) })`; our prisma.config.ts is the Prisma 7 shape.
Conclusion: Prisma 8 is an RC, different product, breaking; not safe for production now.

## Recommendation to present
Ship Experiment A (overrides block) — 0 vulns, zero code change, prisma stays at stable 7.9.1. Revisit real prisma 8 migration when it reaches stable and a migration recipe for prisma 7 → 8 (typed-sql/contract-based) is published.

## Env/context notes
- Dry-run branch: dry-run/prisma-upgrade (local sandbox only; working tree currently has overrides applied — package.json + lockfile changed; notes/game-header-improvement.md also modified on this branch).
- Nothing pushed. main untouched (b1a7960 latest).
- After presenting, decision needed: user may approve applying overrides on main + push/deploy, or decline.
