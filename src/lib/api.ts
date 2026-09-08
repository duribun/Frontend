import type { Gender } from '@/context/user-profile-context';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// TODO: 실제 로그인/토큰 연동 전까지는 인증 토큰이 없다.
// splash.tsx가 아직 TEMP 바이패스라 access token을 어디서도 발급받지 않는 상태.
// 토큰 저장소가 생기면 여기서 Authorization 헤더를 채워 넣는다.
function getAccessToken(): string | null {
  return null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다.');
  }

  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${init?.method ?? 'GET'} ${path} failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export type NicknameCheckResponse = {
  available: boolean;
};

export function checkNicknameAvailable(nickname: string): Promise<NicknameCheckResponse> {
  return request<NicknameCheckResponse>(
    `/api/users/nickname-check?nickname=${encodeURIComponent(nickname)}`,
  );
}

export type SaveProfileRequest = {
  nickname: string;
  birthDate: string; // YYYY-MM-DD
  gender: Gender;
};

export type SaveProfileResponse = SaveProfileRequest;

export function saveProfile(payload: SaveProfileRequest): Promise<SaveProfileResponse> {
  return request<SaveProfileResponse>('/api/users/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export { ApiError };
