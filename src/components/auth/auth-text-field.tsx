import { useState } from 'react';
import type { FC } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import EyeOffIcon from '@/assets/icons/auth/eye-off.svg';

type AuthTextFieldProps = {
  Icon: FC<SvgProps>;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export function AuthTextField({
  Icon,
  placeholder,
  value,
  onChangeText,
  isPassword,
  keyboardType,
}: AuthTextFieldProps) {
  const [hidden, setHidden] = useState(isPassword ?? false);

  return (
    <View style={styles.field}>
      <Icon width={24} height={24} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#828282"
        secureTextEntry={hidden}
        autoCapitalize="none"
        keyboardType={keyboardType}
      />
      {isPassword && (
        <Pressable onPress={() => setHidden((prev) => !prev)} hitSlop={8}>
          <EyeOffIcon width={18} height={18} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 53,
    borderRadius: 15,
    backgroundColor: '#FEFEFE',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
});
