import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useL } from '../../i18n/useLanguage';
import { useCreateSettlement } from '../../hooks/useSettlements';
import { supabase } from '../../lib/supabase';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';
import type { LoadRow } from '../../types/database';

export function RecordSettlementScreen({ route, navigation }: NativeStackScreenProps<LoadsStackParamList, 'RecordSettlement'>) {
  const L = useL();
  const { loadId } = route.params;
  const [gross, setGross] = useState('');
  const [deductions, setDeductions] = useState('0');

  const { data: load } = useQuery({
    queryKey: ['load', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loads').select('*').eq('id', loadId).single();
      if (error) throw error;
      return data as LoadRow;
    },
  });

  const createSettlement = useCreateSettlement(loadId);
  const grossNum = Number(gross) || 0;
  const deductionsNum = Number(deductions) || 0;
  const net = grossNum - deductionsNum;

  const handleSubmit = async () => {
    if (!load?.assigned_driver_id) return;
    await createSettlement.mutateAsync({ driverId: load.assigned_driver_id, gross: grossNum, deductions: deductionsNum });
    navigation.goBack();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('recordSettlement')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        {load ? (
          <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>
            {load.origin} → {load.destination}
          </Text>
        ) : null}

        <TextField label={L('gross')} value={gross} onChangeText={setGross} keyboardType="numeric" placeholder="0" />
        <TextField label={L('deductions')} value={deductions} onChangeText={setDeductions} keyboardType="numeric" placeholder="0" />

        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('net')}</Text>
          <Text style={[display, { color: C.gold, fontSize: 22, fontWeight: '700' }]}>${net}</Text>
        </View>

        <PrimaryButton
          title={L('recordSettlement')}
          onPress={handleSubmit}
          disabled={!gross || !load?.assigned_driver_id}
          loading={createSettlement.isPending}
        />
      </ScrollView>
    </View>
  );
}
