-- Run this once in Supabase Dashboard -> SQL Editor.
--
-- Creates the rule table for the "Automation Bot": admin-defined
-- keyword -> canned-reply rules that whatsapp-inbox-webhook checks against
-- every USER-INITIATED inbound message and auto-replies to, with no Meta
-- template needed (Meta always allows a free-form reply within 24h of the
-- user's own message — which this always is, by construction).
--
-- This is the ONLY table the Automation Bot needs — by design there is no
-- message inbox/history table alongside it. Inbound messages are matched
-- against these rules and replied to in the same request; nothing is
-- persisted.

create table if not exists public.whatsapp_bot_rules (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,                              -- what to match in the inbound message body
  match_type text not null default 'contains'
    check (match_type in ('exact', 'contains')),
  reply_message text not null,                         -- canned text sent back verbatim
  is_active boolean not null default true,
  priority int not null default 0,                     -- higher checked first; first match wins
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_bot_rules_active_priority_idx
  on public.whatsapp_bot_rules(is_active, priority desc);

alter table public.whatsapp_bot_rules enable row level security;

-- Admins manage rules directly from the admin console (same pattern as
-- whatsapp_templates in the main schema) — full CRUD gated on role.
-- profiles.role is the Postgres enum user_role (tutor/parent/admin/
-- academy_admin/staff_coach/coach only — no 'superadmin' label exists, so
-- it must never appear in an IN(...) compared against that column).
drop policy if exists "Admins manage whatsapp bot rules" on public.whatsapp_bot_rules;
create policy "Admins manage whatsapp bot rules"
  on public.whatsapp_bot_rules for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.tutors t where t.id = auth.uid() and t.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    or exists (select 1 from public.tutors t where t.id = auth.uid() and t.role = 'admin')
  );
