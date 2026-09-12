import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';
import { SimpleSlider } from '@/components/settings/simple-slider';
import { useSoundSettings } from '@/context/sound-settings-context';

const GREEN = '#699447';

// 실제 BGM/효과음 파일이 아직 없어서 재생 연결은 없고, 이번엔 UI + 값 저장(세션 메모리)까지만 구현한다
// (docs/ISSUE-설정-구현.md 4번, docs/API_SETTING.md 2번 — BE 저장 스키마 미확정이라 서버 연동은 보류).
export default function SoundScreen() {
  const { bgmVolume, sfxVolume, vibrationEnabled, setBgmVolume, setSfxVolume, setVibrationEnabled } =
    useSoundSettings();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsHeader title="사운드" />

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.sliderRow}>
              <Text style={styles.label}>배경음</Text>
              <SimpleSlider value={bgmVolume} onChange={setBgmVolume} />
            </View>

            <View style={styles.divider} />

            <View style={styles.sliderRow}>
              <Text style={styles.label}>효과음</Text>
              <SimpleSlider value={sfxVolume} onChange={setSfxVolume} />
            </View>

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <Text style={styles.label}>진동</Text>
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                trackColor={{ true: GREEN }}
              />
            </View>
          </View>
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
  },
  card: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  sliderRow: {
    paddingVertical: 16,
    gap: 10,
  },
  toggleRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFEFEF',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#222222',
  },
});
