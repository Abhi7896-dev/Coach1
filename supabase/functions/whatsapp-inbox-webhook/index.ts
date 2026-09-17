// Edge Function: whatsapp-inbox-webhook
//
// Automation Bot ONLY — this deliberately does not store or log any
// message anywhere. It exists purely to let Meta deliver inbound WhatsApp
// messages so whatsapp_bot_rules can be checked and a matching canned
// reply sent back. No admin-facing inbox, no message history in this
// project's database, by design.
//
// NOTE: this Supabase project also has its own "whatsapp-webhook" function
// (deployed from the TruCoach mobile app's backend). This function is
// named differently on purpose — whatsapp-inbox-webhook — so deploying it
// never overwrites that one. See the IMPORTANT note below about which
// webhook URL you actually register with Meta, since Meta only calls ONE
// callback URL per number. (The name is a holdover from when this also
// ran an inbox feature — kept as-is so the already-registered Meta webhook
// URL doesn't need to change again; rename later if you want, just
// re-register the new URL with Meta when you do.)
//
// This is the endpoint Meta calls directly — every incoming WhatsApp message
// lands here. It must be publicly reachable with NO Supabase auth required
// (Meta has no way to send a Supabase JWT), so deploy it with JWT
// verification disabled:
//
//   supabase functions deploy whatsapp-inbox-webhook --no-verify-jwt
//
// Then, in Meta App Dashboard -> WhatsApp -> Configuration -> Webhook:
//   Callback URL:  https://<your-project-ref>.supabase.co/functions/v1/whatsapp-inbox-webhook
//   Verify token:  must match WHATSAPP_VERIFY_TOKEN secret below
//   Subscribe to:  "messages" field
//
// IMPORTANT: Meta lets you register only one webhook callback URL per
// WhatsApp phone number. If TruCoach's mobile app and this admin portal use
// the SAME Meta phone number, registering this URL replaces whatever URL is
// currently registered. If they use DIFFERENT phone numbers, there's no
// conflict at all. Confirm which setup you have before registering this.
//
// Secrets — this project already has these set (from TruCoach's own
// whatsapp-webhook / send-whatsapp-message functions), and since this is
// the SAME Meta WhatsApp Business number, this function deliberately reuses
// them instead of asking you to duplicate them under new names:
//   WHATSAPP_VERIFY_TOKEN         - whatever you already use for Meta's webhook verify handshake
//                                    (falls back to META_WEBHOOK_VERIFY_TOKEN if you'd rather set a distinct one)
//   META_APP_SECRET               - from Meta App Dashboard -> App Settings -> Basic;
//                                    used to verify the X-Hub-Signature-256 header
//                                    so random requests can't fake being Meta
//   META_WHATSAPP_ACCESS_TOKEN    - same token send-whatsapp-message already uses (falls back to WHATSAPP_API_KEY, then META_WHATSAPP_TOKEN)
//   META_WHATSAPP_PHONE_NUMBER_ID - same phone number id send-whatsapp-message already uses (falls back to META_PHONE_NUMBER_ID)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically to
// every edge function — used here only to call the check_rate_limit RPC
// and to read whatsapp_bot_rules. Nothing is ever written to the database
// by this function.

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const url = new URL(req.url);

  // --- Meta's one-time webhook verification handshake ---
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const expected = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || Deno.env.get('META_WEBHOOK_VERIFY_TOKEN');

    if (mode === 'subscribe' && token && expected && token === expected) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // --- Real message events ---
  if (req.method === 'POST') {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Abuse/DoS backstop, same pattern as TruCoach's own whatsapp-webhook —
    // a coarse cap so a flood of requests (signed or not) can't hammer this
    // function indefinitely. The signature check below is the real
    // proof-of-origin; this just bounds the damage before that even runs.
    try {
      const { data: withinLimit, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
        p_key: 'whatsapp_inbox_webhook_inbound',
        p_max_requests: 300,
        p_window_seconds: 60,
      });
      if (!rateLimitError && withinLimit === false) {
        console.warn('whatsapp-inbox-webhook: inbound rate limit exceeded — possible flood/abuse.');
        return new Response(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (_) {
      // Rate limiting is a backstop, not the primary defense — never block
      // legitimate traffic just because this check itself failed.
    }

    const bodyText = await req.text();

    const signatureHeader = req.headers.get('x-hub-signature-256') || '';
    const appSecret = Deno.env.get('META_APP_SECRET');
    if (!appSecret) {
      // Hard-fail instead of silently accepting unsigned requests — an
      // unset secret must never be treated as "verification not required."
      console.error('whatsapp-inbox-webhook: META_APP_SECRET is not configured — rejecting inbound webhook.');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const valid = await verifySignature(bodyText, signatureHeader, appSecret);
    if (!valid) {
      console.error('whatsapp-inbox-webhook: signature verification failed');
      return new Response('Invalid signature', { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    try {
      const entries = payload.entry || [];
      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const value = change.value || {};

          // Inbound messages from users — checked against the bot rules
          // and replied to directly; nothing is persisted anywhere.
          for (const msg of value.messages || []) {
            const body =
              msg.text?.body ??
              msg.button?.text ??
              msg.interactive?.button_reply?.title ??
              msg.interactive?.list_reply?.title ??
              null;

            try {
              await maybeSendAutomatedReply(supabase, msg.from, body);
            } catch (err) {
              console.error('whatsapp-inbox-webhook: automated reply failed', err);
            }
          }

          // Delivery status updates (sent/delivered/read/failed) for
          // messages this app sent — nothing to do with them since there's
          // no message log to update. Intentionally ignored.
        }
      }
    } catch (err) {
      // Log but still return 200 below — Meta retries aggressively on
      // non-200 responses, which would just redeliver the same payload.
      console.error('whatsapp-inbox-webhook: error processing payload', err);
    }

    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method Not Allowed', { status: 405 });
});

// A rule's `keyword` field supports multiple comma-separated alternates
// (e.g. "fees, fee, payment" or "hi, hello, hey") — matches if ANY of them
// hits. Also strips stray quote marks around a token, since typing
// "hi", "hello" (quoted, as one might copy from an example) is a common
// way to write this and should still work as intended rather than being
// matched literally.
function splitKeywords(raw: string | null | undefined): string[] {
  return (raw || '')
    .split(',')
    .map((k) => k.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim().toLowerCase())
    .filter((k) => k.length > 0);
}

// Checks active whatsapp_bot_rules for a keyword match against an inbound
// message body and, if one hits, sends that rule's canned reply via Meta.
// No-op if body is empty, no rule matches, or the Meta secrets aren't
// configured yet. Does not write anything to the database.
async function maybeSendAutomatedReply(
  supabase: ReturnType<typeof createClient>,
  toPhone: string,
  body: string | null
): Promise<void> {
  const text = (body || '').trim();
  if (!text || !toPhone) return;

  const { data: rules, error } = await supabase
    .from('whatsapp_bot_rules')
    .select('keyword, match_type, reply_message')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error || !rules || rules.length === 0) return;

  const lowerText = text.toLowerCase();
  const matched = rules.find((r: any) => {
    const keywords = splitKeywords(r.keyword);
    if (keywords.length === 0) return false;
    return keywords.some((kw) => (r.match_type === 'exact' ? lowerText === kw : lowerText.includes(kw)));
  });
  if (!matched) return;

  // Per-sender cap on auto-replies — stops one phone number from repeatedly
  // triggering the bot (accidentally or deliberately) from running up paid
  // Meta conversations or flooding that number with replies.
  try {
    const { data: withinLimit, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_key: `whatsapp_bot_reply:${toPhone}`,
      p_max_requests: 5,
      p_window_seconds: 60,
    });
    if (!rateLimitError && withinLimit === false) {
      console.warn(`whatsapp-inbox-webhook: bot reply rate limit hit for ${toPhone} — skipping auto-reply.`);
      return;
    }
  } catch (_) {
    // Backstop only — don't block a legitimate reply just because this check failed.
  }

  const META_TOKEN =
    Deno.env.get('META_WHATSAPP_ACCESS_TOKEN') || Deno.env.get('WHATSAPP_API_KEY') || Deno.env.get('META_WHATSAPP_TOKEN');
  const PHONE_NUMBER_ID = Deno.env.get('META_WHATSAPP_PHONE_NUMBER_ID') || Deno.env.get('META_PHONE_NUMBER_ID');
  if (!META_TOKEN || !PHONE_NUMBER_ID) {
    console.warn('whatsapp-inbox-webhook: bot rule matched but no Meta WhatsApp token/phone-number-id secret is set — skipping send.');
    return;
  }

  await fetch(`https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${META_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'text',
      text: { body: matched.reply_message },
    }),
  });
}

async function verifySignature(body: string, signatureHeader: string, secret: string): Promise<boolean> {
  const expectedSig = signatureHeader.replace('sha256=', '');
  if (!expectedSig) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const computedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time-ish comparison (length-checked first) to avoid trivial timing leaks.
  if (computedSig.length !== expectedSig.length) return false;
  let diff = 0;
  for (let i = 0; i < computedSig.length; i++) {
    diff |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return diff === 0;
}
