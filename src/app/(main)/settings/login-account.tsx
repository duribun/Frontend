import { useEffect, useState, type FC } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';

import GoogleIcon from '@/assets/icons/auth/google.svg';
import KakaoIcon from '@/assets/icons/auth/kakao.svg';
import NaverIcon from '@/assets/icons/auth/naver.svg';
import { SettingsHeader } from '@/components/settings/settings-header';
import { ApiError, getMyProfile, type AuthProvider } from '@/lib/api';

const GREEN = '#699447';

const PROVIDER_ICON: Record<AuthProvider, FC<SvgProps>> = {
  GOOGLE: GoogleIcon,
  KAKAO: KakaoIcon,
  NAVER: NaverIcon,
};

const PROVIDER_LABEL: Record<AuthProvider, string> = {
  GOOGLE: 'Google',
  KAKAO: 'Kakao',
  NAVER: 'Naver',
};

// 기획 Figma 목업은 구글/카카오/애플을 각각 연동·해제하는 멀티 연동 관리 화면이었지만,
// 두리번은 가입 시 선택한 provider 하나만 영구적으로 쓰고 추가 연동/해제를 지원하지 않기로 확정했다
// (docs/ISSUE-설정-구현.md 3번, docs/API_SETTING.md 1번). 그래서 이 화면은 연동/해제 버튼 없이
// 현재 로그인 provider 하나만 읽기 전용으로 보여준다. 계정을 없애고 싶으면 "회원 탈퇴"를 이용하게 안내한다.
export default function LoginAccountScreen() {
  const [provider, setProvider] = useState<AuthProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (!cancelled) setProvider(profile.provider);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof ApiError
            ? `로그인 계정 정보를 불러오지 못했어요. (${error.status})`
            : '로그인 계정 정보를 불러오지 못했어요.',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const ProviderIcon = provider ? PROVIDER_ICON[provider] : null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsHeader title="로그인 계정" />

        <View style={styles.content}>
          {loading && <ActivityIndicator color={GREEN} style={styles.loadingIndicator} />}

          {!loading && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

          {!loading && !errorMessage && provider && ProviderIcon && (
            <>
              <View style={styles.card}>
                <ProviderIcon width={40} height={40} />
                <Text style={styles.providerLabel}>{PROVIDER_LABEL[provider]} 계정으로 로그인 중</Text>
              </View>
              <Text style={styles.caption}>
                두리번은 가입 시 선택한 소셜 계정 하나로만 로그인해요. 다른 계정으로 바꾸거나 추가로
                연동할 수는 없어요. 계정을 없애고 싶다면 설정 목록의 &apos;회원 탈퇴&apos;를 이용해주세요.
              </Text>
            </>
          )}
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
    gap: 12,
  },
  loadingIndicator: {
    marginTop: 40,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#B04A3C',
  },
  card: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  providerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
  },
  caption: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8A8A8A',
    marginHorizontal: 4,
  },
});
