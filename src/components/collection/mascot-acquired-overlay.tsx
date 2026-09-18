import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MASCOT_DESCRIPTION_BY_NAME, MASCOT_IMAGE_BY_NAME } from '@/constants/mascot';

export type AcquiredMascot = {
  name: string;
  regionName: string;
};

type MascotAcquiredOverlayProps = {
  mascot: AcquiredMascot | null;
  onConfirm: () => void;
};

// docs/ISSUE-마스코트획득화면-Figma연출구현.md — Figma "(3) 위치 인증" 플로우(node 312:133)의
// 지역별 "OO 발견" 화면(예: node 358:60 "독도 발견")을 구현한 풀스크린 연출. 10개 지역 프레임을
// 대조해보면 배경/컨페티/"NEW!" 배지/팻말 카드/도장 스탬프는 전부 동일하고, 캐릭터 그림·이름
// (지역)·소개 문구 3가지만 마스코트별로 달라지는 구조라 하나의 공용 컴포넌트로 만들었다.
//
// `OnboardingGuide`/`ProfileOverlay`와 동일한 패턴(visible 여부에 해당하는 값을 prop으로 받아
// null이면 아무것도 안 그리고, 보일 땐 `StyleSheet.absoluteFill`로 메인 화면 위에 통째로 덮어
// 띄운다) — 별도 라우트로 분리하지 않았다.
//
// 배경은 성호님 안내대로 Figma 원본의 별도 정원 배경 대신 메인 화면 기본 배경
// (assets/images/main/background.png)을 재사용한다. 컨페티/배지/팻말/도장 4개는 성호님이 Figma에서
// 직접 내보내주신 `assets/images/collection/{confetti,new,picket,stamp-icon}.png`.
//
// 프레임 402x874 기준 Figma 실측 좌표를 %로 환산해 썼다(캐릭터/팻말 카드 내부 텍스트·도장 위치는
// 지역마다 조금씩 달랐던 걸 하나의 평균값으로 근사한 것이라, 완료 기준대로 10개 마스코트 전부
// 실기로 띄워보면서 미세조정이 필요할 수 있다).
const FRAME_WIDTH = 402;
const FRAME_HEIGHT = 874;

function pct(value: number, axis: 'w' | 'h'): number {
  return (value / (axis === 'w' ? FRAME_WIDTH : FRAME_HEIGHT)) * 100;
}

export function MascotAcquiredOverlay({ mascot, onConfirm }: MascotAcquiredOverlayProps) {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  if (!mascot) return null;

  const characterSource = MASCOT_IMAGE_BY_NAME[mascot.name];
  const description = MASCOT_DESCRIPTION_BY_NAME[mascot.name];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require('@/assets/images/main/background.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <Image
        source={require('@/assets/images/collection/confetti.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      <View style={styles.badgeWrap}>
        <Image
          source={require('@/assets/images/collection/new.png')}
          style={styles.badge}
          contentFit="contain"
        />
        <Text style={[styles.badgeSubtitle, fontsLoaded && styles.cafeFont]}>새로운 친구를 만났어요!</Text>
      </View>

      <View style={styles.characterStage} pointerEvents="none">
        {characterSource ? (
          <Image source={characterSource} style={styles.character} contentFit="contain" />
        ) : (
          // MASCOT_IMAGE_BY_NAME에 없는(예상 못한) 이름이 오면 그림 없이 이름 텍스트만으로도 화면이
          // 깨지지 않도록 폴백 — mascot-sticker.tsx의 텍스트 폴백과 동일한 이유.
          <Text style={[styles.characterFallback, fontsLoaded && styles.cafeFont]}>{mascot.name}</Text>
        )}
      </View>

      <View style={styles.picketWrap}>
        <Image
          source={require('@/assets/images/collection/picket.png')}
          style={styles.picket}
          contentFit="contain"
        />
        <View style={styles.picketTextWrap}>
          <Text style={[styles.picketTitle, fontsLoaded && styles.cafeFont]} numberOfLines={1}>
            {mascot.name} ({mascot.regionName})
          </Text>
          {description ? (
            <Text style={[styles.picketDescription, fontsLoaded && styles.cafeFont]}>{description}</Text>
          ) : null}
        </View>
        <Image
          source={require('@/assets/images/collection/stamp-icon.png')}
          style={styles.stamp}
          contentFit="contain"
        />
      </View>

      <Pressable onPress={onConfirm} style={styles.confirmButton}>
        <Text style={styles.confirmLabel}>확인</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: `${pct(96, 'h')}%`,
    alignItems: 'center',
  },
  badge: {
    width: `${pct(283, 'w')}%`,
    aspectRatio: 283 / 122,
  },
  badgeSubtitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#5f4009',
  },
  characterStage: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    top: `${pct(220, 'h')}%`,
    bottom: `${100 - pct(620, 'h')}%`,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  character: {
    width: '100%',
    height: '100%',
  },
  characterFallback: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5f4009',
    textAlign: 'center',
  },
  picketWrap: {
    position: 'absolute',
    alignSelf: 'center',
    top: `${pct(608, 'h')}%`,
    width: `${pct(358, 'w')}%`,
    aspectRatio: 358 / 149,
  },
  picket: {
    width: '100%',
    height: '100%',
  },
  picketTextWrap: {
    position: 'absolute',
    left: '11%',
    right: '30%',
    top: '18%',
    bottom: '10%',
    justifyContent: 'center',
    gap: 4,
  },
  picketTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#5f4009',
  },
  picketDescription: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5f4009',
    lineHeight: 18,
  },
  stamp: {
    position: 'absolute',
    right: '3%',
    top: '21%',
    width: '23%',
    aspectRatio: 84 / 82,
  },
  confirmButton: {
    position: 'absolute',
    left: `${pct(42, 'w')}%`,
    right: `${pct(43, 'w')}%`,
    bottom: `${pct(54, 'h')}%`,
    height: 54,
    borderRadius: 36,
    backgroundColor: '#FFD666',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ca9f27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  confirmLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3a4039',
  },
  cafeFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
});
