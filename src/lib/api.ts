import type { Gender } from '@/context/user-profile-context';
import { resolveApiBaseUrl } from '@/lib/api-config';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/lib/token-storage';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ReissueResponse = {
  accessToken: string;
  refreshToken: string;
};

// 여러 요청이 동시에 401을 받아도 /api/auth/reissue는 한 번만 호출되도록 in-flight promise를 공유한다
// (single-flight). 재발급이 끝나기 전에 또 401이 오면 이 promise에 합류시킨다.
let reissueInFlight: Promise<string | null> | null = null;

async function reissueAccessToken(): Promise<string | null> {
  if (reissueInFlight) {
    return reissueInFlight;
  }

  reissueInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${resolveApiBaseUrl()}/api/auth/reissue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // 리프레시 토큰도 만료/무효 — 세션 완전 종료. 로그인 화면으로의 리다이렉트는
        // Phase 1(실제 로그인 연동)에서 이 상태를 감지해 처리한다.
        await clearTokens();
        return null;
      }

      const data = (await response.json()) as ReissueResponse;
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    }
  })();

  try {
    return await reissueInFlight;
  } finally {
    reissueInFlight = null;
  }
}

// 재발급 자체를 시도할 필요가 없는 경로 — 재귀 호출로 인한 무한 루프 방지.
const AUTH_ENDPOINTS_WITHOUT_RETRY = ['/api/auth/login', '/api/auth/reissue', '/api/auth/logout'];

