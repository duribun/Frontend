import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type AttractionCardProps = {
  title: string;
  description?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  onPress?: () => void;
};

export function AttractionCard({ title, description, location, imageUrl, onPress }: AttractionCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.thumbnail}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} contentFit="cover" /> : null}
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {location ? <Text style={styles.location}>{location}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    height: 150,
    borderRadius: 25,
    backgroundColor: 'rgba(252,252,252,0.8)',
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 7,
    elevation: 2,
  },
  thumbnail: {
    width: 147,
    height: 123,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#171916',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A4039',
  },
  location: {
    fontSize: 14,
    color: '#AFAFAF',
  },
});
