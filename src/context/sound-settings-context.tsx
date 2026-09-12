import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// docs/ISSUE-BGM-구현.md 참고 — 앱 시작 시점부터 계속 반복 재생되는 배경음(BGM)과
// 마스코트 획득 시점에 재생되는 효과음. 별도 컨텍스트로 분리하지 않고 이 컨텍스트에
// 함께 두는 이유는, 재생기 볼륨이 아래 bgmVolume/sfxVolume 상태와 항상 동기화돼야
// 하기 때문이다(다른 컨텍스트로 쪼개면 결국 이 컨텍스트를 구독해야 해서 의미가 없다).
const BGM_SOURCE = require('@/assets/audio/bgm.mp3');
const MASCOT_ACQUIRED_SOURCE = require('@/assets/audio/mascot-acquired.mp3');

type SoundSettings = {
  bgmVolume: number; // 0~1
  sfxVolume: number; // 0~1
  vibrationEnabled: boolean;
};

type SoundSettingsContextValue = SoundSettings & {
  setBgmVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  setVibrationEnabled: (value: boolean) => void;
  // 마스코트를 새로 획득한 시점에 호출한다 (예: POST /api/locations/verify 응답의
  // newlyAcquiredMascots가 비어있지 않을 때). 현재 위치 인증 화면 자체는 미구현이라
  // 실제 호출 지점은 아직 없다 — 후속 "수집 기능 구현" 이슈에서 연결 예정.
  playMascotAcquiredSound: () => void;
};

const DEFAULT_SETTINGS: SoundSettings = {
  bgmVolume: 0.6,
  sfxVolume: 0.6,
  vibrationEnabled: true,
};

const SoundSettingsContext = createContext<SoundSettingsContextValue | null>(null);

// NOTE: bgmVolume/sfxVolume/vibrationEnabled는 여전히 메모리에만 저장한다
// (BE `GET/PATCH /api/settings/me`의 실제 스키마가 아직 확정되지 않아, docs/API_SETTING.md
// 2번 참고 — 서버 저장 연동은 보류 중, 앱을 재시작하면 값이 초기화된다).
// 실제 오디오 재생(BGM 자동 반복 재생 + 마스코트 획득 효과음)은 이 컨텍스트가 담당한다.
export function SoundSettingsProvider({ children }: PropsWithChildren) {
  const [bgmVolume, setBgmVolume] = useState(DEFAULT_SETTINGS.bgmVolume);
  const [sfxVolume, setSfxVolume] = useState(DEFAULT_SETTINGS.sfxVolume);
  const [vibrationEnabled, setVibrationEnabled] = useState(DEFAULT_SETTINGS.vibrationEnabled);

  const bgmPlayer = useAudioPlayer(BGM_SOURCE);
  const sfxPlayer = useAudioPlayer(MASCOT_ACQUIRED_SOURCE);

  // 앱 시작 시 1회: 기기 무음 스위치와 무관하게 BGM이 들리도록 오디오 모드를 설정하고
  // 반복 재생을 시작한다.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {
      // 오디오 모드 설정에 실패해도 앱 흐름을 막을 정도는 아니라 조용히 넘어간다
      // (기기에 따라 무음 모드에서 BGM이 들리지 않을 수 있다).
    });
    bgmPlayer.loop = true;
    bgmPlayer.volume = bgmVolume;
    bgmPlayer.play();
    // 최초 마운트 시 1회만 실행 (볼륨 반영은 아래 별도 effect가 담당).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 슬라이더로 볼륨이 바뀔 때마다 재생 중인 소리에 즉시 반영.
  useEffect(() => {
    bgmPlayer.volume = bgmVolume;
  }, [bgmPlayer, bgmVolume]);

  useEffect(() => {
    sfxPlayer.volume = sfxVolume;
  }, [sfxPlayer, sfxVolume]);

  // 앱이 백그라운드로 전환되면 BGM을 멈추고, 다시 포그라운드로 돌아오면 이어서 재생한다.
  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        bgmPlayer.play();
      } else {
        bgmPlayer.pause();
      }
    }
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playMascotAcquiredSound = useCallback(() => {
    sfxPlayer.seekTo(0);
    sfxPlayer.play();
  }, [sfxPlayer]);

  const value = useMemo(
    () => ({
      bgmVolume,
      sfxVolume,
      vibrationEnabled,
      setBgmVolume,
      setSfxVolume,
      setVibrationEnabled,
      playMascotAcquiredSound,
    }),
    [bgmVolume, sfxVolume, vibrationEnabled, playMascotAcquiredSound],
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
