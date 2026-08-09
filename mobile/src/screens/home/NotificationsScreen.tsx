import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';
import { useMarkNotificationRead, useNotifications } from '../../hooks/useNotifications';
import type { HomeStackParamList } from '../../navigation/HomeStack';

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsScreen({ navigation }: NativeStackScreenProps<HomeStackParamList, 'Notifications'>) {
  const L = useL();
  const { data: notifications, isLoading, isRefetching, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('notifications')} onBack={() => navigation.goBack()} />
      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 pb-6 pt-4"
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
          ) : (
            <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 24 }]}>
              {L('noNotifications')}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && markRead.mutate(item.id)}
            className="flex-row gap-2.5 rounded p-3.5"
            style={{
              backgroundColor: C.panel,
              borderWidth: 1,
              borderColor: C.line,
              borderLeftWidth: item.read ? 1 : 2,
              borderLeftColor: item.read ? C.line : C.gold,
            }}
          >
            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Text style={[body, { color: C.paper, fontSize: 13, fontWeight: '600', flex: 1 }]}>{item.title}</Text>
                <Text style={[body, { color: C.silver, fontSize: 10 }]}>{timeAgo(item.created_at)}</Text>
              </View>
              {item.body ? <Text style={[body, { color: C.silver, fontSize: 12 }]}>{item.body}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
