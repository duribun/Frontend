import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ChevronLeftIcon from '@/assets/icons/map/chevron-left.svg';

type CollectionBoardProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

// Shared cork-board + wood-frame shell used by every 수집(collection) screen.
export function CollectionBoard({ title, subtitle, children }: CollectionBoardProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/collection/board-texture.jpg')}
        style={styles.texture}
        contentFit="cover"
      />
      <View style={styles.woodFrame} pointerEvents="none" />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ChevronLeftIcon width={24} height={24} />
          </Pressable>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          <View style={styles.headerSpacer} />
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DEA95A',
  },
  texture: {
    ...StyleSheet.absoluteFill,
    opacity: 0.35,
  },
  woodFrame: {
    ...StyleSheet.absoluteFill,
    borderWidth: 14,
    borderColor: '#6C4202',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 18,
  },
  headerRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
});
