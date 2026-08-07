import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadBoardScreen } from '../screens/loads/LoadBoardScreen';
import { LoadDetailScreen } from '../screens/loads/LoadDetailScreen';
import { PostLoadScreen } from '../screens/loads/PostLoadScreen';
import { TrackingScreen } from '../screens/loads/TrackingScreen';

export type LoadsStackParamList = {
  LoadBoard: undefined;
  LoadDetail: { loadId: string };
  PostLoad: undefined;
  Tracking: { loadId: string };
};

const Stack = createNativeStackNavigator<LoadsStackParamList>();

export function LoadsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoadBoard" component={LoadBoardScreen} />
      <Stack.Screen name="LoadDetail" component={LoadDetailScreen} />
      <Stack.Screen name="PostLoad" component={PostLoadScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />
    </Stack.Navigator>
  );
}
