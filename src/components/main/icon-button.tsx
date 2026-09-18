import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

type IconButtonProps = Omit<PressableProps, 'style'> & {
  source: ImageSource;
  width?: number;
  height?: number;
};

export function IconButton({ source, width = 63, height = 63, ...rest }: IconButtonProps) {
  return (
    <Pressable
      hitSlop={8}
      style={({ pressed }) => [styles.base, { width, height }, pressed && styles.pressed]}
      {...rest}>
      <Image source={source} style={styles.image} contentFit="contain" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {},
  pressed: {
    opacity: 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
