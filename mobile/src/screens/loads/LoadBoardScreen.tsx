import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Filter } from 'lucide-react-native';
import { C, display, body, mono } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { StatusPill } from '../../components/StatusPill';
import { useL } from '../../i18n/useLanguage';
import { useAuthStore } from '../../stores/authStore';
import { useMyLoads, useOpenLoads } from '../../hooks/useLoads';
import type { LoadRow } from '../../types/database';
import type { LoadsStackParamList } from '../../navigation/LoadsStack';

const EQUIPMENT_FILTERS = ['Dry Van', 'Reefer', 'Flatbed'] as const;
const STATUS_LABEL: Record<LoadRow['status'], string> = {
  open: 'Open',
  booked: 'Booked',
  en_route: 'En Route',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

type Sub = 'Board' | 'My Loads';

export function LoadBoardScreen({ navigation }: NativeStackScreenProps<LoadsStackParamList, 'LoadBoard'>) {
  const L = useL();
  const role = useAuthStore((s) => s.profile?.role);
  const canPostLoads = role === 'dispatcher' || role === 'fleet' || role === 'broker';
  const [sub, setSub] = useState<Sub>('Board');
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>([]);
  const [hazmatOnly, setHazmatOnly] = useState(false);

  const board = useOpenLoads();
  const mine = useMyLoads();
  const query = sub === 'Board' ? board : mine;

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    if (sub !== 'Board') return rows;
    return rows.filter((l) => {
      if (hazmatOnly && !l.hazmat) return false;
      if (equipmentFilters.length && !equipmentFilters.includes(l.equipment_type ?? '')) return false;
      return true;
    });
  }, [query.data, sub, hazmatOnly, equipmentFilters]);

  const toggleEquipment = (f: string) =>
    setEquipmentFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={L('loads')} />

      <View className="mb-3 mt-4 flex-row items-center justify-between px-5">
        <View className="flex-row gap-2">
          {(['Board', 'My Loads'] as Sub[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setSub(s)}
              className="rounded px-3.5 py-1.5"
              style={{
                backgroundColor: sub === s ? C.gold : 'transparent',
                borderWidth: 1,
                borderColor: sub === s ? C.gold : C.line,
              }}
            >
              <Text style={[body, { fontSize: 12, fontWeight: '500', color: sub === s ? C.bg : C.silver }]}>
                {s === 'Board' ? L('board') : L('myLoads')}
              </Text>
            </Pressable>
          ))}
        </View>
        {canPostLoads ? (
          <Pressable
            onPress={() => navigation.navigate('PostLoad')}
            className="rounded px-3 py-1.5"
            style={{ borderWidth: 1, borderColor: C.gold + '66' }}
          >
            <Text style={[body, { fontSize: 12, fontWeight: '500', color: C.gold }]}>+ {L('postLoad')}</Text>
          </Pressable>
        ) : null}
      </View>

      {sub === 'Board' ? (
        <View className="mb-3 flex-row gap-2 px-5">
          {EQUIPMENT_FILTERS.map((f) => {
            const active = equipmentFilters.includes(f);
            return (
              <Pressable
                key={f}
                onPress={() => toggleEquipment(f)}
                className="flex-row items-center gap-1 rounded px-2.5 py-1"
                style={{ borderWidth: 1, borderColor: active ? C.gold : C.line }}
              >
                <Filter size={10} color={active ? C.gold : C.silver} />
                <Text style={[body, { fontSize: 10.5, color: active ? C.gold : C.silver }]}>{f}</Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setHazmatOnly((v) => !v)}
            className="rounded px-2.5 py-1"
            style={{ borderWidth: 1, borderColor: hazmatOnly ? C.red : C.line }}
          >
            <Text style={[body, { fontSize: 10.5, color: hazmatOnly ? C.red : C.silver }]}>{L('hazmat')}</Text>
          </Pressable>
        </View>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 pb-6"
        refreshing={query.isRefetching}
        onRefresh={() => query.refetch()}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={C.gold} style={{ marginTop: 24 }} />
          ) : (
            <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center', marginTop: 24 }]}>{L('noLoads')}</Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate('LoadDetail', { loadId: item.id })}
            className="rounded p-3.5"
            style={{
              backgroundColor: C.panel,
              borderWidth: 1,
              borderColor: C.line,
              borderLeftWidth: item.hazmat ? 3 : 1,
              borderLeftColor: item.hazmat ? C.red : C.line,
            }}
          >
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text style={[mono, { color: C.silver, fontSize: 10.5 }]}>{item.id.slice(0, 8).toUpperCase()}</Text>
              {sub === 'Board' && item.hazmat ? (
                <Text style={[body, { color: C.red, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }]}>{L('hazmat')}</Text>
              ) : sub === 'My Loads' ? (
                <StatusPill status={STATUS_LABEL[item.status]} />
              ) : null}
            </View>
            <Text style={[display, { color: C.paper, fontSize: 19, fontWeight: '700' }]}>
              {item.origin} → {item.destination}
            </Text>
            <View className="mt-2 flex-row items-center justify-between">
              <Text style={[body, { color: C.silver, fontSize: 11.5 }]}>
                {item.equipment_type ?? '—'} · {item.miles ?? '—'} mi
              </Text>
              <View className="items-end">
                <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>${item.rate}</Text>
                {item.rate && item.miles ? (
                  <Text style={[mono, { color: C.silver, fontSize: 10 }]}>${(item.rate / item.miles).toFixed(2)}/mi</Text>
                ) : null}
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
