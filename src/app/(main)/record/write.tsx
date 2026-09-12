import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import { MOOD_OPTIONS, WEATHER_OPTIONS } from '@/constants/record-options';
import {
  ApiError,
  createRecord,
  getRecord,
  updateRecord,
  uploadRecordImage,
  type Mood,
  type Weather,
} from '@/lib/api';

const GREEN = '#699447';
const MAX_PHOTOS = 4;

type Photo = { uri: string; isRemote: boolean };

function nowTimeSuffix(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export default function RecordWriteScreen() {
  const router = useRouter();
  const { date, id } = useLocalSearchParams<{ date?: string; id?: string }>();
  const editingId = id ? Number(id) : null;
  const isEditing = editingId !== null;

  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [visitedDateKey, setVisitedDateKey] = useState(date ?? new Date().toISOString().slice(0, 10));

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [weather, setWeather] = useState<Weather>('CLEAR');
  const [temperature, setTemperature] = useState('20');
  const [mood, setMood] = useState<Mood>('HAPPY');

  useEffect(() => {
    if (!isEditing || editingId === null) return;
    let cancelled = false;

    getRecord(editingId)
      .then((record) => {
        if (cancelled) return;
        setTitle(record.title);
        setContent(record.content);
        setPhotos(record.imageUrls.map((url) => ({ uri: url, isRemote: true })));
        setWeather(record.weather);
        setTemperature(String(record.temperature));
        setMood(record.mood);
        setVisitedDateKey(record.visitedAt.slice(0, 10));
      })
      .catch(() => {
        if (!cancelled) {
          Alert.alert('불러오기 실패', '기록을 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEditing, editingId]);

  async function handlePickPhoto() {
    if (photos.length >= MAX_PHOTOS) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '사진을 첨부하려면 사진 보관함 접근 권한이 필요해요.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.8,
    });

    if (result.canceled) return;

    const picked: Photo[] = result.assets.map((asset) => ({ uri: asset.uri, isRemote: false }));
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  }

  function handleRemovePhoto(uri: string) {
    setPhotos((prev) => prev.filter((photo) => photo.uri !== uri));
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('오늘의 기록 내용을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const imageUrls: string[] = [];
      for (const photo of photos) {
        if (photo.isRemote) {
          imageUrls.push(photo.uri);
        } else {
          const uploadedUrl = await uploadRecordImage(photo.uri);
          imageUrls.push(uploadedUrl);
        }
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        imageUrls,
        visitedAt: isEditing ? `${visitedDateKey}T${nowTimeSuffix()}` : `${visitedDateKey}T${nowTimeSuffix()}`,
        // 방문 장소 선택 UI는 지도 검색 SDK 담당 팀원과 협의 후 별도로 붙일 예정 (docs/ISSUE-여행기록-구현.md 참고).
        // 그 전까지는 항상 장소 미등록(all-or-nothing 중 "없음" 쪽) 상태로 저장한다.
        place: null,
        weather,
        temperature: Number(temperature) || 0,
        mood,
      };

      // NOTE: 로컬 typed routes가 아직 record 라우트를 모르는 상태라 `as Href` 캐스팅.
      // expo start/run:android 실행 시 자동 갱신되어 캐스팅이 필요 없어진다.
      if (isEditing && editingId !== null) {
        await updateRecord(editingId, payload);
        router.replace({ pathname: '/(main)/record/[id]', params: { id: String(editingId) } } as unknown as Href);
      } else {
        const created = await createRecord(payload);
        router.replace({ pathname: '/(main)/record/[id]', params: { id: String(created.id) } } as unknown as Href);
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? `저장에 실패했어요. (${error.status})` : '저장에 실패했어요.';
      Alert.alert('저장 실패', message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Text style={styles.headerTitle}>기록 작성</Text>
          <Pressable onPress={handleSave} disabled={saving} hitSlop={8} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator size="small" color={GREEN} />
            ) : (
              <Text style={styles.saveButtonLabel}>저장</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>제목</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목을 입력하세요."
            placeholderTextColor="#B7B2A6"
            style={styles.titleInput}
          />

          <Text style={styles.sectionLabel}>오늘의 기록</Text>
          <View style={styles.photoRow}>
            {photos.map((photo) => (
              <View key={photo.uri} style={styles.photoSlot}>
                <Image source={{ uri: photo.uri }} style={styles.photoImage} contentFit="cover" />
                <Pressable onPress={() => handleRemovePhoto(photo.uri)} style={styles.photoRemove}>
                  <Text style={styles.photoRemoveLabel}>×</Text>
                </Pressable>
              </View>
            ))}
            {photos.length < MAX_PHOTOS && (
              <Pressable onPress={handlePickPhoto} style={[styles.photoSlot, styles.photoAddSlot]}>
                <Text style={styles.photoAddLabel}>+</Text>
                <Text style={styles.photoCountLabel}>
                  {photos.length}/{MAX_PHOTOS}
                </Text>
              </Pressable>
            )}
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="일기 내용을 입력하세요."
            placeholderTextColor="#B7B2A6"
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.sectionLabel}>방문 장소</Text>
          <View style={styles.placeStub}>
            <Text style={styles.placeStubLabel}>장소를 선택하지 않은 기록으로 저장돼요.</Text>
          </View>

          <Text style={styles.sectionLabel}>날씨</Text>
          <View style={styles.optionRow}>
            {WEATHER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setWeather(option.value)}
                style={[styles.optionChip, weather === option.value && styles.optionChipSelected]}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text
                  style={[styles.optionLabel, weather === option.value && styles.optionLabelSelected]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={temperature}
            onChangeText={setTemperature}
            placeholder="기온(°C)"
            placeholderTextColor="#B7B2A6"
            keyboardType="numeric"
            style={styles.temperatureInput}
          />

          <Text style={styles.sectionLabel}>오늘의 기분</Text>
          <View style={styles.optionRow}>
            {MOOD_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setMood(option.value)}
                style={[styles.moodChip, mood === option.value && styles.moodChipSelected]}
              >
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              </Pressable>
            ))}
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
  saveButton: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  saveButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: GREEN,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
    marginTop: 20,
    marginBottom: 8,
  },
  titleInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#222222',
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoSlot: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 14,
  },
  photoAddSlot: {
    backgroundColor: '#FEFEFE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4DFD3',
    borderStyle: 'dashed',
  },
  photoAddLabel: {
    fontSize: 22,
    color: '#B7B2A6',
    lineHeight: 24,
  },
  photoCountLabel: {
    fontSize: 10,
    color: '#B7B2A6',
    marginTop: 2,
  },
  contentInput: {
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: '#FEFEFE',
    padding: 14,
    marginTop: 10,
    fontSize: 14,
    color: '#333333',
  },
  placeStub: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  placeStubLabel: {
    fontSize: 13,
    color: '#B7B2A6',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FEFEFE',
  },
  optionChipSelected: {
    backgroundColor: GREEN,
  },
  optionEmoji: {
    fontSize: 15,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  optionLabelSelected: {
    color: '#FEFEFE',
  },
  temperatureInput: {
    height: 40,
    width: 120,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 14,
    marginTop: 10,
    fontSize: 13,
    color: '#333333',
  },
  moodChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEFEFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodChipSelected: {
    backgroundColor: GREEN,
  },
});
