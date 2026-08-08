import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Navigation } from 'lucide-react-native';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { StatusPill } from '../../components/StatusPill';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import {
  useAcceptOffer,
  useAdvanceLoadStatus,
  useLoadOffers,
  useRejectOffer,
  useSubmitOffer,
  type LoadOfferWithDriver,
} from '../../hooks/useLoads';
import { useLoadSettlement } from '../../hooks/useSettlements';
import { supabase } from '../../lib/supabase';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';
import type { LoadRow } from '../../types/database';

const OFFER_STATUS_LABEL: Record<LoadOfferWithDriver['status'], string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

// Driver-advanceable steps in a load's lifecycle. 'booked' is set
// automatically when an offer is accepted; 'open'/'cancelled' aren't
// reachable from here.
const NEXT_STATUS: Partial<Record<LoadRow['status'], { status: LoadRow['status']; labelKey: 'markEnRoute' | 'markDelivered' }>> = {
  booked: { status: 'en_route', labelKey: 'markEnRoute' },
  en_route: { status: 'delivered', labelKey: 'markDelivered' },
};

export function LoadDetailScreen({ route, navigation }: NativeStackScreenProps<LoadsStackParamList, 'LoadDetail'>) {
  const L = useL();
  const { loadId } = route.params;
  const userId = useAuthStore((s) => s.session?.user.id);
  const [offerRate, setOfferRate] = useState('');

  const { data: load, isLoading } = useQuery({
    queryKey: ['load', loadId],
    queryFn: async () => {
      const { data, error } = await supabase.from('loads').select('*').eq('id', loadId).single();
      if (error) throw error;
      return data as LoadRow;
    },
  });

  const isPoster = !!load && load.posted_by_id === userId;
  const offers = useLoadOffers(loadId);
  const submitOffer = useSubmitOffer(loadId);
  const acceptOffer = useAcceptOffer(loadId);
  const rejectOffer = useRejectOffer(loadId);
  const advanceStatus = useAdvanceLoadStatus(loadId);
  const loadSettlement = useLoadSettlement(loadId);

  const myOffer = offers.data?.find((o) => o.driver_id === userId);
  const isAssignedDriver = !!load && load.assigned_driver_id === userId;
  const canTrack = !!load && (load.status === 'booked' || load.status === 'en_route') && (isPoster || isAssignedDriver);
  const nextStep = load ? NEXT_STATUS[load.status] : undefined;
  const canRecordSettlement = isPoster && load.status === 'delivered' && !loadSettlement.data;

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

        {canTrack ? (
          <Pressable
            onPress={() => navigation.navigate('Tracking', { loadId })}
            className="flex-row items-center gap-1.5 rounded px-3 py-2.5"
            style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}
          >
            <Navigation size={13} color={C.gold} />
            <Text style={[body, { color: C.gold, fontSize: 12, fontWeight: '600' }]}>{L('track')}</Text>
          </Pressable>
        ) : null}

        {isAssignedDriver && nextStep ? (
          <PrimaryButton
            title={L(nextStep.labelKey)}
            onPress={() => advanceStatus.mutate(nextStep.status)}
            loading={advanceStatus.isPending}
            variant="outline"
          />
        ) : null}

        {canRecordSettlement ? (
          <PrimaryButton
            title={L('recordSettlement')}
            onPress={() => navigation.navigate('RecordSettlement', { loadId })}
            variant="outline"
          />
        ) : null}

        {isPoster ? (
          <View className="gap-2">
            <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('offers').toUpperCase()}</Text>
            {offers.data?.length ? (
              offers.data.map((offer) => (
                <View key={offer.id} className="rounded p-3.5" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text style={[body, { color: C.paper, fontSize: 13.5, fontWeight: '600' }]}>
                      {offer.driver?.full_name ?? offer.driver?.email ?? L('driver')}
                    </Text>
                    <StatusPill status={OFFER_STATUS_LABEL[offer.status]} />
                  </View>
                  <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>${offer.offered_rate}</Text>
                  {offer.status === 'pending' ? (
                    <View className="mt-3 flex-row gap-2">
                      <View className="flex-1">
                        <PrimaryButton
                          title={L('accept')}
                          onPress={() => acceptOffer.mutate(offer.id)}
                          loading={acceptOffer.isPending}
                        />
                      </View>
                      <View className="flex-1">
                        <PrimaryButton
                          title={L('reject')}
                          variant="outline"
                          onPress={() => rejectOffer.mutate(offer.id)}
                          loading={rejectOffer.isPending}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <Text style={[body, { color: C.silver, fontSize: 12.5 }]}>{L('noOffers')}</Text>
            )}
          </View>
        ) : myOffer ? (
          <View className="rounded p-4" style={{ backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }}>
            <View className="mb-1 flex-row items-center justify-between">
              <Text style={[body, { color: C.silver, fontSize: 10, letterSpacing: 0.4 }]}>{L('offerRate')}</Text>
              <StatusPill status={OFFER_STATUS_LABEL[myOffer.status]} />
            </View>
            <Text style={[display, { color: C.paper, fontSize: 20, fontWeight: '700' }]}>${myOffer.offered_rate}</Text>
          </View>
        ) : load.status === 'open' ? (
          <TextField
            label={L('offerRate')}
            value={offerRate}
            onChangeText={setOfferRate}
            keyboardType="numeric"
            placeholder={load.rate ? String(load.rate) : ''}
          />
        ) : null}
      </ScrollView>

      {!isPoster && !myOffer && load.status === 'open' ? (
        <View className="px-5 pb-6">
          <PrimaryButton title={L('submitOffer')} onPress={handleSubmit} loading={submitOffer.isPending} />
        </View>
      ) : null}
    </View>
  );
}
