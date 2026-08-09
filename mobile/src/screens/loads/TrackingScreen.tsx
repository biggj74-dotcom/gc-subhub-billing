import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'lucide-react-native';
import { C, display, body, mono } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { StatusPill } from '../../components/StatusPill';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { TrackingMap } from '../../components/TrackingMap';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import { useSendCheckIn, useTrackingEvents } from '../../hooks/useTracking';
import { supabase } from '../../lib/supabase';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';
import type { LoadRow } from '../../types/database';

const STATUS_LABEL: Record<LoadRow['status'], string> = {
  open: 'Open',
  booked: 'Booked',
  en_route: 'En Route',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function TrackingScreen({ route, navigation }: NativeStackScreenProps<LoadsStackParamList, 'Tracking'>) {
  const L = useL();
  const { loadId } = route.params;
  const userId = useAuthStore((s) => s.session?.user.id);
  const [note, setNote] = useState('');

  const {
    data: load,
    isLoading: loadLoading,
    isError: loadError,
    refetch: refetchLoad,
  } = useQuery({
    queryKey: ['load', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loads').select('*').eq('id', loadId).single();
      if (error) throw error;
      return data as LoadRow;
    },
  });

  const events = useTrackingEvents(loadId);
  const sendCheckIn = useSendCheckIn(loadId);

  const isAssignedDriver = !!load && load.assigned_driver_id === userId;
  const latest = events.data?.[0];

  const handleSendCheckIn = () => {
    sendCheckIn.mutate(note, { onSuccess: () => setNote('') });
  };

  if (loadLoading) {
    return (
      <View className="flex-1" style={{ backgroundColor: C.bg }}>
        <TopBar title={L('trackTitle')} onBack={() => navigation.goBack()} />
        <LoadingView />
      </View>
    );
  }

  if (loadError || !load) {
    return (
      <View className="flex-1" style={{ backgroundColor: C.bg }}>
        <TopBar title={L('trackTitle')} onBack={() => navigation.goBack()} />
        <ErrorView onRetry={() => refetchLoad()} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={`${L('trackTitle')} ${load.id.slice(0, 8).toUpperCase()}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-4">
        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <View className="mb-1 flex-row items-center justify-between">
            <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>
              {load.origin} → {load.destination}
            </Text>
            <StatusPill status={STATUS_LABEL[load.status]} />
          </View>
          <Text style={[body, { color: C.silver, fontSize: 12 }]}>
            {latest ? `${L('lastCheckIn')}: ${timeAgo(latest.created_at)}` : L('noCheckIns')}
          </Text>
        </View>

        <TrackingMap events={events.data ?? []} />

        <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('checkIns').toUpperCase()}</Text>
        {events.data?.length ? (
          events.data.map((event) => (
            <View key={event.id} className="rounded p-3.5" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Navigation size={11} color={C.gold} />
                  <Text style={[mono, { color: C.silver, fontSize: 11 }]}>
                    {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                  </Text>
                </View>
                <Text style={[mono, { color: C.silver, fontSize: 10 }]}>{timeAgo(event.created_at)}</Text>
              </View>
              {event.note ? <Text style={[body, { color: C.paper, fontSize: 12.5 }]}>{event.note}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('noCheckIns')}</Text>
        )}
      </ScrollView>

      {isAssignedDriver && load.status !== 'delivered' && load.status !== 'cancelled' ? (
        <View className="gap-2 px-5 pb-6">
          <TextField label={L('checkInNote')} value={note} onChangeText={setNote} placeholder={L('checkInNotePlaceholder')} />
          <PrimaryButton title={L('sendCheckIn')} onPress={handleSendCheckIn} loading={sendCheckIn.isPending} />
        </View>
      ) : null}
    </View>
  );
}
