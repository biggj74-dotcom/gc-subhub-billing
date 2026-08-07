import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import type { TrackingEventRow } from '../types/database';

export function useTrackingEvents(loadId: string) {
  return useQuery({
    queryKey: ['tracking_events', loadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .eq('load_id', loadId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as TrackingEventRow[];
    },
  });
}

export function useSendCheckIn(loadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note: string) => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const { error } = await supabase.from('tracking_events').insert({
        load_id: loadId,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking_events', loadId] });
    },
  });
}
