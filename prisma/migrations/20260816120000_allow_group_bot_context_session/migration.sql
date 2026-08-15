-- Group bot conversations persist their state in SupportBotSession with step = CONTEXT.
-- The original support-bot hardening migration only allowed the private draft steps,
-- causing group webhook processing to fail before its reply was sent.
ALTER TABLE "SupportBotSession"
  DROP CONSTRAINT IF EXISTS "SupportBotSession_step_check";

ALTER TABLE "SupportBotSession"
  ADD CONSTRAINT "SupportBotSession_step_check"
  CHECK ("step" IN ('TITLE', 'ORDER', 'DESCRIPTION', 'REVIEW', 'CONTEXT'));
