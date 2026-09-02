import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackArrowIcon from '@/assets/icons/auth/back-arrow.svg';
import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';

type Gender = 'female' | 'male';

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,6}$/;

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const nicknameValid = NICKNAME_REGEX.test(nickname);
  const birthdateValid = year.length === 4 && month.length >= 1 && day.length >= 1;
  const canSubmit = nicknameValid && nicknameChecked && birthdateValid && gender !== null;

  function handleChangeNickname(text: string) {
    setNickname(text);
    setNicknameChecked(false);
  }

  function handleCheckNickname() {
    if (!nicknameValid) return;
    // TODO: BE에 닉네임 중복확인 API가 아직 없음 (docs/API_SPEC.md 참고). 우선 항상 통과 처리.
    setNicknameChecked(true);
  }

  function handleNext() {
    if (!canSubmit) return;
    // TODO: BE에 프로필(닉네임/생년월일/캐릭터) 저장 API가 아직 없음. API 나오면 여기서 호출.
    router.push('/(onboarding)/location-permission');
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')} overlay>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <BackArrowIcon width={24} height={24} />
        </Pressable>

        <Text style={styles.title}>닉네임을 입력해주세요</Text>
        <Text style={styles.subtitle}>2~6자, 한글/영문/숫자만 가능</Text>

        <View style={styles.nicknameRow}>
          <TextInput
            style={styles.nicknameInput}
            value={nickname}
            onChangeText={handleChangeNickname}
            placeholder="닉네임 입력"
            placeholderTextColor="#828282"
            maxLength={6}
            autoCapitalize="none"
          />
          <Pressable
            onPress={handleCheckNickname}
            disabled={!nicknameValid}
            style={[styles.checkButton, nicknameValid && styles.checkButtonActive]}>
            <Text style={[styles.checkButtonLabel, nicknameValid && styles.checkButtonLabelActive]}>
              {nicknameChecked ? '확인 완료' : '중복확인'}
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
            selected={gender === 'female'}
            source={require('@/assets/images/onboarding/character-female.png')}
            onPress={() => setGender('female')}
          />
          <CharacterCard
            label="남자"
            selected={gender === 'male'}
            source={require('@/assets/images/onboarding/character-male.png')}
            onPress={() => setGender('male')}
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
  backButton: {
    marginTop: 12,
    width: 24,
    height: 24,
  },
  title: {
    marginTop: 20,
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
