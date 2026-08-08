// Maps the app's 4 subscription tiers (which reuse the user_role enum —
// see 0001_schema.sql) to Stripe Price IDs, configured as Edge Function
// secrets. You create these Prices yourself in the Stripe dashboard
// (Products > add a recurring monthly price for each tier), then:
//   supabase secrets set STRIPE_PRICE_DRIVER=price_...
//   supabase secrets set STRIPE_PRICE_DISPATCHER=price_...
//   supabase secrets set STRIPE_PRICE_FLEET=price_...
//   supabase secrets set STRIPE_PRICE_BROKER=price_...
export type PlanId = 'driver' | 'dispatcher' | 'fleet' | 'broker';

const PLAN_IDS: PlanId[] = ['driver', 'dispatcher', 'fleet', 'broker'];

export function priceIdForPlan(plan: string): string | null {
  if (!PLAN_IDS.includes(plan as PlanId)) return null;
  return Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) ?? null;
}

export function planForPriceId(priceId: string): PlanId | null {
  for (const plan of PLAN_IDS) {
    if (Deno.env.get(`STRIPE_PRICE_${plan.toUpperCase()}`) === priceId) return plan;
  }
  return null;
}
