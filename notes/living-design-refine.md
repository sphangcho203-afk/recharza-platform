# Living design — restraint refinement (user: "i didn't told you to add glows, make it better")

## User intent
Remove glow overload; improve real design craft: layout, spacing, typography, subtle motion. Not "no motion" — just quiet, premium.

## Spec per surface
1. living-backdrop.tsx: REWRITTEN. Aurora reduced to 2 wide faint orbs (0.10/0.07 opacity, blur 72px). Removed ParticleField and ElectricSweep entirely. LiveGlowCard now: hairline accent gradient at top that fills on hover, no inset glow box, no sheen.
2. game-card.tsx: DONE — removed sweep/particles/hover orbs; single 1px accent hairline top edge; arrow chip quiet (border white/12 -> white/22 on hover); button hover = translateY(-1px) only.
3. education section (components/game-education-section.tsx): TODO — remove Tile drifts (2 aurora orbs + 2 particles + sweep each) → one faint section aurora via AuroraGradient in parent; keep icon squares quiet (remove boxShadow radial glow); steps timeline keep numbered circles solid accent, connector line neutral opacity-20; region note remove its aurora orb.
4. app/page.tsx how-it-works: TODO — remove per-card particles + sweep + heavy orb; use AuroraGradient once on section or thin hairline per card; keep icon square quiet; step number subtle.
5. customer-dashboard.tsx: TODO — nav rows: remove aurora orb + sweep per tile; stat tiles: remove orb + sweep; order card status ring recharza-status-ring OK keep subtle; "recharza-electric-btn" usage → plain hover.
6. mobile-nav-menu.tsx: TODO — drawer background keeps 2 soft orbs (already quiet); link rows remove sweep if added.

## Remaining steps
- Edit education section, page.tsx how-it-works, customer-dashboard, mobile-nav-menu (strip recharza-aurora-drift/recharza-particle/recharza-line-sweep inline usages).
- npm run typecheck && npm run lint && VERCEL=1 npm run build
- git add -A && commit "refine: quiet living design — light and motion quality over glow density" && git push origin main
- source /home/ubuntu/.vercel_api.sh && python3 /home/ubuntu/scripts/monitor_deploy.py
- verify live + E2E 45/45 + mail-health probe; screenshots -> result.

## Notes
- Deployment before this: recharza-platform-lhrb2ehoi-stand-still.vercel.app (commit a4c6ef4)
- E2E harness: python3 scripts/e2e-suite.py <url>; mail-health: curl -H "Authorization: Bearer rcz-probe-7k3m9q2x" https://<url>/api/internal/mail-health