async function request<T>(path: string, init?: RequestInit, isRetryAfterReissue = false): Promise<T> {
  const baseUrl = resolveApiBaseUrl();
  const token = await getAccessToken();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  const canRetry = !isRetryAfterReissue && !AUTH_ENDPOINTS_WITHOUT_RETRY.some((p) => path.startsWith(p));
  if (response.status === 401 && canRetry) {
    const newAccessToken = await reissueAccessToken();
    if (newAccessToken) {
      return request<T>(path, init, true);
    }
  }

  if (!response.ok) {
    // 백엔드 GlobalExceptionHandler는 {status, error, message} 형태의 본문을 내려준다.
    // 같은 status 코드가 서로 다른 원인을 가리키는 경우(예: 409가 "이미 구매"와 "포인트 부족" 둘 다에 쓰임)
    // 이 message로 구분해야 하므로 최대한 살려서 전달한다.
    let message = `${init?.method ?? 'GET'} ${path} failed: ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // 본문이 JSON이 아니거나 비어있으면 기본 메시지를 사용한다.
    }
    throw new ApiError(response.status, message);
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

// ---- mascot (마스코트 도감 전체 — 미보유 포함) ----
// GET /api/mascots/me와 달리 지역별 마스코트 전체 목록 + 보유 여부를 함께 내려준다.
// dev 시드 기준 지역 1개 = 마스코트 1개라 전체 개수는 지역 수만큼(현재 2개)뿐이다.

export type MascotEntry = {
  mascotId: number;
  regionId: number;
  name: string;
  imageUrl: string | null;
  acquired: boolean;
  acquiredAt: string | null;
};

export function getMascots(): Promise<MascotEntry[]> {
  return request<MascotEntry[]>('/api/mascots');
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

// ---- badge (칭호 도장판 전체 — 미보유 포함) ----
// GET /api/badges/me와 달리 8단계 칭호 전체 + 보유 여부를 함께 내려준다. 정렬 순서는 보장되지
// 않으므로(백엔드 findAll() 그대로) 도장판에 표시할 때는 requiredMascotCount 기준으로 직접 정렬한다.

export type BadgeEntry = {
  code: string;
  name: string;
  description: string;
  requiredMascotCount: number;
  iconUrl: string;
  acquired: boolean;
  acquiredAt: string | null;
};

export function getBadges(): Promise<BadgeEntry[]> {
  return request<BadgeEntry[]>('/api/badges');
}

export type VisitedRegion = {
  regionId: number;
  regionName: string;
  visitedAt: string;
};

export function getVisitedRegions(): Promise<VisitedRegion[]> {
  return request<VisitedRegion[]>('/api/locations/visits');
}

// ---- regions (지역 기준 정보) ----
// GET /api/locations/regions는 인증 불필요(permitAll). dev 시드는 강릉시(51150)/서울특별시(11000) 2곳뿐.

export type Region = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  verificationRadiusMeters: number;
};

export function getRegions(): Promise<Region[]> {
  return request<Region[]>('/api/locations/regions');
}

// ---- map (지도 화면 관광지 조회) ----
// GET /api/map/**은 전부 인증 불필요(permitAll).

export type AttractionSummary = {
  contentId: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
};

export type AttractionDetail = {
  contentId: string;
  title: string;
  address: string | null;
  description: string | null;
  images: string[];
};

export function getRegionAttractions(regionId: number): Promise<AttractionSummary[]> {
  return request<AttractionSummary[]>(`/api/map/regions/${regionId}/attractions`);
}

export function getNearbyAttractions(
  latitude: number,
  longitude: number,
  radiusMeters?: number,
): Promise<AttractionSummary[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  if (radiusMeters != null) {
    params.set('radiusMeters', String(radiusMeters));
  }
  return request<AttractionSummary[]>(`/api/map/nearby?${params.toString()}`);
}

export function searchAttractions(keyword: string): Promise<AttractionSummary[]> {
  return request<AttractionSummary[]>(`/api/map/search?keyword=${encodeURIComponent(keyword)}`);
}

export function getAttractionDetail(contentId: string): Promise<AttractionDetail> {
  return request<AttractionDetail>(`/api/map/attractions/${encodeURIComponent(contentId)}`);
}

// ---- place (기록 작성 화면 방문 장소 검색) ----
// GET /api/places/search는 인증 불필요(permitAll). map 도메인의 /api/map/search와 달리 관광지로
// 제한하지 않고 전체 콘텐츠 타입(음식점/숙박 등 포함)을 검색하며, 결과를 캐싱하지 않는 단순 프록시다
// (BE docs/ISSUE-장소검색-TourAPI프록시.md). 검색어가 2자 미만이면 BE가 빈 배열을 즉시 반환한다.
// address는 드롭다운 표시용일 뿐 RecordPlace에는 없는 필드라 저장하지 않는다.

export type PlaceSearchResult = {
  placeName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function searchPlaces(keyword: string): Promise<PlaceSearchResult[]> {
  return request<PlaceSearchResult[]>(`/api/places/search?keyword=${encodeURIComponent(keyword)}`);
}

// ---- location (위치 인증) ----
// NOTE: 이 함수를 실제로 호출하는 화면(메인 화면 수집 아이콘 `handleFrame`, GPS 기반
// 관광지 방문 인증 플로우) 자체는 아직 FE에 구현되어 있지 않다 (docs/ISSUE-BGM-구현.md 참고).
// 후속 "수집 기능 구현" 이슈에서 이 함수를 호출하고, 응답의 newlyAcquiredMascots가
// 비어있지 않으면 useSoundSettings().playMascotAcquiredSound()를 호출해 효과음을 재생한다.

export type VerifyLocationRequest = {
  regionId: number;
  latitude: number;
  longitude: number;
};

export type NewlyAcquiredMascot = {
  mascotId: number;
  name: string;
  imageUrl: string;
};

export type VerifyLocationResponse = {
  verified: boolean;
  isFirstVisit: boolean;
  regionId: number;
  regionName: string;
  distanceMeters: number;
  // 이번 호출로 새로 지급된 마스코트. Region과 마스코트가 1:1 매핑이라 항상 0개 또는 1개.
  // 마스코트 지급은 동기 처리라 이 응답을 받는 시점에 이미 완료돼 있다 — 별도로
  // getMyMascots()를 재조회할 필요가 없다. verified/isFirstVisit이 false면 항상 빈 배열.
  newlyAcquiredMascots: NewlyAcquiredMascot[];
};

export function verifyLocation(payload: VerifyLocationRequest): Promise<VerifyLocationResponse> {
  return request<VerifyLocationResponse>('/api/locations/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- 설정 화면 ----

// NOTE: 소셜 로그인이 아직 TEMP 바이패스라 SecureStore에 리프레시 토큰이 저장돼 있지 않다.
// 실제 로그인 연동(Phase 1) 전까지는 refreshToken이 null이라 BE 호출이 의미 있는 세션 종료는 아니지만,
// 로컬 토큰 clear는 지금부터 항상 수행해 Phase 1 연동 후 바로 정상 동작하도록 해둔다.
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await request<void>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    await clearTokens();
  }
}

export function withdrawAccount(): Promise<void> {
  return request<void>('/api/settings/me/withdraw', { method: 'DELETE' });
}

// ---- point (포인트) ----

export type PointBalance = {
  balance: number;
};

export function getMyPointBalance(): Promise<PointBalance> {
  return request<PointBalance>('/api/points/me');
}

// ---- shop (상점) ----
// 이슈 #8(백엔드 이슈 #64) — 백엔드 카테고리를 Figma "옷 갈아입히기" 5탭 구조(상의/하의/모자/신발/악세서리)에
// 맞춰 TOP/BOTTOM/HAT/SHOES/ACCESSORY 5종으로 재편했다. 기존 GLASSES/BAG/CARRIER는 ACCESSORY로 흡수.

export type ItemCategory = 'TOP' | 'BOTTOM' | 'HAT' | 'SHOES' | 'ACCESSORY';

export type ShopItem = {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: ItemCategory;
};

export function getShopItems(): Promise<ShopItem[]> {
  return request<ShopItem[]>('/api/shop/items');
}

export type MyShopItem = {
  id: number;
  name: string;
  imageUrl: string;
  category: ItemCategory;
  isEquipped: boolean;
  purchasedAt: string;
};

export function getMyShopItems(): Promise<MyShopItem[]> {
  return request<MyShopItem[]>('/api/shop/items/me');
}

export type PurchaseItemResponse = {
  itemId: number;
  itemName: string;
  remainingPoints: number;
};

// 실패 시 ApiError.status로 원인을 구분한다: 404(아이템 없음) / 409(이미 구매 또는 포인트 부족 —
// 어느 쪽인지는 ApiError.message로만 구분 가능, 둘 다 409라 status만으로는 못 가른다).
export function purchaseItem(itemId: number): Promise<PurchaseItemResponse> {
  return request<PurchaseItemResponse>(`/api/shop/items/${itemId}/purchase`, { method: 'POST' });
}

export type EquipItemResponse = {
  itemId: number;
  isEquipped: boolean;
};

// 토글 방식 — 미착용 상태면 착용, 착용 상태면 해제. 같은 카테고리 내 중복 착용 방지는 백엔드가
// 보장하므로(비관적 락 + DB 부분 유니크 인덱스) FE에서 추가로 막을 필요 없다.
// 실패 시 ApiError.status: 404(아이템 없음) / 403(미구매).
export function toggleEquipItem(itemId: number): Promise<EquipItemResponse> {
  return request<EquipItemResponse>(`/api/shop/items/${itemId}/equip`, { method: 'PATCH' });
}

export { ApiError };
