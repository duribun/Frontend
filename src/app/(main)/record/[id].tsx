import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import { moodEmoji, weatherEmoji, weatherLabel } from '@/constants/record-options';
import { ApiError, deleteRecord, getRecord, toggleRecordFavorite, type RecordDetail } from '@/lib/api';

const GREEN = '#699447';
const SCREEN_WIDTH = Dimensions.get('window').width;

function formatVisitedAt(visitedAt: string): string {
  const date = new Date(visitedAt);
  if (Number.isNaN(date.getTime())) return visitedAt;
  const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')} (${weekdayLabels[date.getDay()]})`;
}

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordId = Number(id);

  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingFavorite, setTogglingFavorite] = useState(false);

  const loadRecord = useCallback(() => {
    setLoading(true);
    getRecord(recordId)
      .then(setRecord)
      .catch(() => {
        Alert.alert('불러오기 실패', '기록을 불러오지 못했어요.');
      })
      .finally(() => setLoading(false));
  }, [recordId]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  async function handleToggleFavorite() {
    if (!record) return;
    setTogglingFavorite(true);
    try {
      const updated = await toggleRecordFavorite(record.id);
      setRecord(updated);
    } catch {
      Alert.alert('실패', '즐겨찾기 상태를 변경하지 못했어요.');
    } finally {
      setTogglingFavorite(false);
    }
  }

  function handleEdit() {
    if (!record) return;
    // NOTE: 로컬 typed routes 갱신 전이라 `as Href` 캐스팅 (expo start/run:android 후 불필요해짐).
    router.push({ pathname: '/(main)/record/write', params: { id: String(record.id) } } as unknown as Href);
  }

  async function handleShare() {
    if (!record) return;
    try {
      await Share.share({ message: `${record.title}\n${record.content}` });
    } catch {
      // 공유 취소는 조용히 무시.
    }
  }

  function handleDelete() {
    if (!record) return;
    Alert.alert('기록 삭제', '이 기록을 삭제할까요? 삭제하면 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRecord(record.id);
            router.back();
          } catch (error) {
            const message =
              error instanceof ApiError ? `삭제에 실패했어요. (${error.status})` : '삭제에 실패했어요.';
            Alert.alert('삭제 실패', message);
          }
        },
      },
    ]);
  }

  if (loading || !record) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={GREEN} />
      </View>
    );
  }

  const hasPlace = record.placeName !== null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Text style={styles.headerTitle}>기록 상세</Text>
          <Pressable onPress={handleToggleFavorite} disabled={togglingFavorite} hitSlop={8} style={styles.favoriteButton}>
            <Text style={[styles.favoriteIcon, record.favorite && styles.favoriteIconActive]}>
              {record.favorite ? '★' : '☆'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {record.imageUrls.length > 0 && (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {record.imageUrls.map((url) => (
                <Image
                  key={url}
                  source={{ uri: url }}
                  style={[styles.photo, { width: SCREEN_WIDTH, height: SCREEN_WIDTH }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          )}

          <Text style={styles.title}>{record.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatVisitedAt(record.visitedAt)}</Text>
            <Text style={styles.metaText}>
              {weatherEmoji(record.weather)} {weatherLabel(record.weather)} {record.temperature}°C
            </Text>
            <Text style={styles.metaText}>{moodEmoji(record.mood)}</Text>
          </View>

          <Text style={styles.content}>{record.content}</Text>

          {hasPlace && (
            <View style={styles.placeCard}>
              <Text style={styles.placeLabel}>📍 {record.placeName}</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <Pressable onPress={handleEdit} style={styles.actionButton}>
              <Text style={styles.actionLabel}>수정</Text>
            </Pressable>
            <Pressable onPress={handleShare} style={styles.actionButton}>
              <Text style={styles.actionLabel}>공유</Text>
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.actionButton}>
              <Text style={[styles.actionLabel, styles.deleteLabel]}>삭제</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1D3',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  favoriteButton: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  favoriteIcon: {
    fontSize: 22,
    color: '#B7B2A6',
  },
  favoriteIconActive: {
    color: '#E8B84B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  photoScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  photo: {},
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222222',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#8A8A8A',
  },
  content: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  placeCard: {
    marginTop: 20,
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    padding: 14,
  },
  placeLabel: {
    fontSize: 13,
    color: '#555555',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 32,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555555',
  },
  deleteLabel: {
    color: '#B04A3C',
  },
});
