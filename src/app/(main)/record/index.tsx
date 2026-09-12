import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import { MonthCalendar, formatDateKey } from '@/components/record/month-calendar';
import { RecordCard } from '@/components/record/record-card';
import { ApiError, listRecords, type RecordSummary } from '@/lib/api';

const GREEN = '#699447';

function todayDateKey(): string {
  const now = new Date();
  return formatDateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export default function RecordHomeScreen() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey());
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    listRecords(year, month)
      .then((result) => {
        if (!cancelled) setRecords(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRecords([]);
        setErrorMessage(
          error instanceof ApiError
            ? `기록을 불러오지 못했어요. (${error.status})`
            : '기록을 불러오지 못했어요.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const markedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const record of records) {
      keys.add(record.visitedAt.slice(0, 10));
    }
    return keys;
  }, [records]);

  const recordsForSelectedDate = useMemo(
    () => records.filter((record) => record.visitedAt.slice(0, 10) === selectedDateKey),
    [records, selectedDateKey],
  );

  function handleChangeMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
  }

  // NOTE: 로컬 typed routes(.expo/types/router.d.ts)가 record 라우트 추가 전 상태라 `as Href`로 캐스팅함.
  // expo start/run:android 한 번 실행하면 타입이 자동 갱신되어 캐스팅 없이도 통과한다.
  function handleWriteNew() {
    router.push({ pathname: '/(main)/record/write', params: { date: selectedDateKey } } as unknown as Href);
  }

  function handleOpenRecord(recordId: number) {
    router.push({ pathname: '/(main)/record/[id]', params: { id: String(recordId) } } as unknown as Href);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <Text style={styles.headerTitle}>기록</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <MonthCalendar
            year={year}
            month={month}
            selectedDateKey={selectedDateKey}
            markedDateKeys={markedDateKeys}
            onSelectDate={setSelectedDateKey}
            onChangeMonth={handleChangeMonth}
          />

          <Pressable onPress={handleWriteNew} style={styles.writeButton}>
            <Text style={styles.writeButtonLabel}>+ 기록하기</Text>
          </Pressable>

          <View style={styles.listSection}>
            {loading && <ActivityIndicator color={GREEN} style={styles.loadingIndicator} />}

            {!loading && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            {!loading && !errorMessage && recordsForSelectedDate.length === 0 && (
              <Text style={styles.emptyText}>이 날짜에는 아직 기록이 없어요.</Text>
            )}

            {!loading &&
              !errorMessage &&
              recordsForSelectedDate.map((record) => (
                <RecordCard key={record.id} record={record} onPress={() => handleOpenRecord(record.id)} />
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
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  writeButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  writeButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  listSection: {
    gap: 10,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#B04A3C',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#8A8A8A',
    fontSize: 13,
  },
});
