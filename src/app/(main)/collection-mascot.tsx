import { useEffect, useMemo, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CollectionBoard } from '@/components/collection/collection-board';
import { MascotSticker } from '@/components/collection/mascot-sticker';
import { getMascots, type MascotEntry } from '@/lib/api';

const PAGE_SIZE = 6;

// 미보유 마스코트는 아예 그리지 않고, 보유한 것만 스티커로 채워나간다(도감이 빈 채로 시작해서
// 하나씩 얻을 때마다 채워지는 느낌). 위치는 격자가 아니라 서로 겹치지 않는 랜덤한 자리에 배치.
const SLOT_MIN_SIZE = 26;
const SLOT_MAX_SIZE = 38;
const SLOT_GAP = 2;
const MAX_PLACEMENT_ATTEMPTS = 80;

type Slot = { left: number; top: number; width: number; height: number };

// 시드 기반 PRNG(mulberry32) — 같은 페이지(같은 마스코트 구성)는 리렌더/재조회해도 항상 같은
// 배치가 나오도록 페이지 인덱스를 시드로 사용한다. Math.random을 그냥 쓰면 매번 자리가 달라져서
// 화면이 열릴 때마다 스티커가 널뛰어 보인다.
function createRng(seed: number) {
  let state = seed;
  return function rng() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function overlaps(a: Slot, b: Slot) {
  return !(
    a.left + a.width + SLOT_GAP <= b.left ||
    b.left + b.width + SLOT_GAP <= a.left ||
    a.top + a.height + SLOT_GAP <= b.top ||
    b.top + b.height + SLOT_GAP <= a.top
  );
}

function layoutPage(count: number, seed: number): Slot[] {
  const rng = createRng(seed);
  const placed: Slot[] = [];
  for (let i = 0; i < count; i++) {
    let slot: Slot | null = null;
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS && !slot; attempt++) {
      const width = SLOT_MIN_SIZE + rng() * (SLOT_MAX_SIZE - SLOT_MIN_SIZE);
      const height = SLOT_MIN_SIZE + rng() * (SLOT_MAX_SIZE - SLOT_MIN_SIZE);
      const candidate: Slot = {
        left: rng() * (100 - width),
        top: rng() * (100 - height),
        width,
        height,
      };
      if (!placed.some((p) => overlaps(candidate, p))) {
        slot = candidate;
      }
    }
    // 80번 시도해도 빈 자리를 못 찾으면(스티커가 꽉 찬 페이지) 겹침을 감수하고 작은 크기로 배치.
    placed.push(slot ?? { left: rng() * 60, top: rng() * 60, width: SLOT_MIN_SIZE, height: SLOT_MIN_SIZE });
  }
  return placed;
}

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

  const acquiredMascots = mascots.filter((mascot) => mascot.acquired);
  const pages = chunk(acquiredMascots, PAGE_SIZE);
  const pageLayouts = useMemo(() => pages.map((page, index) => layoutPage(page.length, index)), [pages]);

  return (
    <CollectionBoard title="마스코트 도감" subtitle={loading ? undefined : `${acquiredMascots.length} / ${mascots.length}`}>
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
                    {pageMascots.map((mascot, slotIndex) => {
                      const slot = pageLayouts[index][slotIndex];
                      return (
                        <View
                          key={mascot.mascotId}
                          style={[
                            styles.slot,
                            {
                              left: `${slot.left}%`,
                              top: `${slot.top}%`,
                              width: `${slot.width}%`,
                              height: `${slot.height}%`,
                            },
                          ]}
                        >
                          <MascotSticker name={mascot.name} imageUrl={mascot.imageUrl} />
                        </View>
                      );
                    })}
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
    height: '100%',
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  slot: {
    position: 'absolute',
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
