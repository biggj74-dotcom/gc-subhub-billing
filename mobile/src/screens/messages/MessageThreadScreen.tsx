import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react-native';
import { C, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import { useMessages, useSendMessage, type MessageWithSender } from '../../hooks/useMessages';
import { supabase } from '../../lib/supabase';
import type { MessagesStackParamList } from '../../navigation/MessagesStack';
import type { LoadRow } from '../../types/database';

export function MessageThreadScreen({ route, navigation }: NativeStackScreenProps<MessagesStackParamList, 'MessageThread'>) {
  const L = useL();
  const { loadId } = route.params;
  const userId = useAuthStore((s) => s.session?.user.id);
  const [body_, setBody] = useState('');

  const { data: load } = useQuery({
    queryKey: ['load', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loads').select('*').eq('id', loadId).single();
      if (error) throw error;
      return data as LoadRow;
    },
  });

  const messages = useMessages(loadId);
  const sendMessage = useSendMessage(loadId);
  const reversed = useMemo(() => [...(messages.data ?? [])].reverse(), [messages.data]);

  const handleSend = () => {
    const text = body_.trim();
    if (!text) return;
    sendMessage.mutate(text, { onSuccess: () => setBody('') });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={load ? `${L('loadWorkspace')} — ${load.id.slice(0, 8).toUpperCase()}` : L('loadWorkspace')} onBack={() => navigation.goBack()} />
      <FlatList
        inverted
        data={reversed}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 py-4"
        renderItem={({ item }: { item: MessageWithSender }) => {
          const isMine = item.sender_id === userId;
          return (
            <View style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <View
                className="rounded px-3 py-2"
                style={{ backgroundColor: isMine ? C.gold : C.panel, borderWidth: 1, borderColor: isMine ? C.gold : C.line }}
              >
                <Text style={[body, { fontSize: 13, color: isMine ? C.bg : C.paper, fontWeight: isMine ? '500' : '400' }]}>
                  {item.body}
                </Text>
              </View>
            </View>
          );
        }}
      />
      <View className="flex-row items-center gap-2 px-5 py-3">
        <TextInput
          value={body_}
          onChangeText={setBody}
          placeholder={L('sendCheckCall')}
          placeholderTextColor={C.silver}
          onSubmitEditing={handleSend}
          className="flex-1 rounded px-3.5 py-3"
          style={[body, { color: C.paper, fontSize: 13, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }]}
        />
        <Pressable onPress={handleSend} className="rounded p-3" style={{ backgroundColor: C.gold }}>
          <Send size={16} color={C.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
