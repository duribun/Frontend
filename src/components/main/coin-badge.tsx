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
    position: 'absolute',
    left: -4,
    top: -4,
    width: 44,
    height: 44,
  },
});
