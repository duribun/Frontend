import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import {
  ApiError,
  getMyPointBalance,
  getMyShopItems,
  getShopItems,
  purchaseItem,
  toggleEquipItem,
  type ItemCategory,
  type MyShopItem,
  type ShopItem as ApiShopItem,
} from '@/lib/api';

type ShopCategory = 'top' | 'bottom' | 'hat' | 'shoes' | 'accessory';

// 백엔드 ItemCategory(TOP/BOTTOM/HAT/SHOES/ACCESSORY)와 1:1 대응 (이슈 #8 / 백엔드 이슈 #64에서 정리 완료).
const CATEGORY_TO_TAB: Record<ItemCategory, ShopCategory> = {
  TOP: 'top',
  BOTTOM: 'bottom',
  HAT: 'hat',
  SHOES: 'shoes',
  ACCESSORY: 'accessory',
};

const CATEGORY_PLACEHOLDER_ICON: Record<ShopCategory, React.ComponentType<{ width?: number; height?: number }>> = {
  top: TopInactive,
  bottom: BottomInactive,
  hat: HatInactive,
  shoes: ShoesInactive,
  accessory: AccessoryInactive,
};

type Item = {
  id: number;
  tab: ShopCategory;
  name: string;
  price: number;
  imageUrl: string | null;
  owned: boolean;
  equipped: boolean;
};

function mergeItems(catalog: ApiShopItem[], mine: MyShopItem[]): Item[] {
  const mineById = new Map(mine.map((item) => [item.id, item]));
  return catalog.map((item) => {
    const owned = mineById.get(item.id);
    return {
      id: item.id,
      tab: CATEGORY_TO_TAB[item.category],
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || null,
      owned: owned != null,
      equipped: owned?.isEquipped ?? false,
    };
  });
}

export default function ShopScreen() {
  const router = useRouter();
  const [coins, setCoins] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ShopTabKey>('top');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [catalog, mine, balance] = await Promise.all([getShopItems(), getMyShopItems(), getMyPointBalance()]);
        if (!cancelled) {
          setItems(mergeItems(catalog, mine));
          setCoins(balance.balance);
        }
      } catch {
        if (!cancelled) {
          setError('상점 정보를 불러오지 못했어요.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(() => {
    if (activeTab === 'liked') return []; // 백엔드에 찜(liked) 개념이 없어 항상 빈 상태.
    if (activeTab === 'owned') return items.filter((item) => item.owned);
    return items.filter((item) => item.tab === activeTab);
  }, [activeTab, items]);

  function getStatus(item: Item): ShopItemStatus {
    if (activeTab === 'owned') return 'listed';
    if (!item.owned) return 'buy';
    return item.equipped ? 'equipped' : 'equip';
  }

  async function handleItemPress(item: Item) {
    if (activeTab === 'owned') return;
    setActionError(null);

    if (!item.owned) {
      try {
        const result = await purchaseItem(item.id);
        setCoins(result.remainingPoints);
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, owned: true } : it)));
      } catch (e) {
        // 백엔드 409는 "이미 구매"와 "포인트 부족" 둘 다에 쓰여 status만으로는 구분이 안 되고,
        // ApiError.message(GlobalExceptionHandler가 내려주는 실제 사유)로만 구분할 수 있다.
        setActionError(e instanceof ApiError ? e.message : '구매에 실패했어요.');
      }
      return;
    }

    try {
      const result = await toggleEquipItem(item.id);
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === item.id) return { ...it, equipped: result.isEquipped };
          // 같은 탭(=백엔드 카테고리) 내 기존 착용 아이템은 백엔드가 자동 해제하므로 화면도 맞춘다.
          if (it.tab === item.tab && result.isEquipped) return { ...it, equipped: false };
          return it;
        }),
      );
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : '착용에 실패했어요.');
    }
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

        {actionError && <Text style={styles.actionErrorText}>{actionError}</Text>}

        {loading ? (
          <ActivityIndicator style={styles.statusIndicator} color="#3A4039" />
        ) : error ? (
          <Text style={styles.emptyText}>{error}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {visibleItems.map((item) => (
              <ShopItemCard
                key={item.id}
                price={item.price}
                image={item.imageUrl}
                placeholderIcon={
                  item.imageUrl ? undefined : (() => {
                    const Icon = CATEGORY_PLACEHOLDER_ICON[item.tab];
                    return <Icon width={40} height={40} />;
                  })()
                }
                status={getStatus(item)}
                onPress={() => handleItemPress(item)}
              />
            ))}
            {visibleItems.length === 0 && <Text style={styles.emptyText}>아직 아이템이 없어요.</Text>}
          </ScrollView>
        )}
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
    bottom: '1%',
    width: '38%',
    aspectRatio: 305 / 89,
    alignSelf: 'center',
  },
  character: {
    width: '38%',
    // character-girl.png 실제 픽셀 비율(505x910)을 그대로 사용 — Figma 캐릭터 바운딩박스 비율(152/322)과
    // 실제 에셋 비율이 달라서 152/322를 쓰면 contain 레터박싱으로 캐릭터가 의도보다 작게 보였다.
    aspectRatio: 505 / 910,
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
    rowGap: 12,
    columnGap: 12,
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
  statusIndicator: {
    marginTop: 40,
  },
  actionErrorText: {
    marginTop: 4,
    paddingHorizontal: 14,
    textAlign: 'center',
    fontSize: 13,
    color: '#C0392B',
  },
});
