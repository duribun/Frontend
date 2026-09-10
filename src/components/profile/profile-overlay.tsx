import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CakeIcon from '@/assets/icons/profile/cake.svg';
import CatIcon from '@/assets/icons/profile/cat.svg';
import DogIcon from '@/assets/icons/profile/dog.svg';
import PictureIcon from '@/assets/icons/profile/picture.svg';
import WritingIcon from '@/assets/icons/profile/writing.svg';
import type { Gender } from '@/context/user-profile-context';
import { getMyBadges, getMyMascots, getMyProfile, listAllRecords } from '@/lib/api';

// 아래 색상/좌표/폰트는 피그마 노드(VERd4hScPHYynIZaTQzFkM, node 559:4746/818:2530 "프로필아이콘")의
// get_design_context 결과에서 그대로 가져온 값이다. 카드 배경("여행증", 1092:1770 — 링/스트랩/톱니 테두리/
// 모서리 잎 장식까지 전부 포함된 통짜 이미지, `assets/images/profile/travel-card-bg.png`)과 통계 아이콘
// 5개(`assets/icons/profile/*.svg`)는 Figma에서 실제로 다운로드해 받은 에셋을 그대로 쓴다. 이 이미지 자체가
// CARD_X/CARD_Y를 원점으로 한 346×423 노드 전체(링/스트랩 포함)를 담고 있으므로, 아래 pos() 좌표 변환은
// 그대로 유지한 채 배경만 이 이미지로 교체하면 된다.
const TITLE_COLOR = '#9fa46d'; // 칭호명, 여행자 정보, 라벨/값 공통 색상
const NAME_COLOR = '#5f691e'; // 이름 색상 (칭호명보다 진한 올리브)
const PILL_TEXT_COLOR = '#fefce0'; // "프로필" 배지 텍스트 색상 (배지 배경 자체는 배경 이미지에 포함됨)

// 카드 원본(피그마) 크기 — 이 값 기준으로 모든 내부 요소를 %로 배치한다.
const CARD_W = 346;
const CARD_H = 423;
const CARD_X = 28;
const CARD_Y = 182;

// RN의 DimensionValue 타입은 `${number}%` 형태의 템플릿 리터럴만 허용해서,
// 런타임에 계산한 문자열(string으로 widen됨)은 그대로 대입하면 타입 에러가 난다 — 여기서만 any로 캐스팅한다.
// 반환 타입도 ViewStyle로 고정하지 않고 필드를 전부 any로 둔 느슨한 타입을 쓴다 —
// 이 헬퍼가 Text(TextStyle 기대)와 View/SVG 아이콘(ViewStyle 기대) 양쪽의
// style 배열에 섞여 들어가는데, ViewStyle과 TextStyle은 구조적으로 호환되지 않아
// (예: userSelect 리터럴 유니온 차이) 고정 타입을 쓰면 한쪽에서 항상 타입 에러가 난다.
type PosStyle = {
  position: 'absolute';
  left: any;
  top: any;
  width?: any;
  height?: any;
};

function pos(x: number, y: number, w?: number, h?: number): PosStyle {
  const style: PosStyle = {
    position: 'absolute',
    left: `${(((x - CARD_X) / CARD_W) * 100).toFixed(2)}%`,
    top: `${(((y - CARD_Y) / CARD_H) * 100).toFixed(2)}%`,
  };
  if (w !== undefined) style.width = `${((w / CARD_W) * 100).toFixed(2)}%`;
  if (h !== undefined) style.height = `${((h / CARD_H) * 100).toFixed(2)}%`;
  return style;
}

// TODO: 메인 화면과 동일하게, 남자 프로필 정식 에셋이 아직 없어 온보딩 캐릭터 이미지를 임시로 재사용한다.
const PROFILE_SOURCE = {
  FEMALE: require('@/assets/images/main/profile-girl.png'),
  MALE: require('@/assets/images/onboarding/character-male.png'),
} as const;

