import { Pressable, StyleSheet, Text, View } from 'react-native';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const GREEN = '#699447';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

type MonthCalendarProps = {
  year: number;
  month: number; // 1~12
  selectedDateKey: string | null;
  markedDateKeys: Set<string>;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
};

export function MonthCalendar({
  year,
  month,
  selectedDateKey,
  markedDateKeys,
  onSelectDate,
  onChangeMonth,
}: MonthCalendarProps) {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  function goPrevMonth() {
    if (month === 1) {
      onChangeMonth(year - 1, 12);
    } else {
      onChangeMonth(year, month - 1);
    }
  }

  function goNextMonth() {
    if (month === 12) {
      onChangeMonth(year + 1, 1);
    } else {
      onChangeMonth(year, month + 1);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={goPrevMonth} hitSlop={8} style={styles.arrowButton}>
          <Text style={styles.arrowLabel}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {year}년 {month}월
        </Text>
        <Pressable onPress={goNextMonth} hitSlop={8} style={styles.arrowButton}>
          <Text style={styles.arrowLabel}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={label}
            style={[
              styles.weekdayLabel,
              i === 0 && styles.sundayLabel,
              i === 6 && styles.saturdayLabel,
            ]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: cells.length / 7 }, (_, weekIndex) => (
          <View key={weekIndex} style={styles.weekRow}>
            {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((day, weekday) => {
              if (day === null) {
                return <View key={`empty-${weekIndex}-${weekday}`} style={styles.cell} />;
              }
              const dateKey = formatDateKey(year, month, day);
              const isSelected = dateKey === selectedDateKey;
              const hasRecord = markedDateKeys.has(dateKey);
              return (
                <Pressable key={dateKey} onPress={() => onSelectDate(dateKey)} style={styles.cell}>
                  <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                    <Text
                      style={[
                        styles.dayLabel,
                        weekday === 0 && styles.sundayLabel,
                        weekday === 6 && styles.saturdayLabel,
                        isSelected && styles.dayLabelSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasRecord && <View style={[styles.dot, isSelected && styles.dotSelected]} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEFEFE',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  arrowButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8A8A8A',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9A9A9A',
    marginBottom: 6,
  },
  grid: {
    gap: 2,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  dayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: GREEN,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
  },
  dayLabelSelected: {
    color: '#FEFEFE',
    fontWeight: '700',
  },
  sundayLabel: {
    color: '#E0654A',
  },
  saturdayLabel: {
    color: '#4A7CD6',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GREEN,
  },
  dotSelected: {
    backgroundColor: '#A9D14D',
  },
});
