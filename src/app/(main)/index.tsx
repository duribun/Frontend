import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Ellipse } from 'react-native-svg';

import RefreshIcon from '@/assets/icons/main/refresh.svg';
import SettingsIcon from '@/assets/icons/main/settings.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import { IconButton } from '@/components/main/icon-button';
import { MascotAcquiredOverlay, type AcquiredMascot } from '@/components/collection/mascot-acquired-overlay';
import { BadgeAcquiredOverlay, type AcquiredBadge } from '@/components/main/badge-acquired-overlay';
import { OnboardingGuide } from '@/components/onboarding/onboarding-guide';
import { ProfileOverlay } from '@/components/profile/profile-overlay';
import { useSoundSettings } from '@/context/sound-settings-context';
import { useUserProfile } from '@/context/user-profile-context';
import { getMyBadges, getMyPointBalance, getRegions, verifyLocation } from '@/lib/api';

const SWIPE_THRESHOLD = 60;
// (main)/map.tsx의 loadDefaultAttractions()와 동일한 이유(실내 등 GPS 신호가 안 잡히는 환경에서
// getCurrentPositionAsync가 무한 대기하지 않도록)로 타임아웃을 둔다. 값도 그쪽과 동일하게 맞췄다.
const LOCATION_TIMEOUT_MS = 8000;
// 에뮬레이터에서 adb geo fix로 좌표를 주입해도 getCurrentPositionAsync(라이브 fix 요청)가 계속
// timeout나는 걸 확인 — Fused Location Provider가 라이브 요청 자체엔 응답을 안 주는 환경이 있다.
// expo-location 공식 문서도 "빠른 응답이 필요하고 고정밀이 불필요하면 getLastKnownPositionAsync를
// 쓰라"고 안내한다. 우리도 지역 인증 반경이 1000m라 고정밀이 필요 없으니, 캐시된 마지막 위치가
// 이 시간 이내면 먼저 그걸 쓰고, 없거나 너무 오래됐을 때만 라이브 fix로 폴백한다.
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 60_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// 두 좌표 사이 거리를 미터 단위로 계산한다(하버사인 공식). 등록된 지역 중 지금 위치가
// `verificationRadiusMeters` 안에 드는 곳이 있는지 1차로 판별하는 용도 — 실제 인증 성공 여부는
// verifyLocation() 응답(`verified`)을 신뢰한다.
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const EARTH_RADIUS_METERS = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

// 여캐(character-girl.png)가 남캐(character-male.png)보다 화면에서 더 커 보인다는 피드백 — 두 에셋을
// PIL로 직접 뜯어보니 캔버스 대비 실제 캐릭터가 차지하는 폭 비율이 서로 달랐다(여캐 약 88%, 남캐 약 72%,
// alpha>50 기준 실측). `character` 스타일(width/aspectRatio)은 둘 다 같은 박스로 렌더링하는데, contentFit=
// "contain"이 각 이미지 자체의 비율대로 맞추기 때문에, 캔버스에 여백이 적은 여캐가 같은 박스 안에서 실제로
// 더 크게 그려진다. 남캐를 기준으로 맞추기 위해 여캐 렌더링 크기에만 비율(0.72/0.88 ≈ 0.81)을 곱한다.
const FEMALE_SIZE_SCALE = 0.81;
const CHARACTER_WIDTH_PERCENT: Record<'FEMALE' | 'MALE', number> = {
  MALE: 70,
  FEMALE: 70 * FEMALE_SIZE_SCALE, // ≈ 56.7
};
// 그림자 크기도 캐릭터 폭(70%) 기준으로 잡아둔 값(55%)이라, 캐릭터가 줄어드는 만큼 같은 비율로 같이 줄여야
// 그림자가 캐릭터에 비해 상대적으로 커 보이는 걸 막을 수 있다.
const CHARACTER_SHADOW_WIDTH_PERCENT: Record<'FEMALE' | 'MALE', number> = {
  MALE: 55,
  FEMALE: 55 * FEMALE_SIZE_SCALE, // ≈ 44.55
};

