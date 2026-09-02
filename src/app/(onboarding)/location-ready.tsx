import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';

export default function LocationReadyScreen() {
  const router = useRouter();

  function handleStart() {
    router.replace('/(tabs)');
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')} overlay>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.spacer} />

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>위치 인증 준비 완료!</Text>
          <Text style={styles.description}>
            이제 실제 지역을 탐험하며{'\n'}캐릭터와 관광지를 수집할 수 있어요.
          </Text>
        </View>

        <View style={styles.spacer} />

        <PillButton label="탐험 시작하기" onPress={handleStart} />
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
});
