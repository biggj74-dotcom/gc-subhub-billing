import { Text, View } from 'react-native';
import { C, body } from '../theme/tokens';
import { useL } from '../i18n/useLanguage';
import { PrimaryButton } from './PrimaryButton';

export function ErrorView({ onRetry }: { onRetry: () => void }) {
  const L = useL();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8" style={{ backgroundColor: C.bg }}>
      <Text style={[body, { color: C.silver, fontSize: 12.5, textAlign: 'center' }]}>{L('somethingWentWrong')}</Text>
      <PrimaryButton title={L('retry')} onPress={onRetry} variant="outline" />
    </View>
  );
}
