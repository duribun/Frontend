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
import { ApiError, getMyBadges, getMyMascots, getMyProfile, listAllRecords } from '@/lib/api';

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

// 프로필 클로즈업 사진 — 피그마 정식 목업(node 818:2673 "남캐")에서 export받은 에셋으로 교체 완료
// (docs/ISSUE-성별캐릭터-프로필이미지버그.md 2번). 메인 화면 헤더 아이콘과 이 이미지 하나를 공유해서 쓴다.
const PROFILE_SOURCE = {
  FEMALE: require('@/assets/images/main/profile-girl.png'),
  MALE: require('@/assets/images/main/profile-boy.png'),
} as const;

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

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
      .catch((error: unknown) => {
        if (cancelled) return;
        setData(null);
        setErrorMessage(
          error instanceof ApiError
            ? `프로필을 불러오지 못했어요. (${error.status})`
            : '프로필을 불러오지 못했어요.',
        );
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
          {/* [팀원 요청 1번 후속] fontsLoaded도 로딩 조건에 포함시켜서, 커스텀 폰트가 아직 준비되기 전에
              카드 텍스트가 시스템 기본 폰트로 잠깐 그려졌다가 폰트 로드 후 다시 그려지는(그 순간에만
              "폰트가 안 맞아 보이는") 상황 자체를 없앴다. */}
          {(loading || !fontsLoaded) && <ActivityIndicator color={TITLE_COLOR} />}

          {!loading && fontsLoaded && errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          {!loading && fontsLoaded && !errorMessage && data && (
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
                {/* [프로필 사진이 옆에 비해 위아래로 길쭉해 보이는 문제] 기존 (60,310,108,130) —
                    가로세로비 108:130≈0.83 — 은 Figma 목업(61,324,106,116, 비율 106:116≈0.91)보다
                    훨씬 세로로 길쭉했다. `contentFit="cover"`는 박스가 세로로 길수록 사진을 더
                    확대해서 가로를 잘라내기 때문에, 이 세로 길쭉함 자체가 에뮬레이터 사진이 Figma보다
                    더 확대되고 갑갑해 보이는(옆으로도 여백 없이 꽉 차 보이는) 원인이었다. 아래쪽
                    경계(310+130=440, 배경 placeholder를 덮으려고 잡아둔 기준선)는 그대로 유지한 채
                    위쪽만 12px 줄여서(310→322, 130→118) 비율을 108:118≈0.92로 Figma 원본과 거의
                    동일하게 맞췄다. 이제 배경 카드 자체가 placeholder 그라데이션 없는 새 에셋이라
                    위쪽 경계를 덜 확장해도 색이 비칠 걱정은 없다. */}
                <View style={[styles.photoBox, pos(60, 322, 108, 118)]}>
                  <Image
                    source={PROFILE_SOURCE[gender]}
                    style={styles.photoImage}
                    contentFit="cover"
                    contentPosition="top"
                    recyclingKey={`profile-${gender}`}
                  />
                </View>

                <Text
                  style={[styles.figText, font, styles.headingText, pos(183.5, 316, 120, 22)]}
                  numberOfLines={1}
                  ellipsizeMode="clip"
                >
                  여행자 정보
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
                <Text style={[styles.figText, font, styles.statValue, pos(68, 537, 81, 30)]}>
                  {formatBirthDate(data.birthDate)}
                </Text>
                <CakeIcon width={41} height={41} style={pos(88, 494, 41, 41)} />

                <Text style={[styles.figText, font, styles.statLabel, pos(171, 479, 68, 15)]}>
                  획득 마스코트
                </Text>
                {/* [팀원 요청 6번: 0명 위치] 이 좌표(191,532)는 이미 Figma 선언값과 거의 일치하고, 위
                    강아지/고양이 아이콘 클러스터 중심(약 208)과도 크게 어긋나지 않아서 구체적으로 뭐가
                    잘못됐는지 특정하지 못해 값은 그대로 뒀다 — 실기로 보고 어느 방향(x=191 앞의 숫자)으로
                    옮기고 싶은지 알려주면 그 방향으로 조정하면 된다. */}
                <Text style={[styles.figText, font, styles.statValue, pos(188, 537, 42, 30)]}>
                  {data.mascotCount}명
                </Text>
                {/* 강아지-고양이 간격: 8px → 3px로 좁혔는데도 성호님이 보기엔 여전히 떨어져 보인다고 해서,
                    강아지 오른쪽 끝(177+33=210)에 고양이 왼쪽 끝을 딱 맞춰 간격을 0으로 없앴다. */}
                <DogIcon width={33} height={33} style={pos(177, 500, 33, 33)} />
                <CatIcon width={30} height={30} style={[pos(208, 503, 30, 30), styles.mirroredIcon]} />

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
                {/* [팀원 요청 4번: 기록 개수 위치] 아이콘을 Figma 선언 크기(30×40)로 복원하면서 아이콘
                    클러스터 중심이 283~317(중심 300)으로 바뀌었다 — 라벨/값도 그 중심에 맞춰 3px씩 오른쪽으로
                    같이 옮겼다. 그래도 여전히 위치가 이상해 보이면 이 좌표(pos의 첫 번째 숫자, x좌표)를
                    직접 조정하면 된다. */}
                <Text style={[styles.figText, font, styles.statLabel, pos(252, 479, 96, 15)]}>
                  기록 개수
                </Text>
                <Text style={[styles.figText, font, styles.statValue, pos(267, 537, 66, 30)]}>
                  {data.recordCount}개
                </Text>
                {/* [팀원 요청 5번: 기록 개수 그림 위치 및 크기] 기존엔 20×30으로 Figma 선언값(30×40, 좌표
                    287,498)보다 작게 잡혀 있어서 사진 아이콘(18×18)에 비해 연필 아이콘이 왜소해 보이고,
                    그 아래 텍스트(라벨/값)와도 클러스터 중심이 안 맞았다. Figma 선언값 그대로 복원. */}
                <WritingIcon width={30} height={35} style={pos(287, 498, 30, 40)} />
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
  errorText: {
    textAlign: 'center',
    color: '#FEFEFE',
    fontSize: 14,
    paddingHorizontal: 24,
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
    // [프로필 카드 전체 위치] justifyContent:'center'로 가운데 정렬되는 위치는 paddingTop과
    // paddingBottom의 "차이"에 좌우된다 — paddingTop이 paddingBottom보다 클수록 카드가 아래로 쏠려
    // 보인다. 90/40 → 75/55 → 65/65 → 0/65 순으로 좁혀오다가 성호님이 실기로 보면서 0/65(카드를
    // 최대한 위로)로 최종 확정. 이 헤더 겹침 방지용 상단 여백(맨 위 주석)은 이제 paddingTop이 아니라
    // 카드가 위로 붙어도 안 겹치는 실제 위치로 자연스럽게 대체된 상태 — 더 조정하고 싶으면 이 두 값을
    // 계속 같은 방식으로 건드리면 된다.
    paddingTop: 0,
    paddingBottom: 65,
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
    // 원래 있던 '#DCEEDC' 민트색은 캐릭터 PNG의 투명한 모서리 틈으로 옛 카드 배경(그라데이션
    // placeholder)이 비치지 않게 깔아둔 안전망이었다. 새로 받은 카드 배경 에셋(고리 투명 처리본)엔
    // 그 placeholder가 없어서, 실제로 합성해보니(시뮬레이션 확인) 투명하게 둬도 이음매 없이 깔끔하게
    // 카드 배경이 그대로 비친다 — 그래서 제거했다. 나중에 카드 배경을 또 바꿨는데 사진 모서리에
    // 이상한 색이 비치면 이 자리에 다시 배경색을 넣으면 된다.
    backgroundColor: 'transparent',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1 }]
  },
  // [팀원 요청 1번: 글씨체 변경 및 통일] fontWeight: '700'을 커스텀 폰트(Cafe24Ssurround)와 같이 쓰고
  // 있었는데, 이 폰트 파일은 웨이트가 하나뿐이다(assets/fonts에 Bold 컷이 따로 없음) — RN은 커스텀 폰트에
  // fontWeight를 얹어도 안드로이드에서는 합성 볼드를 만들어주지 않아서, 실제로는 무시되거나 플랫폼마다
  // 다르게 처리돼 "폰트가 안 맞다"는 인상을 준다. 아래 텍스트 스타일들에서 fontWeight를 전부 제거했다 —
  // 폰트 파일 자체가 이미 두꺼운 스타일이라 눈에 띄는 변화는 없을 것이다. 만약 여전히 두께가 다르게
  // 보인다면 Cafe24 쪽에서 Bold 전용 폰트 파일을 새로 받아와야 한다(현재는 그런 파일이 없음).
  headingText: {
    fontSize: 18,
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
    color: PILL_TEXT_COLOR,
  },
  titleText: {
    fontSize: 30,
    color: TITLE_COLOR,
    textAlign: 'right',
  },
  nameText: {
    fontSize: 30,
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
    fontSize: 24,
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
