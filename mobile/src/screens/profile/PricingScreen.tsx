import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CheckCircle } from 'lucide-react-native';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { StatusPill } from '../../components/StatusPill';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import { useStartCheckout, useSubscription } from '../../hooks/useSubscription';
import type { UserRole } from '../../types/database';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';

// The prototype's pricing page has 5 tiers, but subscriptions.plan reuses
// the 4-value user_role enum (see 0001_schema.sql) — "Owner-Operator" as a
// distinct paid tier from "Driver" isn't representable without a schema
// change, so it's folded out here rather than adding a 5th enum value for
// one plan.
const PLANS: { role: UserRole; price: number; features: string[] }[] = [
  { role: 'driver', price: 19.99, features: ['Load searches', 'Driver profile', 'Community access', 'Document storage'] },
  { role: 'dispatcher', price: 99, features: ['Manage up to 10 trucks', 'Dispatch dashboard', 'Driver messaging', 'Revenue reports'] },
  { role: 'fleet', price: 199, features: ['Manage up to 30 trucks', 'Multiple dispatcher seats', 'Fleet analytics', 'Maintenance reminders'] },
  { role: 'broker', price: 149, features: ['Post loads', 'Receive carrier offers', 'Carrier verification', 'Load tracking'] },
];

export function PricingScreen({ navigation }: NativeStackScreenProps<ProfileStackParamList, 'Pricing'>) {
  const L = useL();
  const myRole = useAuthStore((s) => s.profile?.role);
  const { data: subscription } = useSubscription();
  const startCheckout = useStartCheckout();

  const isCurrentPlan = (role: UserRole) => subscription?.plan === role && subscription.status === 'active';

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('plans')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-2.5 px-5 pb-6 pt-4">
        {PLANS.map((p) => (
          <View key={p.role} className="rounded p-3.5" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>{L(p.role)}</Text>
              <Text style={[display, { color: C.gold, fontSize: 15, fontWeight: '700' }]}>${p.price}/mo</Text>
            </View>
            <View className="mb-3 gap-1">
              {p.features.map((f) => (
                <View key={f} className="flex-row items-center gap-1.5">
                  <CheckCircle size={11} color={C.gold} />
                  <Text style={[body, { color: C.silver, fontSize: 11.5 }]}>{f}</Text>
                </View>
              ))}
            </View>
            {p.role !== myRole ? null : isCurrentPlan(p.role) ? (
              <StatusPill status="Verified" />
            ) : (
              <PrimaryButton
                title={L('subscribe')}
                onPress={() => startCheckout.mutate(p.role)}
                loading={startCheckout.isPending}
                variant="outline"
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
