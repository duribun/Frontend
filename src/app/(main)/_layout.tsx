import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useUserProfile } from '@/context/user-profile-context';
import { getMyProfile } from '@/lib/api';

export default function MainLayout() {
  const { setProfile } = useUserProfile();

  // UserProfileContext는 메모리 초기값(전부 null)에서 시작해서, 온보딩(profile-setup)에서
  // 직접 setProfile()을 호출해줄 때만 값이 채워진다. 재로그인(재로그인 시 profile-setup을
  // 건너뛰고 바로 이 (main) 그룹으로 옴)이나 앱 재시작 시에는 이 값이 채워지지 않아 gender가
  // 계속 null로 남고, 그걸 쓰는 화면들(메인 캐릭터/헤더 프로필 사진)이 전부 기본값인
  // 'FEMALE'로 고정 표시되는 문제가 있었다. (main) 그룹에 진입할 때마다 BE의 실제 프로필로
  // 한 번 동기화해서 이 문제를 근본적으로 해결한다 — 실패해도(네트워크 등) 화면을 막지 않고
  // 조용히 넘어간다(이전 값 유지 또는 기존 기본값 fallback).
  useEffect(() => {
    let cancelled = false;
    getMyProfile()
      .then((profile) => {
        if (cancelled) return;
        setProfile({ nickname: profile.nickname, birthDate: profile.birthDate, gender: profile.gender });
      })
      .catch(() => {
        // no-op
      });
    return () => {
      cancelled = true;
    };
  }, [setProfile]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="map" />
      <Stack.Screen name="collection" />
      <Stack.Screen name="collection-mascot" />
      <Stack.Screen name="collection-stamp" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="record/index" />
      <Stack.Screen name="record/write" />
      <Stack.Screen name="record/[id]" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/login-account" />
      <Stack.Screen name="settings/sound" />
      <Stack.Screen name="settings/location-permission" />
      <Stack.Screen name="settings/withdraw" />
    </Stack>
  );
}
