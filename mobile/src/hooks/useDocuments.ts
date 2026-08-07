import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { File } from 'expo-file-system';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { DocumentRow, DocumentType } from '../types/database';

export function useDocuments() {
  const userId = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['documents', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId as string)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data as DocumentRow[];
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);

  return useMutation({
    mutationFn: async ({
      type,
      uri,
      name,
      mimeType,
    }: {
      type: DocumentType;
      uri: string;
      name: string;
      mimeType?: string | null;
    }) => {
      if (!userId) throw new Error('Not signed in');

      const path = `${userId}/${Date.now()}-${name}`;
      const bytes = await new File(uri).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, bytes, { contentType: mimeType ?? 'application/octet-stream' });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('documents').insert({
        user_id: userId,
        type,
        file_url: path,
      });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', userId] });
    },
  });
}
