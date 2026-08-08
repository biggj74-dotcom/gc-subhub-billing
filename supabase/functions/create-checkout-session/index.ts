// Creates a Stripe Checkout Session for one of the app's subscription
// tiers. Deploy with: supabase functions deploy create-checkout-session
// (JWT verification stays ON, unlike send-push/stripe-webhook — this is
// called directly from the signed-in app via supabase.functions.invoke(),
// which attaches the user's own access token).
//
// Requires these Edge Function secrets:
//   STRIPE_SECRET_KEY               (sk_... from the Stripe dashboard)
//   STRIPE_PRICE_DRIVER / _DISPATCHER / _FLEET / _BROKER  (see _shared/plans.ts)

import Stripe from 'npm:stripe@17.5.0?target=deno';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { priceIdForPlan } from '../_shared/plans.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user?.email) {
    return new Response('Not authenticated', { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const priceId = body.plan ? priceIdForPlan(body.plan) : null;
  if (!priceId) {
    return new Response(`Unknown or unconfigured plan: ${body.plan}`, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: 'gcsubhub-trucking://profile?checkout=success',
    cancel_url: 'gcsubhub-trucking://profile?checkout=cancel',
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
