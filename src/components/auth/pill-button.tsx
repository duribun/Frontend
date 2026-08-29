import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type PillButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'solid' | 'ghost';
};

export function PillButton({ label, variant = 'solid', disabled, ...rest }: PillButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}>
      <Text style={[styles.label, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: 36,
    backgroundColor: '#C5D775',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    height: 42.5,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  ghostLabel: {
    color: '#EDEDED',
  },
});
