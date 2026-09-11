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

// ---- record (여행 기록) ----

export type Weather = 'CLEAR' | 'SNOW' | 'RAIN' | 'THUNDER' | 'WIND' | 'CLOUDY';
export type Mood = 'EXCITED' | 'HAPPY' | 'NEUTRAL' | 'SAD' | 'DISTRESSED';

export type RecordSummary = {
  id: number;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  visitedAt: string;
  placeName: string | null;
  favorite: boolean;
};

export type RecordDetail = {
  id: number;
  title: string;
  content: string;
  imageUrls: string[];
  visitedAt: string;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  weather: Weather;
  temperature: number;
  mood: Mood;
  favorite: boolean;
};

export type RecordPlace = {
  placeName: string;
  latitude: number;
  longitude: number;
};

export type RecordInput = {
  title: string;
  content: string;
  imageUrls?: string[];
  visitedAt: string;
  place?: RecordPlace | null; // null/미지정 = 장소 미등록 (all-or-nothing이라 이름/좌표를 묶어서 받는다)
  weather: Weather;
  temperature: number;
  mood: Mood;
};

type RecordRequestBody = {
  title: string;
  content: string;
  imageUrls: string[];
  visitedAt: string;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  weather: Weather;
  temperature: number;
  mood: Mood;
};

function toRecordRequestBody(input: RecordInput): RecordRequestBody {
  return {
    title: input.title,
    content: input.content,
    imageUrls: input.imageUrls ?? [],
    visitedAt: input.visitedAt,
    placeName: input.place?.placeName ?? null,
    latitude: input.place?.latitude ?? null,
    longitude: input.place?.longitude ?? null,
    weather: input.weather,
    temperature: input.temperature,
    mood: input.mood,
  };
}

export function listRecords(year: number, month: number): Promise<RecordSummary[]> {
  return request<RecordSummary[]>(`/api/records/me?year=${year}&month=${month}`);
}

// year/month를 아예 안 보내면 필터 없이 전체 기록이 반환된다 (프로필 화면의 "기록 개수" 계산용).
export function listAllRecords(): Promise<RecordSummary[]> {
  return request<RecordSummary[]>('/api/records/me');
}

export function getRecord(recordId: number): Promise<RecordDetail> {
  return request<RecordDetail>(`/api/records/${recordId}`);
}

export function createRecord(input: RecordInput): Promise<RecordDetail> {
  return request<RecordDetail>('/api/records', {
    method: 'POST',
    body: JSON.stringify(toRecordRequestBody(input)),
  });
}

export function updateRecord(recordId: number, input: RecordInput): Promise<RecordDetail> {
  return request<RecordDetail>(`/api/records/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify(toRecordRequestBody(input)),
  });
}

export function deleteRecord(recordId: number): Promise<void> {
  return request<void>(`/api/records/${recordId}`, { method: 'DELETE' });
}

export function toggleRecordFavorite(recordId: number): Promise<RecordDetail> {
  return request<RecordDetail>(`/api/records/${recordId}/favorite`, { method: 'PATCH' });
}

type PresignedUploadUrlResponse = {
  uploadUrl: string;
  imageUrl: string;
};

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getFileExtension(uri: string): string {
  const match = /\.([a-zA-Z0-9]+)$/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
}

/**
 * 로컬 이미지(uri)를 S3에 업로드하고 최종 접근 URL을 반환한다.
 * 1) presigned URL 발급 2) 발급받은 uploadUrl로 직접 PUT 업로드 (우리 API 서버를 거치지 않음).
 */
export async function uploadRecordImage(localUri: string): Promise<string> {
  const extension = getFileExtension(localUri);
  const contentType = EXTENSION_CONTENT_TYPE[extension] ?? 'image/jpeg';

  const { uploadUrl, imageUrl } = await request<PresignedUploadUrlResponse>(
    `/api/records/images/presigned-url?extension=${extension}`,
    { method: 'POST' },
  );

  const fileResponse = await fetch(localUri);
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    throw new ApiError(uploadResponse.status, `S3 이미지 업로드 실패: ${uploadResponse.status}`);
  }

  return imageUrl;
}

// ---- profile (프로필 화면) ----

export type AuthProvider = 'GOOGLE' | 'KAKAO' | 'NAVER';

export type MyProfile = {
  nickname: string;
  birthDate: string | null;
  gender: Gender | null;
  // 가입 시 사용한 소셜 provider, 불변값 (연동/해제 기능 없음) — 설정 > 로그인 계정 화면에서 읽기 전용으로 표시.
  provider: AuthProvider;
};

export function getMyProfile(): Promise<MyProfile> {
  return request<MyProfile>('/api/users/me');
}

export type Mascot = {
  mascotId: number;
  name: string;
  imageUrl: string;
  acquiredAt: string;
};

export function getMyMascots(): Promise<Mascot[]> {
  return request<Mascot[]>('/api/mascots/me');
}

export type Badge = {
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  requiredMascotCount: number;
  acquiredAt: string;
};

// requiredMascotCount 내림차순으로 정렬되어 내려온다. 첫 항목이 곧 "현재 칭호"(가장 높은 단계).
export function getMyBadges(): Promise<Badge[]> {
  return request<Badge[]>('/api/badges/me');
}

export type VisitedRegion = {
  regionId: number;
  regionName: string;
  visitedAt: string;
};

export function getVisitedRegions(): Promise<VisitedRegion[]> {
  return request<VisitedRegion[]>('/api/locations/visits');
}

// ---- 설정 화면 ----

// NOTE: 소셜 로그인이 아직 TEMP 바이패스라 리프레시 토큰을 들고 있지 않다 (getAccessToken()도 항상 null).
// 실제 로그인 연동 전까지는 이 호출이 성공하더라도 의미 있는 세션 종료는 아니다 (docs/API-NEEDS-설정.md 3번 참고).
export function logout(): Promise<void> {
  return request<void>('/api/auth/logout', { method: 'POST' });
}

export function withdrawAccount(): Promise<void> {
  return request<void>('/api/settings/me/withdraw', { method: 'DELETE' });
}

export { ApiError };
