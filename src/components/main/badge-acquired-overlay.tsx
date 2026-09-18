import { useFonts } from 'expo-font';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import BadgeStar from '@/assets/icons/main/badge-star.svg';

export type AcquiredBadge = {
  name: string;
};

type BadgeAcquiredOverlayProps = {
  badge: AcquiredBadge | null;
  onConfirm: () => void;
};

// Figma "칭호 획득"(node 963:1755, 카드 그룹 1005:1819)을 그대로 옮긴 모달. MascotAcquiredOverlay와
// 달리 전용 배경이 없고, 메인 화면 위에 반투명 어둠(#000 40%)만 깔고 카드를 띄우는 구조다
// (OnboardingGuide/ProfileOverlay와 같은 "dim + center card" 패턴).
//
// 카드 내부 좌표는 흰 카드 박스("설명" 프레임, 361x238)를 기준 프레임으로 삼아 %로 환산했다.
// 왕관/반짝임 장식은 카드 위로 튀어나오므로 top이 음수 %다.
const CARD_WIDTH = 361;
const CARD_HEIGHT = 238;

function cardPct(value: number, axis: 'w' | 'h'): number {
  return (value / (axis === 'w' ? CARD_WIDTH : CARD_HEIGHT)) * 100;
}

export function BadgeAcquiredOverlay({ badge, onConfirm }: BadgeAcquiredOverlayProps) {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  if (!badge) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.dim} />
      <View style={styles.centerWrap} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.decorWrap} pointerEvents="none">
            <Image
              source={require('@/assets/icons/main/badge-sparkle-left-diagonal.png')}
              resizeMode="contain"
              style={styles.sparkleLeftDiagonal}
            />
            <Image
              source={require('@/assets/icons/main/badge-sparkle-left-flat.png')}
              resizeMode="contain"
              style={styles.sparkleLeftFlat}
            />
            <Image
              source={require('@/assets/icons/main/badge-sparkle-right-diagonal.png')}
              resizeMode="contain"
              style={styles.sparkleRightDiagonal}
            />
            <Image
              source={require('@/assets/icons/main/badge-sparkle-right-flat.png')}
              resizeMode="contain"
              style={styles.sparkleRightFlat}
            />
            <Image
              source={require('@/assets/icons/main/badge-crown.png')}
              resizeMode="contain"
              style={styles.crownWrap}
            />
          </View>

          <Text style={[styles.title, fontsLoaded && styles.cafeFont]}>칭호를 획득했어요!</Text>

          <BadgeStar width={22} height={22} style={styles.starLeft} />
          <View style={styles.pill}>
            <Text style={[styles.pillText, fontsLoaded && styles.cafeFont]} numberOfLines={1}>
              {badge.name}
            </Text>
          </View>
          <BadgeStar width={22} height={22} style={styles.starRight} />

          <Pressable onPress={onConfirm} style={styles.confirmButton}>
            <Image
              source={require('@/assets/icons/main/badge-confirm-button.png')}
              resizeMode="contain"
              style={styles.confirmButtonImage}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '5.2%',
  },
  card: {
    width: '100%',
    aspectRatio: CARD_WIDTH / CARD_HEIGHT,
    borderRadius: 26,
    backgroundColor: '#FFFFF5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  // 왕관/반짝임 4개 광선 좌표는 Figma API(노드 1005:1818, 964:1884)에서 직접 조회한
  // absoluteBoundingBox를 카드 프레임("설명", 361x238) 기준으로 환산한 값이다.
  decorWrap: {
    ...StyleSheet.absoluteFill,
  },
  crownWrap: {
    position: 'absolute',
    left: `${cardPct(150, 'w')}%`,
    top: `${cardPct(-31, 'h')}%`,
    width: `${cardPct(62, 'w')}%`,
    height: `${cardPct(62, 'h')}%`,
  },
  sparkleLeftDiagonal: {
    position: 'absolute',
    left: `${cardPct(127.3687, 'w')}%`,
    top: `${cardPct(-37, 'h')}%`,
    width: `${cardPct(16.3825, 'w')}%`,
    height: `${cardPct(16.809, 'h')}%`,
  },
  sparkleLeftFlat: {
    position: 'absolute',
    left: `${cardPct(119, 'w')}%`,
    top: `${cardPct(-17, 'h')}%`,
    width: `${cardPct(17.7512, 'w')}%`,
    height: `${cardPct(5.726, 'h')}%`,
  },
  sparkleRightDiagonal: {
    position: 'absolute',
    left: `${cardPct(219, 'w')}%`,
    top: `${cardPct(-37, 'h')}%`,
    width: `${cardPct(16.3825, 'w')}%`,
    height: `${cardPct(16.809, 'h')}%`,
  },
  sparkleRightFlat: {
    position: 'absolute',
    left: `${cardPct(226, 'w')}%`,
    top: `${cardPct(-17, 'h')}%`,
    width: `${cardPct(17.7512, 'w')}%`,
    height: `${cardPct(5.726, 'h')}%`,
  },
  title: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${cardPct(54, 'h')}%`,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#7D4C28',
  },
  pill: {
    position: 'absolute',
    left: `${cardPct(48, 'w')}%`,
    top: `${cardPct(95, 'h')}%`,
    width: `${cardPct(269, 'w')}%`,
    height: `${cardPct(48, 'h')}%`,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: '#DFC261',
    backgroundColor: '#FFF0BE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#7D4C28',
  },
  starLeft: {
    position: 'absolute',
    left: `${cardPct(20, 'w')}%`,
    top: `${cardPct(108, 'h')}%`,
  },
  starRight: {
    position: 'absolute',
    left: `${cardPct(323, 'w')}%`,
    top: `${cardPct(108, 'h')}%`,
  },
  confirmButton: {
    position: 'absolute',
    left: `${cardPct(124, 'w')}%`,
    top: `${cardPct(167, 'h')}%`,
    width: `${cardPct(118, 'w')}%`,
    height: `${cardPct(48, 'h')}%`,
  },
  confirmButtonImage: {
    width: '100%',
    height: '100%',
  },
  cafeFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
});
