import { StyleSheet, Text, View } from 'react-native';

import CheckIcon from '@/assets/icons/auth/check.svg';

const REQUIREMENTS = [
  { key: 'case', label: '영문 대/소문자', test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { key: 'digit', label: '숫자', test: (value: string) => /\d/.test(value) },
  { key: 'special', label: '특수문자', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
  { key: 'length', label: '8-16자', test: (value: string) => value.length >= 8 && value.length <= 16 },
] as const;

export function passwordMeetsAllRequirements(value: string) {
  return REQUIREMENTS.every((req) => req.test(value));
}

export function PasswordRequirements({ value }: { value: string }) {
  return (
    <View style={styles.row}>
      {REQUIREMENTS.map((req) => {
        const met = req.test(value);
        return (
          <View key={req.key} style={styles.item}>
            <View style={[styles.checkDot, met && styles.checkDotMet]}>
              {met && <CheckIcon width={8} height={6} />}
            </View>
            <Text style={[styles.label, met && styles.labelMet]}>{req.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotMet: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  labelMet: {
    color: '#FEFEFE',
  },
});
