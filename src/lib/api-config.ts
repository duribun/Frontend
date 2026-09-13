import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Phase 0 공통 인프라: 로컬 개발 시 BE Base URL 자동 분기.
// - Android 에뮬레이터: 호스트 머신의 localhost는 10.0.2.2로 접근해야 함
// - iOS 시뮬레이터: localhost 그대로 접근 가능
// - 실기기(iOS/Android 실물): 같은 Wi-Fi 네트워크의 로컬 IP를 .env(EXPO_PUBLIC_API_BASE_URL)에 직접 설정해야 함
//   (예: EXPO_PUBLIC_API_BASE_URL=http://192.168.0.5:8080) — 이 경우 Device.isDevice가 true이므로
//   아래 자동 치환 로직이 개입하지 않고 .env 값을 그대로 사용한다.
const CONFIGURED_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export function resolveApiBaseUrl(): string {
  if (!CONFIGURED_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다. .env를 확인하세요.');
  }

  const isAndroidEmulator = Platform.OS === 'android' && !Device.isDevice;
  if (isAndroidEmulator) {
    return CONFIGURED_BASE_URL.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
  }

  return CONFIGURED_BASE_URL;
}
