import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import StampBoardDeco from '@/assets/icons/collection/stamp-board-deco.svg';
import { CollectionBoard } from '@/components/collection/collection-board';
import { getBadges } from '@/lib/api';

type Tier = {
  id: string;
  label: [string, string];
  threshold: number;
  leftPct: number;
  topPct: number;
};

// Positions below are read off the Figma board (390x797) as percentages of the board
// rect, since the tier ladder skips rows non-uniformly (milestones get sparser at
// higher tiers) — this mirrors the Figma mock 1:1.
// "레전드 여행가" used to live on a separate completion-state board (Figma node
// 616:1164) — the design merged it into this board as a 9th tier, which pulled
// veteran/national/master up to make room. "베테랑 여행자" was later dropped
// (issue #27), so national/master/legend each shift up by one slot (~6.66%)
// to close the gap it left.
// threshold = 칭호 획득에 필요한 마스코트 수 (기획 확정값). 화면에는 표시하지 않고
// reached 판정 로직(보유 마스코트 수와 비교)에만 사용 — TODO: 실제 보유 수와 연동.
// leftPct는 Figma 텍스트 노드의 왼쪽 가장자리가 아니라 "가로 중심"을 기준으로 계산한 값이다 —
// tierLabel이 width:56 + marginLeft:-28로 leftPct 지점을 텍스트 중심처럼 쓰기 때문에, 왼쪽 가장자리
// 좌표를 그대로 넣으면 텍스트 실제 폭의 절반만큼 왼쪽으로 밀려 보인다(실제로 발견된 버그).
const TIERS: Tier[] = [
  { id: 'seed', label: ['여행', '새싹'], threshold: 0, leftPct: 21.92, topPct: 19.57 },
  { id: 'beginner', label: ['여행', '입문자'], threshold: 5, leftPct: 78.33, topPct: 19.45 },
  { id: 'novice', label: ['초보', '여행가'], threshold: 10, leftPct: 78.33, topPct: 26.1 },
  { id: 'regional', label: ['지역', '수집가'], threshold: 15, leftPct: 78.33, topPct: 32.62 },
  { id: 'pioneer', label: ['여행', '개척자'], threshold: 20, leftPct: 78.33, topPct: 39.15 },
  { id: 'national', label: ['전국', '여행가'], threshold: 30, leftPct: 78.33, topPct: 52.32 },
  { id: 'master', label: ['마스터', '여행가'], threshold: 40, leftPct: 78.33, topPct: 65.5 },
  { id: 'legend', label: ['레전드', '여행가'], threshold: 50, leftPct: 78.33, topPct: 78.17 },
];

// 도장은 자기 칭호 라벨과 같은 left에, top만 살짝 내려서(=라벨을 덮도록) 찍힌다 — Figma 목업에서
// "새싹"/"입문자" 두 라벨 위에 찍힌 도장 좌표를 실측해 얻은 공통 오프셋(+1.8~1.92%, 평균값 사용).
const STAMP_TOP_OFFSET_PCT = 1.85;

export default function CollectionStampScreen() {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });
  const [reachedThresholds, setReachedThresholds] = useState<Set<number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const badges = await getBadges();
        if (!cancelled) {
          setReachedThresholds(
            new Set(badges.filter((badge) => badge.acquired).map((badge) => badge.requiredMascotCount)),
          );
        }
      } catch {
        // 도장판 배경/라벨은 항상 보여주고, 실패 시 획득 여부만 전부 미획득으로 둔다.
        if (!cancelled) {
          setReachedThresholds(new Set());
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadingBadges = reachedThresholds === null;

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

        {TIERS.map((tier) => {
          const reached = !loadingBadges && reachedThresholds.has(tier.threshold);
          return (
            <View key={tier.id} style={[styles.tierLabel, { left: `${tier.leftPct}%`, top: `${tier.topPct}%` }]}>
              {tier.label.map((line, i) => (
                <Text
                  key={i}
                  style={[
                    styles.tierText,
                    // Cafe24Ssurround 폰트의 '싹'(쌍시옷 초성) 글리프가 Android에서 깨져서(예: "ㅣㅂ"
                    // 형태로) 렌더링되는 버그 확인됨 — 24px 축소 우회도 결과가 더 나빠서, 이 한 단어만
                    // 커스텀 폰트를 적용하지 않고 시스템 폰트로 폴백한다.
                    line !== '새싹' && fontsLoaded && styles.tierTextFont,
                    reached && styles.tierTextReached,
                  ]}
                >
                  {line}
                </Text>
              ))}
            </View>
          );
        })}

        {!loadingBadges &&
          TIERS.filter((tier) => reachedThresholds.has(tier.threshold)).map((tier) => (
            <Image
              key={tier.id}
              source={require('@/assets/images/collection/stamp-icon.png')}
              style={[
                styles.stamp,
                { left: `${tier.leftPct}%`, top: `${tier.topPct + STAMP_TOP_OFFSET_PCT}%` },
              ]}
              contentFit="contain"
            />
          ))}

        {loadingBadges && <ActivityIndicator style={styles.statusIndicator} color="#535D51" />}
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
  statusIndicator: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
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
    fontSize: 35,
    fontWeight: '700',
    color: '#535D51',
  },
  ribbonTextFont: {
    fontFamily: 'Cafe24Ssurround',
    // Figma 스펙은 Cafe24 Ssurround OTF Bold인데 번들 폰트는 TTF Regular뿐이라 fontWeight는
    // 유지해서 OS 합성 볼드(synthetic bold)라도 적용되게 한다.
    fontWeight: '700',
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
