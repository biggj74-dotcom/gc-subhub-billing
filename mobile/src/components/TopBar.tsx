import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { C, display } from '../theme/tokens';

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-2 px-5 pt-4 pb-3">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} className="-ml-1 p-1">
            <ChevronLeft size={20} color={C.gold} />
          </Pressable>
        ) : null}
        <Text style={[display, { color: C.paper, fontSize: 23, fontWeight: '700', letterSpacing: 0.3 }]} className="flex-1">
          {title}
        </Text>
        {right}
      </View>
      <LinearGradient
        colors={['transparent', C.gold, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 1, width: '100%' }}
      />
    </View>
  );
}
