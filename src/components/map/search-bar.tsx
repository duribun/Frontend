import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <SymbolView name="magnifyingglass" tintColor="#8A8A8A" size={18} fallback={null} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="지역 검색"
        placeholderTextColor="#8A8A8A"
        autoCapitalize="none"
      />
      <SymbolView name="mic.fill" tintColor="#8A8A8A" size={18} fallback={null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
});
