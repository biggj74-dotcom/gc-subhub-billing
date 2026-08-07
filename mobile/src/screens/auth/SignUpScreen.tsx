import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, body } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TopBar } from '../../components/TopBar';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { UserRole } from '../../types/database';

const ROLES: UserRole[] = ['driver', 'dispatcher', 'fleet', 'broker'];

export function SignUpScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignUp'>) {
  const L = useL();
  const signUp = useAuthStore((s) => s.signUp);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('driver');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await signUp({ email: email.trim(), password, fullName: fullName.trim(), role });
    setLoading(false);
    if (err) setError(L('signUpError'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: C.bg }}
    >
      <TopBar title={L('signUp')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-4 px-6 py-6" keyboardShouldPersistTaps="handled">
        <TextField label={L('fullName')} value={fullName} onChangeText={setFullName} autoComplete="name" />
        <TextField
          label={L('email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField label={L('password')} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password-new" />

        <View className="gap-1.5">
          <Text style={[body, { color: C.silver, fontSize: 10.5, letterSpacing: 0.5 }]}>{L('role').toUpperCase()}</Text>
          <View className="flex-row flex-wrap gap-2">
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className="rounded px-3.5 py-2"
                style={{
                  backgroundColor: role === r ? C.gold : 'transparent',
                  borderWidth: 1,
                  borderColor: role === r ? C.gold : C.line,
                }}
              >
                <Text style={[body, { fontSize: 12.5, fontWeight: '500', color: role === r ? C.bg : C.silver }]}>{L(r)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? <Text style={[body, { color: C.red, fontSize: 12.5 }]}>{error}</Text> : null}

        <PrimaryButton
          title={L('signUp')}
          onPress={handleSubmit}
          loading={loading}
          disabled={!email || !password || !fullName}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
