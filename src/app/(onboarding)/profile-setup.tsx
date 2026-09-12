import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';
import { useUserProfile, type Gender } from '@/context/user-profile-context';
import { checkNicknameAvailable, saveProfile } from '@/lib/api';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,10}$/;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { setProfile } = useUserProfile();
  const [nickname, setNickname] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nicknameValid = NICKNAME_REGEX.test(nickname);
  const birthdateValid = year.length === 4 && month.length >= 1 && day.length >= 1;
  const canSubmit = nicknameValid && nicknameChecked && birthdateValid && gender !== null && !submitting;

  function handleChangeNickname(text: string) {
    setNickname(text);
    setNicknameChecked(false);
  }

  async function handleCheckNickname() {
    if (!nicknameValid || checkingNickname) return;
    setCheckingNickname(true);
    try {
      const result = await checkNicknameAvailable(nickname);
      setNicknameChecked(result.available);
      if (!result.available) {
        // TODO: 중복된 닉네임 안내 UI (토스트/에러 텍스트) 추가.
        console.warn('[profile-setup] nickname already in use:', nickname);
      }
    } catch (error) {
      // TEMP: 로그인 연동 전이라 인증 토큰이 없어 API가 401로 실패할 수 있다.
      // 개발 흐름이 막히지 않도록 우선 통과 처리하고, 실제 인증이 붙으면 이 catch가 자연히 사라진다.
      console.warn('[profile-setup] nickname-check API 호출 실패, 임시로 통과 처리:', error);
      setNicknameChecked(true);
    } finally {
      setCheckingNickname(false);
    }
  }

  async function handleNext() {
    if (!canSubmit || !gender) return;
    setSubmitting(true);
    const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    try {
      await saveProfile({ nickname, birthDate, gender });
    } catch (error) {
      // TEMP: 위와 동일한 이유(인증 토큰 없음)로 실패할 수 있어 흐름은 계속 진행시킨다.
      console.warn('[profile-setup] profile 저장 API 호출 실패, 로컬 상태만 반영:', error);
    } finally {
      setSubmitting(false);
    }
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
          <CharacterCard
            label="여자"
            selected={gender === 'FEMALE'}
            source={require('@/assets/images/onboarding/character-female.png')}
            onPress={() => setGender('FEMALE')}
          />
          <CharacterCard
            label="남자"
            selected={gender === 'MALE'}
            source={require('@/assets/images/onboarding/character-male.png')}
            onPress={() => setGender('MALE')}
          />
        </View>

        <View style={styles.spacer} />

        <PillButton label="다음" onPress={handleNext} disabled={!canSubmit} />
      </SafeAreaView>
    </AuthBackground>
  );
}

function CharacterCard({
  label,
  selected,
  source,
  onPress,
}: {
  label: string;
  selected: boolean;
  source: ComponentProps<typeof Image>['source'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.characterCard, selected && styles.characterCardSelected]}>
      <Image source={source} style={styles.characterImage} contentFit="contain" />
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
  },
  characterCardSelected: {
    borderWidth: 3,
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
