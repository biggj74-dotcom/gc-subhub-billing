import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Truck } from 'lucide-react-native';
import { C, display, body } from '../../theme/tokens';
import { useAuthStore } from '../../stores/authStore';
import { useL } from '../../i18n/useLanguage';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import type { AuthStackParamList } from '../../navigation/AuthStack';

export function SignInScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'SignIn'>) {
  const L = useL();
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(L('signInError'));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
      style={{ backgroundColor: C.bg }}
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-8 gap-8" keyboardShouldPersistTaps="handled">
        <View className="items-center gap-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ borderWidth: 1, borderColor: C.gold, backgroundColor: C.panel }}
          >
            <Truck size={24} color={C.gold} />
          </View>
          <Text style={[display, { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: 0.5 }]}>
            GCSubHub <Text style={{ color: C.gold }}>Trucking</Text>
          </Text>
        </View>

        <View className="gap-4">
          <TextField
            label={L('email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextField
            label={L('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          {error ? <Text style={[body, { color: C.red, fontSize: 12.5 }]}>{error}</Text> : null}
          <PrimaryButton title={L('signIn')} onPress={handleSubmit} loading={loading} disabled={!email || !password} />
        </View>

        <Pressable onPress={() => navigation.navigate('SignUp')} className="items-center">
          <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>
            {L('dontHaveAccount')} <Text style={{ color: C.gold, fontWeight: '600' }}>{L('signUp')}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
