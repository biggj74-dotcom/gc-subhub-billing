import { ActivityIndicator, Pressable, Text } from 'react-native';
import { C, body } from '../theme/tokens';

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'solid',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'solid' | 'outline';
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className="w-full items-center rounded py-3.5"
      style={{
        backgroundColor: variant === 'solid' ? C.gold : 'transparent',
        borderWidth: 1,
        borderColor: C.gold,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? C.bg : C.gold} />
      ) : (
        <Text style={[body, { color: variant === 'solid' ? C.bg : C.gold, fontSize: 14.5, fontWeight: '600', letterSpacing: 0.3 }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
