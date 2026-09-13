import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { resolveApiBaseUrl } from '@/lib/api-config';
import { saveTokens } from '@/lib/token-storage';

// Phase 1: 소셜 로그인. Google부터 먼저 구현하고 Kakao/Naver는 후속 작업으로 추가한다.
//
// BE 실제 코드(AuthController/LoginRequest/LoginResponse) 확인 완료 — 아래 스키마는 가정이 아니라 검증된 값이다.
//   - 요청 바디: { token: string }
//   - {provider} path 값: SocialProvider.from()이 toUpperCase()로 파싱해서 대소문자 무관하게 동작('GOOGLE' 사용)
type LoginResponseBody = {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
  userId: number;
};

export type SocialProviderCode = 'GOOGLE' | 'KAKAO' | 'NAVER';

export type SocialLoginResult = {
  isNewUser: boolean;
};

GoogleSignin.configure({
  // google-signin 라이브러리 요구사항: Android/iOS 네이티브 클라이언트를 쓰더라도
  // idToken 발급을 위해 webClientId(Web 클라이언트 ID)가 항상 필요하다.
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
});

async function socialLogin(provider: SocialProviderCode, token: string): Promise<SocialLoginResult> {
  const response = await fetch(`${resolveApiBaseUrl()}/api/auth/login/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    throw new Error(`소셜 로그인 실패: ${response.status}`);
  }

  const data = (await response.json()) as LoginResponseBody;
  await saveTokens(data.accessToken, data.refreshToken);
  return { isNewUser: data.isNewUser };
}

export async function signInWithGoogle(): Promise<SocialLoginResult> {
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();

  // ⚠️ @react-native-google-signin/google-signin v10+ 기준으로 signIn()이
  // { type: 'success', data: { idToken, user } }를 반환한다고 가정하고 작성함.
  // 설치된 버전에 따라 result.idToken처럼 구조가 다를 수 있으니, 설치 후
  // 타입 에러가 나면 이 부분만 실제 반환 타입에 맞춰 고치면 된다.
  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google idToken을 받지 못했습니다.');
  }

  return socialLogin('GOOGLE', idToken);
}
