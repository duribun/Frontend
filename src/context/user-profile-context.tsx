import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type Gender = 'FEMALE' | 'MALE';

type UserProfile = {
  nickname: string | null;
  birthDate: string | null;
  gender: Gender | null;
};

type UserProfileContextValue = {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  // 최초 로그인 온보딩(위치 인증)을 막 마치고 메인에 처음 진입하는 순간인지 여부.
  // 메인 화면이 이 값을 보고 온보딩 가이드를 1회 띄운 뒤 바로 false로 되돌린다.
  // TODO: BE의 isNewUser + 온보딩 가이드 확인 여부가 영구 저장(AsyncStorage 등)되면 이 임시 플래그를 대체한다.
  shouldShowGuide: boolean;
  setShouldShowGuide: (value: boolean) => void;
};

const EMPTY_PROFILE: UserProfile = { nickname: null, birthDate: null, gender: null };

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

// NOTE: 이 값 자체는 메모리에만 저장된다 (AsyncStorage 등 영구 저장소 미도입) — 하지만 항상 최신은
// (main)/_layout.tsx가 앱 진입/재로그인마다 GET /api/users/me로 다시 채워준다(재설치/재시작 시에도 동일).
// 여기 프로바이더는 그 값을 들고 있는 저장소 역할만 하고, 실제 조회는 (main)/_layout.tsx가 담당한다.
export function UserProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [shouldShowGuide, setShouldShowGuide] = useState(false);

  const value = useMemo(
    () => ({ profile, setProfile, shouldShowGuide, setShouldShowGuide }),
    [profile, shouldShowGuide],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
