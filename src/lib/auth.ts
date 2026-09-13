import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import { resolveApiBaseUrl } from '@/lib/api-config';
import { saveTokens } from '@/lib/token-storage';

// Phase 1: 소셜 로그인 (Google/Kakao/Naver).
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

export async function signInWithKakao(): Promise<SocialLoginResult> {
  // KakaoAuthClient(BE)는 Access Token으로 카카오 REST API를 호출해 사용자 정보를 조회하는 방식이라,
  // Google과 달리 idToken이 아니라 accessToken을 보낸다.
  const token = await kakaoLogin();
  return socialLogin('KAKAO', token.accessToken);
}

let naverInitialized = false;

function ensureNaverInitialized() {
  if (naverInitialized) return;
  NaverLogin.initialize({
    appName: '두리번',
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
    // app.json의 "scheme"("fe")과 반드시 동일해야 로그인 후 앱으로 정상 복귀한다.
    serviceUrlSchemeIOS: 'fe',
    disableNaverAppAuthIOS: true,
  });
  naverInitialized = true;
}

export async function signInWithNaver(): Promise<SocialLoginResult> {
  // NaverAuthClient(BE)도 Kakao와 동일하게 Access Token 기반 REST 검증 방식.
  ensureNaverInitialized();
  const { isSuccess, successResponse, failureResponse } = await NaverLogin.login();
  if (!isSuccess || !successResponse) {
    throw new Error(failureResponse?.message ?? 'Naver 로그인에 실패했습니다.');
  }
  return socialLogin('NAVER', successResponse.accessToken);
}
