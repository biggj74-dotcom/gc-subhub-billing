import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { C } from '../theme/tokens';
import { useAuthStore } from '../stores/authStore';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: C.bg, card: C.panel, border: C.line, primary: C.gold, text: C.paper },
};

export function RootNavigator() {
  const initializing = useAuthStore((s) => s.initializing);
  const session = useAuthStore((s) => s.session);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: C.bg }}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return <NavigationContainer theme={navTheme}>{session ? <MainTabs /> : <AuthStack />}</NavigationContainer>;
}
