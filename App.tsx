import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider } from 'styled-components/native';
import SimpleNavigator from './src/navigation/SimpleNavigator';
import theme from './src/styles/theme';
import { FocusTimerProvider } from './src/contexts/FocusTimerContext';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <FocusTimerProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.colors.primary}
        />
        <SimpleNavigator />
      </FocusTimerProvider>
    </ThemeProvider>
  );
}
