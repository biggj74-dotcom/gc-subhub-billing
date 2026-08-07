import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { C, body } from '../theme/tokens';

export function TextField({
  label,
  ...inputProps
}: { label: string } & TextInputProps) {
  return (
    <View className="gap-1.5">
      <Text style={[body, { color: C.silver, fontSize: 10.5, letterSpacing: 0.5 }]}>{label.toUpperCase()}</Text>
      <TextInput
        placeholderTextColor={C.silver}
        className="rounded px-3.5 py-3"
        style={[body, { color: C.paper, fontSize: 14.5, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line }]}
        {...inputProps}
      />
    </View>
  );
}
