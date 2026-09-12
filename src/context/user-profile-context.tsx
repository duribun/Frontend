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

// NOTE: 현재는 메모리에만 저장한다 (AsyncStorage 등 영구 저장소 미도입).
// BE에 프로필 조회(GET) API가 아직 없어서, 로그인 세션이 유지되는 동안에만 값이 남아있는다.
// 재설치/재실행 시에는 다시 profile-setup을 거치거나, BE 조회 API가 생기면 그걸로 교체한다.
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
