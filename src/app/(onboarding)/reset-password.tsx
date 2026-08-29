import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackArrowIcon from '@/assets/icons/auth/back-arrow.svg';
import ClearIcon from '@/assets/icons/auth/clear.svg';
import { AuthBackground } from '@/components/auth/auth-background';
import { PillButton } from '@/components/auth/pill-button';
import { passwordMeetsAllRequirements, PasswordRequirements } from '@/components/auth/password-requirements';

const CODE_TIMEOUT_SECONDS = 180;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type FieldRowProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  rightSlot?: React.ReactNode;
};

function FieldRow({ value, onChangeText, placeholder, secureTextEntry, keyboardType, rightSlot }: FieldRowProps) {
  return (
    <View style={styles.field}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#828282"
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        keyboardType={keyboardType}
      />
      {rightSlot}
      {!rightSlot && value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <ClearIcon width={24} height={24} />
        </Pressable>
      )}
    </View>
  );
}

function MiniConfirmButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!active} style={[styles.miniButton, active && styles.miniButtonActive]}>
      <Text style={[styles.miniButtonLabel, active && styles.miniButtonLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_TIMEOUT_SECONDS);
  const [code, setCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (!codeSent || codeVerified) return;
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeSent, codeVerified, secondsLeft]);

  function handleSendCode() {
    setCodeSent(true);
    setSecondsLeft(CODE_TIMEOUT_SECONDS);
    // TODO: wire up to the backend to send a verification email.
  }

  function handleVerifyCode() {
    setCodeVerified(true);
    // TODO: wire up to the backend to verify the code.
  }

  const passwordValid = passwordMeetsAllRequirements(newPassword);
  const canSubmit = passwordValid && newPassword === confirmPassword && confirmPassword.length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setSuccessVisible(true);
    // TODO: wire up to the backend to change the password.
  }

  return (
    <AuthBackground source={require('@/assets/images/onboarding/scenic-bg.jpg')}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <BackArrowIcon width={24} height={24} />
        </Pressable>

        <Text style={styles.title}>아이디 인증</Text>

        <View style={styles.fields}>
          <FieldRow
            value={email}
            onChangeText={setEmail}
            placeholder="아이디(이메일)을 입력해 주세요."
            keyboardType="email-address"
            rightSlot={<MiniConfirmButton label="확인" active={email.length > 3} onPress={handleSendCode} />}
          />
          {codeSent && (
            <FieldRow
              value={code}
              onChangeText={setCode}
              placeholder="인증번호 6자리를 입력해 주세요."
              keyboardType="number-pad"
              rightSlot={
                codeVerified ? (
                  <Text style={styles.timerText}>완료</Text>
                ) : (
                  <>
                    <Text style={styles.timerText}>{formatCountdown(secondsLeft)}</Text>
                    <MiniConfirmButton label="확인" active={code.length === 6} onPress={handleVerifyCode} />
                  </>
                )
              }
            />
          )}
        </View>

        {codeVerified && (
          <>
            <View style={styles.divider} />

            <Text style={styles.title}>신규 비밀번호 설정</Text>

            <View style={styles.fields}>
              <View style={styles.fieldGroup}>
                <FieldRow
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="새 비밀번호를 입력해 주세요."
                  secureTextEntry
                />
                <PasswordRequirements value={newPassword} />
              </View>
              <FieldRow
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="비밀번호를 재입력해 주세요."
                secureTextEntry
              />
            </View>
          </>
        )}

        <View style={styles.spacer} />

        {codeVerified && <PillButton label="변경하기" onPress={handleSubmit} disabled={!canSubmit} />}
      </SafeAreaView>

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>비밀번호 변경 완료!</Text>
            <Text style={styles.modalSubtitle}>새 비밀번호로 로그인해 주세요.</Text>
            <PillButton label="로그인 화면으로 이동" onPress={() => router.replace('/(onboarding)/sign-in')} />
          </View>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#FAFDFF',
  },
  fields: {
    marginTop: 20,
    gap: 12,
  },
  fieldGroup: {
    gap: 8,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 53,
    borderRadius: 15,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  timerText: {
    fontSize: 13,
    color: '#828282',
  },
  miniButton: {
    width: 53,
    height: 33,
    borderRadius: 8,
    backgroundColor: '#EDEDED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniButtonActive: {
    backgroundColor: '#C5D775',
  },
  miniButtonLabel: {
    fontSize: 13,
    color: '#828282',
  },
  miniButtonLabelActive: {
    color: '#FEFEFE',
    fontWeight: '600',
  },
  divider: {
    marginTop: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});
