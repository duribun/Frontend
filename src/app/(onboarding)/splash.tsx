import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const LOADING_DURATION_MS = 2200;

export default function SplashScreen() {
  const router = useRouter();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: LOADING_DURATION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(router.replace)('/(onboarding)/sign-in');
        }
      },
    );
  }, [progress, router]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Image
        source={require('@/assets/images/onboarding/scenic-bg.jpg')}
        style={styles.background}
        contentFit="cover"
      />

      <View style={styles.titleWrap}>
        <Image
          source={require('@/assets/images/onboarding/splash-title.png')}
          style={styles.title}
          contentFit="contain"
        />
      </View>

      <View style={styles.loadingWrap}>
        <Text style={styles.loadingLabel}>Loading &middot;&middot;&middot;</Text>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, fillStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8FCBEF',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  titleWrap: {
    position: 'absolute',
    top: '20%',
    left: '9%',
    right: '9%',
    alignItems: 'center',
  },
  title: {
    width: '100%',
    aspectRatio: 323.45 / 169,
  },
  loadingWrap: {
    position: 'absolute',
    bottom: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  loadingLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#432D07',
    letterSpacing: -0.5,
  },
  track: {
    width: 239,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#FBEFA3',
    borderWidth: 1,
    borderColor: '#67582E',
    padding: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#C8DA77',
  },
});
