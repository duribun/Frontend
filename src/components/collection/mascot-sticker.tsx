import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type MascotStickerProps = {
  name: string;
  imageUrl?: string | null;
};

// docs/ISSUE-마스코트도감-로컬에셋매핑.md — 마스코트 10종은 사용자 업로드가 아니라 고정된 세트고,
// 앱의 다른 그래픽도 전부 로컬 번들 에셋으로 처리하므로 BE가 원격 imageUrl을 호스팅하지 않기로 했다.
// 이름 기준으로 로컬 에셋에 매핑한다(mascotId/regionId는 시드를 다시 하면 값이 바뀔 수 있어 불안정).
const MASCOT_IMAGE_BY_NAME: Record<string, ImageSource> = {
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

// Figma gives each mascot its own custom scalloped "cutline" plaque shape, but that
// layer only exports as a flat silhouette (no per-mascot art) via the design-context
// asset pipeline, so we fall back to one shared rounded card behind every character.
// imageUrl은 API 응답 형태를 유지하기 위해 prop으로는 남겨두지만, 위 로컬 매핑을 우선 사용하고
// (BE가 계속 null로 시드해도 무방) 매핑에 없는 이름일 때만 imageUrl로, 그것도 없으면 이름
// 텍스트로 폴백한다. 보유한 마스코트만 렌더링되므로 잠금 상태는 없다.
export function MascotSticker({ name, imageUrl }: MascotStickerProps) {
  const localImage = MASCOT_IMAGE_BY_NAME[name];
  const source = localImage ?? (imageUrl ? { uri: imageUrl } : null);

  return (
    <View style={styles.card}>
      {source ? (
        <Image source={source} style={styles.image} contentFit="contain" />
      ) : (
        <Text style={styles.placeholderText} numberOfLines={2}>
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFDF3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A7A5C',
    textAlign: 'center',
  },
});
