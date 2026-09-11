import { useRouter, type Href } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsCard } from '@/components/settings/settings-card';
import { SettingsHeader } from '@/components/settings/settings-header';
import { SettingsRow } from '@/components/settings/settings-row';
import { logout } from '@/lib/api';

const RED = '#B04A3C';

// docs/ISSUE-설정-구현.md 작업 범위 2번: 걸음 수 데이터/국가·언어 설정 행은 제외, 고객지원 그룹(도움말/FAQ/
// 1:1 문의/버그 신고/이용약관/개인정보 처리방침)도 이번 범위에서 통째로 제외 — BE 미준비 + 카피 미확정.
export default function SettingsHomeScreen() {
  const router = useRouter();

  function handleLogout() {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            // NOTE: 소셜 로그인이 아직 TEMP 바이패스라 실제 세션 종료가 의미 없을 수 있다 (API-NEEDS-설정.md 3번).
            // 실패하더라도 로컬에서는 그냥 스플래시로 돌려보낸다.
          }
          router.replace('/(onboarding)/splash');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsHeader title="설정" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SettingsCard title="계정 정보">
            <SettingsRow
              icon="person-outline"
              label="로그인 계정"
              onPress={() => router.push('/(main)/settings/login-account' as Href)}
            />
          </SettingsCard>

          <SettingsCard title="콘텐츠 설정">
            <SettingsRow
              icon="location-outline"
              label="위치 접근 권한"
              onPress={() => router.push('/(main)/settings/location-permission' as Href)}
            />
            <SettingsRow
              icon="volume-medium-outline"
              label="사운드"
              onPress={() => router.push('/(main)/settings/sound' as Href)}
            />
          </SettingsCard>

          <SettingsCard title="계정 관리">
            <SettingsRow icon="log-out-outline" label="로그아웃" onPress={handleLogout} />
            <SettingsRow
              icon="person-remove-outline"
              iconColor={RED}
              labelColor={RED}
              label="회원 탈퇴"
              onPress={() => router.push('/(main)/settings/withdraw' as Href)}
            />
          </SettingsCard>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },
});
