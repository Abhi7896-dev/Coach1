-- Run this once in Supabase Dashboard -> SQL Editor.
-- It creates a SECURITY DEFINER function that safely exposes last_sign_in_at
-- (and a few other auth fields) from the protected auth.users table — but
-- ONLY to callers who are already an admin. Anyone else calling it gets an
-- empty result, never another user's data. Nothing else from auth.users
-- (password hashes, tokens, etc.) is ever exposed.

create or replace function public.get_user_activity()
returns table (
  id uuid,
  email text,
  phone text,
  last_sign_in_at timestamptz,
  auth_created_at timestamptz,
  role text,
  full_name text
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    u.phone,
    u.last_sign_in_at,
    u.created_at as auth_created_at,
    -- p.role is the Postgres enum user_role; t.role is plain text — COALESCE
    -- can't mix an enum and text without an explicit cast on the enum side.
    coalesce(p.role::text, t.role) as role,
    coalesce(p.full_name, p.name, t.full_name, t.name) as full_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.tutors t on t.id = u.id
  where
    -- caller must themselves be an admin, checked server-side. profiles.role
    -- is the enum user_role (tutor/parent/admin/academy_admin/staff_coach/
    -- coach only — no 'superadmin' label exists there, so it must never
    -- appear in an IN(...) compared against that column).
    exists (
      select 1 from public.profiles ap
      where ap.id = auth.uid() and ap.role = 'admin'
    )
    or exists (
      select 1 from public.tutors at
      where at.id = auth.uid() and at.role = 'admin'
    );
$$;

-- Safe to grant broadly: the WHERE clause above means non-admins get zero rows.
grant execute on function public.get_user_activity() to authenticated;
