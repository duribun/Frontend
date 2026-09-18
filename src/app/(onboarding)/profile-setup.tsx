import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';
import { useUserProfile, type Gender } from '@/context/user-profile-context';
import { ApiError, checkNicknameAvailable, saveProfile } from '@/lib/api';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { setProfile } = useUserProfile();
  const [nickname, setNickname] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nicknameValid = NICKNAME_REGEX.test(nickname);
  const birthdateValid = year.length === 4 && month.length >= 1 && day.length >= 1;
  const canSubmit = nicknameValid && nicknameChecked && birthdateValid && gender !== null && !submitting;

  function handleChangeNickname(text: string) {
    setNickname(text);
    setNicknameChecked(false);
    setNicknameError(null);
  }

  async function handleCheckNickname() {
    if (!nicknameValid || checkingNickname) return;
    setCheckingNickname(true);
    setNicknameError(null);
    try {
      const result = await checkNicknameAvailable(nickname);
      setNicknameChecked(result.available);
      if (!result.available) {
        setNicknameError('이미 사용 중인 닉네임이에요.');
      }
    } catch (error) {
      // 로그인(Phase 1) 연동 완료 후에는 401이 아니라 400(형식 위반)/네트워크 오류만 실제로 발생해야 한다.
      // 예전처럼 실패를 통과 처리하면 잘못된 닉네임도 넘어가버리니, 확인 실패로 명확히 남긴다.
      setNicknameChecked(false);
      setNicknameError('닉네임 확인에 실패했어요. 다시 시도해주세요.');
      console.error('[profile-setup] nickname-check 실패', error);
    } finally {
      setCheckingNickname(false);
    }
  }

  async function handleNext() {
    if (!canSubmit || !gender) return;
    setSubmitting(true);
    setSubmitError(null);
    const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    try {
      await saveProfile({ nickname, birthDate, gender });
    } catch (error) {
      // 409 = 저장 시점에 닉네임이 이미 다른 사람에게 선점됨(중복확인 이후 레이스 컨디션) — 재확인 요구.
      if (error instanceof ApiError && error.status === 409) {
        setNicknameChecked(false);
        setSubmitError('방금 다른 사람이 선점한 닉네임이에요. 닉네임을 다시 확인해주세요.');
      } else {
        setSubmitError('프로필 저장에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
      console.error('[profile-setup] profile 저장 실패', error);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    setProfile({ nickname, birthDate, gender });
    router.push('/(onboarding)/location-permission');
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')} overlay>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>닉네임을 입력해주세요</Text>
        <Text style={styles.subtitle}>2~10자, 한글/영문/숫자만 가능</Text>

        <View style={styles.nicknameRow}>
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={handleChangeNickname}
            placeholder="닉네임 입력"
            placeholderTextColor="#828282"
            maxLength={10}
            autoCapitalize="none"
          />
          <Pressable
            onPress={handleCheckNickname}
            disabled={!nicknameValid || checkingNickname}
            style={[styles.checkButton, nicknameValid && styles.checkButtonActive]}>
            <Text style={[styles.checkButtonLabel, nicknameValid && styles.checkButtonLabelActive]}>
              {checkingNickname ? '확인 중...' : nicknameChecked ? '확인 완료' : '중복확인'}
            </Text>
          </Pressable>
        </View>
        {nicknameError && <Text style={styles.errorText}>{nicknameError}</Text>}

        <Text style={styles.sectionLabel}>생년월일</Text>
        <View style={styles.birthRow}>
          <TextInput
            style={styles.birthInput}
            value={year}
            onChangeText={(text) => setYear(text.replace(/[^0-9]/g, '').slice(0, 4))}
            placeholder="년"
            placeholderTextColor="#828282"
            keyboardType="number-pad"
            maxLength={4}
          />
          <TextInput
            style={styles.birthInput}
            value={month}
            onChangeText={(text) => setMonth(text.replace(/[^0-9]/g, '').slice(0, 2))}
            placeholder="월"
            placeholderTextColor="#828282"
            keyboardType="number-pad"
            maxLength={2}
          />
          <TextInput
            style={styles.birthInput}
            value={day}
            onChangeText={(text) => setDay(text.replace(/[^0-9]/g, '').slice(0, 2))}
            placeholder="일"
            placeholderTextColor="#828282"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>

        <Text style={styles.sectionLabel}>성별</Text>
        <View style={styles.genderRow}>
          {/* key에 selected 값을 넣어서, 성별을 전환할 때마다 이 카드가 완전히 언마운트→새로
              마운트되게 강제한다. recyclingKey만으로는 안드로이드에서 이미지가 계속 사라지는
              문제가 해결되지 않아(재현 확인됨), props만 바뀌는 게 아니라 네이티브 Image 뷰 자체를
              새로 만들어서 안드로이드 쪽의 오래된 비트맵/레이아웃 캐시 문제를 원천적으로 피한다. */}
          <CharacterCard
            key={`female-${gender === 'FEMALE'}`}
            label="여자"
            selected={gender === 'FEMALE'}
            source={require('@/assets/images/onboarding/character-female.png')}
            recyclingKey="character-female"
            onPress={() => setGender('FEMALE')}
          />
          <CharacterCard
            key={`male-${gender === 'MALE'}`}
            label="남자"
            selected={gender === 'MALE'}
            source={require('@/assets/images/onboarding/character-male.png')}
            recyclingKey="character-male"
            onPress={() => setGender('MALE')}
          />
        </View>

        <View style={styles.spacer} />

        {submitError && <Text style={styles.errorText}>{submitError}</Text>}
        <PillButton label={submitting ? '저장 중...' : '다음'} onPress={handleNext} disabled={!canSubmit} />
      </SafeAreaView>
    </AuthBackground>
  );
}

function CharacterCard({
  label,
  selected,
  source,
  recyclingKey,
  onPress,
}: {
  label: string;
  selected: boolean;
  source: ComponentProps<typeof Image>['source'];
  recyclingKey: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.characterCard, selected && styles.characterCardSelected]}>
      {/* recyclingKey: 안드로이드에서 expo-image가 뷰를 재사용(recycle)하는 과정에서
          두 카드의 로컬 캐릭터 이미지가 뒤섞여, 성별을 전환하면 방금 선택 해제된 카드의
          이미지가 빈 화면으로 보이던 버그(ISSUE-성별캐릭터-프로필이미지버그.md 1번)의 수정.
          각 소스마다 고유한 키를 줘서 재사용 시 캐시가 섞이지 않도록 한다. */}
      <Image source={source} style={styles.characterImage} contentFit="contain" recyclingKey={recyclingKey} />
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 21,
    paddingBottom: 24,
  },
  title: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: '#FAFDFF',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#EDEDED',
  },
  nicknameRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nicknameInput: {
    flex: 1,
    height: 53,
    borderRadius: 15,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#333333',
  },
  checkButton: {
    height: 53,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActive: {
    backgroundColor: '#FEFEFE',
  },
  checkButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8A8A',
  },
  checkButtonLabelActive: {
    color: '#4B7F3F',
  },
  sectionLabel: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  birthRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  birthInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  genderRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 11,
  },
  characterCard: {
    flex: 1,
    height: 190,
    borderRadius: 26,
    backgroundColor: 'rgba(251,255,251,0.92)',
    overflow: 'hidden',
    padding: 10,
    // 선택 시에만 borderWidth가 0→3으로 붙으면 카드 크기가 바뀌면서 리레이아웃이 발생해,
    // 이게 안드로이드에서 이미지가 사라지는 문제의 원인 중 하나로 보인다. 항상 3px 테두리를
    // 깔아두고(투명) 선택 시엔 색만 바꿔서, 선택 상태가 바뀌어도 카드 크기 자체는 고정되게 한다.
    borderWidth: 3,
    borderColor: 'transparent',
  },
  characterCardSelected: {
    borderColor: '#4A7CD6',
  },
  characterImage: {
    flex: 1,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A7CD6',
    borderWidth: 2,
    borderColor: '#FEFEFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
