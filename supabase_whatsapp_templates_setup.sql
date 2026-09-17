-- Run this once in Supabase Dashboard -> SQL Editor, alongside
-- supabase_user_activity_setup.sql.
--
-- Adds one column to the existing whatsapp_templates table so admins can
-- store/edit example values used to preview each template in the admin
-- console. Purely additive — safe to run even if the table already has rows.

alter table public.whatsapp_templates
  add column if not exists sample_variables jsonb not null default '[]'::jsonb;

comment on column public.whatsapp_templates.sample_variables is
  'Array of example strings substituted into {{1}}, {{2}}, ... when previewing this template in the admin console. Does NOT change the Meta-approved wording — only local preview data.';
