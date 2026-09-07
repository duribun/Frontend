import { useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { CollectionBoard } from '@/components/collection/collection-board';
import { MascotSticker } from '@/components/collection/mascot-sticker';

// TODO: wire up to the backend character/collection API once it exists — mock mascots below.
const MASCOTS = [
  { id: 'bread', image: require('@/assets/images/collection/mascot-bread-char.png') },
  { id: 'camellia', image: require('@/assets/images/collection/mascot-camellia-char.png') },
  { id: 'apple', image: require('@/assets/images/collection/mascot-apple-char.png') },
  { id: 'crane', image: require('@/assets/images/collection/mascot-crane-char.png') },
  { id: 'azalea', image: require('@/assets/images/collection/mascot-azalea-char.png') },
  { id: 'haechi', image: require('@/assets/images/collection/mascot-haechi-char.png') },
  { id: 'sealion', image: require('@/assets/images/collection/mascot-sealion-char.png') },
  { id: 'catcrab', image: require('@/assets/images/collection/mascot-catcrab-char.png') },
  { id: 'whale', image: require('@/assets/images/collection/mascot-whale-char.png') },
  { id: 'deer', image: require('@/assets/images/collection/mascot-deer-char.png') },
];

const TOTAL_MASCOT_COUNT = 76;
const PAGES = [MASCOTS.slice(0, 6), MASCOTS.slice(6)];

export default function CollectionMascotScreen() {
  const [pageWidth, setPageWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setPageWidth(event.nativeEvent.layout.width);
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!pageWidth) return;
    setActivePage(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  }

  return (
    <CollectionBoard title="마스코트 도감" subtitle={`${MASCOTS.length} / ${TOTAL_MASCOT_COUNT}`}>
      <View style={styles.scrollWrap} onLayout={handleLayout}>
        {pageWidth > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
          >
            {PAGES.map((pageMascots, index) => (
              <View key={index} style={[styles.page, { width: pageWidth }]}>
                {pageMascots.map((mascot) => (
                  <MascotSticker key={mascot.id} image={mascot.image} />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.dots}>
        {PAGES.map((_, index) => (
          <View key={index} style={[styles.dot, activePage === index && styles.dotActive]} />
        ))}
      </View>
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
});
