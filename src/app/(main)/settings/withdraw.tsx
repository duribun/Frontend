import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsHeader } from '@/components/settings/settings-header';
import { ApiError, withdrawAccount } from '@/lib/api';

const RED = '#E96B5C';
const GREEN = '#699447';

// 성호님 피드백: 안내 문구가 와이어프레임 placeholder 그대로 남아있었다 ("1. 탈퇴 내용으로 바꿔야 됨"
// 이라는 제목 그 자체, 그 아래 내용도 실제로는 "개인정보 수집·이용 목적" 안내(회원가입 약관에나 맞는
// 내용)라 회원 탈퇴 화면과 무관했다. 실제 탈퇴 시 동작(withdrawAccount → 계정 삭제, 복구 불가)에 맞는
// 카피로 바꿨다. 다만 법무/정책 확정 문구는 아니라서, 정식 카피가 나오면 교체 필요 (docs/ISSUE-설정-구현.md
// 6번 참고).
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
            <Text style={styles.paragraphTitle}>1. 탈퇴 시 안내 사항</Text>
            <Text style={styles.paragraph}>
              회원 탈퇴 시 계정 및 서비스 이용 정보가 모두 삭제되며, 탈퇴 후에는 삭제된 정보를 복구할 수
              없습니다.
            </Text>
            <Text style={styles.bullet}>- 탈퇴는 신중하게 결정해 주세요.</Text>
            <Text style={styles.bullet}>- 진행 중인 이벤트·혜택이 있다면 탈퇴 전 확인해 주세요.</Text>

            <Text style={styles.paragraphTitle}>2. 삭제되는 정보</Text>
            <Text style={styles.paragraph}>탈퇴 시 아래 정보가 함께 삭제됩니다.</Text>
            <Text style={styles.bullet}>- 닉네임, 이메일 등 계정 정보</Text>
            <Text style={styles.bullet}>- 보유 캐릭터, 재화, 아이템 등 게임 데이터</Text>
            <Text style={styles.bullet}>- 지역 방문 인증 기록, 기록 사진 등 콘텐츠</Text>

            <Text style={styles.paragraphTitle}>3. 재가입 안내</Text>
            <Text style={styles.paragraph}>
              탈퇴 후에도 동일한 소셜 계정으로 다시 가입할 수 있지만, 이전에 이용하던 데이터는 복구되지
              않고 새로운 계정으로 시작됩니다.
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
    // [팀원 요청 2번: 배경 색상(노란색 -> 흰색 배경에 칸은 회색 테두리)] 노란 배경 -> 흰색.
    backgroundColor: '#FEFEFE',
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
