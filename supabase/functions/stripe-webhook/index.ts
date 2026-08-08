// Receives Stripe webhook events and syncs public.subscriptions.
//
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// (Stripe calls this directly — there's no Supabase user session to attach
// a JWT to. The Stripe signature check below is what actually authenticates
// the caller, same role JWT verification would normally play.)
//
// Then in the Stripe dashboard: Developers > Webhooks > add endpoint,
// pointing at https://<project-ref>.functions.supabase.co/stripe-webhook,
// subscribed to checkout.session.completed, customer.subscription.updated,
// and customer.subscription.deleted. Copy the resulting signing secret into:
//   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
// (STRIPE_SECRET_KEY must already be set from create-checkout-session.)

import Stripe from 'npm:stripe@17.5.0?target=deno';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { planForPriceId } from '../_shared/plans.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-12-18.acacia' });
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function upsertFromSubscription(
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price?.id;
  const plan = priceId ? planForPriceId(priceId) : null;

  await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan: plan ?? 'driver',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (err) {
    return new Response(`Signature verification failed: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      if (userId && customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(userId, customerId, subscription);
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();
      if (existing?.user_id) {
        await upsertFromSubscription(existing.user_id, customerId, subscription);
      }
      break;
    }
    default:
      break;
  }

  return new Response('ok', { status: 200 });
});
