import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RefreshIcon from '@/assets/icons/main/refresh.svg';
import SettingsIcon from '@/assets/icons/main/settings.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import { IconButton } from '@/components/main/icon-button';
import { OnboardingGuide } from '@/components/onboarding/onboarding-guide';
import { ProfileOverlay } from '@/components/profile/profile-overlay';
import { useUserProfile } from '@/context/user-profile-context';
import { getMyPointBalance } from '@/lib/api';

const SWIPE_THRESHOLD = 60;

// TODO: 메인 화면 아트 스타일에 맞는 실제 남자 전신 캐릭터 에셋이 아직 없어서
// 온보딩 카드용 character-male.png를 임시로 재사용한다 (docs/ISSUE-캐릭터성별연동-온보딩가이드.md 참고).
// 실제 에셋이 나오면 assets/images/main/character-boy.png로 교체하고 이 매핑만 갈아끼우면 된다.
const CHARACTER_SOURCE = {
  FEMALE: require('@/assets/images/main/character-girl.png'),
  MALE: require('@/assets/images/onboarding/character-male.png'),
} as const;

// 프로필 클로즈업 사진 — 피그마 정식 목업(node 818:2673 "남캐")에서 export받은 에셋으로 교체 완료
// (docs/ISSUE-성별캐릭터-프로필이미지버그.md 2번). 헤더 아이콘/프로필 오버레이 카드 둘 다 이 이미지 하나를
// 공유해서 쓰고, 담기는 박스 크기만 style로 다르게 잘라 보여준다.
const PROFILE_SOURCE = {
  FEMALE: require('@/assets/images/main/profile-girl.png'),
  MALE: require('@/assets/images/main/profile-boy.png'),
} as const;

export default function MainScreen() {
  const router = useRouter();
  const { profile, shouldShowGuide, setShouldShowGuide } = useUserProfile();
  const gender = profile.gender ?? 'FEMALE';
  const [guideVisible, setGuideVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [coins, setCoins] = useState(0);
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  useEffect(() => {
    if (shouldShowGuide) {
      setGuideVisible(true);
      setShouldShowGuide(false);
    }
  }, [shouldShowGuide, setShouldShowGuide]);

  // 화면에 포커스될 때마다 잔액을 다시 불러온다 — 샵에서 구매하거나 마스코트/칭호 획득으로
  // 포인트가 바뀐 뒤 메인 화면으로 돌아와도(스택 push라 재마운트되지 않음) 최신 값을 보여주기 위함.
  // 실패 시에는 장식성 배지라 에러 UI 없이 조용히 이전 값을 유지한다.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getMyPointBalance()
        .then((result) => {
          if (!cancelled) setCoins(result.balance);
        })
        .catch(() => {
          // no-op: 조회 실패해도 화면을 막지 않고 이전 값을 유지한다.
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

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
    // NOTE: 신규 collection 라우트라 로컬 typed routes 갱신 전까지 `as Href` 캐스팅 (handleDiary와 동일 사유).
    router.push('/(main)/collection' as Href);
  }

  function handleShop() {
    // NOTE: 신규 shop 라우트라 로컬 typed routes 갱신 전까지 `as Href` 캐스팅 (handleDiary와 동일 사유).
    router.push('/(main)/shop' as Href);
  }

  function handleSettings() {
    // NOTE: 신규 settings 라우트라 로컬 typed routes 갱신 전까지 `as Href` 캐스팅 (handleDiary와 동일 사유).
    router.push('/(main)/settings' as Href);
  }

  function handleProfile() {
    setProfileVisible(true);
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
            <CoinBadge amount={coins} />
            <Pressable onPress={handleProfile} hitSlop={8} style={styles.profileButton}>
              <Image
                source={PROFILE_SOURCE[gender]}
                style={styles.profileImage}
                contentFit="cover"
                contentPosition="top"
                recyclingKey={`profile-${gender}`}
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
      <ProfileOverlay visible={profileVisible} onClose={() => setProfileVisible(false)} />
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
