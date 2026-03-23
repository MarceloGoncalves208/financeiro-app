import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCurrency, formatDate } from '../utils/helpers';
import { TransactionStatus } from '../types';

interface TransactionItemProps {
  description: string;
  amount: number;
  date: Date;
  category: string;
  status: TransactionStatus;
  type: 'income' | 'expense';
  onPress?: () => void;
}

export default function TransactionItem({
  description,
  amount,
  date,
  category,
  status,
  type,
  onPress,
}: TransactionItemProps) {
  const theme = useTheme();

  const color = type === 'income' ? '#06d6a0' : '#ef476f';
  const icon = type === 'income' ? 'arrow-up-circle' : 'arrow-down-circle';
  const isPending = status === TransactionStatus.PENDING;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>

      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        <View style={styles.meta}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {category}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {' - '}
            {formatDate(date)}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text variant="bodyLarge" style={[styles.amount, { color }]}>
          {type === 'income' ? '+' : '-'} {formatCurrency(amount)}
        </Text>
        {isPending && (
          <View style={[styles.badge, { backgroundColor: '#ffd16620' }]}>
            <Text variant="labelSmall" style={{ color: '#ffd166' }}>
              Pendente
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  description: {
    fontWeight: '500',
  },
  meta: {
    flexDirection: 'row',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
});
