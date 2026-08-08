import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';
import { PricingScreen } from '../screens/profile/PricingScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Documents: undefined;
  Pricing: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
    </Stack.Navigator>
  );
}
