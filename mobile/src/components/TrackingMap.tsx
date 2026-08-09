import { View } from 'react-native';
import { Mapbox } from '../lib/mapbox';
import { C } from '../theme/tokens';
import type { TrackingEventRow } from '../types/database';

// Small padding around a single point so the bounding box isn't
// zero-sized — lets one Camera config handle both the one-ping and
// many-pings cases without branching.
const PAD = 0.01;

export function TrackingMap({ events }: { events: TrackingEventRow[] }) {
  if (!events.length) return null;

  const lats = events.map((e) => e.lat);
  const lngs = events.map((e) => e.lng);
  const ne: [number, number] = [Math.max(...lngs) + PAD, Math.max(...lats) + PAD];
  const sw: [number, number] = [Math.min(...lngs) - PAD, Math.min(...lats) - PAD];

  return (
    <View className="overflow-hidden rounded" style={{ height: 220, borderWidth: 1, borderColor: C.line }}>
      <Mapbox.MapView style={{ flex: 1 }} styleURL={Mapbox.StyleURL.Dark}>
        <Mapbox.Camera
          bounds={{ ne, sw, paddingLeft: 40, paddingRight: 40, paddingTop: 40, paddingBottom: 40 }}
          animationDuration={0}
        />
        {events.map((event, i) => (
          <Mapbox.PointAnnotation key={event.id} id={event.id} coordinate={[event.lng, event.lat]}>
            <View
              style={{
                width: i === 0 ? 14 : 9,
                height: i === 0 ? 14 : 9,
                borderRadius: 999,
                backgroundColor: i === 0 ? C.gold : C.silver,
                borderWidth: 2,
                borderColor: C.bg,
              }}
            />
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
}
