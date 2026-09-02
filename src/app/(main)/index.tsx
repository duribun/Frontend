import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RefreshIcon from '@/assets/icons/main/refresh.svg';
import SettingsIcon from '@/assets/icons/main/settings.svg';
import { CoinBadge } from '@/components/main/coin-badge';
import { IconButton } from '@/components/main/icon-button';

const SWIPE_THRESHOLD = 60;

export default function MainScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > 10,
      onPanResponderRelease: (_evt, gesture) => {
        if (gesture.dx < -SWIPE_THRESHOLD) {
          router.push('/(main)/map');
        }
      },
    }),
  ).current;

  function handleDiary() {
    // TODO: wire up to the record (여행 기록) flow once that screen exists.
  }

  function handleFrame() {
    // TODO: wire up to the collection (수집) flow once that screen exists.
  }

  function handleShop() {
    // TODO: wire up to the shop flow once that screen exists.
  }

  function handleSettings() {
    // TODO: wire up to the settings flow once that screen exists.
  }

  function handleProfile() {
    // TODO: wire up to the profile flow once that screen exists.
  }

  function handleRefreshRegionName() {
    // TODO: wire up to the backend location API to re-check the current region.
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Image
        source={require('@/assets/images/main/background.png')}
        style={styles.background}
        contentFit="cover"
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={handleSettings} hitSlop={8}>
            <SettingsIcon width={38} height={38} />
          </Pressable>

          <View style={styles.headerRight}>
            <CoinBadge amount={797} />
            <Pressable onPress={handleProfile} hitSlop={8} style={styles.profileButton}>
              <Image
                source={require('@/assets/images/main/profile-girl.png')}
                style={styles.profileImage}
                contentFit="cover"
              />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Positioned as % of the full screen, matching the Figma frame (402x874) layout 1:1. */}
      <View style={styles.iconColumn} pointerEvents="box-none">
        <IconButton
          source={require('@/assets/images/main/icon-diary.png')}
          width={57}
          height={63}
          onPress={handleDiary}
        />
        <IconButton
          source={require('@/assets/images/main/icon-frame.png')}
          width={59}
          height={56}
          onPress={handleFrame}
        />
        <IconButton
          source={require('@/assets/images/main/icon-shop.png')}
          width={63}
          height={63}
          onPress={handleShop}
        />
        <IconButton
          source={require('@/assets/images/main/icon-map.png')}
          width={63}
          height={51}
          onPress={() => router.push('/(main)/map')}
        />
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

      <View style={styles.signpostWrap}>
        <Image
          source={require('@/assets/images/main/signpost.png')}
          style={styles.signpost}
          contentFit="contain"
        />
        <Text style={[styles.regionName, fontsLoaded && styles.regionNameFont]}>지역명</Text>
        <Pressable onPress={handleRefreshRegionName} hitSlop={8} style={styles.refreshButton}>
          <RefreshIcon width={20} height={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E7E6E2',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  safeArea: {
    paddingHorizontal: 18,
  },
  headerRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButton: {
    width: 51,
    height: 51,
    borderRadius: 25.5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  iconColumn: {
    position: 'absolute',
    left: '4%',
    top: '20.4%',
    gap: 20,
  },
  characterStage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '26%',
    alignItems: 'center',
  },
  characterShadow: {
    position: 'absolute',
    bottom: '-3%',
    width: '80%',
    aspectRatio: 305 / 89,
  },
  character: {
    width: '58%',
    aspectRatio: 198 / 396,
  },
  signpostWrap: {
    position: 'absolute',
    left: '16.4%',
    bottom: 0,
    width: '67.2%',
    aspectRatio: 270 / 239,
  },
  signpost: {
    width: '100%',
    height: '100%',
  },
  regionName: {
    position: 'absolute',
    top: '22%',
    left: 0,
    right: 0,
    lineHeight: 32,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: '#3D2109',
  },
  regionNameFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  refreshButton: {
    position: 'absolute',
    top: '39%',
    left: '45.9%',
  },
});
