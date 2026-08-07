import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { DocumentsScreen } from '../screens/profile/DocumentsScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Documents: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
    </Stack.Navigator>
  );
}
