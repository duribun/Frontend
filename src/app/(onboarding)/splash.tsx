import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AuthBackground } from '@/components/auth/auth-background';
import { SocialRow, type SocialProvider } from '@/components/auth/social-row';

// TODO: 자동로그인(토큰 재발급) 체크가 붙으면 이 타이머 대신 그 결과로 ready를 바꾼다.
const LOADING_DURATION_MS = 2200;

export default function SplashScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: LOADING_DURATION_MS, easing: Easing.out(Easing.cubic) });
    const timer = setTimeout(() => setReady(true), LOADING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  function handleSocialSignIn(provider: SocialProvider) {
    // TEMP: BE 소셜 로그인 연동 전까지는 버튼 클릭 시 바로 다음 온보딩 단계로 이동한다.
    // TODO: BE 연동되면 이 부분을 실제 provider OAuth → socialLogin(provider, token) 호출로 교체.
    // TODO: 최초 로그인이 아닌 경우(재로그인) profile-setup을 건너뛰고 (tabs)로 바로 보내는 분기 추가.
    console.log(`[auth] TEMP bypass login as ${provider}`);
    router.replace('/(onboarding)/profile-setup');
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.logoWrap}>
          <Image
            source={require('@/assets/images/onboarding/splash-title.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <View style={styles.bottomSection}>
          {!ready ? (
            <Animated.View exiting={FadeOut.duration(250)} style={styles.loadingWrap}>
              <Text style={styles.loadingLabel}>Loading &middot;&middot;&middot;</Text>
              <View style={styles.track}>
                <Animated.View style={[styles.fill, fillStyle]} />
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(300)} style={styles.socialSection}>
              <Text style={styles.socialLabel}>SNS 계정으로 로그인</Text>
              <SocialRow onSelect={handleSocialSignIn} />
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 21,
    paddingBottom: 48,
  },
  logoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    aspectRatio: 323.45 / 169,
  },
  bottomSection: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 10,
  },
  loadingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  track: {
    width: 200,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#C8DA77',
  },
  socialSection: {
    alignItems: 'center',
    gap: 16,
  },
  socialLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FEFEFE',
  },
});
