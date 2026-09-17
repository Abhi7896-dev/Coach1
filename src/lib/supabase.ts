import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://boonnputmbbdrfnczipq.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvb25ucHV0bWJiZHJmbmN6aXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzEyNTIsImV4cCI6MjEwMjIwNzI1Mn0.9h1e-V63bKsrSsgh0axp-omjouiAq2PG1EjhEMIXijA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface AdminUser {
  id: string;
  email: string;
  phone?: string;
  role: string;
  fullName?: string;
}

/**
 * Checks if the specified user has admin privileges.
 * Validates both 'profiles' and 'tutors' tables.
 */
export async function verifyAdminRole(userId: string): Promise<boolean> {
  try {
    // 1. Check profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile && (profile.role === 'admin' || profile.role === 'superadmin')) {
      return true;
    }

    // 2. Check tutors table
    const { data: tutor } = await supabase
      .from('tutors')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (tutor && (tutor.role === 'admin' || tutor.role === 'superadmin')) {
      return true;
    }

    return false;
  } catch (err) {
    console.error('[verifyAdminRole] Error checking admin role:', err);
    return false;
  }
}

/**
 * Signs in using email OR 10-digit mobile number + password, then verifies admin role.
 */
export async function signInAdmin(identifier: string, password: string): Promise<AdminUser> {
  const input = identifier.trim();
  const isEmail = input.includes('@');
  let authRes;

  if (isEmail) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.toLowerCase(),
      password,
    });
    if (error) throw new Error(error.message);
    authRes = data;
  } else {
    // Treat as phone number
    const cleanPhone = input.replace(/[^0-9]/g, '');
    const p10 = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

    let resolvedEmail: string | null = null;
    try {
      const { data: rpcEmail } = await supabase.rpc('get_email_for_phone', { p_phone: p10 });
      if (rpcEmail && rpcEmail.includes('@')) {
        resolvedEmail = rpcEmail.trim();
      }
    } catch (_) {}

    if (resolvedEmail) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail.toLowerCase(),
        password,
      });
      if (!error && data.user) {
        authRes = data;
      }
    }

    // Try direct phone login variants if email resolution was not successful
    if (!authRes || !authRes.user) {
      const phoneCandidates = [`+91${p10}`, p10, `91${p10}`];
      let lastErr = null;
      for (const ph of phoneCandidates) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            phone: ph,
            password,
          });
          if (!error && data.user) {
            authRes = data;
            break;
          } else if (error) {
            lastErr = error;
          }
        } catch (_) {}
      }
      if (!authRes || !authRes.user) {
        throw new Error(lastErr?.message || 'Invalid credentials. Please verify your admin email/phone and password.');
      }
    }
  }

  if (!authRes?.user) {
    throw new Error('Authentication failed: No user returned');
  }

  const isAdmin = await verifyAdminRole(authRes.user.id);
  if (!isAdmin) {
    await supabase.auth.signOut();
    throw new Error('Access Denied: This account does not have Platform Admin privileges in TruCoach.');
  }

  // Fetch admin name from tutors or profiles
  let adminName = 'Platform Admin';
  const [{ data: prof }, { data: tut }] = await Promise.all([
    supabase.from('profiles').select('full_name, name').eq('id', authRes.user.id).maybeSingle(),
    supabase.from('tutors').select('name, full_name, phone').eq('id', authRes.user.id).maybeSingle(),
  ]);

  adminName = prof?.full_name || prof?.name || tut?.full_name || tut?.name || 'Platform Admin';

  return {
    id: authRes.user.id,
    email: authRes.user.email || input,
    phone: tut?.phone,
    role: 'admin',
    fullName: adminName,
  };
}

/**
 * Signs out the current admin user — and actually tears down the session,
 * not just the local UI state:
 *
 * 1. Closes every open Realtime channel/websocket this client holds (the
 *    WhatsApp Inbox live-message channel, the unread-count channel, or any
 *    future one) — otherwise those sockets can outlive the "logged out"
 *    screen for a moment, still authenticated as this user.
 * 2. Revokes the session server-side with `scope: 'global'` (explicit, even
 *    though it's already the client default) — this invalidates the
 *    refresh token in GoTrue immediately, so it can never be used again to
 *    mint a new access token, and clears the session out of local storage.
 *
 * One honest limitation: a JWT access token is a self-contained, signed,
 * stateless credential — Supabase (like virtually every JWT-based system)
 * doesn't check a server-side revocation list on every request, so an
 * *already-issued* access token that somehow leaked elsewhere stays
 * cryptographically valid until its own short expiry (Supabase's default is
 * 1 hour), even after this runs. What this DOES immediately and completely
 * kill is the ability to get a NEW access token from this session ever
 * again, and every connection this browser tab itself was holding.
 */
export async function signOutAdmin(): Promise<void> {
  try {
    await supabase.removeAllChannels();
  } catch (_) {}
  await supabase.auth.signOut({ scope: 'global' });
}

/**
 * Retrieves the currently active session and checks admin role.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const isAdmin = await verifyAdminRole(session.user.id);
  if (!isAdmin) return null;

  const [{ data: prof }, { data: tut }] = await Promise.all([
    supabase.from('profiles').select('full_name, name').eq('id', session.user.id).maybeSingle(),
    supabase.from('tutors').select('name, full_name, phone').eq('id', session.user.id).maybeSingle(),
  ]);

  const adminName = prof?.full_name || prof?.name || tut?.full_name || tut?.name || 'Platform Admin';

  return {
    id: session.user.id,
    email: session.user.email || '',
    phone: tut?.phone,
    role: 'admin',
    fullName: adminName,
  };
}
