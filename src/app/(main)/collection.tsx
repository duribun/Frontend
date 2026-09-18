import { useFonts } from 'expo-font';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import FlowerDeco from '@/assets/icons/collection/preview-mascot-flower.svg';
import { CollectionBoard } from '@/components/collection/collection-board';

export default function CollectionScreen() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Cafe24Ssurround: require('@/assets/fonts/Cafe24Ssurround.ttf'),
  });

  return (
    <CollectionBoard title="수집">
      <View style={styles.cardColumn}>
        <Pressable
          style={styles.card}
          // NOTE: 신규 collection-mascot 라우트라 로컬 typed routes 갱신 전까지 `as Href` 캐스팅.
          onPress={() => router.push('/(main)/collection-mascot' as Href)}
        >
          <View style={styles.cardDashedBorder} pointerEvents="none" />
          <View style={styles.mascotGroundShadow} />
          <Text style={[styles.cardTitle, fontsLoaded && styles.cardTitleFont]}>마스코트</Text>
          <View style={styles.cardPreview}>
            <Image
              source={require('@/assets/images/collection/preview-mascot-group.png')}
              style={styles.mascotPreviewImage}
              contentFit="contain"
            />
            <FlowerDeco width={194} height={35} style={styles.mascotFlower} />
          </View>
        </Pressable>

        <Pressable
          style={styles.card}
          // NOTE: 신규 collection-stamp 라우트라 로컬 typed routes 갱신 전까지 `as Href` 캐스팅.
          onPress={() => router.push('/(main)/collection-stamp' as Href)}
        >
          <View style={styles.cardDashedBorder} pointerEvents="none" />
          <Text style={[styles.cardTitle, fontsLoaded && styles.cardTitleFont]}>도장판</Text>
          <View style={styles.cardPreview}>
            <Image
              source={require('@/assets/images/collection/stamp-icon-preview.png')}
              style={styles.stampPreviewImage}
              contentFit="contain"
            />
          </View>
        </Pressable>
      </View>
    </CollectionBoard>
  );
}

const styles = StyleSheet.create({
  cardColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 36,
  },
  card: {
    alignSelf: 'center',
    width: 206,
    height: 185,
    borderRadius: 20,
    backgroundColor: '#FCFCE9',
    alignItems: 'center',
    paddingTop: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  // Figma 기준 점선 테두리는 배경 박스(206x185) 안쪽으로 사방 10px 떨어진 별도 사각형(187x164)이다 —
  // 배경 박스 가장자리에 바로 테두리를 그리면 점선이 실제보다 커 보인다.
  cardDashedBorder: {
    position: 'absolute',
    left: 10,
    top: 10,
    right: 9,
    bottom: 11,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D5D5A8',
    borderStyle: 'dashed',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#553F23',
  },
  cardTitleFont: {
    fontFamily: 'Cafe24Ssurround',
    fontWeight: 'normal',
  },
  cardPreview: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotPreviewImage: {
    width: 160,
    height: 123,
  },
  mascotFlower: {
    marginTop: -34,
  },
  mascotGroundShadow: {
    position: 'absolute',
    left: 26,
    top: 155,
    width: 154,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C4D98C',
  },
  stampPreviewImage: {
    width: 165,
    height: 118,
    transform: [{ translateY: -12 }],
  },
});
