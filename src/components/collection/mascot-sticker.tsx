import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

type MascotStickerProps = {
  image: number;
};

// Figma gives each mascot its own custom scalloped "cutline" plaque shape, but that
// layer only exports as a flat silhouette (no per-mascot art) via the design-context
// asset pipeline, so we fall back to one shared rounded card behind every character.
export function MascotSticker({ image }: MascotStickerProps) {
  return (
    <View style={styles.card}>
      <Image source={image} style={styles.image} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '46%',
    aspectRatio: 1,
    backgroundColor: '#FFFDF3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 16,
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
});
