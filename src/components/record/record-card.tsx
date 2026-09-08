import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecordSummary } from '@/lib/api';
import { RECORD_TITLE_PREVIEW_LENGTH, recordContentPreviewLength, truncate } from '@/lib/truncate';

type RecordCardProps = {
  record: RecordSummary;
  onPress: () => void;
};

export function RecordCard({ record, onPress }: RecordCardProps) {
  const title = record.title.length > 0 ? truncate(record.title, RECORD_TITLE_PREVIEW_LENGTH) : '(제목 없음)';
  const hasPhoto = record.thumbnailUrl !== null;
  const content = truncate(record.content, recordContentPreviewLength(hasPhoto));

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {record.thumbnailUrl ? (
        <Image source={{ uri: record.thumbnailUrl }} style={styles.thumbnail} contentFit="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Text style={styles.thumbnailPlaceholderLabel}>📔</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {record.favorite && <Text style={styles.favoriteMark}>★</Text>}
        </View>
        {content.length > 0 && (
          <Text style={styles.content} numberOfLines={1}>
            {content}
          </Text>
        )}
        {record.placeName && (
          <Text style={styles.place} numberOfLines={1}>
            📍 {record.placeName}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEFEFE',
    borderRadius: 16,
    padding: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  thumbnailPlaceholder: {
    backgroundColor: '#F0EDE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailPlaceholderLabel: {
    fontSize: 22,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  favoriteMark: {
    fontSize: 14,
    color: '#E8B84B',
  },
  content: {
    fontSize: 13,
    color: '#666666',
  },
  place: {
    fontSize: 12,
    color: '#8A8A8A',
  },
});
