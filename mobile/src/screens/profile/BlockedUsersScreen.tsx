import { FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';
import { useBlockedUsers, useUnblockUser } from '../../hooks/useModeration';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';

export function BlockedUsersScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'BlockedUsers'>) {
  const L = useL();
  const { data: blocked, isLoading } = useBlockedUsers();
  const unblockUser = useUnblockUser();

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('blockedUsers')} onBack={() => navigation.goBack()} />
      <FlatList
        data={blocked ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 pb-6 pt-4"
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 24 }]}>{L('noBlockedUsers')}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View
            className="flex-row items-center justify-between rounded p-3.5"
            style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}
          >
            <Text style={[body, { color: C.paper, fontSize: 13, fontWeight: '500' }]}>
              {item.blocked?.full_name ?? item.blocked?.email ?? '—'}
            </Text>
            <Pressable
              onPress={() => unblockUser.mutate(item.blocked_id)}
              className="rounded px-3 py-1.5"
              style={{ borderWidth: 1, borderColor: C.gold + '66' }}
            >
              <Text style={[body, { color: C.gold, fontSize: 12, fontWeight: '500' }]}>{L('unblock')}</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
