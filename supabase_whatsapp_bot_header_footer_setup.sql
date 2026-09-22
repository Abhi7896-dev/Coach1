-- Adds optional header/footer to Automation Bot replies.
--
-- WhatsApp's free-form (non-template) messages have no native header/footer
-- component — that's a Template-only feature. This stores enough to
-- compose the practical equivalent when sending: an image message (with
-- the reply text as its caption) or a bold text/link line prepended to the
-- body, plus an italic footer line appended.
--
-- Run this once in Supabase Dashboard -> SQL Editor.

ALTER TABLE whatsapp_bot_rules
  ADD COLUMN IF NOT EXISTS header_type TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS header_value TEXT,
  ADD COLUMN IF NOT EXISTS footer_text TEXT;

ALTER TABLE whatsapp_bot_rules
  DROP CONSTRAINT IF EXISTS whatsapp_bot_rules_header_type_check;
ALTER TABLE whatsapp_bot_rules
  ADD CONSTRAINT whatsapp_bot_rules_header_type_check
  CHECK (header_type IN ('none', 'text', 'image', 'link'));
