import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';

import TabNavigator from './TabNavigator';
import AddLancamentoScreen from '../screens/AddLancamentoScreen';
import AddIncomeScreen from '../screens/AddIncomeScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import DREReportScreen from '../screens/DREReportScreen';
import CashFlowReportScreen from '../screens/CashFlowReportScreen';
import CMVReportScreen from '../screens/CMVReportScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LancamentosScreen from '../screens/LancamentosScreen';
import EditLancamentoScreen from '../screens/EditLancamentoScreen';
import AppDrawer from '../components/AppDrawer';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function StackWithDrawer() {
  const theme = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Lancamentos" component={LancamentosScreen} options={{ title: 'Lançamentos' }} />
        <Stack.Screen name="EditLancamento" component={EditLancamentoScreen} options={{ title: 'Editar Lançamento' }} />
        <Stack.Screen name="AddLancamento" component={AddLancamentoScreen} options={{ title: 'Novo Lançamento' }} />
        <Stack.Screen name="AddIncome" component={AddIncomeScreen} options={{ title: 'Nova Receita' }} />
        <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Nova Despesa' }} />
        <Stack.Screen name="DREReport" component={DREReportScreen} options={{ title: 'DRE' }} />
        <Stack.Screen name="CashFlowReport" component={CashFlowReportScreen} options={{ title: 'Fluxo de Caixa' }} />
        <Stack.Screen name="CMVReport" component={CMVReportScreen} options={{ title: 'CMV' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
      </Stack.Navigator>
      <AppDrawer />
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StackWithDrawer />
    </NavigationContainer>
  );
}
