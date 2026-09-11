import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="record/index" />
      <Stack.Screen name="record/write" />
      <Stack.Screen name="record/[id]" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/login-account" />
      <Stack.Screen name="settings/sound" />
      <Stack.Screen name="settings/location-permission" />
      <Stack.Screen name="settings/withdraw" />
    </Stack>
  );
}
