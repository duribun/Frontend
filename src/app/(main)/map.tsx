import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import { AttractionCard } from '@/components/map/attraction-card';
import { SearchBar } from '@/components/map/search-bar';
import {
  type AttractionSummary,
  getNearbyAttractions,
  getRegionAttractions,
  getRegions,
  searchAttractions,
} from '@/lib/api';

const COLLAPSED_HEIGHT = 150;
const EXPANDED_HEIGHT = 620;
const SEARCH_DEBOUNCE_MS = 400;
const LOCATION_TIMEOUT_MS = 8000;

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

// 위치 권한이 있으면 현재 위치 주변 관광지를, 없거나 조회에 실패/지연되면 등록된 지역들의
// 관광지 목록으로 대체한다 (GET /api/map/**, GET /api/locations/regions 모두 인증 불필요).
// 실내 등 GPS 신호가 잡히지 않는 환경에서 getCurrentPositionAsync가 무한 대기하지 않도록 타임아웃을 둔다.
async function loadDefaultAttractions(): Promise<AttractionSummary[]> {
  const current = await Location.getForegroundPermissionsAsync();
  const granted =
    current.status === 'granted' ? true : (await Location.requestForegroundPermissionsAsync()).status === 'granted';

  if (granted) {
    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATION_TIMEOUT_MS,
      );
      return await getNearbyAttractions(position.coords.latitude, position.coords.longitude);
    } catch {
      // 위치 조회 실패/타임아웃 시 지역 기반 목록으로 폴백
    }
  }

  const regions = await getRegions();
  const lists = await Promise.all(regions.map((region) => getRegionAttractions(region.id)));
  return lists.flat();
}

export default function MapScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [attractions, setAttractions] = useState<AttractionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sheetStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, { duration: 250 }),
  }));

  useEffect(() => {
    const keyword = query.trim();
    let cancelled = false;

    async function run(fetcher: () => Promise<AttractionSummary[]>, failureMessage: string) {
      setLoading(true);
      setError(null);
      try {
        const results = await fetcher();
        if (!cancelled) {
          setAttractions(results);
        }
      } catch {
        if (!cancelled) {
          setError(failureMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (keyword.length === 0) {
      run(loadDefaultAttractions, '관광지 정보를 불러오지 못했어요.');
      return () => {
        cancelled = true;
      };
    }

    const timer = setTimeout(() => {
      run(() => searchAttractions(keyword), '검색에 실패했어요.');
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/map/paper-texture.jpg')}
        style={styles.texture}
        contentFit="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Text style={styles.title}>지도</Text>
        </View>

        <View style={styles.mapWrap}>
          <Image
            source={require('@/assets/images/map/korea-map.png')}
            style={styles.map}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.sheet, sheetStyle]}>
        <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={8} style={styles.grabberRow}>
          <View style={styles.grabber} />
        </Pressable>

        <View style={styles.sheetContent}>
          <SearchBar value={query} onChangeText={setQuery} />

          {expanded && (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator style={styles.statusIndicator} color="#8A8A8A" />
              ) : error ? (
                <Text style={styles.statusText}>{error}</Text>
              ) : attractions.length === 0 ? (
                <Text style={styles.statusText}>표시할 관광지가 없어요.</Text>
              ) : (
                attractions.map((attraction) => (
                  <View key={attraction.contentId} style={styles.listItem}>
                    <AttractionCard title={attraction.title} imageUrl={attraction.imageUrl} />
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1D3',
  },
  texture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  mapWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingBottom: 160,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  sheet: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.71)',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  grabberRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D8D3C8',
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  list: {
    flex: 1,
  },
  listItem: {
    marginBottom: 12,
  },
  statusIndicator: {
    marginTop: 24,
  },
  statusText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#8A8A8A',
  },
});
