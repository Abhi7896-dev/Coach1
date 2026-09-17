-- Run this once in Supabase Dashboard -> SQL Editor, when you're ready.
--
-- Adds one index that the existing automation_logs indexes don't cover.
-- automation_logs already has (tutor_id, sent_at desc) and
-- (student_id, sent_at desc) — both great for per-coach/per-student lookups,
-- but useless for a platform-wide "how many messages went out in the last
-- N days?" query, which filters/sorts on sent_at alone with no tutor_id or
-- student_id equality filter. Two admin-portal reads do exactly that:
--   - AdminPortal.tsx's Quick Access "Message Logs (7d)" count
--   - MessageLogsDashboard.tsx's full log listing (LIMIT 2000)
-- Both currently can't use either composite index for that filter/sort and
-- fall back to scanning every row. This index fixes both at once.

create index if not exists idx_automation_logs_sent_at
  on public.automation_logs (sent_at desc);
