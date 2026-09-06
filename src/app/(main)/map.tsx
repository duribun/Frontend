import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import { AttractionCard } from '@/components/map/attraction-card';
import { SearchBar } from '@/components/map/search-bar';

const COLLAPSED_HEIGHT = 150;
const EXPANDED_HEIGHT = 620;

// TODO: replace with GET /api/map/regions/{regionId}/attractions or GET /api/map/nearby.
const MOCK_ATTRACTIONS = [
  { id: '1', title: '경복궁', description: '조선 왕조를 대표하는 법궁', location: '서울 종로구' },
  { id: '2', title: '해운대 해수욕장', description: '부산을 대표하는 해수욕장', location: '부산 해운대구' },
  { id: '3', title: '성심당', description: '대전을 대표하는 빵집', location: '대전 중구' },
  { id: '4', title: '경포호', description: '동해와 맞닿은 호수', location: '강원 강릉시' },
  { id: '5', title: '자갈치시장', description: '부산의 대표 수산시장', location: '부산 중구' },
];

export default function MapScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');

  const sheetStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, { duration: 250 }),
  }));

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/map/paper-texture.png')}
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
              {MOCK_ATTRACTIONS.map((attraction) => (
                <View key={attraction.id} style={styles.listItem}>
                  <AttractionCard
                    title={attraction.title}
                    description={attraction.description}
                    location={attraction.location}
                  />
                </View>
              ))}
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
});
