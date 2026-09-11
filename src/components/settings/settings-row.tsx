import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type SettingsRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  label: string;
  labelColor?: string;
  onPress?: () => void;
  // 우측에 커스텀 컨텐츠(값 텍스트 등)를 넣고 싶을 때. 지정 안 하면 onPress가 있는 행에만 chevron이 붙는다.
  right?: ReactNode;
  disabled?: boolean;
};

const GREEN = '#699447';

// 설정 목록의 아이템 한 줄 — 아이콘 + 라벨 + (우측 컨텐츠 또는 이동 화살표).
// Figma 목업의 아이콘들은 픽셀 단위로 맞추지 않고 의미가 통하는 Ionicons로 대체했다
// (프로필 카드와 달리 커스텀 배경 위에 얹는 요소가 아니라 일반 리스트라 아이콘 브랜드 일치가 크게 중요하지 않다고 판단).
export function SettingsRow({ icon, iconColor = GREEN, label, labelColor, onPress, right, disabled }: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={iconColor} style={styles.icon} />
      <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>{label}</Text>
      <View style={styles.right}>
        {right}
        {onPress && !right && <Ionicons name="chevron-forward" size={18} color="#C4C4C4" />}
      </View>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: 20,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#222222',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
