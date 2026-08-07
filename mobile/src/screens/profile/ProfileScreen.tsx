import { Pressable, ScrollView, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { useLanguageStore } from '../../i18n/useLanguage';
import type { Lang } from '../../i18n/dict';

export function ProfileScreen() {
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

        <PrimaryButton title={L('signOut')} onPress={signOut} variant="outline" />
      </ScrollView>
    </View>
  );
}
