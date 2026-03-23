import 'expo/build/Expo.fx';
import React, { useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/theme';
import { FinanceProvider } from './src/contexts/FinanceContext';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <FinanceProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </FinanceProvider>
    </PaperProvider>
  );
}
