import type { ImageSource } from 'expo-image';

// docs/ISSUE-마스코트도감-로컬에셋매핑.md, docs/ISSUE-마스코트획득화면-Figma연출구현.md — 마스코트 10종은
// 고정된 세트라 이미지/소개 문구를 이름 기준 로컬 상수로 들고 있는다(BE가 imageUrl을 계속 null로 시드하고,
// description은 애초에 API 응답에 없음). 도감 스티커(mascot-sticker.tsx)와 획득 연출 화면
// (mascot-acquired-overlay.tsx) 둘 다 이 파일을 공유해서 쓴다.
//
// mascotId/regionId는 시드를 다시 하면 값이 바뀔 수 있어 불안정해서, 상대적으로 안정적인 마스코트
// `name`을 키로 잡았다 — BE에서 이름을 오타 수정 등으로 바꾸면 이 파일도 같이 고쳐야 하는 결합은
// 생기지만, 마스코트 개수가 10개로 고정적이라 감수할 만하다고 판단(BE
// docs/ISSUE-지역마스코트시드-실데이터교체.md와 동일한 트레이드오프).
export const MASCOT_IMAGE_BY_NAME: Record<string, ImageSource> = {
  강치: require('@/assets/images/collection/mascot-sealion-char.png'),
  해치: require('@/assets/images/collection/mascot-haechi-char.png'),
  고래: require('@/assets/images/collection/mascot-whale-char.png'),
  괭이갈매기: require('@/assets/images/collection/mascot-catcrab-char.png'),
  동백: require('@/assets/images/collection/mascot-camellia-char.png'),
  빵: require('@/assets/images/collection/mascot-bread-char.png'),
  사과: require('@/assets/images/collection/mascot-apple-char.png'),
  철쭉: require('@/assets/images/collection/mascot-azalea-char.png'),
  학: require('@/assets/images/collection/mascot-crane-char.png'),
  노루: require('@/assets/images/collection/mascot-deer-char.png'),
};

// Figma "(3) 위치 인증" 플로우(node 312:133)의 지역별 "OO 발견" 화면 팻말 소개 문구를 그대로 옮겼다.
// BE MascotSeedConfig의 description과 동일한 문구(같은 출처에서 옮겨적음) — BE가 이 문구를 바꾸면
// 여기도 같이 갱신해야 한다.
export const MASCOT_DESCRIPTION_BY_NAME: Record<string, string> = {
  강치: '독도의 경비대 강치! 우리를 안전하게 지켜줘요.',
  해치: '서울의 수호자 해치! 언제나 씩씩하게 서울을 지켜줘요.',
  고래: '울산 앞바다의 고래! 시원한 바다 여행을 함께해요.',
  괭이갈매기: '섬과 바다의 친구 괭이갈매기! 울릉도 곳곳을 자유롭게 날아다녀요.',
  동백: '차가운 겨울에 피는 부산의 동백! 따뜻한 마음을 전해줘요.',
  빵: '빵의 도시 대전! 고소한 향기로 여행자를 이끌어요.',
  사과: '햇살 가득 머금은 대구 사과! 상큼한 맛으로 여행에 활력을 더해줘요',
  철쭉: '봄을 알리는 무등산의 철쭉! 멋진 꽃길로 여행자를 반겨줘요.',
  학: '인천의 자연을 품은 학! 갯벌과 바다를 자유롭게 여행해요.',
  노루: '제주 숲속의 귀여운 노루! 자연과 함께 즐거운 여행을 떠나요.',
};
