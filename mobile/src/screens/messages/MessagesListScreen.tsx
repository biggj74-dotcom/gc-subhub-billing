import { FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, display, body, mono } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { StatusPill } from '../../components/StatusPill';
import { useL } from '../../i18n/useLanguage';
import { useConversations } from '../../hooks/useMessages';
import type { LoadRow } from '../../types/database';
import type { MessagesStackParamList } from '../../navigation/MessagesStack';

const STATUS_LABEL: Record<LoadRow['status'], string> = {
  open: 'Open',
  booked: 'Booked',
  en_route: 'En Route',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function MessagesListScreen({ navigation }: NativeStackScreenProps<MessagesStackParamList, 'MessagesList'>) {
  const L = useL();
  const conversations = useConversations();

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('msgs')} />
      <FlatList
        data={conversations.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 pb-6 pt-4"
        refreshing={conversations.isRefetching}
        onRefresh={() => conversations.refetch()}
        ListEmptyComponent={
          !conversations.isLoading ? (
            <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 24 }]}>
              {L('noConversations')}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('MessageThread', { loadId: item.id })}
            className="rounded p-3.5"
            style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}
          >
            <View className="mb-1 flex-row items-center justify-between">
              <Text style={[mono, { color: C.silver, fontSize: 10.5 }]}>{item.id.slice(0, 8).toUpperCase()}</Text>
              <StatusPill status={STATUS_LABEL[item.status]} />
            </View>
            <Text style={[display, { color: C.paper, fontSize: 17, fontWeight: '700' }]}>
              {item.origin} → {item.destination}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
