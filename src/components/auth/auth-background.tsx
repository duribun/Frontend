import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

type AuthBackgroundProps = PropsWithChildren<{
  source: ComponentProps<typeof Image>['source'];
  /** 텍스트 가독성이 필요한 화면(프로필 설정, 위치 인증 등)에서만 켠다. 로그인/스플래시는 기본값(false)으로 원본 밝기 유지. */
  overlay?: boolean;
}>;

export function AuthBackground({ source, overlay = false, children }: AuthBackgroundProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Image source={source} style={styles.background} contentFit="cover" />
      {overlay && <View style={styles.overlay} pointerEvents="none" />}
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
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.33)',
  },
});
