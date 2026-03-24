import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import DashboardScreen from '../screens/DashboardScreen';
import IncomesScreen from '../screens/IncomesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import MoreScreen from '../screens/MoreScreen';
import { useDrawer } from '../contexts/DrawerContext';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

function HamburgerButton() {
  const theme = useTheme();
  const { openDrawer } = useDrawer();
  return (
    <TouchableOpacity onPress={openDrawer} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <MaterialCommunityIcons name="menu" size={26} color={theme.colors.onSurface} />
    </TouchableOpacity>
  );
}

export default function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerLeft: () => <HamburgerButton />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          height: 72,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: 'Início',
          tabBarLabel: 'Início',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Receitas"
        component={IncomesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="arrow-up-circle" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Despesas"
        component={ExpensesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="arrow-down-circle" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Relatorios"
        component={ReportsScreen}
        options={{
          headerTitle: 'Relatórios',
          tabBarLabel: 'Relatórios',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-bar" color={color} size={26} />
          ),
        }}
      />
      <Tab.Screen
        name="Mais"
        component={MoreScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="dots-horizontal" color={color} size={26} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
