import { ActivityIndicator, View } from 'react-native';
import { C } from '../theme/tokens';

export function LoadingView() {
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
      <ActivityIndicator color={C.gold} />
    </View>
  );
}
