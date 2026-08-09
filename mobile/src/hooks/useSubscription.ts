import { useMutation, useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { showError } from '../lib/errors';
import { useAuthStore } from '../stores/authStore';
import type { SubscriptionRow, UserRole } from '../types/database';

export function useSubscription() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['subscription', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as SubscriptionRow | null;
    },
  });
}

/** Opens Stripe Checkout for the given plan in the system browser. Resolves once the browser closes (success or cancel) — the actual subscription row lands via the stripe-webhook Edge Function shortly after. */
export function useStartCheckout() {
  return useMutation({
    mutationFn: async (plan: UserRole) => {
      const { data, error } = await supabase.functions.invoke<{ url: string }>('create-checkout-session', {
        body: { plan },
      });
      if (error) throw error;
      if (!data?.url) throw new Error('Checkout session did not return a URL');
      await WebBrowser.openBrowserAsync(data.url);
    },
    onError: showError,
  });
}
