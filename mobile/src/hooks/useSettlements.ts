import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showError } from '../lib/errors';
import { useAuthStore } from '../stores/authStore';
import type { SettlementRow } from '../types/database';

export type SettlementWithLoad = SettlementRow & {
  load: { origin: string; destination: string } | null;
};

/** The current driver's own settlements. */
export function useSettlements() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['settlements', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*, load:loads(origin, destination)')
        .eq('driver_id', userId as string)
        .order('paid_at', { ascending: false });
      if (error) throw error;
      return data as unknown as SettlementWithLoad[];
    },
  });
}

/** Whether a settlement already exists for this load — read via the "poster reads settlements for their loads" policy, so this only resolves usefully for the load's poster. */
export function useLoadSettlement(loadId: string) {
  return useQuery({
    queryKey: ['settlement', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('settlements').select('*').eq('load_id', loadId).maybeSingle();
      if (error) throw error;
      return data as SettlementRow | null;
    },
  });
}

export function useCreateSettlement(loadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ driverId, gross, deductions }: { driverId: string; gross: number; deductions: number }) => {
      const { error } = await supabase.from('settlements').insert({
        load_id: loadId,
        driver_id: driverId,
        gross,
        deductions,
        net: gross - deductions,
        paid_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlement', loadId] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
    onError: showError,
  });
}
