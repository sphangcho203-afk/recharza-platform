# Quick Reply Deploy & Migration State (Aug 18, 2026)

## Commits pushed
- 02a4a23 fix: synchronize primary Telegram support bot
- 17b2c3b feat: add Telegram Quick Reply relay for staff group responses
- Both pushed to origin/main; GitHub: sphangcho203-afk/recharza-platform

## Vercel deployment
- Commit 17b2c3b → deployment recharza-platform-kivzbopi1-stand-still.vercel.app
- Status: Ready (verified 1m after push)
- Production URL: https://recharza-platform-fuvjqou63-stand-still.vercel.app (promoted production domain)

## Migration to apply
- prisma/migrations/20260818100000_staff_telegram_quick_reply/migration.sql
- Creates table "StaffReplyRequest" (workerChatId, workerUserId PK; ticketPublicId; createdAt; updatedAt; expiresAt) + index StaffReplyRequest_expiresAt_idx

## Next steps
1. Apply migration via Neon MCP SQL (production Neon recharza DB).
2. Verify /api/telegram/health and health on production URL.
3. Report to user.
