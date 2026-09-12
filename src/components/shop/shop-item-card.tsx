import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ShopItemStatus = 'buy' | 'equip' | 'equipped' | 'listed';

type ShopItemCardProps = {
  price: number;
  image: number | null;
  placeholderIcon?: React.ReactNode;
  status: ShopItemStatus;
  onPress: () => void;
};

export function ShopItemCard({ price, image, placeholderIcon, status, onPress }: ShopItemCardProps) {
  return (
    <Pressable style={styles.card} onPress={onPress} disabled={status === 'listed'}>
      <View style={styles.thumbnail}>
        {image ? <Image source={image} style={styles.image} contentFit="contain" /> : placeholderIcon}
      </View>

      {status === 'buy' ? (
        <View style={styles.pricePill}>
          <Image source={require('@/assets/images/main/coin.png')} style={styles.coinIcon} contentFit="contain" />
          <Text style={styles.priceText}>{price}</Text>
        </View>
      ) : (
        <View style={[styles.statusPill, status === 'equipped' && styles.statusPillEquipped]}>
          <Text style={[styles.statusText, status === 'equipped' && styles.statusTextEquipped]}>
            {status === 'listed' ? '소장중' : status === 'equipped' ? '착용중' : '착용'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '31%',
    aspectRatio: 115 / 155,
    backgroundColor: '#FFFEF5',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
    shadowColor: '#034500',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnail: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F7F4D6',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statusPill: {
    backgroundColor: '#DCEFC2',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  statusPillEquipped: {
    backgroundColor: '#699447',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A4039',
  },
  statusTextEquipped: {
    color: '#FFFFFF',
  },
});
