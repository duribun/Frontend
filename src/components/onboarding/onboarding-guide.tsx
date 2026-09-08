import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, Mask, Rect } from 'react-native-svg';

// Figma(node-id=311-106, 가이드1~가이드7 프레임 + 가이드8 마무리 화면)에서 직접 좌표/문구를 뽑아왔다.
// 프레임 기준 402x874 기준 %로 환산해서 저장해두고, 실제 렌더링 시 화면 크기에 맞춰 다시 px로 계산한다.
// 원본 디자인은 어두운 배경에 타원(ellipse) 모양 구멍을 뚫는 방식(boolean subtract)이라 SVG mask로 동일하게 구현했다.
// 주의: Figma 프레임 이름("가이드N")의 번호가 실제 노출 순서와 다르다 (가이드3 내용이 가이드2보다 먼저 나옴) — 스크린샷으로 재확인한 순서를 따름.
const FRAME_WIDTH = 402;
const FRAME_HEIGHT = 874;

type Highlight = { top: number; left: number; width: number; height: number }; // 전부 % 단위 (top/left/width/height)

function px(top: number, left: number, width: number, height: number): Highlight {
  return {
    top: (top / FRAME_HEIGHT) * 100,
    left: (left / FRAME_WIDTH) * 100,
    width: (width / FRAME_WIDTH) * 100,
    height: (height / FRAME_HEIGHT) * 100,
  };
}

type GuideStep = {
  title: string;
  description: string;
  highlights: Highlight[]; // 빈 배열이면 하이라이트 없이 전체 화면 어둡게만
  cardTopOverride?: number; // Figma에서 카드 위치를 실측한 슬라이드는 계산값 대신 이 값을 그대로 쓴다 (% 단위)
};

// 모든 슬라이드 타이틀을 동일한 초록색으로 통일 (Figma 기준).
const GREEN = '#699447';

const STEPS: GuideStep[] = [
  {
    title: '환영합니다!',
    description: '두리번은 여행이 게임이 되는 새로운 경험을 제공해요. 다양한 기능을 사용해 나만의 여행을 완성해보세요!',
    highlights: [],
  },
  {
    title: '지역을 방문하면 인증!',
    description: 'GPS로 현재 위치를 인증하면 해당 지역의 캐릭터와 게임 내 재화를 획득할 수 있어요.',
    highlights: [px(626, 57, 285, 166), px(253, 8, 71, 71)],
    // Figma 원본 프레임(node 497:3679 "설명")에서 실측한 카드 위치: top 397 / 874 ≈ 45.4%.
    // 표지판(하단) 하이라이트와 액자 아이콘(상단) 하이라이트 사이에 정확히 끼워져 있었다.
    cardTopOverride: (397 / 874) * 100,
  },
  {
    title: '방문 인증시 지도에 기록!',
    description: '방문한 지역은 지도에 색으로 표시돼요. 지도에서 추천 관광지도 확인하고, 다음 여행지를 찾아보세요!',
    // NOTE: 문구는 확정, 하이라이트 위치는 get_design_context가 "Subtract"를 이미지로 평탄화해서 정확한 타원 좌표는
    // 못 가져왔다. 화살표 장식이 지도 아이콘 쪽을 가리키고 있어 다른 슬라이드(상점/다이어리)와 동일한 오프셋 패턴으로 추정해 채움.
    highlights: [px(414, 6, 71, 71)],
  },
  {
    title: '포인트를 모아 아이템으로!',
    description: '모은 포인트를 통해 상점에서 다양한 아이템을 구매할 수 있어요.',
    highlights: [px(333, 10, 71, 71)],
  },
  {
    title: '여행을 기록하고 확인하세요!',
    description: '방문한 관광지에 기록을 남기고, 나의 여행을 돌아볼 수 있어요.',
    highlights: [px(172, 8, 71, 71)],
  },
  {
    title: '나만의 캐릭터 꾸미기!',
    description: '획득한 재화로 의상, 소품 등을 구매해 나만의 여행 캐릭터를 자유롭게 꾸밀 수 있어요.',
    highlights: [px(208, 56, 290, 446)],
  },
  {
    title: '더 많은 기능을 활용해보세요!',
    description: '프로필을 확인하고, 설정에서 가이드 다시 보기, 이용 문의 등 다양한 기능을 이용할 수 있어요.',
    // 설정/프로필 하이라이트는 402x874 프레임 추정치가 아니라, 실제 (main)/index.tsx 헤더 레이아웃
    // (paddingHorizontal:18, marginTop:12, 안전영역 top 등)을 그대로 이용해 런타임에 계산한다.
    // (아래 useHeaderHighlights 참고) — 여기는 빈 배열로 두고 렌더링 시 마지막 슬라이드에만 주입한다.
    highlights: [],
  },
];

