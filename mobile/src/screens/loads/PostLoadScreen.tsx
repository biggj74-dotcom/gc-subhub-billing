import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { C, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { TextField } from '../../components/TextField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useL } from '../../i18n/useLanguage';
import { useCreateLoad } from '../../hooks/useLoads';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';

export function PostLoadScreen({ navigation }: NativeStackScreenProps<LoadsStackParamList, 'PostLoad'>) {
  const L = useL();
  const createLoad = useCreateLoad();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [miles, setMiles] = useState('');
  const [rate, setRate] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [weight, setWeight] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [posted, setPosted] = useState(false);

  const rateNum = Number(rate);
  const milesNum = Number(miles);
  const rateValid = rate.trim() !== '' && Number.isFinite(rateNum) && rateNum > 0;
  const milesValid = miles.trim() === '' || (Number.isFinite(milesNum) && milesNum > 0);
  const canSubmit = origin.trim() && destination.trim() && rateValid && milesValid;

  const handleSubmit = () => {
    createLoad.mutate(
      {
        origin,
        destination,
        miles: miles.trim() ? milesNum : null,
        rate: rateNum,
        equipment_type: equipmentType || null,
        weight: weight || null,
        pickup_date: pickupDate || null,
        hazmat: false,
      },
      { onSuccess: () => setPosted(true) }
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('postLoad')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-4">
        <TextField label="Origin" value={origin} onChangeText={setOrigin} placeholder="Dallas, TX" />
        <TextField label="Destination" value={destination} onChangeText={setDestination} placeholder="Memphis, TN" />
        <TextField label={L('distance')} value={miles} onChangeText={setMiles} keyboardType="numeric" placeholder="452" />
        <TextField label={L('postedRate')} value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="1380" />
        <TextField label={L('equipment')} value={equipmentType} onChangeText={setEquipmentType} placeholder="Dry Van" />
        <TextField label={L('weight')} value={weight} onChangeText={setWeight} placeholder="42,000 lb" />
        <TextField label={L('pickup')} value={pickupDate} onChangeText={setPickupDate} placeholder="2026-08-14" />

        {posted ? <Text style={[body, { color: C.green, fontSize: 12.5 }]}>{L('loadPosted')}</Text> : null}

        <PrimaryButton
          title={posted ? L('loadPosted') : L('postToBoard')}
          onPress={handleSubmit}
          disabled={!canSubmit || posted}
          loading={createLoad.isPending}
        />
      </ScrollView>
    </View>
  );
}
