import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

type CoinBadgeProps = {
  amount: number;
};

export function CoinBadge({ amount }: CoinBadgeProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pill}>
        <Text style={styles.amount}>{amount}</Text>
      </View>
      <Image
        source={require('@/assets/images/main/coin.png')}
        style={styles.coin}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    justifyContent: 'center',
  },
  pill: {
    height: 34,
    minWidth: 74,
    borderRadius: 17,
    backgroundColor: '#F3F2ED',
    paddingLeft: 40,
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3A4039',
  },
  coin: {
    // [팀원 요청 1번: 동전 위치] 피그마(노드 757:1805)에서는 동전 아이콘이 알약 왼쪽으로
    // 자기 너비의 약 42%(≈18px/44px)만큼 튀어나와 겹치는 구조. -18/-6으로 1차 조정했지만
    // 실기로 보니 아직 부족하다는 성호님 피드백으로 좀 더 키움.
    position: 'absolute',
    left: -17,
    top: -1,
    width: 52,
    height: 52,
  },
});
