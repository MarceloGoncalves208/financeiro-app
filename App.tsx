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
import { EmpresaProvider, useEmpresa } from './src/contexts/EmpresaContext';
import SelectEmpresaScreen from './src/screens/SelectEmpresaScreen';

function AppContent() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const { empresa } = useEmpresa();

  return (
    <PaperProvider theme={theme}>
      <View style={{ flex: 1 }}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {empresa ? (
          <FinanceProvider>
            <DrawerProvider>
              <AppNavigator />
            </DrawerProvider>
          </FinanceProvider>
        ) : (
          <SelectEmpresaScreen />
        )}
      </View>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <EmpresaProvider>
      <AppContent />
    </EmpresaProvider>
  );
}
