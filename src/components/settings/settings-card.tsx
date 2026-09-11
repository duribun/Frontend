import { Children, Fragment, type PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type SettingsCardProps = PropsWithChildren<{
  title?: string;
}>;

// 설정 목록/각 하위 화면에서 공통으로 쓰는 둥근 흰 카드 그룹 — record 화면 톤(#FEFEFE 카드, 14 라운드)과 통일.
// 자식 사이에 얇은 구분선을 자동으로 넣어준다 (Figma "설정 화면1" 목업의 아이템 간 divider와 동일한 역할).
export function SettingsCard({ title, children }: SettingsCardProps) {
  const items = Children.toArray(children);

  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.card}>
        {items.map((item, index) => (
          <Fragment key={index}>
            {index > 0 && <View style={styles.divider} />}
            {item}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
    marginLeft: 52,
  },
});
