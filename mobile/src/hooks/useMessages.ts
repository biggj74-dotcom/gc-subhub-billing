import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useMyLoads } from './useLoads';
import type { MessageRow } from '../types/database';

export type MessageWithSender = MessageRow & {
  sender: { full_name: string | null; email: string } | null;
};

/** Load conversations: the user's loads that actually have a workspace (i.e. a driver has been assigned). */
export function useConversations() {
  const myLoads = useMyLoads();
  return {
    ...myLoads,
    data: myLoads.data?.filter((l) => l.status === 'booked' || l.status === 'en_route' || l.status === 'delivered'),
  };
}

export function useMessages(loadId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['messages', loadId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users(full_name, email)')
        .eq('load_id', loadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as unknown as MessageWithSender[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${loadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `load_id=eq.${loadId}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId]);

  return query;
}

export function useSendMessage(loadId: string) {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (body: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('messages').insert({ load_id: loadId, sender_id: userId, body });
      if (error) throw error;
    },
  });
}
