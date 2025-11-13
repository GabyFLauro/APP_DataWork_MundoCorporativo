import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent, ViewStyle, TextStyle } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  variant?: Variant;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  accessibilityLabel?: string;
}

const Button: React.FC<Props> = ({ children, onPress, style, textStyle, variant = 'primary', size = 'medium', disabled = false, accessibilityLabel }) => {
  const bg = variant === 'primary' ? styles.primary : variant === 'danger' ? styles.danger : variant === 'secondary' ? styles.secondary : styles.ghost;
  const padding = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
      style={[styles.base, bg, padding, style]}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#111827',
  },
  danger: {
    backgroundColor: '#FF3B30',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: 8,
  },
  medium: {
    minHeight: 44,
  },
  large: {
    minHeight: 52,
    paddingHorizontal: 16,
  },
});

export default Button;
