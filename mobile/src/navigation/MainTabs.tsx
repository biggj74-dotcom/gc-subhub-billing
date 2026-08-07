import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { Home, Truck, MessageCircle, Users, User } from 'lucide-react-native';
import { View } from 'react-native';
import { C, body } from '../theme/tokens';
import { HomeScreen } from '../screens/home/HomeScreen';
import { LoadsStack, type LoadsStackParamList } from './LoadsStack';
import { ProfileStack } from './ProfileStack';
import { ComingSoonScreen } from '../screens/placeholder/ComingSoonScreen';
import { useL } from '../i18n/useLanguage';

export type MainTabsParamList = {
  Home: undefined;
  Loads: NavigatorScreenParams<LoadsStackParamList>;
  Messages: undefined;
  Community: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const L = useL();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: C.panel, borderTopColor: C.line, borderTopWidth: 1 },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.silver,
        tabBarLabelStyle: [body, { fontSize: 9 }],
        tabBarIcon: ({ color, focused }) => {
          const Icon = { Home, Loads: Truck, Messages: MessageCircle, Community: Users, Profile: User }[route.name];
          return (
            <View className="items-center gap-1.5">
              <View style={{ height: 1, width: 20, backgroundColor: focused ? C.gold : 'transparent' }} />
              <Icon size={17} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: L('home') }} />
      <Tab.Screen name="Loads" component={LoadsStack} options={{ tabBarLabel: L('loads') }} />
      <Tab.Screen name="Messages" options={{ tabBarLabel: L('msgs') }}>
        {() => <ComingSoonScreen title={L('msgs')} />}
      </Tab.Screen>
      <Tab.Screen name="Community" options={{ tabBarLabel: L('community') }}>
        {() => <ComingSoonScreen title={L('community')} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: L('profile') }} />
    </Tab.Navigator>
  );
}
