import { createClient } from '@supabase/supabase-js';

// Points at the standalone TruCoach-WhatsApp/directory project, NOT the
// main TruCoach project — the public website's academy search reads from
// a mirrored, 7-field `academy_directory` table there (kept in sync by a
// trigger on the main project's `academies` table), so it never queries
// the real production database at all.
const DIRECTORY_URL = import.meta.env.ACADEMY_DIRECTORY_URL || '';
const DIRECTORY_ANON_KEY = import.meta.env.ACADEMY_DIRECTORY_ANON_KEY || '';

export const isDirectoryConfigured = Boolean(DIRECTORY_URL && DIRECTORY_ANON_KEY);

export const directoryClient = isDirectoryConfigured
  ? createClient(DIRECTORY_URL, DIRECTORY_ANON_KEY, { auth: { persistSession: false } })
  : null;
