import { useEffect, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CollectionBoard } from '@/components/collection/collection-board';
import { MascotSticker } from '@/components/collection/mascot-sticker';
import { getMascots, type MascotEntry } from '@/lib/api';

const PAGE_SIZE = 6;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages.length > 0 ? pages : [[]];
}

export default function CollectionMascotScreen() {
  const [mascots, setMascots] = useState<MascotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await getMascots();
        if (!cancelled) {
          setMascots(results);
        }
      } catch {
        if (!cancelled) {
          setError('마스코트 도감을 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLayout(event: LayoutChangeEvent) {
    setPageWidth(event.nativeEvent.layout.width);
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!pageWidth) return;
    setActivePage(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  }

  const acquiredCount = mascots.filter((mascot) => mascot.acquired).length;
  const pages = chunk(mascots, PAGE_SIZE);

  return (
    <CollectionBoard title="마스코트 도감" subtitle={loading ? undefined : `${acquiredCount} / ${mascots.length}`}>
      {loading ? (
        <ActivityIndicator style={styles.statusIndicator} color="#6C4202" />
      ) : error ? (
        <Text style={styles.statusText}>{error}</Text>
      ) : (
        <>
          <View style={styles.scrollWrap} onLayout={handleLayout}>
            {pageWidth > 0 && (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScrollEnd}
              >
                {pages.map((pageMascots, index) => (
                  <View key={index} style={[styles.page, { width: pageWidth }]}>
                    {pageMascots.map((mascot) => (
                      <MascotSticker
                        key={mascot.mascotId}
                        name={mascot.name}
                        imageUrl={mascot.imageUrl}
                        acquired={mascot.acquired}
                      />
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {pages.length > 1 && (
            <View style={styles.dots}>
              {pages.map((_, index) => (
                <View key={index} style={[styles.dot, activePage === index && styles.dotActive]} />
              ))}
            </View>
          )}
        </>
      )}
    </CollectionBoard>
  );
}

const styles = StyleSheet.create({
  scrollWrap: {
    flex: 1,
  },
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FCE9C5',
    opacity: 0.8,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#4A2E05',
    opacity: 1,
  },
  statusIndicator: {
    marginTop: 40,
  },
  statusText: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 14,
    color: '#6C4202',
  },
});
