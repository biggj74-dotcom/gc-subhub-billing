import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MessagesListScreen } from '../screens/messages/MessagesListScreen';
import { MessageThreadScreen } from '../screens/messages/MessageThreadScreen';

export type MessagesStackParamList = {
  MessagesList: undefined;
  MessageThread: { loadId: string };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MessagesList" component={MessagesListScreen} />
      <Stack.Screen name="MessageThread" component={MessageThreadScreen} />
    </Stack.Navigator>
  );
}
