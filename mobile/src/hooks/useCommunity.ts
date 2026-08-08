import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { CommunityPostRow } from '../types/database';

export type CommunityPostWithAuthor = CommunityPostRow & {
  author: { full_name: string | null; email: string } | null;
};

export function usePosts() {
  return useQuery({
    queryKey: ['community_posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*, author:users(full_name, email)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as CommunityPostWithAuthor[];
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (body: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('community_posts').insert({ author_id: userId, body });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
  });
}
