import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://boonnputmbbdrfnczipq.supabase.co';
export const SUPABASE_ANON_KEY =
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
  role: 'admin' | 'superadmin';
  isSuperAdmin: boolean;
  fullName?: string;
}

/**
 * Returns the admin's actual role tier ('admin' | 'superadmin'), or null if
 * this user isn't a platform admin at all. Checks both 'profiles' and
 * 'tutors' tables. Previously this only returned a boolean — every admin
 * was treated as identical regardless of what was actually in the database,
 * so there was no way to tell a root owner apart from any other admin.
 */
export async function getAdminRole(userId: string): Promise<'admin' | 'superadmin' | null> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.role === 'admin' || profile?.role === 'superadmin') {
      return profile.role;
    }

    const { data: tutor } = await supabase
      .from('tutors')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (tutor?.role === 'admin' || tutor?.role === 'superadmin') {
      return tutor.role;
    }

    return null;
  } catch (err) {
    console.error('[getAdminRole] Error checking admin role:', err);
    return null;
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

  const role = await getAdminRole(authRes.user.id);
  if (!role) {
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
    role,
    isSuperAdmin: role === 'superadmin',
    fullName: adminName,
  };
}

/**
 * Sends the login-time second-factor code to the just-authenticated admin's
 * own email, reusing the exact send-email-notification path already used
 * for the create-admin / change-password OTP flows — generated and compared
 * client-side (no server-side OTP state), same established pattern, same
 * threat model: this gates a password alone being enough to reach the
 * portal, not email ownership of the account.
 */
export async function sendAdminLoginOtp(adminUser: AdminUser): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const { error } = await supabase.functions.invoke('send-email-notification', {
    body: {
      action: 'email_verification_otp',
      to_email: adminUser.email,
      user_name: adminUser.fullName || 'Admin',
      otp: code,
    },
  });
  if (error) {
    throw new Error(error.message || 'Failed to send verification code.');
  }
  return code;
}

const ADMIN_2FA_SESSION_KEY = 'trucoach_admin_2fa_verified';

/** Marks THIS browser tab's session as having passed login-time 2FA. */
export function markAdmin2faVerified(): void {
  try {
    sessionStorage.setItem(ADMIN_2FA_SESSION_KEY, '1');
  } catch (_) {}
}

/**
 * Whether this tab's session has passed 2FA. Deliberately sessionStorage,
 * not localStorage — a closed tab/browser requires a fresh code next time,
 * same as requiring a fresh password; an open tab's own refresh does not.
 */
export function isAdmin2faVerified(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_2FA_SESSION_KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function clearAdmin2faVerified(): void {
  try {
    sessionStorage.removeItem(ADMIN_2FA_SESSION_KEY);
  } catch (_) {}
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
  clearAdmin2faVerified();
  await supabase.auth.signOut({ scope: 'global' });
}

/**
 * Retrieves the currently active session and checks admin role. Also
 * requires this tab to have already passed login-time 2FA (see
 * isAdmin2faVerified) — a Supabase session alone (e.g. restored in a fresh
 * tab from localStorage) is not treated as a complete login; the caller is
 * expected to send the admin back through the OTP step if this returns null
 * while a Supabase auth session still technically exists.
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  if (!isAdmin2faVerified()) return null;

  const role = await getAdminRole(session.user.id);
  if (!role) return null;

  const [{ data: prof }, { data: tut }] = await Promise.all([
    supabase.from('profiles').select('full_name, name').eq('id', session.user.id).maybeSingle(),
    supabase.from('tutors').select('name, full_name, phone').eq('id', session.user.id).maybeSingle(),
  ]);

  const adminName = prof?.full_name || prof?.name || tut?.full_name || tut?.name || 'Platform Admin';

  return {
    id: session.user.id,
    email: session.user.email || '',
    phone: tut?.phone,
    role,
    isSuperAdmin: role === 'superadmin',
    fullName: adminName,
  };
}
