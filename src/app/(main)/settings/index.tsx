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
            // 로그아웃 API 실패(네트워크 등)와 무관하게 로컬 토큰은 logout() 내부에서 항상 지워지므로,
            // 여기서는 실패해도 그냥 스플래시로 돌려보낸다.
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
    // [팀원 요청 2번: 배경 색상(노란색 -> 흰색 배경에 칸은 회색 테두리)] 노란 배경 -> 흰색.
    backgroundColor: '#FEFEFE',
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