// Figma 원본의 개발 메모(311-106 옆 노트)에 "메인화면 위에 검정 60~70% Overlay + 하단 Bottom Sheet 형태"라고
// 명시되어 있다 — 기본값은 화면 하단에 붙는 시트다. 다만 슬라이드에 따라 하이라이트가 하단(예: 표지판)에
// 있으면 시트가 그걸 덮게 되므로, 그 경우에만 예외적으로 카드를 위로 띄운다("가이드 3"=지역 방문 인증 슬라이드가
// 실제로 그렇게 되어 있었다: 카드가 화면 중간에, 아이콘 하이라이트와 표지판 하이라이트 사이에 끼워져 있었음).
// 그래서 "하단부터 확인해서, 하이라이트와 겹치면 그 위의 빈 공간으로 올라간다"는 규칙으로 구현한다.
const CARD_HEIGHT_ESTIMATE = 24; // 카드 예상 높이(%) — Figma 실측(205/874≈23.5%)과 비슷하게 잡음
const CARD_GAP_MARGIN = 4; // 하이라이트와 카드 사이 최소 여백(%)
const CARD_BOTTOM_MARGIN = 3; // 화면 맨 아래와의 최소 여백(%) — 완전히 가장자리에 붙지는 않게
const CARD_TOP_SAFE_MARGIN = 9; // 화면 맨 위쪽에 놓일 때 "나가기" 버튼/안전영역과 안 겹치게 하는 최소 여백(%)

function computeCardTopPercent(highlights: Highlight[]): number {
  if (highlights.length === 0) {
    // 강조할 대상이 없는 슬라이드(예: 첫 인사)는 기본 형태인 하단 시트로 배치한다.
    return 100 - CARD_HEIGHT_ESTIMATE - CARD_BOTTOM_MARGIN;
  }

  const intervals = highlights
    .map((h) => ({ start: h.top, end: h.top + h.height }))
    .sort((a, b) => a.start - b.start);

  const gaps: { start: number; end: number }[] = [{ start: 0, end: intervals[0].start }];
  for (let i = 0; i < intervals.length - 1; i += 1) {
    gaps.push({ start: intervals[i].end, end: intervals[i + 1].start });
  }
  gaps.push({ start: intervals[intervals.length - 1].end, end: 100 });

  const required = CARD_HEIGHT_ESTIMATE + CARD_GAP_MARGIN;

  // 맨 아래 여백부터 위로 올라가며 카드가 들어갈 만큼 넓은 첫 번째 여백을 쓴다 (기본은 하단 시트,
  // 하이라이트에 막힐 때만 그 바로 위의 빈 공간으로 옮겨간다). 어느 여백도 충분히 넓지 않으면
  // (예: 캐릭터 전신처럼 하이라이트가 화면 대부분을 차지) 그나마 가장 넓은 곳을 쓴다.
  const viableFromBottom = [...gaps].reverse().find((g) => g.end - g.start >= required);
  const best =
    viableFromBottom ??
    gaps.reduce((a, b) => (b.end - b.start > a.end - a.start ? b : a));

  const gapSize = best.end - best.start;
  const cardHeight = Math.min(CARD_HEIGHT_ESTIMATE, gapSize - 2);
  const isBottomGap = best.end >= 100;
  let top = isBottomGap
    ? best.end - CARD_BOTTOM_MARGIN - cardHeight
    : best.start + (gapSize - cardHeight) / 2;
  if (best.start <= 1) {
    top = Math.max(top, CARD_TOP_SAFE_MARGIN);
  }
  return top;
}

// (main)/index.tsx의 헤더 레이아웃 상수. 실제 화면과 어긋나지 않으려면 여기 값도 함께 맞춰야 한다.
const HEADER_PADDING_H = 18;
const HEADER_MARGIN_TOP = 12;
const SETTINGS_SIZE = 38;
const PROFILE_SIZE = 51;
const HEADER_HIGHLIGHT_PADDING = 9; // 아이콘보다 살짝만 크게 보이도록 하는 여유값(px)

// 안전영역 top inset + 실제 헤더 레이아웃 상수로 설정/프로필 아이콘의 실제 화면 좌표를 그대로 계산한다.
// (프레임 % 추정 방식은 기기 화면 비율이 조금만 달라도 크기/위치가 어긋나서, 여기서만 절대좌표로 직접 계산)
function useHeaderHighlights(screenWidth: number, screenHeight: number): Highlight[] {
  const insets = useSafeAreaInsets();
  const headerTop = insets.top + HEADER_MARGIN_TOP;

  const settingsCenterX = HEADER_PADDING_H + SETTINGS_SIZE / 2;
  const settingsCenterY = headerTop + SETTINGS_SIZE / 2;
  const settingsR = SETTINGS_SIZE / 2 + HEADER_HIGHLIGHT_PADDING;

  const profileCenterX = screenWidth - HEADER_PADDING_H - PROFILE_SIZE / 2;
  const profileCenterY = headerTop + PROFILE_SIZE / 2;
  const profileR = PROFILE_SIZE / 2 + HEADER_HIGHLIGHT_PADDING;

  function toHighlight(centerX: number, centerY: number, r: number): Highlight {
    return {
      left: ((centerX - r) / screenWidth) * 100,
      top: ((centerY - r) / screenHeight) * 100,
      width: ((r * 2) / screenWidth) * 100,
      height: ((r * 2) / screenHeight) * 100,
    };
  }

  return [
    toHighlight(settingsCenterX, settingsCenterY, settingsR),
    toHighlight(profileCenterX, profileCenterY, profileR),
  ];
}

