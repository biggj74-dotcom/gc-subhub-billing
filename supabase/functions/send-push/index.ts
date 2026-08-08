// Supabase Edge Function: sends an Expo push notification for a newly
// inserted `notifications` row. Invoked by the database webhook trigger in
// 0009_push_webhook.sql (supabase_functions.http_request on INSERT), which
// POSTs a payload shaped like:
//   { type: "INSERT", table: "notifications", record: {...}, schema: "public", old_record: null }
//
// Deploy with: supabase functions deploy send-push
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically to
// every Edge Function by the Supabase runtime — no manual secret needed for
// those two. Nothing else is required since Expo's push API needs no API key.

import { createClient } from 'npm:@supabase/supabase-js@2';

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
}

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: NotificationRecord;
}

Deno.serve(async (req) => {
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const record = payload.record;
  if (!record?.user_id) {
    return new Response('Missing record.user_id', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: user, error } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', record.user_id)
    .single();

  if (error || !user?.expo_push_token) {
    // No token on file (never registered, or on a simulator) — nothing to send.
    return new Response('No push token for user', { status: 200 });
  }

  const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: user.expo_push_token,
      title: record.title,
      body: record.body ?? undefined,
      data: { type: record.type, notificationId: record.id },
    }),
  });

  if (!pushResponse.ok) {
    const text = await pushResponse.text();
    return new Response(`Expo push API error: ${text}`, { status: 502 });
  }

  return new Response('ok', { status: 200 });
});
