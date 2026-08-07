import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronRight, FileText, ShieldCheck } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { useLanguageStore } from '../../i18n/useLanguage';
import type { Lang } from '../../i18n/dict';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';

export function ProfileScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'Profile'>) {
  const L = useL();
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('profile')} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <View className="items-center gap-2 py-2">
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ borderWidth: 1, borderColor: C.gold, backgroundColor: C.panel2 }}
          >
            <Text style={[display, { color: C.gold, fontSize: 22, fontWeight: '700' }]}>
              {(profile?.full_name ?? profile?.email ?? '?')[0]?.toUpperCase()}
            </Text>
          </View>
          <Text style={[display, { color: C.paper, fontSize: 19, fontWeight: '700' }]}>{profile?.full_name}</Text>
          <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{profile?.email}</Text>
        </View>

        {profile?.dot_number || profile?.mc_number ? (
          <View className="flex-row items-center gap-2 rounded p-3" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <ShieldCheck size={14} color={C.green} />
            <Text style={[body, { color: C.paper, fontSize: 12.5 }]}>{L('dotVerified')}</Text>
          </View>
        ) : null}

        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4, marginBottom: 8 }]}>{L('role').toUpperCase()}</Text>
          <Text style={[display, { color: C.gold, fontSize: 16, fontWeight: '700' }]}>{profile?.role ? L(profile.role) : '—'}</Text>
        </View>

        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4, marginBottom: 8 }]}>{L('language').toUpperCase()}</Text>
          <View className="flex-row gap-2">
            {(['en', 'es'] as Lang[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                className="rounded px-3.5 py-1.5"
                style={{ backgroundColor: lang === l ? C.gold : 'transparent', borderWidth: 1, borderColor: lang === l ? C.gold : C.line }}
              >
                <Text style={[body, { fontSize: 12, fontWeight: '500', color: lang === l ? C.bg : C.silver }]}>
                  {l === 'en' ? 'English' : 'Español'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Documents')}
          className="flex-row items-center justify-between rounded p-4"
          style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}
        >
          <View className="flex-row items-center gap-2.5">
            <FileText size={14} color={C.silver} />
            <Text style={[body, { color: C.paper, fontSize: 13, fontWeight: '600' }]}>{L('documents')}</Text>
          </View>
          <ChevronRight size={16} color={C.silver} />
        </Pressable>

        <PrimaryButton title={L('signOut')} onPress={signOut} variant="outline" />
      </ScrollView>
    </View>
  );
}
