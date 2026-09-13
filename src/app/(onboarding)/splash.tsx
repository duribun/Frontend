import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AuthBackground } from '@/components/auth/auth-background';
import { SocialRow, type SocialProvider } from '@/components/auth/social-row';
import { signInWithGoogle } from '@/lib/auth';

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

  async function handleSocialSignIn(provider: SocialProvider) {
    // TODO: Kakao/Naver는 아직 미구현 — Google 먼저 붙이고 후속 작업으로 추가한다.
    if (provider !== 'google') {
      console.log(`[auth] TEMP bypass login as ${provider}`);
      router.replace('/(onboarding)/profile-setup');
      return;
    }

    try {
      const { isNewUser } = await signInWithGoogle();
      // 최초 가입이면 프로필 설정으로, 재로그인이면 위치 권한 여부와 무관하게 바로 메인으로.
      router.replace(isNewUser ? '/(onboarding)/profile-setup' : '/(main)');
    } catch (error) {
      // TODO: 에러 토스트/알림 UI. 지금은 콘솔 로그만 남기고 스플래시에 그대로 머문다.
      console.error('[auth] Google 로그인 실패', error);
    }
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
