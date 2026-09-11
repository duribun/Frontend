import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';

const GREEN = '#699447';

type PermissionLevel = 'always' | 'while-using' | 'denied';

const OPTIONS: { level: PermissionLevel; title: string; description: string }[] = [
  { level: 'always', title: '항상 허용', description: '앱이 실행 중이 아니어도 위치 정보에 접근합니다' },
  { level: 'while-using', title: '사용 중에만 허용', description: '앱을 사용할 때만 위치 정보에 접근합니다' },
  { level: 'denied', title: '거부', description: '위치 정보 접근을 허용하지 않습니다' },
];

// OS 자체 권한이라 앱이 값을 직접 바꿀 수 없다 — 현재 상태를 읽어와 체크 표시만 하고,
// 탭하면 OS 설정 앱으로 보낸다 (docs/ISSUE-설정-구현.md 5번).
export default function LocationPermissionScreen() {
  const [level, setLevel] = useState<PermissionLevel | null>(null);

  const refreshStatus = useCallback(async () => {
    const foreground = await Location.getForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      setLevel('denied');
      return;
    }

    // NOTE: 두리번은 앱을 쓰는 동안(포그라운드)만 위치를 쓰고 백그라운드 위치는 필요 없어서,
    // app.json에 ACCESS_BACKGROUND_LOCATION 권한을 선언해두지 않았다. 이 상태에서
    // getBackgroundPermissionsAsync()를 호출하면 안드로이드에서 매니페스트 권한이 없다는
    // CodedError를 던지므로(정상 동작), "거부"가 아니라 "사용 중에만 허용"으로 폴백한다.
    // 매니페스트에 권한을 추가하는 순간부터는 실제 백그라운드 허용 여부를 그대로 반영하게 된다.
    try {
      const background = await Location.getBackgroundPermissionsAsync();
      setLevel(background.status === 'granted' ? 'always' : 'while-using');
    } catch {
      setLevel('while-using');
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    // 설정 앱에 갔다가 돌아왔을 때 바뀐 권한을 반영하기 위해 앱이 포그라운드로 돌아올 때마다 다시 읽는다.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshStatus();
    });
    return () => subscription.remove();
  }, [refreshStatus]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsHeader title="위치 접근 권한" />

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>위치 정보 접근 권한</Text>
          <View style={styles.card}>
            {OPTIONS.map((option, index) => (
              <View key={option.level}>
                {index > 0 && <View style={styles.divider} />}
                <Pressable onPress={() => Linking.openSettings()} style={styles.row}>
                  <Ionicons
                    name={level === option.level ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={level === option.level ? GREEN : '#C4C4C4'}
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{option.title}</Text>
                    <Text style={styles.rowDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
          <Text style={styles.caption}>권한은 OS 설정에서만 바꿀 수 있어요. 항목을 탭하면 설정 앱으로 이동해요.</Text>
        </View>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  sectionTitle: {
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
    marginLeft: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },
  rowDescription: {
    fontSize: 12,
    color: '#8A8A8A',
  },
  caption: {
    fontSize: 12,
    color: '#8A8A8A',
    marginHorizontal: 4,
    marginTop: 4,
  },
});
