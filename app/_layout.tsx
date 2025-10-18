import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Auto NIFTY Options Trader' }} />
        <Stack.Screen name="logs" options={{ title: 'Trade Logs' }} />
        <Stack.Screen name="auth" options={{ title: 'FYERS Login' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
