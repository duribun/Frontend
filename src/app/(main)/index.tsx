import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RefreshIcon from '@/assets/icons/main/refresh.svg';
import SettingsIcon from '@/assets/icons/main/settings.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import { IconButton } from '@/components/main/icon-button';
import { OnboardingGuide } from '@/components/onboarding/onboarding-guide';
import { useUserProfile } from '@/context/user-profile-context';

const SWIPE_THRESHOLD = 60;

// TODO: 메인 화면 아트 스타일에 맞는 실제 남자 캐릭터/프로필 에셋이 아직 없어서
// 온보딩 카드용 character-male.png를 임시로 재사용한다 (docs/ISSUE-캐릭터성별연동-온보딩가이드.md 참고).
// 실제 에셋이 나오면 assets/images/main/character-boy.png, profile-boy.png로 교체하고 이 매핑만 갈아끼우면 된다.
const CHARACTER_SOURCE = {
  FEMALE: require('@/assets/images/main/character-girl.png'),
  MALE: require('@/assets/images/onboarding/character-male.png'),
} as const;

const PROFILE_SOURCE = {
  FEMALE: require('@/assets/images/main/profile-girl.png'),
  MALE: require('@/assets/images/onboarding/character-male.png'),
} as const;

export default function MainScreen() {
  const router = useRouter();
  const { profile, shouldShowGuide, setShouldShowGuide } = useUserProfile();
  const gender = profile.gender ?? 'FEMALE';
  const [guideVisible, setGuideVisible] = useState(false);
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  useEffect(() => {
    if (shouldShowGuide) {
      setGuideVisible(true);
      setShouldShowGuide(false);
    }
  }, [shouldShowGuide, setShouldShowGuide]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 10,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          router.push('/(main)/map');
        }
      },
    }),
  ).current;

  function handleDiary() {
    // NOTE: 이 세션에서는 아직 로컬 router.d.ts(typed routes)에 신규 record 라우트가 반영되지 않아
    // `as Href`로 캐스팅해둠. expo start/run:android를 한 번 실행하면 자동으로 타입이 갱신되면서
    // 캐스팅 없이도 타입 체크가 통과한다 (런타임 동작에는 영향 없음).
    router.push('/(main)/record' as Href);
  }

  function handleFrame() {
    // TODO: wire up to the collection (수집) flow once that screen exists.
  }

  function handleShop() {
    // TODO: wire up to the shop flow once that screen exists.
  }

  function handleSettings() {
    // TODO: wire up to the settings flow once that screen exists.
  }

  function handleProfile() {
    // TODO: wire up to the profile flow once that screen exists.
  }

  function handleRefreshRegionName() {
    // TODO: wire up to the backend location API to re-check the current region.
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Image
        source={require('@/assets/images/main/background.png')}
        style={styles.background}
        contentFit="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleSettings} hitSlop={8}>
            <SettingsIcon width={38} height={38} />
          </Pressable>

          <View style={styles.headerRight}>
            <CoinBadge amount={797} />
            <Pressable onPress={handleProfile} hitSlop={8} style={styles.profileButton}>
              <Image
                source={PROFILE_SOURCE[gender]}
                style={styles.profileImage}
                contentFit="cover"
                contentPosition="top"
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Positioned as % of the full screen, matching the Figma frame (402x874) layout 1:1. */}
      <View style={styles.iconColumn} pointerEvents="box-none">
        <IconButton
          source={require('@/assets/images/main/icon-diary.png')}
          width={57}
          height={63}
          onPress={handleDiary}
        />
        <IconButton
          source={require('@/assets/images/main/icon-frame.png')}
          width={59}
          height={56}
          onPress={handleFrame}
        />
        <IconButton
          source={require('@/assets/images/main/icon-shop.png')}
          width={63}
          height={63}
          onPress={handleShop}
        />
        <IconButton
          source={require('@/assets/images/main/icon-map.png')}
          width={63}
          height={51}
          onPress={() => router.push('/(main)/map')}
        />
      </View>

      <View style={styles.characterStage} pointerEvents="none">
        <Image
          source={require('@/assets/images/main/character-shadow.png')}
          style={styles.characterShadow}
          contentFit="contain"
        />
        <Image
          source={CHARACTER_SOURCE[gender]}
          style={styles.character}
          contentFit="contain"
          contentPosition="bottom"
        />
      </View>

      <View style={styles.signpostWrap}>
        <Image
          source={require('@/assets/images/main/signpost.png')}
          style={styles.signpost}
          contentFit="contain"
        />
        <Text style={[styles.regionName, fontsLoaded && styles.regionNameFont]}>지역명</Text>
        <Pressable onPress={handleRefreshRegionName} hitSlop={8} style={styles.refreshButton}>
          <RefreshIcon width={20} height={20} />
        </Pressable>
      </View>

      <OnboardingGuide visible={guideVisible} onFinish={() => setGuideVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7E6E2',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  safeArea: {
    paddingHorizontal: 18,
  },
  headerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  iconColumn: {
    position: 'absolute',
    left: '4%',
    top: '20.4%',
    gap: 20,
  },
  characterStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '26%',
    alignItems: 'center',
  },
  characterShadow: {
    position: 'absolute',
    bottom: '-3%',
    width: '80%',
    aspectRatio: 305 / 89,
  },
  character: {
    width: '58%',
    aspectRatio: 198 / 396,
  },
  signpostWrap: {
    position: 'absolute',
    left: '16.4%',
    bottom: 0,
    width: '67.2%',
    aspectRatio: 270 / 239,
  },
  signpost: {
    width: '100%',
    height: '100%',
  },
  regionName: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    lineHeight: 32,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: '#3D2109',
  },
  regionNameFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  refreshButton: {
    position: 'absolute',
    top: '39%',
    left: '45.9%',
  },
});
