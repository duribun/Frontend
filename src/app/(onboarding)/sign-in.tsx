import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackArrowIcon from '@/assets/icons/auth/back-arrow.svg';
import LockIcon from '@/assets/icons/auth/lock.svg';
import MailIcon from '@/assets/icons/auth/mail.svg';
import { AuthBackground } from '@/components/auth/auth-background';
import { AuthTextField } from '@/components/auth/auth-text-field';
import { PillButton } from '@/components/auth/pill-button';
import { SocialRow, type SocialProvider } from '@/components/auth/social-row';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saveId, setSaveId] = useState(false);

  function handleSignIn() {
    // TODO: wire up to the backend auth API.
  }

  function handleSocialSignIn(provider: SocialProvider) {
    // TODO: wire up to the backend social auth flow.
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <BackArrowIcon width={24} height={24} />
        </Pressable>

        <Text style={styles.title}>로그인</Text>

        <View style={styles.fields}>
          <AuthTextField
            Icon={MailIcon}
            placeholder="아이디(이메일)를 입력해 주세요."
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <AuthTextField
            Icon={LockIcon}
            placeholder="비밀번호를 입력해 주세요."
            value={password}
            onChangeText={setPassword}
            isPassword
          />
        </View>

        <View style={styles.optionsRow}>
          <Pressable style={styles.checkboxRow} onPress={() => setSaveId((prev) => !prev)} hitSlop={8}>
            <View style={[styles.checkbox, saveId && styles.checkboxChecked]} />
            <Text style={styles.optionText}>아이디 저장</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(onboarding)/reset-password')} hitSlop={8}>
            <Text style={styles.optionTextStrong}>비밀번호 재설정</Text>
          </Pressable>
        </View>

        <PillButton label="로그인" onPress={handleSignIn} />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>또는</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialSection}>
          <Text style={styles.socialTitle}>SNS 계정으로 로그인</Text>
          <SocialRow onSelect={handleSocialSignIn} />
        </View>

        <View style={styles.spacer} />

        <Text style={styles.footerText}>
          계정이 없으신가요?{' '}
          <Text style={styles.footerLink} onPress={() => router.push('/(onboarding)/sign-up')}>
            계정 만들기
          </Text>
        </Text>
      </SafeAreaView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: 21,
  },
  backButton: {
    marginTop: 12,
    width: 24,
    height: 24,
  },
  title: {
    marginTop: 28,
    fontSize: 26,
    fontWeight: '700',
    color: '#FAFDFF',
  },
  fields: {
    marginTop: 28,
    gap: 12,
  },
  optionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#EDEDED',
  },
  checkboxChecked: {
    backgroundColor: '#C5D775',
    borderColor: '#C5D775',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EDEDED',
  },
  optionTextStrong: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EDEDED',
  },
  dividerRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dividerText: {
    fontSize: 15,
    color: '#FAFDFF',
  },
  socialSection: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  socialTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  footerText: {
    alignSelf: 'center',
    marginBottom: 16,
    fontSize: 13,
    color: '#EDEDED',
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C5D775',
  },
});
