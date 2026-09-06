import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type AttractionCardProps = {
  title: string;
  description: string;
  location: string;
  imageUrl?: string;
};

export function AttractionCard({ title, description, location, imageUrl }: AttractionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.thumbnail}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.thumbnailImage} contentFit="cover" /> : null}
      </View>
      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
        <Text style={styles.location}>{location}</Text>
      </View>
    </View>
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
