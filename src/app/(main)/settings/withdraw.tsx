import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';
import { ApiError, withdrawAccount } from '@/lib/api';

const RED = '#E96B5C';
const GREEN = '#699447';

// 안내 문구는 와이어프레임 placeholder 상태 그대로다 ("1. 탈퇴 내용으로 바꿔야 됨" 등 미완성 카피) —
// 실제 콘텐츠가 나오는 대로 교체한다 (docs/ISSUE-설정-구현.md 6번).
export default function WithdrawScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleWithdraw() {
    Alert.alert('회원 탈퇴', '정말 탈퇴하시겠어요? 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await withdrawAccount();
            router.replace('/(onboarding)/splash');
          } catch (error) {
            const message =
              error instanceof ApiError ? `탈퇴에 실패했어요. (${error.status})` : '탈퇴에 실패했어요.';
            Alert.alert('탈퇴 실패', message);
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsHeader title="회원 탈퇴" />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.paragraphTitle}>1. 탈퇴 내용으로 바꿔야 됨</Text>
            <Text style={styles.paragraph}>회사는 다음의 목적을 위하여 개인정보를 수집 및 이용합니다.</Text>
            <Text style={styles.bullet}>- 서비스 제공 및 문의</Text>
            <Text style={styles.bullet}>- 사용자 맞춤 서비스 제공</Text>
            <Text style={styles.bullet}>- 고객 문의 응대</Text>

            <Text style={styles.paragraphTitle}>2. 수집하는 개인정보 항목</Text>
            <Text style={styles.paragraph}>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</Text>
            <Text style={styles.bullet}>- 필수항목: 이메일, 닉네임, 위치 정보 등</Text>
            <Text style={styles.bullet}>- 선택항목: 프로필 사진 등</Text>

            <Text style={styles.paragraphTitle}>3. 개인정보 보유 및 이용 기간</Text>
            <Text style={styles.paragraph}>
              회사는 개인정보 수집 및 이용 목적이 달성되면 지체없이 해당 정보를 파기합니다.
            </Text>
          </View>

          <Pressable onPress={() => setAgreed((prev) => !prev)} style={styles.agreeRow} hitSlop={8}>
            <Ionicons
              name={agreed ? 'checkmark-circle' : 'ellipse-outline'}
              size={20}
              color={agreed ? GREEN : '#C4C4C4'}
            />
            <Text style={styles.agreeLabel}>안내 사항을 모두 확인하였으며, 이에 동의합니다.</Text>
          </Pressable>

          <Pressable
            onPress={handleWithdraw}
            disabled={!agreed || submitting}
            style={[styles.withdrawButton, (!agreed || submitting) && styles.withdrawButtonDisabled]}
          >
            <Text style={styles.withdrawButtonLabel}>탈퇴 하기</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonLabel}>취소</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1D3',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FEFEFE',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  paragraphTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginTop: 10,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 19,
    color: '#555555',
  },
  bullet: {
    fontSize: 13,
    lineHeight: 19,
    color: '#555555',
    marginLeft: 4,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
  },
  agreeLabel: {
    fontSize: 13,
    color: '#555555',
  },
  withdrawButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {
    opacity: 0.4,
  },
  withdrawButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FEFEFE',
  },
  cancelButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFEFEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555555',
  },
});
