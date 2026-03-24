import 'expo/build/Expo.fx';
import React from 'react';
import { PaperProvider } from 'react-native-paper';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme, darkTheme } from './src/theme';
import { FinanceProvider } from './src/contexts/FinanceContext';
import { DrawerProvider } from './src/contexts/DrawerContext';

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <PaperProvider theme={theme}>
      <FinanceProvider>
        <DrawerProvider>
          <View style={{ flex: 1 }}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <AppNavigator />
          </View>
        </DrawerProvider>
      </FinanceProvider>
    </PaperProvider>
  );
}
