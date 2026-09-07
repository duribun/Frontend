import { Pressable, StyleSheet, View } from 'react-native';

import AccessoryActive from '@/assets/icons/shop/tab-accessory-active.svg';
import AccessoryInactive from '@/assets/icons/shop/tab-accessory-inactive.svg';
import BottomActive from '@/assets/icons/shop/tab-bottom-active.svg';
import BottomInactive from '@/assets/icons/shop/tab-bottom-inactive.svg';
import HangerActive from '@/assets/icons/shop/tab-hanger-active.svg';
import HangerInactive from '@/assets/icons/shop/tab-hanger-inactive.svg';
import HatActive from '@/assets/icons/shop/tab-hat-active.svg';
import HatInactive from '@/assets/icons/shop/tab-hat-inactive.svg';
import HeartActive from '@/assets/icons/shop/tab-heart-active.svg';
import HeartInactive from '@/assets/icons/shop/tab-heart-inactive.svg';
import ShoesActive from '@/assets/icons/shop/tab-shoes-active.svg';
import ShoesInactive from '@/assets/icons/shop/tab-shoes-inactive.svg';
import TopActive from '@/assets/icons/shop/tab-top-active.svg';
import TopInactive from '@/assets/icons/shop/tab-top-inactive.svg';

export type ShopTabKey = 'liked' | 'owned' | 'top' | 'bottom' | 'hat' | 'shoes' | 'accessory';

type TabIcon = React.ComponentType<{ width?: number; height?: number }>;

const TABS: { key: ShopTabKey; Active: TabIcon; Inactive: TabIcon; size: number }[] = [
  { key: 'liked', Active: HeartActive, Inactive: HeartInactive, size: 21 },
  { key: 'owned', Active: HangerActive, Inactive: HangerInactive, size: 21 },
  { key: 'top', Active: TopActive, Inactive: TopInactive, size: 21 },
  { key: 'bottom', Active: BottomActive, Inactive: BottomInactive, size: 19 },
  { key: 'hat', Active: HatActive, Inactive: HatInactive, size: 21 },
  { key: 'shoes', Active: ShoesActive, Inactive: ShoesInactive, size: 23 },
  { key: 'accessory', Active: AccessoryActive, Inactive: AccessoryInactive, size: 22 },
];

type ShopTabBarProps = {
  active: ShopTabKey;
  onChange: (tab: ShopTabKey) => void;
};

export function ShopTabBar({ active, onChange }: ShopTabBarProps) {
  return (
    <View style={styles.bar}>
      {TABS.map(({ key, Active, Inactive, size }) => {
        const isActive = active === key;
        const Icon = isActive ? Active : Inactive;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            hitSlop={6}
            style={[styles.tab, isActive && styles.tabActive]}>
            <Icon width={size} height={size} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#D5F0A4',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 7,
    shadowColor: '#034500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#699447',
  },
});
