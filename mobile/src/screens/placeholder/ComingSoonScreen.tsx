import { Text, View } from 'react-native';
import { C, display, body } from '../../theme/tokens';
import { TopBar } from '../../components/TopBar';
import { useL } from '../../i18n/useLanguage';

export function ComingSoonScreen({ title }: { title: string }) {
  const L = useL();
  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      <TopBar title={title} />
      <View className="flex-1 items-center justify-center gap-2 px-8">
        <Text style={[display, { color: C.paper, fontSize: 18, fontWeight: '700' }]}>{L('comingSoon')}</Text>
        <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center' }]}>{L('comingSoonBody')}</Text>
      </View>
    </View>
  );
}
