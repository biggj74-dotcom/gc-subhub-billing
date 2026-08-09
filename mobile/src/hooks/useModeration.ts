import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showError } from '../lib/errors';
import { makeL } from '../i18n/dict';
import { useLanguageStore } from '../i18n/useLanguage';
import { useAuthStore } from '../stores/authStore';
import type { UserBlockRow } from '../types/database';

export type BlockedUserWithProfile = UserBlockRow & {
  blocked: { full_name: string | null; email: string } | null;
};

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return !!err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === UNIQUE_VIOLATION;
}

export function useReportPost() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async ({ postId, reason }: { postId: string; reason: string }) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('community_post_reports').insert({ post_id: postId, reporter_id: userId, reason });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
    onError: (err) => {
      if (isUniqueViolation(err)) {
        const L = makeL(useLanguageStore.getState().lang);
        Alert.alert(L('alreadyReportedTitle'), L('alreadyReportedBody'));
        return;
      }
      showError(err);
    },
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('user_blocks').insert({ blocker_id: userId, blocked_id: blockedId });
      if (error && !isUniqueViolation(error)) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blocked_users'] });
    },
    onError: showError,
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', userId).eq('blocked_id', blockedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
      queryClient.invalidateQueries({ queryKey: ['blocked_users'] });
    },
    onError: showError,
  });
}

export function useBlockedUsers() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['blocked_users', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*, blocked:users!user_blocks_blocked_id_fkey(full_name, email)')
        .eq('blocker_id', userId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BlockedUserWithProfile[];
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('community_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    },
    onError: showError,
  });
}
