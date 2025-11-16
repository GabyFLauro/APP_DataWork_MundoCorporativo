import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusTimer } from '../contexts/FocusTimerContext';
import theme from '../styles/theme';

const GlobalTimerIndicator: React.FC = () => {
  const { secondsLeft, running } = useFocusTimer();

  if (!running) return null;

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⏱️ {fmt(secondsLeft)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GlobalTimerIndicator;