// TEMP: 소셜 로그인이 아직 실제 인증 연동 전(TEMP 바이패스)이라 아래 API 호출이 전부 401로 실패한다.
// 기획팀 시연 영상 촬영을 위해, 실패 시 에러 알림 대신 아래 목데이터로 화면을 채운다.
// 실제 인증이 붙으면 이 폴백은 지우고 다시 실패 시 Alert.alert로 에러를 보여줘야 한다.
const MOCK_PROFILE: ProfileData = {
  nickname: '두리번 여행자',
  birthDate: '2000-05-14',
  gender: 'FEMALE',
  title: '여행 입문자',
  mascotCount: 12,
  recordCount: 8,
};

function formatBirthDate(birthDate: string | null): string {
  if (!birthDate) return '00/00';
  const parts = birthDate.split('-');
  const month = parts[1];
  const day = parts[2];
  if (!month || !day) return '00/00';
  return `${month}/${day}`;
}

type ProfileData = {
  nickname: string;
  birthDate: string | null;
  gender: Gender | null;
  title: string | null;
  mascotCount: number;
  recordCount: number;
};

type ProfileOverlayProps = {
  visible: boolean;
  onClose: () => void;
};

export function ProfileOverlay({ visible, onClose }: ProfileOverlayProps) {
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([getMyProfile(), getMyMascots(), getMyBadges(), listAllRecords()])
      .then(([profile, mascots, badges, records]) => {
        if (cancelled) return;
        setData({
          nickname: profile.nickname,
          birthDate: profile.birthDate,
          gender: profile.gender,
          // badges는 requiredMascotCount 내림차순 정렬로 내려온다 — 첫 항목이 곧 "현재 칭호".
          title: badges[0]?.name ?? null,
          mascotCount: mascots.length,
          recordCount: records.length,
        });
      })
      .catch(() => {
        // TEMP: 위 MOCK_PROFILE 주석 참고 — 실제 인증 연동 전까지 실패 시 목데이터로 대체.
        if (!cancelled) {
          setData(MOCK_PROFILE);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible) return null;

  const gender = data?.gender ?? 'FEMALE';
  const font = fontsLoaded ? styles.figFont : undefined;

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* 배경/헤더/캐릭터는 별도로 그리지 않는다 — 이 오버레이 밑에 있는 실제 메인 화면이 그대로 비쳐 보이도록 두고,
          이 투명 Pressable이 화면 전체의 터치만 가로채서 "카드 바깥을 탭하면 닫힘"을 구현한다.
          다만 프로필 카드에 시선이 집중되도록 배경 자체는 반투명 어둠으로 살짝 눌러준다. */}
      <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={onClose} />

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.content} pointerEvents="box-none">
          {loading || !data ? (
            <ActivityIndicator color={TITLE_COLOR} />
          ) : (
            <View style={styles.cardWrap}>
              {/* 링/스트랩/톱니 테두리/모서리 잎 장식까지 전부 포함된 통짜 배경 이미지.
                  이 이미지 자체가 CARD_W/CARD_H(346×423) 전체를 담고 있어서, 아래 콘텐츠는
                  기존과 동일한 pos() 좌표로 그 위에 겹쳐 놓기만 하면 된다. */}
              <Image
                source={require('@/assets/images/profile/travel-card-bg.png')}
                style={styles.cardBackground}
                contentFit="contain"
              />

              <View style={styles.card}>
                {/* 사진 박스는 배경 PNG에 이미 그려진 그라데이션 placeholder를 직접 측정한
                    좌표(60,310,108,130)를 그대로 쓴다 — Figma의 "실제 사진이 채워진" 목업(818:2530,
                    남캐 818:2673)은 이보다 작은 좌표(61,324,106,116)를 쓰지만, 그건 그 목업 프레임
                    자체에 종속된 값이고 우리가 실제로 다운로드해 쓰는 카드 배경 PNG의 placeholder
                    도형과는 크기가 다르다. 더 작은 좌표를 쓰면 사진이 그 placeholder보다 작아져서
                    background PNG에 이미 그려진 하늘색 그라데이션이 사진 가장자리 밖으로 삐져나와
                    보이는(색이 비치는) 문제가 생긴다 — 실측값(60,310,108,130)을 유지해 placeholder를
                    완전히 덮는 쪽이 더 안전하다. 모서리 잎 장식과 살짝 겹치는 것은 이 배경 PNG
                    자체에 이미 그렇게 그려져 있는 것이라 사진 유무와 무관하게 동일하다. */}
                <View style={[styles.photoBox, pos(60, 310, 108, 130)]}>
                  <Image
                    source={PROFILE_SOURCE[gender]}
                    style={styles.photoImage}
                    contentFit="cover"
                    contentPosition="top"
                  />
                </View>

                <Text
                  style={[styles.figText, font, styles.headingText, pos(181.5, 316, 120, 22)]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  🌿 여행자 정보
                </Text>

                {/* "프로필" 리본 배지는 배경 이미지에 이미 그려져 있어서(사진 옆의 초록 리본),
                    여기서는 배경색 없이 텍스트만 그 리본 위에 겹쳐 놓는다. */}
                <View style={[styles.pill, pos(183, 347, 50, 16)]}>
                  <Text style={[styles.figText, font, styles.pillText]}>프로필</Text>
                </View>

                {/* 칭호명/이름 텍스트는 Figma에서 폭은 다르지만(77 / 54) 오른쪽 끝(x=345)이 서로
                    맞춰진 "우측 정렬" 텍스트다. 그 실측 폭(77/54)은 Figma 목업의 짧은 placeholder
                    글자에 딱 맞춘 값이라 그대로 쓰면 실제 닉네임처럼 조금만 길어져도 잘려서
                    "두리번 ..."처럼 보인다(실기 스크린샷에서 확인) — 왼쪽 경계를 사진 박스 오른쪽
                    끝(x=168) 바로 다음인 x=175까지 넉넉히 넓혀서(폭 170) 우측 끝(345)은 유지한 채
                    텍스트가 잘리지 않게 한다. textAlign:'right'로 우측 정렬은 그대로 유지. */}
                <Text
                  style={[styles.figText, font, styles.titleText, pos(175, 366, 170, 38)]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.title ?? '칭호 없음'}
                </Text>

                <Text
                  style={[styles.figText, font, styles.nameText, pos(175, 410, 170, 38)]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {data.nickname}
                </Text>

                <View style={[styles.vDivider, pos(154, 472, 0, 93)]} />
                <View style={[styles.vDivider, pos(255, 472, 0, 93)]} />

                <Text style={[styles.figText, font, styles.statLabel, pos(92.5, 479, 30, 15)]}>
                  생일
                </Text>
                <Text style={[styles.figText, font, styles.statValue, pos(68, 532, 81, 30)]}>
                  {formatBirthDate(data.birthDate)}
                </Text>
                <CakeIcon width={41} height={41} style={pos(89, 494, 41, 41)} />

                <Text style={[styles.figText, font, styles.statLabel, pos(171, 479, 68, 15)]}>
                  획득 마스코트
                </Text>
                <Text style={[styles.figText, font, styles.statValue, pos(191, 532, 42, 30)]}>
                  {data.mascotCount}명
                </Text>
                {/* 강아지-고양이 간격: 8px로 좁혔던 것도 성호님이 Figma 프로토타입 실제 스크린샷
                    (node 818:2530, 402×874 — 이 프레임은 1:1 스케일이라 픽셀=디자인 좌표)과 비교해서
                    보내준 참고 이미지 기준으로 보면 여전히 넓었다 — 그 스크린샷에서는 둘이 거의
                    맞닿아 보인다. 3px로 더 좁힘. */}
                <DogIcon width={33} height={33} style={pos(177, 500, 33, 33)} />
                <CatIcon width={30} height={30} style={[pos(213, 503, 30, 30), styles.mirroredIcon]} />

                {/* "칸(구분선으로 나뉜 3칸) 가운데 정렬"을 기준으로 다시 정리한다.
                    카드 좌측 끝(28)~구분선1(154)인 "생일" 칸은 수학적 중심이 91인데, 라벨/아이콘/값이
                    전부 108 근처에 모여 있다 — 여기엔 불만이 없었으니 이게 실제로 맞는 위치다. 즉
                    카드 바깥쪽 장식 테두리(스트랩/톱니 장식)가 칸 안쪽 여백을 먹어서, 카드 "가장자리"에
                    붙은 칸의 실제 콘텐츠 중심은 구분선 쪽으로 ~17.5px 치우쳐야 한다. "기록 개수" 칸도
                    구분선2(255)~카드 우측 끝(374)로 카드 바깥쪽 가장자리에 붙은 칸이니, 대칭으로
                    반대 방향(왼쪽)으로 ~17.5px 치우친 297 근처가 진짜 중심 — 마침 사진/글쓰기 아이콘
                    쌍이 이미 그 위치(283-309, 중심 296)에 있다. 라벨/값을 아이콘과 같은 중심(297)에
                    맞춘다(지난 수정에서 "칸의 수학적 중심"(314.5)으로 되돌린 건 "생일" 칸의 이 패턴을
                    놓친 과교정이었다). */}
                <Text style={[styles.figText, font, styles.statLabel, pos(249, 479, 96, 15)]}>
                  기록 개수
                </Text>
                <Text style={[styles.figText, font, styles.statValue, pos(264, 532, 66, 30)]}>
                  {data.recordCount}개
                </Text>
                <WritingIcon width={20} height={30} style={pos(289, 500, 20, 30)} />
                <PictureIcon width={18} height={18} style={pos(283, 498, 18, 18)} />
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // 실제 메인 화면의 헤더(설정/코인/프로필 아바타)가 이 오버레이 밑에 그대로 비쳐 보이므로,
    // 카드가 그 위로 겹치지 않도록 상단 여백을 헤더 높이만큼 띄워둔다.
    paddingTop: 90,
    paddingBottom: 40,
  },
  cardWrap: {
    width: '100%',
    // 카드 안쪽 요소를 전부 피그마 원본 비율(346:423) 기준 절대좌표(%)로 배치하므로,
    // 래퍼도 같은 비율을 유지해야 좌표가 어긋나지 않는다. 배경 이미지 자체가 이미 링/스트랩까지
    // 포함한 전체 노드 비율이라 이 박스 안에 꽉 채우기만 하면 된다.
    aspectRatio: CARD_W / CARD_H,
  },
  cardBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  // 아래 배치용 스타일들은 pos()가 만드는 절대좌표(%)로 배경 이미지 위에 겹쳐진다.
  figText: {
    position: 'absolute',
  },
  figFont: {
    fontFamily: 'Cafe24Ssurround',
  },
  photoBox: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#DCEEDC',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  headingText: {
    fontSize: 13,
    fontWeight: '700',
    color: TITLE_COLOR,
  },
  pill: {
    // 배경 이미지 안에 이미 리본 모양 배지가 그려져 있어서 여기서는 배경을 그리지 않고,
    // 텍스트를 그 리본 위 좌표에 올려놓는 정렬 컨테이너로만 쓴다.
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    position: 'relative',
    fontSize: 9,
    fontWeight: '700',
    color: PILL_TEXT_COLOR,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: TITLE_COLOR,
    textAlign: 'right',
  },
  nameText: {
    fontSize: 19,
    fontWeight: '700',
    color: NAME_COLOR,
    textAlign: 'right',
  },
  vDivider: {
    position: 'absolute',
    width: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderLeftColor: '#C9C2AA',
  },
  statLabel: {
    fontSize: 10,
    color: TITLE_COLOR,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TITLE_COLOR,
    // statLabel은 원래부터 textAlign:'center'였는데 값(statValue) 쪽엔 빠져 있어서, 라벨/아이콘은
    // 칸 가운데 정렬인데 값만 왼쪽 정렬로 보여 "생일 값이 왼쪽으로 쏠려 보인다"는 문제가 있었다.
    textAlign: 'center',
  },
  mirroredIcon: {
    // 다운로드한 cat.svg가 Figma 원본과 좌우가 뒤집혀 있어(원본은 왼쪽을, 우리 에셋은 오른쪽을 본다)
    // 좌우 반전해서 맞춘다.
    transform: [{ scaleX: -1 }],
  },
});
