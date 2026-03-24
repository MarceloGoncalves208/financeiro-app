import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, Text, Divider } from 'react-native-paper';

import DashboardScreen from '../screens/DashboardScreen';
import IncomesScreen from '../screens/IncomesScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { DrawerParamList } from './types';

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: any) {
  const theme = useTheme();

  const items = [
    { name: 'Dashboard',    label: 'Início',         icon: 'view-dashboard' },
    { name: 'Receitas',     label: 'Receitas',        icon: 'arrow-up-circle' },
    { name: 'Despesas',     label: 'Despesas',        icon: 'arrow-down-circle' },
    { name: 'Relatorios',   label: 'Relatórios',      icon: 'chart-bar' },
    { name: 'Configuracoes',label: 'Configurações',   icon: 'cog' },
  ] as const;

  const activeRoute = props.state.routes[props.state.index]?.name;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, backgroundColor: theme.colors.surface }}
    >
      {/* Logo / título */}
      <View style={[styles.drawerHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
        <MaterialCommunityIcons name="cash-register" size={28} color={theme.colors.primary} />
        <Text variant="titleMedium" style={{ marginLeft: 12, fontWeight: '700', color: theme.colors.onSurface }}>
          Gula Grill
        </Text>
      </View>

      {/* Itens de navegação */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        {items.map((item) => {
          const isActive = activeRoute === item.name;
          return (
            <DrawerItem
              key={item.name}
              label={item.label}
              icon={({ size }) => (
                <MaterialCommunityIcons
                  name={item.icon}
                  size={size}
                  color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              )}
              focused={isActive}
              activeTintColor={theme.colors.primary}
              inactiveTintColor={theme.colors.onSurfaceVariant}
              activeBackgroundColor={theme.colors.primaryContainer}
              labelStyle={{ fontSize: 15, fontWeight: isActive ? '700' : '400' }}
              onPress={() => props.navigation.navigate(item.name)}
              style={{ borderRadius: 8, marginHorizontal: 8 }}
            />
          );
        })}
      </View>

      {/* Rodapé */}
      <View style={[styles.drawerFooter, { borderTopColor: theme.colors.outlineVariant }]}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Financeiro App v1.0.0
        </Text>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  const theme = useTheme();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 260,
        },
        drawerType: 'front',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Início', headerTitle: 'Início' }}
      />
      <Drawer.Screen
        name="Receitas"
        component={IncomesScreen}
        options={{ title: 'Receitas', headerTitle: 'Receitas' }}
      />
      <Drawer.Screen
        name="Despesas"
        component={ExpensesScreen}
        options={{ title: 'Despesas', headerTitle: 'Despesas' }}
      />
      <Drawer.Screen
        name="Relatorios"
        component={ReportsScreen}
        options={{ title: 'Relatórios', headerTitle: 'Relatórios' }}
      />
      <Drawer.Screen
        name="Configuracoes"
        component={SettingsScreen}
        options={{ title: 'Configurações', headerTitle: 'Configurações' }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
