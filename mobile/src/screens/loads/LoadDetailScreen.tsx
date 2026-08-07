import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { useL } from '../../i18n/useLanguage';
import { useSubmitOffer } from '../../hooks/useLoads';
import { supabase } from '../../lib/supabase';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';
import type { LoadRow } from '../../types/database';

export function LoadDetailScreen({ route, navigation }: NativeStackScreenProps<LoadsStackParamList, 'LoadDetail'>) {
  const L = useL();
  const { loadId } = route.params;
  const [offerRate, setOfferRate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: load, isLoading } = useQuery({
    queryKey: ['load', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loads').select('*').eq('id', loadId).single();
      if (error) throw error;
      return data as LoadRow;
    },
  });

  const submitOffer = useSubmitOffer(loadId);

  if (isLoading || !load) {
    return (
      <View className="flex-1" style={{ backgroundColor: C.bg }}>
        <TopBar title="" onBack={() => navigation.goBack()} />
        <Text style={[body, { color: C.silver, textAlign: 'center', marginTop: 24 }]}>{L('loading')}</Text>
      </View>
    );
  }

  const ratePerMile = load.rate && load.miles ? (load.rate / load.miles).toFixed(2) : null;
  const details: [string, string][] = [
    [L('equipment'), load.equipment_type ?? '—'],
    [L('weight'), load.weight ?? '—'],
    [L('distance'), `${load.miles ?? '—'} mi`],
    [L('pickup'), load.pickup_date ?? '—'],
    [L('hazmat'), load.hazmat ? 'Yes' : 'No'],
  ];

  const handleSubmit = async () => {
    const rate = Number(offerRate) || load.rate || 0;
    await submitOffer.mutateAsync(rate);
    setSubmitted(true);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={load.id.slice(0, 8).toUpperCase()} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-4 pt-4">
        <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
          <Text style={[display, { color: C.paper, fontSize: 21, fontWeight: '700' }]}>
            {load.origin} → {load.destination}
          </Text>
          <View className="mt-3 flex-row flex-wrap gap-y-3">
            {details.map(([k, v]) => (
              <View key={k} style={{ width: '50%' }}>
                <Text style={[body, { color: C.silver, fontSize: 9.5, letterSpacing: 0.4 }]}>{k}</Text>
                <Text style={[body, { color: C.paper, fontSize: 13.5, fontWeight: '500' }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View
          className="flex-row items-center justify-between rounded p-4"
          style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}
        >
          <View>
            <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('postedRate')}</Text>
            <Text style={[display, { color: C.paper, fontSize: 25, fontWeight: '700' }]}>${load.rate}</Text>
          </View>
          {ratePerMile ? (
            <View className="items-end">
              <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('ratePerMile')}</Text>
              <Text style={[display, { color: C.paper, fontSize: 17, fontWeight: '700' }]}>${ratePerMile}</Text>
            </View>
          ) : null}
        </View>

        {!submitted ? (
          <TextField
            label={L('offerRate')}
            value={offerRate}
            onChangeText={setOfferRate}
            keyboardType="numeric"
            placeholder={load.rate ? String(load.rate) : ''}
          />
        ) : null}
      </ScrollView>

      <View className="px-5 pb-6">
        <PrimaryButton
          title={submitted ? L('offerSubmitted') : L('submitOffer')}
          onPress={handleSubmit}
          disabled={submitted}
          loading={submitOffer.isPending}
        />
      </View>
    </View>
  );
}
