import { directoryClient } from './directoryClient';

export interface AcademyRosterCoach {
  id: string;
  name: string | null;
  designation: string | null;
  profile_image_url: string | null;
  years_of_experience: number | null;
  sports_offered: string[] | null;
  is_verified: boolean | null;
}

export interface DirectoryAcademy {
  id: string;
  slug: string | null;
  name: string;
  logo_url: string | null;
  description: string | null;
  sports_offered: string[] | null;
  locality: string | null;
  pincode: string | null;
  coaches: AcademyRosterCoach[];
}

export interface DirectoryCoach {
  id: string;
  slug: string | null;
  name: string | null;
  academy_name: string | null;
  designation: string | null;
  bio: string | null;
  profile_image_url: string | null;
  locality: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  sports_offered: string[] | null;
  years_of_experience: number | null;
  total_students_taught: number | null;
  achievements: string[] | null;
  title_tags: string[] | null;
  gallery_urls: string[] | null;
  certification_urls: string[] | null;
  is_verified: boolean | null;
  social_link: string | null;
}

// Every read here goes to the standalone directory project, never the main
// TruCoach project — see src/lib/directoryClient.ts.
export async function searchAcademies(query: string, limit = 24): Promise<DirectoryAcademy[]> {
  if (!directoryClient) return [];
  let builder = directoryClient
    .from('academy_directory')
    .select('id, slug, name, logo_url, description, sports_offered, locality, pincode, coaches')
    .order('updated_at', { ascending: false })
    .limit(limit);
  const term = query.trim();
  if (term) {
    builder = builder.or(`name.ilike.%${term}%,locality.ilike.%${term}%,pincode.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data || [];
}

export async function searchCoaches(query: string, limit = 24): Promise<DirectoryCoach[]> {
  if (!directoryClient) return [];
  let builder = directoryClient.from('coach_directory').select('*').order('updated_at', { ascending: false }).limit(limit);
  const term = query.trim();
  if (term) {
    builder = builder.or(
      `name.ilike.%${term}%,locality.ilike.%${term}%,pincode.ilike.%${term}%,academy_name.ilike.%${term}%,bio.ilike.%${term}%`
    );
  }
  const { data, error } = await builder;
  if (error) throw new Error(error.message);
  return data || [];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Looked up by slug (the pretty, shareable URL segment) with a fallback to
// raw id — so an already-shared /academy/<uuid> link (or the admin's own
// "Copy Link" before a slug existed) keeps working. `id` is a UUID column,
// so an id.eq. filter is only safe to include when slugOrId actually looks
// like one — otherwise PostgREST rejects the whole OR clause as a type error.
export async function getAcademyBySlugOrId(slugOrId: string): Promise<DirectoryAcademy | null> {
  if (!directoryClient) return null;
  const filter = UUID_RE.test(slugOrId) ? `slug.eq.${slugOrId},id.eq.${slugOrId}` : `slug.eq.${slugOrId}`;
  const { data, error } = await directoryClient.from('academy_directory').select('*').or(filter).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getCoachBySlugOrId(slugOrId: string): Promise<DirectoryCoach | null> {
  if (!directoryClient) return null;
  const filter = UUID_RE.test(slugOrId) ? `slug.eq.${slugOrId},id.eq.${slugOrId}` : `slug.eq.${slugOrId}`;
  const { data, error } = await directoryClient.from('coach_directory').select('*').or(filter).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
