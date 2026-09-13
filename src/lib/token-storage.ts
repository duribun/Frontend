import * as SecureStore from 'expo-secure-store';

// Phase 0 공통 인프라: 액세스/리프레시 토큰을 SecureStore(iOS Keychain / Android Keystore)에 저장.
// AsyncStorage(평문) 대신 SecureStore를 쓰는 이유: 토큰은 민감정보이므로 암호화 저장소가 필요.
const ACCESS_TOKEN_KEY = 'duribun_access_token';
const REFRESH_TOKEN_KEY = 'duribun_refresh_token';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

export async function hasRefreshToken(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}
