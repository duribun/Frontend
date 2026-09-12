import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';
import AccessoryInactive from '@/assets/icons/shop/tab-accessory-inactive.svg';
import BottomInactive from '@/assets/icons/shop/tab-bottom-inactive.svg';
import HatInactive from '@/assets/icons/shop/tab-hat-inactive.svg';
import ShoesInactive from '@/assets/icons/shop/tab-shoes-inactive.svg';
import TopInactive from '@/assets/icons/shop/tab-top-inactive.svg';
import Wall from '@/assets/icons/shop/wall.svg';
import WallStripes from '@/assets/icons/shop/wall-stripes.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import { ShopItemCard, type ShopItemStatus } from '@/components/shop/shop-item-card';
import { ShopTabBar, type ShopTabKey } from '@/components/shop/shop-tab-bar';

type ShopCategory = 'top' | 'bottom' | 'hat' | 'shoes' | 'accessory';

type ShopItem = {
  id: string;
  category: ShopCategory;
  name: string;
  price: number;
  image: number | null;
  liked?: boolean;
};

const CATEGORY_PLACEHOLDER_ICON: Record<ShopCategory, React.ComponentType<{ width?: number; height?: number }>> = {
  top: TopInactive,
  bottom: BottomInactive,
  hat: HatInactive,
  shoes: ShoesInactive,
  accessory: AccessoryInactive,
};

// TODO: 백엔드 shop.category enum(GLASSES/BAG/CARRIER/HAT)이 이 Figma 카테고리
// (top/bottom/hat/shoes/accessory)와 개념 자체가 달라 별도 이슈로 트래킹 중.
// 카테고리 매핑이 정리되면 GET /api/shop/items, GET /api/shop/items/me로 교체.
const MOCK_ITEMS: ShopItem[] = [
  {
    id: 'top-green',
    category: 'top',
    name: '그린 라운드넥 티셔츠',
    price: 30,
    image: require('@/assets/images/shop/item-top-green.png'),
  },
  {
    id: 'top-shirt',
    category: 'top',
    name: '스트라이프 셔츠',
    price: 40,
    image: require('@/assets/images/shop/item-top-striped-shirt.png'),
    liked: true,
  },
  {
    id: 'top-hoodie',
    category: 'top',
    name: '옐로우 후드티',
    price: 40,
    image: require('@/assets/images/shop/item-top-yellow-hoodie.png'),
  },
  {
    id: 'top-blue-fleece',
    category: 'top',
    name: '블루 후리스 자켓',
    price: 70,
    image: require('@/assets/images/shop/item-top-blue-fleece.png'),
  },
  {
    id: 'top-green-fleece',
    category: 'top',
    name: '그린 조끼',
    price: 70,
    image: require('@/assets/images/shop/item-top-green-fleece.png'),
    liked: true,
  },
  // 하의/모자/신발/악세서리는 Figma에서 실제 아이템 아트를 아직 못 뽑아서 카테고리 아이콘으로 대체.
  { id: 'bottom-1', category: 'bottom', name: '데님 반바지', price: 30, image: null },
  { id: 'bottom-2', category: 'bottom', name: '카고 팬츠', price: 50, image: null, liked: true },
  { id: 'hat-1', category: 'hat', name: '버킷 햇', price: 35, image: null },
  { id: 'hat-2', category: 'hat', name: '캡 모자', price: 45, image: null },
  { id: 'shoes-1', category: 'shoes', name: '캔버스 스니커즈', price: 55, image: null },
  { id: 'shoes-2', category: 'shoes', name: '샌들', price: 40, image: null, liked: true },
  { id: 'accessory-1', category: 'accessory', name: '선글라스', price: 60, image: null },
  { id: 'accessory-2', category: 'accessory', name: '크로스백', price: 65, image: null },
];

const STARTING_COINS = 1200;

export default function ShopScreen() {
  const router = useRouter();
  const [coins, setCoins] = useState(STARTING_COINS);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(() => new Set(['top-green']));
  const [equippedByCategory, setEquippedByCategory] = useState<Partial<Record<ShopCategory, string>>>({
    top: 'top-green',
  });
  const [activeTab, setActiveTab] = useState<ShopTabKey>('top');

  const visibleItems = useMemo(() => {
    if (activeTab === 'liked') return MOCK_ITEMS.filter((item) => item.liked);
    if (activeTab === 'owned') return MOCK_ITEMS.filter((item) => ownedIds.has(item.id));
    return MOCK_ITEMS.filter((item) => item.category === activeTab);
  }, [activeTab, ownedIds]);

  function getStatus(item: ShopItem): ShopItemStatus {
    if (activeTab === 'owned') return 'listed';
    if (!ownedIds.has(item.id)) return 'buy';
    return equippedByCategory[item.category] === item.id ? 'equipped' : 'equip';
  }

  function handleItemPress(item: ShopItem) {
    if (activeTab === 'owned') return;

    if (!ownedIds.has(item.id)) {
      if (coins < item.price) return; // TODO: 포인트 부족 피드백 (백엔드는 409 반환)
      setCoins((prev) => prev - item.price);
      setOwnedIds((prev) => new Set(prev).add(item.id));
      // TODO: wire up to POST /api/shop/items/{itemId}/purchase
      return;
    }

    setEquippedByCategory((prev) => {
      const next = { ...prev };
      if (prev[item.category] === item.id) {
        delete next[item.category];
      } else {
        next[item.category] = item.id; // 같은 카테고리 내 기존 착용 아이템 자동 해제
      }
      // TODO: wire up to PATCH /api/shop/items/{itemId}/equip
      return next;
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.wallpaper} pointerEvents="none">
        <Wall width="100%" height="100%" />
        <View style={StyleSheet.absoluteFill}>
          <WallStripes width="100%" height="100%" />
        </View>
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ChevronLeftIcon width={28} height={28} />
          </Pressable>
          <CoinBadge amount={coins} />
        </View>

        <View style={styles.characterStage} pointerEvents="none">
          <Image
            source={require('@/assets/images/main/character-shadow.png')}
            style={styles.characterShadow}
            contentFit="contain"
          />
          <Image
            source={require('@/assets/images/main/character-girl.png')}
            style={styles.character}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>

      <View style={styles.panel}>
        <View style={styles.tabBarWrap}>
          <ShopTabBar active={activeTab} onChange={setActiveTab} />
        </View>

        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {visibleItems.map((item) => (
            <ShopItemCard
              key={item.id}
              price={item.price}
              image={item.image}
              placeholderIcon={
                item.image ? undefined : (() => {
                  const Icon = CATEGORY_PLACEHOLDER_ICON[item.category];
                  return <Icon width={40} height={40} />;
                })()
              }
              status={getStatus(item)}
              onPress={() => handleItemPress(item)}
            />
          ))}
          {visibleItems.length === 0 && <Text style={styles.emptyText}>아직 아이템이 없어요.</Text>}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFADC',
  },
  wallpaper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '46%',
  },
  safeArea: {
    paddingHorizontal: 18,
  },
  headerRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  characterStage: {
    marginTop: 8,
    alignItems: 'center',
  },
  characterShadow: {
    position: 'absolute',
    bottom: '-6%',
    width: '80%',
    aspectRatio: 305 / 89,
    alignSelf: 'center',
  },
  character: {
    width: '38%',
    aspectRatio: 152 / 322,
  },
  panel: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: '52%',
    bottom: 14,
    backgroundColor: '#EAF5D1',
    borderRadius: 25,
    overflow: 'hidden',
  },
  tabBarWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  emptyText: {
    width: '100%',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#7A8272',
  },
});
