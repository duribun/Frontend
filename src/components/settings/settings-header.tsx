import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';

type SettingsHeaderProps = {
  title: string;
};

// record/[id].tsx, record/index.tsx와 동일한 헤더 패턴(중앙 타이틀 + 좌상단 뒤로가기)을 재사용.
export function SettingsHeader({ title }: SettingsHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
        <ChevronLeftIcon width={28} height={28} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
});
