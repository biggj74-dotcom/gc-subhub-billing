import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, display, body, mono } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';
import { useSettlements } from '../../hooks/useSettlements';
import type { HomeStackParamList } from '../../navigation/HomeStack';

export function EarningsScreen({ navigation }: NativeStackScreenProps<HomeStackParamList, 'Earnings'>) {
  const L = useL();
  const { data: settlements, isLoading } = useSettlements();
  const total = (settlements ?? []).reduce((sum, s) => sum + s.net, 0);

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('earnings')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-4">
        <View
          className="rounded p-4"
          style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: C.gold }}
        >
          <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('totalSettled')}</Text>
          <Text style={[display, { color: C.paper, fontSize: 27, fontWeight: '700' }]}>${total.toLocaleString()}</Text>
        </View>

        {!isLoading && !settlements?.length ? (
          <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 12 }]}>{L('noSettlements')}</Text>
        ) : null}

        {settlements?.map((s) => (
          <View key={s.id} className="rounded p-3.5" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text style={[mono, { color: C.silver, fontSize: 10.5 }]}>
                {s.id.slice(0, 8).toUpperCase()} {s.paid_at ? `· ${new Date(s.paid_at).toLocaleDateString()}` : ''}
              </Text>
              <Text style={[display, { color: C.paper, fontSize: 15, fontWeight: '700' }]}>${s.net}</Text>
            </View>
            <Text style={[body, { color: C.paper, fontSize: 13.5, fontWeight: '500', marginBottom: 4 }]}>
              {s.load ? `${s.load.origin} → ${s.load.destination}` : '—'}
            </Text>
            <Text style={[body, { color: C.silver, fontSize: 11 }]}>
              {L('gross')} ${s.gross} · {L('deductions')} ${s.deductions}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
