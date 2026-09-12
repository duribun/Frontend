import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type SoundSettings = {
  bgmVolume: number; // 0~1
  sfxVolume: number; // 0~1
  vibrationEnabled: boolean;
};

type SoundSettingsContextValue = SoundSettings & {
  setBgmVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  setVibrationEnabled: (value: boolean) => void;
};

const DEFAULT_SETTINGS: SoundSettings = {
  bgmVolume: 0.6,
  sfxVolume: 0.6,
  vibrationEnabled: true,
};

const SoundSettingsContext = createContext<SoundSettingsContextValue | null>(null);

// NOTE: 현재는 메모리에만 저장한다 (user-profile-context.tsx와 동일한 방식).
// BE `GET/PATCH /api/settings/me`의 실제 스키마가 아직 확정되지 않아(docs/API_SETTING.md 2번 참고)
// 서버 저장 연동은 보류 중 — 앱을 재시작하면 값이 초기화된다. 실제 BGM/효과음 재생 연결도 아직 없다.
export function SoundSettingsProvider({ children }: PropsWithChildren) {
  const [bgmVolume, setBgmVolume] = useState(DEFAULT_SETTINGS.bgmVolume);
  const [sfxVolume, setSfxVolume] = useState(DEFAULT_SETTINGS.sfxVolume);
  const [vibrationEnabled, setVibrationEnabled] = useState(DEFAULT_SETTINGS.vibrationEnabled);

  const value = useMemo(
    () => ({ bgmVolume, sfxVolume, vibrationEnabled, setBgmVolume, setSfxVolume, setVibrationEnabled }),
    [bgmVolume, sfxVolume, vibrationEnabled],
  );

  return <SoundSettingsContext.Provider value={value}>{children}</SoundSettingsContext.Provider>;
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    throw new Error('useSoundSettings must be used within a SoundSettingsProvider');
  }
  return context;
}
