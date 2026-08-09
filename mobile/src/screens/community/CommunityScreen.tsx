import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { MoreVertical, Send, Trash2 } from 'lucide-react-native';
import { C, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import { useCreatePost, usePosts, type CommunityPostWithAuthor } from '../../hooks/useCommunity';
import { useBlockUser, useDeletePost, useReportPost } from '../../hooks/useModeration';

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function CommunityScreen() {
  const L = useL();
  const userId = useAuthStore((s) => s.session?.user.id);
  const { data: posts, isLoading, isRefetching, refetch } = usePosts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const reportPost = useReportPost();
  const blockUser = useBlockUser();
  const [draft, setDraft] = useState('');

  const handlePost = () => {
    const text = draft.trim();
    if (!text) return;
    createPost.mutate(text, { onSuccess: () => setDraft('') });
  };

  const confirmDelete = (postId: string) => {
    Alert.alert(L('deletePost'), L('deletePostConfirm'), [
      { text: L('cancel'), style: 'cancel' },
      { text: L('delete'), style: 'destructive', onPress: () => deletePost.mutate(postId) },
    ]);
  };

  const pickReportReason = (postId: string) => {
    Alert.alert(L('reportPost'), undefined, [
      { text: L('reportReasonSpam'), onPress: () => reportPost.mutate({ postId, reason: 'spam' }) },
      { text: L('reportReasonHarassment'), onPress: () => reportPost.mutate({ postId, reason: 'harassment' }) },
      { text: L('reportReasonOther'), onPress: () => reportPost.mutate({ postId, reason: 'other' }) },
      { text: L('cancel'), style: 'cancel' },
    ]);
  };

  const confirmBlock = (authorId: string, authorName: string) => {
    Alert.alert(L('blockUser'), L('blockUserConfirm').replace('{name}', authorName), [
      { text: L('cancel'), style: 'cancel' },
      { text: L('blockUser'), style: 'destructive', onPress: () => blockUser.mutate(authorId) },
    ]);
  };

  const showPostActions = (post: CommunityPostWithAuthor) => {
    const authorName = post.author?.full_name ?? post.author?.email ?? L('driver');
    Alert.alert('', '', [
      { text: L('reportPost'), onPress: () => pickReportReason(post.id) },
      { text: L('blockUser'), style: 'destructive', onPress: () => confirmBlock(post.author_id, authorName) },
      { text: L('cancel'), style: 'cancel' },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('community')} />
      <FlatList
        data={posts ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-5 pb-4 pt-4"
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
          ) : (
            <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 24 }]}>{L('noPosts')}</Text>
          )
        }
        renderItem={({ item }) => {
          const isMine = item.author_id === userId;
          return (
            <View className="rounded p-3.5" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
              <View className="mb-1.5 flex-row items-center justify-between">
                <Text style={[body, { color: C.paper, fontSize: 13, fontWeight: '600' }]}>
                  {item.author?.full_name ?? item.author?.email ?? '—'}
                </Text>
                <View className="flex-row items-center gap-2.5">
                  <Text style={[body, { color: C.silver, fontSize: 10.5 }]}>{timeAgo(item.created_at)}</Text>
                  <Pressable
                    onPress={() => (isMine ? confirmDelete(item.id) : showPostActions(item))}
                    hitSlop={8}
                  >
                    {isMine ? <Trash2 size={13} color={C.silver} /> : <MoreVertical size={14} color={C.silver} />}
                  </Pressable>
                </View>
              </View>
              <Text style={[body, { color: C.silver, fontSize: 13, lineHeight: 18 }]}>{item.body}</Text>
            </View>
          );
        }}
      />
      <View className="flex-row items-center gap-2 px-5 py-3">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={L('sharePost')}
          placeholderTextColor={C.silver}
          multiline
          className="flex-1 rounded px-3.5 py-3"
          style={[body, { color: C.paper, fontSize: 13, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, maxHeight: 100 }]}
        />
        <Pressable onPress={handlePost} className="rounded p-3" style={{ backgroundColor: C.gold }}>
          <Send size={16} color={C.bg} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
