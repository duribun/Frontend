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

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleSignUp() {
    // TODO: wire up to the backend auth API.
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <BackArrowIcon width={24} height={24} />
        </Pressable>

        <Text style={styles.title}>가입하기</Text>

        <View style={styles.fields}>
          <AuthTextField
            Icon={MailIcon}
            placeholder="아이디(이메일)을 입력해 주세요."
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
          <AuthTextField
            Icon={LockIcon}
            placeholder="비밀번호를 재입력해 주세요."
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />
        </View>

        <View style={styles.spacer} />

        <PillButton label="가입하기" onPress={handleSignUp} />
      </SafeAreaView>
    </AuthBackground>
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
    marginTop: 28,
    fontSize: 26,
    fontWeight: '700',
    color: '#FAFDFF',
  },
  fields: {
    marginTop: 28,
    gap: 12,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
