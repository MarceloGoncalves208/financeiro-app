import React from 'react';
import { View, Animated, TouchableWithoutFeedback, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';

import { useDrawer, DRAWER_WIDTH_CONST } from '../contexts/DrawerContext';

const NAV_ITEMS = [
  { route: 'Dashboard',  label: 'Início',         icon: 'view-dashboard'   },
  { route: 'Receitas',   label: 'Receitas',        icon: 'arrow-up-circle'  },
  { route: 'Despesas',   label: 'Despesas',        icon: 'arrow-down-circle'},
  { route: 'Relatorios', label: 'Relatórios',      icon: 'chart-bar'        },
  { route: 'Mais',       label: 'Mais',            icon: 'dots-horizontal'  },
] as const;

export default function AppDrawer() {
  const theme = useTheme();
  const { closeDrawer, translateX, overlayOpacity, isOpen } = useDrawer();
  const navigation = useNavigation<any>();

  const activeRoute = useNavigationState((state) => {
    const mainRoute = state?.routes?.find((r) => r.name === 'Main');
    const tabState = (mainRoute?.state as any);
    if (tabState?.routes) {
      return tabState.routes[tabState.index ?? 0]?.name;
    }
    return null;
  });

  const navigate = (route: string) => {
    closeDrawer();
    setTimeout(() => navigation.navigate('Main', { screen: route }), 50);
  };

  if (!isOpen) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {/* Overlay escuro */}
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: 'rgba(0,0,0,0.45)', opacity: overlayOpacity },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Painel do drawer */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: theme.colors.surface,
            width: DRAWER_WIDTH_CONST,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Cabeçalho */}
        <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
          <MaterialCommunityIcons name="cash-register" size={26} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ marginLeft: 10, fontWeight: '700', color: theme.colors.onSurface }}>
            Gula Grill
          </Text>
        </View>

        {/* Itens de navegação */}
        <View style={styles.navItems}>
          {NAV_ITEMS.map((item) => {
            const active = activeRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                onPress={() => navigate(item.route)}
                activeOpacity={0.7}
                style={[
                  styles.navItem,
                  active && { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={22}
                  color={active ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyLarge"
                  style={{
                    marginLeft: 14,
                    color: active ? theme.colors.primary : theme.colors.onSurface,
                    fontWeight: active ? '700' : '400',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Divider />

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Financeiro App v1.0.0
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navItems: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 8,
    marginBottom: 2,
  },
  footer: {
    padding: 20,
  },
});