type OnboardingGuideProps = {
  visible: boolean;
  onFinish: () => void;
};

export function OnboardingGuide({ visible, onFinish }: OnboardingGuideProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [index, setIndex] = useState(0);
  const [showClosing, setShowClosing] = useState(false);
  const listRef = useRef<FlatList<GuideStep>>(null);
  const headerHighlights = useHeaderHighlights(screenWidth, screenHeight);

  if (!visible) return null;

  const isLast = index === STEPS.length - 1;
  const activeHighlights = isLast ? headerHighlights : STEPS[index].highlights;
  const cardTopPercent = STEPS[index].cardTopOverride ?? computeCardTopPercent(activeHighlights);

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setIndex(nextIndex);
  }

  function goNext() {
    if (isLast) {
      // 마지막 슬라이드 다음엔 도트/스포트라이트 없는 별도의 마무리 화면("가이드8")을 한 번 더 보여준다.
      setShowClosing(true);
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex((prev) => prev + 1);
  }

  if (showClosing) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.closingScrim} />
        <View style={styles.closingCardWrap} pointerEvents="box-none">
          <View style={styles.closingCard}>
            <Text style={styles.closingTitle}>&ldquo;당신만의 여행 도감을 완성하세요.&rdquo;</Text>
            <Pressable onPress={onFinish} style={styles.closingButton}>
              <Text style={styles.closingButtonLabel}>여행 Play</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <FlatList
        ref={listRef}
        data={STEPS}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item, index: itemIndex }) => {
          const highlights = itemIndex === STEPS.length - 1 ? headerHighlights : item.highlights;
          return (
          <View style={{ width: screenWidth, height: screenHeight }} pointerEvents="none">
            <Svg width={screenWidth} height={screenHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <Mask id="spotlight-mask" x="0" y="0" width={screenWidth} height={screenHeight}>
                  <Rect x={0} y={0} width={screenWidth} height={screenHeight} fill="#FFFFFF" />
                  {highlights.map((h, i) => (
                    <Ellipse
                      key={i}
                      cx={((h.left + h.width / 2) / 100) * screenWidth}
                      cy={((h.top + h.height / 2) / 100) * screenHeight}
                      rx={((h.width / 2) / 100) * screenWidth}
                      ry={((h.height / 2) / 100) * screenHeight}
                      fill="#000000"
                    />
                  ))}
                </Mask>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={screenWidth}
                height={screenHeight}
                fill="rgba(0,0,0,0.65)"
                mask="url(#spotlight-mask)"
              />
            </Svg>
          </View>
          );
        }}
      />

      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable onPress={onFinish} hitSlop={8} style={styles.skipButton}>
          <Text style={styles.skipLabel}>나가기</Text>
        </Pressable>
      </SafeAreaView>

      <View style={[styles.card, { top: `${cardTopPercent}%` }]}>
        <Text style={styles.title}>{STEPS[index].title}</Text>
        <Text style={styles.description}>{STEPS[index].description}</Text>

        <View style={styles.footerRow}>
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Pressable onPress={goNext} style={styles.nextButton}>
            <Text style={styles.nextButtonLabel}>{isLast ? '시작하기' : '다음'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginRight: 21,
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    // top은 슬라이드마다 다르게 계산되어 인라인으로 주입된다 (computeCardTopPercent 참고).
    // 기본은 하단 시트 위치, 하이라이트가 하단을 가릴 때만 그 위 빈 공간으로 올라간다.
    position: 'absolute',
    left: 21,
    right: 21,
    backgroundColor: '#FEFEFE',
    borderRadius: 26,
    paddingHorizontal: 21,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#555555',
    textAlign: 'center',
  },
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    backgroundColor: '#4A7CD6',
    width: 16,
  },
  nextButton: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 22,
    backgroundColor: '#4A7CD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  closingScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  closingCardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  closingCard: {
    width: '100%',
    backgroundColor: '#FEFEFE',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    textAlign: 'center',
    lineHeight: 26,
  },
  closingButton: {
    marginTop: 20,
    height: 48,
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#A9D14D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closingButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
