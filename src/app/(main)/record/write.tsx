import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  searchPlaces,
  updateRecord,
  uploadRecordImage,
  type Mood,
  type PlaceSearchResult,
  type RecordPlace,
  type Weather,
} from '@/lib/api';

const GREEN = '#699447';
const MAX_PHOTOS = 4;

type Photo = { uri: string; isRemote: boolean };

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

  const [placeQuery, setPlaceQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<RecordPlace | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSearchResult[]>([]);
  const [placeSearchState, setPlaceSearchState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  // 장소를 선택/해제하거나(handleSelectPlace/handleClearPlace) 기존 기록을 불러와 placeQuery를
  // 코드로 채울 때(아래 getRecord), 그 직후의 debounce 검색 1회를 건너뛰기 위한 플래그.
  const skipNextPlaceSearchRef = useRef(false);

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
        if (record.placeName && record.latitude != null && record.longitude != null) {
          skipNextPlaceSearchRef.current = true;
          setSelectedPlace({
            placeName: record.placeName,
            latitude: record.latitude,
            longitude: record.longitude,
          });
          setPlaceQuery(record.placeName);
        }
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

  // 방문 장소 검색 디바운스 (~300ms) — 짧은 검색어(2자 미만)는 BE 호출 없이 즉시 결과 목록을 비운다
  // (BE도 동일 기준으로 빈 배열을 즉시 반환하지만, 타이핑 중 불필요한 요청 자체를 줄이기 위해 FE에서도 막는다).
  useEffect(() => {
    if (skipNextPlaceSearchRef.current) {
      skipNextPlaceSearchRef.current = false;
      return;
    }

    const trimmed = placeQuery.trim();
    if (trimmed.length < 2) {
      setPlaceSuggestions([]);
      setPlaceSearchState('idle');
      return;
    }

    setPlaceSearchState('loading');
    const timer = setTimeout(() => {
      searchPlaces(trimmed)
        .then((results) => {
          // RecordPlace는 latitude/longitude가 필수라, 좌표가 없는 결과는 애초에 선택 불가능하므로 제외한다.
          const withCoords = results.filter(
            (place): place is PlaceSearchResult & { latitude: number; longitude: number } =>
              place.latitude != null && place.longitude != null,
          );
          setPlaceSuggestions(withCoords);
          setPlaceSearchState(withCoords.length === 0 ? 'empty' : 'idle');
        })
        .catch(() => {
          setPlaceSuggestions([]);
          setPlaceSearchState('error');
        });
    }, 300);

    return () => clearTimeout(timer);
  }, [placeQuery]);

  function handlePlaceQueryChange(text: string) {
    setPlaceQuery(text);
    // 선택 후 텍스트를 직접 고치면 이전 선택은 더 이상 유효하지 않다.
    setSelectedPlace(null);
  }

  function handleSelectPlace(place: PlaceSearchResult & { latitude: number; longitude: number }) {
    skipNextPlaceSearchRef.current = true;
    setSelectedPlace({ placeName: place.placeName, latitude: place.latitude, longitude: place.longitude });
    setPlaceQuery(place.placeName);
    setPlaceSuggestions([]);
    setPlaceSearchState('idle');
  }

  function handleClearPlace() {
    setSelectedPlace(null);
    setPlaceQuery('');
    setPlaceSuggestions([]);
    setPlaceSearchState('idle');
  }

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
        // BE의 visitedAt은 LocalDate(날짜만)라서 시간 성분을 붙여 보내면 Jackson이 400으로 거부한다.
        visitedAt: visitedDateKey,
        // 장소를 검색해 선택하면 selectedPlace가 채워지고, 아무것도 선택하지 않으면(또는 선택을
        // 해제하면) null로 저장된다 — all-or-nothing 중 "없음" 쪽 (BE CreateRecordRequest 참고).
        place: selectedPlace,
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
          <View style={styles.placeSearchWrap}>
            <TextInput
              value={placeQuery}
              onChangeText={handlePlaceQueryChange}
              placeholder="장소를 검색해보세요. 비워두면 장소 없이 저장돼요."
              placeholderTextColor="#B7B2A6"
              style={styles.placeInput}
            />
            {selectedPlace && (
              <Pressable onPress={handleClearPlace} style={styles.placeSelectedRow} hitSlop={8}>
                <Text style={styles.placeSelectedLabel} numberOfLines={1}>
                  📍 {selectedPlace.placeName}
                </Text>
                <Text style={styles.placeClearLabel}>선택 해제</Text>
              </Pressable>
            )}
            {!selectedPlace && placeQuery.trim().length >= 2 && (
              <View style={styles.placeDropdown}>
                {placeSearchState === 'loading' && (
                  <View style={styles.placeDropdownRow}>
                    <ActivityIndicator size="small" color={GREEN} />
                  </View>
                )}
                {placeSearchState === 'error' && (
                  <Text style={styles.placeDropdownMessage}>
                    장소를 찾을 수 없어요. 잠시 후 다시 시도해주세요.
                  </Text>
                )}
                {placeSearchState === 'empty' && (
                  <Text style={styles.placeDropdownMessage}>검색 결과가 없어요.</Text>
                )}
                {placeSearchState === 'idle' &&
                  placeSuggestions.map((place, index) => (
                    <Pressable
                      key={`${place.placeName}-${place.address ?? index}`}
                      onPress={() =>
                        handleSelectPlace(place as PlaceSearchResult & { latitude: number; longitude: number })
                      }
                      style={styles.placeDropdownRow}
                    >
                      <Text style={styles.placeDropdownName} numberOfLines={1}>
                        {place.placeName}
                      </Text>
                      {place.address && (
                        <Text style={styles.placeDropdownAddress} numberOfLines={1}>
                          {place.address}
                        </Text>
                      )}
                    </Pressable>
                  ))}
              </View>
            )}
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
  placeSearchWrap: {
    position: 'relative',
    zIndex: 10,
  },
  placeInput: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333333',
  },
  placeSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0EDE3',
  },
  placeSelectedLabel: {
    flex: 1,
    fontSize: 13,
    color: '#4A4A4A',
    marginRight: 8,
  },
  placeClearLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B04A3C',
  },
  placeDropdown: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  placeDropdownRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  placeDropdownName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  placeDropdownAddress: {
    fontSize: 11,
    color: '#9A9A9A',
    marginTop: 2,
  },
  placeDropdownMessage: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 12,
    color: '#9A9A9A',
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
