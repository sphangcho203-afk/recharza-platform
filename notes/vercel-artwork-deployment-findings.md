# Vercel artwork deployment findings

Source: https://vercel.com/stand-still/recharza-platform/CF1jvdtubZpnHh4WJdN9KdKhaAQZ

The Vercel dashboard showed an older preview deployment error for branch `project-overview`, commit `a80c8f6`, with `Command "pnpm run build" exited with 1`. This was not the current `main` commit `d65be6d`; it was a stale preview deployment listed in the dashboard.

The current GitHub-triggered production workflow for commit `d65be6d` had CI success and the Vercel deploy step still in progress at the time of inspection. The canonical asset endpoint still returned the previous RGB file metadata (`content-length: 2738257`, `last-modified: Sat, 15 Aug 2026 21:52:24 GMT`), so the corrected RGBA artwork had not yet been confirmed live.
