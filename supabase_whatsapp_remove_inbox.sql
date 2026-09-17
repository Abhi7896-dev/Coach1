-- Run this once in Supabase Dashboard -> SQL Editor, when you're ready.
--
-- Removes the WhatsApp Inbox feature entirely: the admin portal no longer
-- stores or shows any WhatsApp message history. Only the Automation Bot
-- (whatsapp_bot_rules) is kept — it doesn't depend on this table at all,
-- it matches inbound messages against rules and replies in the same
-- request, without persisting anything.
--
-- THIS PERMANENTLY DELETES any WhatsApp message history already stored.
-- There is no undo once this runs.

drop table if exists public.whatsapp_messages;
