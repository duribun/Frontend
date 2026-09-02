import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';

const FEATURES = [
  { icon: 'search' as const, label: '주변 관광지 탐색' },
  { icon: 'location' as const, label: '지역 방문 인증' },
  { icon: 'gift' as const, label: '마스코트 수집' },
];

export default function LocationPermissionScreen() {
  const router = useRouter();

  async function handleAllow() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      router.push('/(onboarding)/location-ready');
    }
    // TODO: 거부(특히 영구 거부)된 경우 설정 앱으로 안내하는 처리 추가.
  }

  function handleLater() {
    router.back();
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')} overlay>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.spacer} />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>위치 인증이 필요해요!</Text>
          <Text style={styles.description}>
            두리번은 실제 방문한 지역을 인증하여{'\n'}지역 캐릭터와 보상을 제공해요.{'\n'}GPS 기반 여행 플랫폼입니다.
          </Text>

          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <Ionicons name={feature.icon} size={18} color="#FEFEFE" />
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttons}>
          <PillButton label="위치 권한 허용하기" onPress={handleAllow} />
          <PillButton label="나중에 하기" variant="ghost" onPress={handleLater} />
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 21,
    paddingBottom: 24,
  },
  spacer: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    gap: 14,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#EDEDED',
  },
  featureList: {
    marginTop: 8,
    gap: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FEFEFE',
  },
  buttons: {
    gap: 10,
  },
});
