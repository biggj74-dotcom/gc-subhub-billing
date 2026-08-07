import { Text, View } from 'react-native';
import { C, body, withAlpha } from '../theme/tokens';

const STATUS_COLOR: Record<string, string> = {
  Verified: C.green,
  Delivered: C.green,
  Available: C.green,
  Expiring: C.gold,
  'En Route': C.blue,
  'On Load': C.blue,
  'Off Duty': C.silver,
  Pending: C.silver,
  'Pending Review': C.blue,
  Open: C.blue,
  Booked: C.gold,
  Cancelled: C.red,
};

export function StatusPill({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? C.silver;
  return (
    <View
      className="rounded-sm px-2 py-0.5"
      style={{ backgroundColor: withAlpha(color, '1A'), borderWidth: 1, borderColor: withAlpha(color, '40') }}
    >
      <Text style={[body, { color, fontSize: 10, letterSpacing: 0.3, fontWeight: '500' }]}>{status}</Text>
    </View>
  );
}
