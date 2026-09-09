import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RefreshIcon from '@/assets/icons/main/refresh.svg';
import SettingsIcon from '@/assets/icons/main/settings.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import type { Gender } from '@/context/user-profile-context';
import {
  getMyBadges,
  getMyMascots,
  getMyProfile,
  getVisitedRegions,
  listAllRecords,
  type VisitedRegion,
} from '@/lib/api';

const GREEN = '#699447';

// TODO: 메인 화면과 동일하게, 남자 프로필 정식 에셋이 아직 없어 온보딩 캐릭터 이미지를 임시로 재사용한다.
const PROFILE_SOURCE = {
  FEMALE: require('@/assets/images/main/profile-girl.png'),
  MALE: require('@/assets/images/onboarding/character-male.png'),
} as const;

function formatBirthDate(birthDate: string | null): string {
  if (!birthDate) return '00/00';
  const parts = birthDate.split('-');
  const month = parts[1];
  const day = parts[2];
  if (!month || !day) return '00/00';
  return `${month}/${day}`;
}

type ProfileData = {
  nickname: string;
  birthDate: string | null;
  gender: Gender | null;
  title: string | null;
  mascotCount: number;
  recordCount: number;
};

type ProfileOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

export function ProfileOverlay({ visible, onClose }: ProfileOverlayProps) {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);
  const [regions, setRegions] = useState<VisitedRegion[]>([]);
  const [regionIndex, setRegionIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([getMyProfile(), getMyMascots(), getMyBadges(), listAllRecords(), getVisitedRegions()])
      .then(([profile, mascots, badges, records, visitedRegions]) => {
        if (cancelled) return;
        setData({
          nickname: profile.nickname,
          birthDate: profile.birthDate,
          gender: profile.gender,
          // badges는 requiredMascotCount 내림차순 정렬로 내려온다 — 첫 항목이 곧 "현재 칭호".
          title: badges[0]?.name ?? null,
          mascotCount: mascots.length,
          recordCount: records.length,
        });
        setRegions(visitedRegions);
        setRegionIndex(0);
      })
      .catch(() => {
        if (!cancelled) {
          Alert.alert('불러오기 실패', '프로필 정보를 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible) return null;

  const gender = data?.gender ?? 'FEMALE';
  const currentRegionName = regions[regionIndex]?.regionName ?? null;

  function handleRefreshRegion() {
    // 방문한 지역이 있으면 새로고침을 누를 때마다 다음 방문 지역으로 순환해서 보여준다.
    // NOTE: 지역 방문을 계기로 마스코트를 획득하는 조건은 아직 미정이라 이번 구현에는 포함하지 않는다
    // (docs/ISSUE-프로필-구현.md 참고).
    if (regions.length === 0) return;
    setRegionIndex((prev) => (prev + 1) % regions.length);
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Image
          source={require('@/assets/images/main/background.png')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      </Pressable>

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <SettingsIcon width={38} height={38} />

          <View style={styles.headerRight}>
            <CoinBadge amount={797} />
            <Pressable onPress={onClose} hitSlop={8} style={styles.profileButton}>
              <Image
                source={PROFILE_SOURCE[gender]}
                style={styles.profileImage}
                contentFit="cover"
                contentPosition="top"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.content} pointerEvents="box-none">
          {loading || !data ? (
            <ActivityIndicator color={GREEN} />
          ) : (
            <View style={styles.card}>
              <Text style={[styles.cardHeading, fontsLoaded && styles.cardHeadingFont]}>
                🌿 여행자 정보 🌿
              </Text>

              <View style={styles.profileRow}>
                <View style={styles.photoPlaceholder}>
                  <Image
                    source={PROFILE_SOURCE[gender]}
                    style={styles.photoImage}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>
                <View style={styles.nameColumn}>
                  <Text style={styles.titleLabel} numberOfLines={1}>
                    {data.title ?? '칭호 없음'}
                  </Text>
                  <Text style={styles.nameLabel} numberOfLines={1}>
                    {data.nickname}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🎂</Text>
                  <Text style={styles.statLabel}>생일</Text>
                  <Text style={styles.statValue}>{formatBirthDate(data.birthDate)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>🐾</Text>
                  <Text style={styles.statLabel}>획득 마스코트</Text>
                  <Text style={styles.statValue}>{data.mascotCount}명</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statIcon}>📔</Text>
                  <Text style={styles.statLabel}>기록 개수</Text>
                  <Text style={styles.statValue}>{data.recordCount}개</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>

      <View style={styles.signpostWrap} pointerEvents="box-none">
        <Image
          source={require('@/assets/images/main/signpost.png')}
          style={styles.signpost}
          contentFit="contain"
        />
        <Text style={[styles.regionName, fontsLoaded && styles.regionNameFont]} numberOfLines={1}>
          {currentRegionName ?? '지역명'}
        </Text>
        <Pressable onPress={handleRefreshRegion} hitSlop={8} style={styles.refreshButton}>
          <RefreshIcon width={20} height={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '18%',
  },
  card: {
    width: '100%',
    backgroundColor: '#FEFEFE',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHeading: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  cardHeadingFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  profileRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0EDE4',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  nameColumn: {
    flex: 1,
    gap: 6,
  },
  titleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  nameLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
  },
  divider: {
    marginTop: 20,
    marginBottom: 16,
    height: 1,
    backgroundColor: '#EDEAE1',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#8A8A8A',
  },
  statValue: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '700',
    color: '#222222',
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
