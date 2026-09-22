-- WhatsApp 24-hour Customer Service Window tracking.
--
-- Deliberately minimal, matching whatsapp-inbox-webhook's existing
-- "no message history" policy: this stores ONLY a phone number and the
-- timestamp of the most recent inbound message from it — never message
-- content, never a history of messages. A row older than 24 hours is
-- useless (Meta's free-form reply window has already closed) and gets
-- deleted automatically by the same webhook call that would otherwise
-- read/write it, so nothing accumulates indefinitely.
--
-- Run this once in Supabase Dashboard -> SQL Editor.

CREATE TABLE IF NOT EXISTS whatsapp_session_windows (
  phone TEXT PRIMARY KEY,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_session_windows_last_message_at
  ON whatsapp_session_windows (last_message_at);

ALTER TABLE whatsapp_session_windows ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (matches whatsapp_bot_rules' policy shape).
-- No INSERT/UPDATE/DELETE policy is defined at all — the only writer is
-- the webhook edge function, which uses the service-role key and bypasses
-- RLS entirely, so there is no path for any authenticated client to write
-- to this table.
DROP POLICY IF EXISTS "Admins can view whatsapp session windows" ON whatsapp_session_windows;
CREATE POLICY "Admins can view whatsapp session windows"
  ON whatsapp_session_windows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
