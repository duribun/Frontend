import type { FC } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import AppleIcon from '@/assets/icons/auth/apple.svg';
import GoogleIcon from '@/assets/icons/auth/google.svg';
import KakaoIcon from '@/assets/icons/auth/kakao.svg';

export type SocialProvider = 'google' | 'kakao' | 'apple';

const ICONS: Record<SocialProvider, FC<SvgProps>> = {
  google: GoogleIcon,
  kakao: KakaoIcon,
  apple: AppleIcon,
};

const PROVIDERS: SocialProvider[] = ['google', 'kakao', 'apple'];

type SocialRowProps = {
  onSelect: (provider: SocialProvider) => void;
};

export function SocialRow({ onSelect }: SocialRowProps) {
  return (
    <View style={styles.row}>
      {PROVIDERS.map((provider) => {
        const Icon = ICONS[provider];
        return (
          <Pressable key={provider} onPress={() => onSelect(provider)} hitSlop={4}>
            <Icon width={52} height={52} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'center',
  },
});
