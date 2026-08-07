import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { LoadRow } from '../types/database';

export function useOpenLoads() {
  return useQuery({
    queryKey: ['loads', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoadRow[];
    },
  });
}

/** Loads relevant to the current user: assigned to them (driver) or posted by them (dispatcher/fleet/broker). */
export function useMyLoads() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const role = useAuthStore((s) => s.profile?.role);

  return useQuery({
    queryKey: ['loads', 'mine', userId, role],
    enabled: !!userId,
    queryFn: async () => {
      const column = role === 'driver' ? 'assigned_driver_id' : 'posted_by_id';
      const { data, error } = await supabase
        .from('loads')
        .select('*')
        .eq(column, userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoadRow[];
    },
  });
}

export function useLoadOffers(loadId: string) {
  return useQuery({
    queryKey: ['load_offers', loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('load_offers')
        .select('*')
        .eq('load_id', loadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitOffer(loadId: string) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (offeredRate: number) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('load_offers').insert({
        load_id: loadId,
        driver_id: userId,
        offered_rate: offeredRate,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['load_offers', loadId] });
    },
  });
}

export function useCreateLoad() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (load: Pick<LoadRow, 'origin' | 'destination' | 'miles' | 'rate' | 'equipment_type' | 'weight' | 'pickup_date' | 'hazmat'>) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('loads').insert({ ...load, posted_by_id: userId, status: 'open' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] });
    },
  });
}
