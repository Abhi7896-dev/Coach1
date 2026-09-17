// Edge Function: whatsapp-meta-templates
//
// Proxies Meta's WhatsApp Business Cloud API to fetch your real, approved
// message templates (name, language, category, body text, and Meta's own
// example variable values). This MUST run server-side — a Meta access
// token must never be shipped in client-side JS, where anyone opening dev
// tools could read and reuse it.
//
// Deploy with the Supabase CLI:
//   supabase functions deploy whatsapp-meta-templates
//
// Then set these two secrets (Supabase Dashboard -> Edge Functions ->
// whatsapp-meta-templates -> Secrets, or `supabase secrets set`):
//   META_WHATSAPP_TOKEN  - a Meta System User or long-lived access token
//                          with whatsapp_business_management permission
//   META_WABA_ID         - your WhatsApp Business Account ID
//
// The admin console calls this via:
//   supabase.functions.invoke('whatsapp-meta-templates')

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    // Verify the caller is a signed-in admin before touching Meta at all —
    // same admin-role check used by the rest of this app's own tables.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const [{ data: profile }, { data: tutor }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('tutors').select('role').eq('id', user.id).maybeSingle(),
    ]);
    const role = (profile?.role || tutor?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'superadmin') {
      throw new Error('Forbidden: admin access required');
    }

    const META_TOKEN = Deno.env.get('META_WHATSAPP_TOKEN');
    const WABA_ID = Deno.env.get('META_WABA_ID');
    if (!META_TOKEN || !WABA_ID) {
      throw new Error(
        'META_WHATSAPP_TOKEN / META_WABA_ID secrets are not configured on this function yet.'
      );
    }

    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${WABA_ID}/message_templates?limit=100`,
      { headers: { Authorization: `Bearer ${META_TOKEN}` } }
    );
    const metaJson = await metaRes.json();
    if (!metaRes.ok) {
      throw new Error(metaJson?.error?.message || 'Meta Graph API request failed');
    }

    return new Response(
      JSON.stringify({ success: true, templates: metaJson.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
