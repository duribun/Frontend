import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

type AuthBackgroundProps = PropsWithChildren<{
  source: ComponentProps<typeof Image>['source'];
}>;

export function AuthBackground({ source, children }: AuthBackgroundProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={source} style={styles.background} contentFit="cover" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3F6FA8',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
});
