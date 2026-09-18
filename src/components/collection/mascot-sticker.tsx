import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type MascotStickerProps = {
  name: string;
  imageUrl?: string | null;
};

// Figma gives each mascot its own custom scalloped "cutline" plaque shape, but that
// layer only exports as a flat silhouette (no per-mascot art) via the design-context
// asset pipeline, so we fall back to one shared rounded card behind every character.
// 백엔드가 아직 마스코트 이미지(imageUrl)를 세팅해두지 않은 경우가 있어(dev 시드 기준 전부 null),
// 그럴 땐 카드만 비워두고 이름 텍스트로 대체한다. 보유한 마스코트만 렌더링되므로 잠금 상태는 없다.
export function MascotSticker({ name, imageUrl }: MascotStickerProps) {
  return (
    <View style={styles.card}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
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
