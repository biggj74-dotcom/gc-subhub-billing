import { ScrollView, Text, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { useMyLoads } from '../../hooks/useLoads';
import { StatusPill } from '../../components/StatusPill';

export function HomeScreen() {
  const L = useL();
  const profile = useAuthStore((s) => s.profile);
  const isDriver = profile?.role === 'driver';
  const { data: myLoads } = useMyLoads();
  const activeLoad = myLoads?.find((l) => l.status === 'en_route' || l.status === 'booked');

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={isDriver ? L('dashboard') : L('fleetOverview')} />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-4">
        <Text style={[display, { color: C.paper, fontSize: 19, fontWeight: '700' }]}>
          {profile?.full_name ? `Welcome, ${profile.full_name.split(' ')[0]}` : 'Welcome'}
        </Text>

        {profile?.medical_card_expires_at ? (
          <View
            className="flex-row items-center gap-2 rounded px-3 py-2.5"
            style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderLeftWidth: 2, borderLeftColor: C.gold }}
          >
            <AlertTriangle size={14} color={C.gold} />
            <Text style={[body, { color: C.paper, fontSize: 12.5, flex: 1 }]}>{L('savedLocally')}</Text>
          </View>
        ) : null}

        {activeLoad ? (
          <View
            className="rounded p-4"
            style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: C.gold }}
          >
            <View className="mb-2 flex-row items-center justify-between">
              <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>
                {activeLoad.origin} → {activeLoad.destination}
              </Text>
              <StatusPill status={activeLoad.status === 'en_route' ? 'En Route' : 'Booked'} />
            </View>
            <Text style={[body, { color: C.silver, fontSize: 12 }]}>${activeLoad.rate} · {activeLoad.miles} mi</Text>
          </View>
        ) : (
          <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('noLoads')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
