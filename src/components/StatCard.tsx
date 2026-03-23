import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/helpers';

interface StatCardProps {
  title: string;
  value: number;
  type?: 'default' | 'income' | 'expense' | 'balance';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  showCurrency?: boolean;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  type = 'default',
  icon,
  showCurrency = true,
  subtitle,
}: StatCardProps) {
  const theme = useTheme();

  const getColor = () => {
    switch (type) {
      case 'income':
        return '#06d6a0';
      case 'expense':
        return '#ef476f';
      case 'balance':
        return value >= 0 ? '#06d6a0' : '#ef476f';
      default:
        return theme.colors.primary;
    }
  };

  const color = getColor();

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
          </View>
        )}
        <Text variant="bodySmall" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
          {title}
        </Text>
      </View>
      <Text variant="headlineSmall" style={[styles.value, { color }]}>
        {showCurrency ? formatCurrency(value) : value.toLocaleString('pt-BR')}
      </Text>
      {subtitle && (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {subtitle}
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    flex: 1,
  },
  value: {
    fontWeight: 'bold',
  },
});
