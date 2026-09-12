import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import StampBoardDeco from '@/assets/icons/collection/stamp-board-deco.svg';
import { CollectionBoard } from '@/components/collection/collection-board';

type Tier = {
  id: string;
  label: [string, string];
  leftPct: number;
  topPct: number;
  decorative: boolean;
  reached: boolean;
};

// Positions below are read off the Figma board (390x797) as percentages of the board
// rect, since the tier ladder skips rows non-uniformly (milestones get sparser at
// higher tiers). TODO: replace with real thresholds once the character/collection
// API defines them — for now this mirrors the Figma mock 1:1.
// "레전드 여행가" used to live on a separate completion-state board (Figma node
// 616:1164) — the design merged it into this board as a 9th tier, which pulled
// veteran/national/master up to make room.
const TIERS: Tier[] = [
  { id: 'seed', label: ['여행', '새싹'], leftPct: 20.72, topPct: 18.95, decorative: false, reached: true },
  { id: 'beginner', label: ['여행', '입문자'], leftPct: 79.4, topPct: 18.82, decorative: false, reached: false },
  { id: 'novice', label: ['초보', '여행가'], leftPct: 79.55, topPct: 25.61, decorative: true, reached: false },
  { id: 'regional', label: ['지역', '수집가'], leftPct: 79.55, topPct: 32.27, decorative: true, reached: false },
  { id: 'pioneer', label: ['여행', '개척자'], leftPct: 79.55, topPct: 38.92, decorative: true, reached: false },
  { id: 'veteran', label: ['베테랑', '여행자'], leftPct: 79.55, topPct: 45.71, decorative: true, reached: false },
  { id: 'national', label: ['전국', '여행가'], leftPct: 79.55, topPct: 52.37, decorative: true, reached: false },
  { id: 'master', label: ['마스터', '여행가'], leftPct: 79.55, topPct: 65.81, decorative: true, reached: false },
  { id: 'legend', label: ['레전드', '여행가'], leftPct: 79.55, topPct: 78.75, decorative: true, reached: false },
];

// Centers deliberately coincide with the "seed"/"beginner" tier labels above — an
// earned stamp visually covers its tier's name (matches the Figma mock).
const EARNED_STAMPS = [
  { leftPct: 20.72, topPct: 20.74 },
  { leftPct: 79.28, topPct: 20.74 },
  { leftPct: 20.72, topPct: 27.4 },
];

export default function CollectionStampScreen() {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  return (
    <CollectionBoard>
      <View style={styles.boardWrap}>
        <Image
          source={require('@/assets/images/collection/stamp-board-bg.png')}
          style={styles.boardImage}
          contentFit="fill"
        />
        <View style={styles.decoLayer} pointerEvents="none">
          <StampBoardDeco width="100%" height="100%" />
        </View>

        <Text style={[styles.ribbonText, fontsLoaded && styles.ribbonTextFont]}>여행 도장</Text>

        {TIERS.map((tier) => (
          <View key={tier.id} style={[styles.tierLabel, { left: `${tier.leftPct}%`, top: `${tier.topPct}%` }]}>
            {tier.label.map((line, i) => (
              <Text
                key={i}
                style={[
                  styles.tierText,
                  tier.decorative && fontsLoaded && styles.tierTextFont,
                  tier.reached && styles.tierTextReached,
                ]}
              >
                {line}
              </Text>
            ))}
          </View>
        ))}

        {EARNED_STAMPS.map((stamp, i) => (
          <Image
            key={i}
            source={require('@/assets/images/collection/stamp-icon.png')}
            style={[styles.stamp, { left: `${stamp.leftPct}%`, top: `${stamp.topPct}%` }]}
            contentFit="contain"
          />
        ))}
      </View>
    </CollectionBoard>
  );
}

const styles = StyleSheet.create({
  boardWrap: {
    marginTop: 8,
    width: '100%',
    aspectRatio: 390 / 797,
    alignSelf: 'center',
  },
  boardImage: {
    ...StyleSheet.absoluteFill,
  },
  decoLayer: {
    ...StyleSheet.absoluteFill,
  },
  ribbonText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '5.9%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#535D51',
  },
  ribbonTextFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  tierLabel: {
    position: 'absolute',
    width: 56,
    marginLeft: -28,
    alignItems: 'center',
  },
  tierText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    color: '#7CA959',
    textAlign: 'center',
  },
  tierTextFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  tierTextReached: {
    opacity: 0.51,
  },
  stamp: {
    position: 'absolute',
    width: 53,
    height: 50,
    marginLeft: -26.5,
    marginTop: -25,
  },
});
