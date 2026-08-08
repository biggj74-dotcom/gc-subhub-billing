import { Pressable, ScrollView, Text, View } from 'react-native';
import { AlertTriangle, Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { useMyLoads } from '../../hooks/useLoads';
import { useNotifications } from '../../hooks/useNotifications';
import { StatusPill } from '../../components/StatusPill';
import type { MainTabsParamList } from '../../navigation/MainTabs';
import type { HomeStackParamList } from '../../navigation/HomeStack';

export function HomeScreen() {
  const L = useL();
  // Two independently-typed handles on the same navigation tree — one for
  // this screen's own stack, one for the parent tab navigator — rather than
  // a single CompositeScreenProps navigation prop, whose merged `navigate`
  // overloads TS fails to resolve correctly for either call shape.
  const homeNav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const tabNav = useNavigation<BottomTabNavigationProp<MainTabsParamList>>();
  const profile = useAuthStore((s) => s.profile);
  const isDriver = profile?.role === 'driver';
  const { data: myLoads } = useMyLoads();
  const activeLoad = myLoads?.find((l) => l.status === 'en_route' || l.status === 'booked');
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar
        title={isDriver ? L('dashboard') : L('fleetOverview')}
        right={
          <Pressable onPress={() => homeNav.navigate('Notifications')} hitSlop={8} className="relative p-1">
            <Bell size={19} color={C.silver} />
            {unreadCount > 0 ? (
              <View
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: C.gold, borderWidth: 1.5, borderColor: C.bg }}
              />
            ) : null}
          </Pressable>
        }
      />
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
          <Pressable
            onPress={() => tabNav.navigate('Loads', { screen: 'LoadDetail', params: { loadId: activeLoad.id } })}
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
          </Pressable>
        ) : (
          <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('noLoads')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