export default function MainScreen() {
  const router = useRouter();
  const { profile, shouldShowGuide, setShouldShowGuide } = useUserProfile();
  const { playMascotAcquiredSound } = useSoundSettings();
  const gender = profile.gender ?? 'FEMALE';
  const [guideVisible, setGuideVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [coins, setCoins] = useState(0);
  const [regionName, setRegionName] = useState('지역명');
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [acquiredMascot, setAcquiredMascot] = useState<AcquiredMascot | null>(null);
  const [acquiredBadge, setAcquiredBadge] = useState<AcquiredBadge | null>(null);
  // 마스코트 팝업을 먼저 닫아야 칭호 팝업이 뜨도록(동시에 두 팝업을 겹쳐 띄우지 않으려고) 대기시켜두는 값.
  const pendingBadgeRef = useRef<AcquiredBadge | null>(null);
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

  // 성호님 요청(docs/ISSUE-지역명새로고침-위치인증-마스코트획득.md): 새로고침을 누르면 GPS로 현재 위치를
  // 다시 확인해서 지역명을 갱신하고, 처음 방문한 지역이면 마스코트를 획득한다. `getRegions()`가
  // regionId를 직접 주지 않으므로, 여기서 하버사인 거리로 반경 안에 드는 지역을 먼저 찾은 뒤
  // verifyLocation()을 호출하는 순서다(등록된 지역과 겹치면 가장 가까운 한 곳을 선택).
  async function handleRefreshRegionName() {
    if (verifyingLocation) return;
    setVerifyingLocation(true);
    try {
      // 칭호(BadgeAcquiredOverlay)는 서버 응답에 안 실려 있어서(VerifyLocationResponse는
      // newlyAcquiredMascots만 준다) 위치 인증 전/후 보유 칭호 목록을 직접 비교해서 감지한다.
      // 마스코트 인증과 동시에 병렬로 미리 가져와두면 위치 조회 대기 시간에 묻혀서 추가 지연이 없다.
      const badgesBeforePromise = getMyBadges();

      const current = await Location.getForegroundPermissionsAsync();
      const granted =
        current.status === 'granted'
          ? true
          : (await Location.requestForegroundPermissionsAsync()).status === 'granted';

      if (!granted) {
        Alert.alert('위치 권한 필요', '현재 위치를 확인하려면 위치 접근 권한이 필요해요.');
        return;
      }

      // 임시 진단 로그: getLastKnownPositionAsync가 null인 게 "maxAge(60초) 안에 든 캐시가 없어서"인지
      // "이 기기/에뮬레이터에 위치 자체가 전혀 없어서"인지 구분하기 위해, 제한 없는 조회와
      // hasServicesEnabledAsync()도 같이 찍어본다.
      const [servicesEnabled, rawLastKnown] = await Promise.all([
        Location.hasServicesEnabledAsync(),
        Location.getLastKnownPositionAsync(),
      ]);
      console.warn(
        '[handleRefreshRegionName] 진단 — servicesEnabled:',
        servicesEnabled,
        'rawLastKnown(제한없음):',
        rawLastKnown,
      );

      // adb geo fix로 좌표를 주입해도 getCurrentPositionAsync(라이브 fix 요청)가 계속 timeout나는
      // 환경이 있었다 — Fused Location Provider가 라이브 요청 자체엔 응답을 안 주는 경우. 캐시된
      // 마지막 위치가 있으면 먼저 그걸 쓰고, 없거나 너무 오래됐을 때만 라이브 요청으로 폴백한다.
      const cachedPosition = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS,
      });
      // 진단 로그로 확인: rawLastKnown이 에뮬레이터 기본 위치(Mountain View, 37.42/-122.08)로 나온 걸
      // 보면 adb geo fix로 주입한 GPS 좌표가 아니라 훨씬 오래된 네트워크 기반 위치가 캐시돼 있었다.
      // Accuracy.Balanced는 네트워크 기반 위치를 우선시하는 경향이 있어서, 그쪽 백엔드가 응답을 안 주면
      // adb geo fix가 실제로 먹이는 GPS_PROVIDER 경로는 요청도 안 가고 영영 대기하는 것으로 보인다.
      // Highest로 올려서 GPS 우선순위를 높인다(지역 인증 반경 1000m라 정확도가 높아져도 무해함).
      const position =
        cachedPosition ??
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest }),
          LOCATION_TIMEOUT_MS,
        ));
      const { latitude, longitude } = position.coords;

      const regions = await getRegions();
      let nearestRegion: (typeof regions)[number] | null = null;
      let nearestDistance = Infinity;
      for (const region of regions) {
        const distance = haversineDistanceMeters(latitude, longitude, region.latitude, region.longitude);
        if (distance <= region.verificationRadiusMeters && distance < nearestDistance) {
          nearestRegion = region;
          nearestDistance = distance;
        }
      }

      if (!nearestRegion) {
        // [비고 1: 반경 밖] 등록된 지역과 너무 멀리 떨어져 있으면 팻말은 그대로 두고 안내만 띄운다.
        Alert.alert('인증 실패', '근처에 등록된 지역이 없어요.');
        return;
      }

      const result = await verifyLocation({ regionId: nearestRegion.id, latitude, longitude });
      setRegionName(result.regionName);

      if (result.isFirstVisit && result.newlyAcquiredMascots.length > 0) {
        // docs/ISSUE-마스코트획득화면-Figma연출구현.md — Region과 마스코트가 1:1 매핑이라
        // newlyAcquiredMascots는 항상 0개 아니면 1개다(BE 쪽 확인 완료). 전용 연출 화면
        // (MascotAcquiredOverlay)을 띄우고, 효과음은 기존처럼 그대로 재생한다.
        playMascotAcquiredSound();
        setAcquiredMascot({ name: result.newlyAcquiredMascots[0].name, regionName: result.regionName });

        // docs/ISSUE-메인화면칭호획득연출구현.md — 칭호는 마스코트 획득 수 임계값에 따라 BE가
        // 자동으로 부여한다(BadgeService.handleMascotAcquired). 방금 새로 생긴 칭호가 있는지는
        // "이번 verifyLocation 호출 전/후 getMyBadges() 응답 차이"로 판별한다. getMyBadges()는
        // 보유한 칭호만 내려주므로(전체 8단계 아님) code가 새로 등장했으면 신규 획득이다.
        const badgesBefore = await badgesBeforePromise;
        const beforeCodes = new Set(badgesBefore.map((badge) => badge.code));
        const badgesAfter = await getMyBadges();
        const newlyAcquiredBadge = badgesAfter.find((badge) => !beforeCodes.has(badge.code));
        if (newlyAcquiredBadge) {
          // 마스코트 팝업이 이미 떠있으니 칭호 팝업은 그걸 닫은 뒤(onConfirm) 이어서 띄운다.
          pendingBadgeRef.current = { name: newlyAcquiredBadge.name };
        }
      }
    } catch (error) {
      // 임시 디버깅: 원래 catch{}로 실제 에러를 그냥 삼켰는데, 에뮬레이터에서 실패 원인이(권한/GPS
      // 타임아웃/getRegions·verifyLocation 네트워크 실패 중 어디인지) 안 보여서 콘솔에 남긴다.
      // Metro 번들러 터미널이나 Logcat에서 이 로그로 실제 원인을 확인할 수 있다.
      console.warn('[handleRefreshRegionName] 위치 인증 실패:', error);
      Alert.alert('위치 확인 실패', '현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setVerifyingLocation(false);
    }
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
          width={78}
          height={56}
          onPress={() => router.push('/(main)/map')}
        />
      </View>

      <View style={styles.characterStage} pointerEvents="none">
        {/* borderRadius로 만든 모양은 위아래가 평평한 "알약(스타디움)" 형태라 아무리 넓혀도
            각져 보였다 — react-native-svg의 Ellipse로 실제 곡선 타원을 그림. viewBox를 정사각형
            (0~100, 0~100)으로 두고 반지름 50짜리 원을 채운 뒤 preserveAspectRatio="none"으로
            컨테이너 비율(styles.characterShadow의 width/aspectRatio)에 맞게 늘려서 납작한
            타원으로 만든다. */}
        <Svg
          style={[styles.characterShadow, { width: `${CHARACTER_SHADOW_WIDTH_PERCENT[gender]}%` }]}
          viewBox="0 0 100 100"
          preserveAspectRatio="none">
          <Ellipse cx={50} cy={50} rx={50} ry={50} fill="rgba(20, 20, 20, 0.22)" />
        </Svg>
        <Image
          source={CHARACTER_SOURCE[gender]}
          style={[styles.character, { width: `${CHARACTER_WIDTH_PERCENT[gender]}%` }]}
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
        <Text style={[styles.regionName, fontsLoaded && styles.regionNameFont]}>{regionName}</Text>
        <Pressable
          onPress={handleRefreshRegionName}
          disabled={verifyingLocation}
          hitSlop={8}
          style={styles.refreshButton}
        >
          {verifyingLocation ? (
            <ActivityIndicator size="small" color="#3D2109" />
          ) : (
            <RefreshIcon width={20} height={20} />
          )}
        </Pressable>
      </View>

      <OnboardingGuide visible={guideVisible} onFinish={() => setGuideVisible(false)} />
      <ProfileOverlay visible={profileVisible} onClose={() => setProfileVisible(false)} />
      <MascotAcquiredOverlay
        mascot={acquiredMascot}
        onConfirm={() => {
          setAcquiredMascot(null);
          if (pendingBadgeRef.current) {
            setAcquiredBadge(pendingBadgeRef.current);
            pendingBadgeRef.current = null;
          }
        }}
      />
      <BadgeAcquiredOverlay badge={acquiredBadge} onConfirm={() => setAcquiredBadge(null)} />
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
    // 성호님 요청: 프로필 원형 흰 테두리가 두꺼워 보여서 축소 (2 → 1). 피그마 자체에는
    // 이 테두리가 없지만(마스크 원과 캐릭터 이미지만 존재), 배경과 구분되도록 얇게 유지.
    width: 51,
    height: 51,
    borderRadius: 25.5,
    overflow: 'hidden',
    borderWidth: 1,
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
    alignItems: 'center',
  },
  characterStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '28%',
    alignItems: 'center',
  },
  characterShadow: {
    // width는 성별별로 다르게 주입된다 (CHARACTER_SHADOW_WIDTH_PERCENT 참고).
    position: 'absolute',
    alignSelf: 'center',
    bottom: -6,
    aspectRatio: 9,
    transform: [{ translateX: 10 }],
  },
  character: {
    // width는 성별별로 다르게 주입된다 (CHARACTER_WIDTH_PERCENT 참고) — 여캐 에셋의 캔버스 여백이
    // 남캐보다 적어서 같은 박스로 렌더링하면 여캐가 더 커 보이는 걸 보정하기 위함.
    aspectRatio: 200 / 400,
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
    lineHeight: 40,
    textAlign: 'center',
    fontSize: 34,
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
