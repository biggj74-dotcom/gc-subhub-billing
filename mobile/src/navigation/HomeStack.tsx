import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NotificationsScreen } from '../screens/home/NotificationsScreen';
import { EarningsScreen } from '../screens/home/EarningsScreen';

export type HomeStackParamList = {
  Home: undefined;
  Notifications: undefined;
  Earnings: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
    </Stack.Navigator>
  );
}
