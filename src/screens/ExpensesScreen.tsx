import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, FAB, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TransactionItem, EmptyState } from '../components';
import { useFinance } from '../contexts/FinanceContext';
import { TransactionStatus, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/helpers';

const categoryLabels: Record<string, string> = {
  raw_material: 'Materia-prima',
  direct_labor: 'Mao de Obra',
  production_costs: 'Producao',
  administrative: 'Administrativo',
  commercial: 'Comercial',
  financial: 'Financeiro',
  investment: 'Investimento',
  other: 'Outros',
};

export default function ExpensesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { state } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');

  // Filtrar despesas
  const filteredExpenses = state.expenses
    .filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.competenceDate).getTime() - new Date(a.competenceDate).getTime());

  // Totais
  const totalCompleted = state.expenses
    .filter((e) => e.status === TransactionStatus.COMPLETED)
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPending = state.expenses
    .filter((e) => e.status === TransactionStatus.PENDING)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Despesas
        </Text>
        <View style={styles.totals}>
          <View style={styles.totalItem}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pago
            </Text>
            <Text variant="titleMedium" style={{ color: '#ef476f' }}>
              {formatCurrency(totalCompleted)}
            </Text>
          </View>
          <View style={styles.totalItem}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Pendente
            </Text>
            <Text variant="titleMedium" style={{ color: '#ffd166' }}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <Searchbar
        placeholder="Buscar despesa..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {/* Filters */}
      <View style={styles.filters}>
        <Chip
          selected={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
          style={styles.chip}
        >
          Todas
        </Chip>
        <Chip
          selected={filterStatus === TransactionStatus.COMPLETED}
          onPress={() => setFilterStatus(TransactionStatus.COMPLETED)}
          style={styles.chip}
        >
          Pagas
        </Chip>
        <Chip
          selected={filterStatus === TransactionStatus.PENDING}
          onPress={() => setFilterStatus(TransactionStatus.PENDING)}
          style={styles.chip}
        >
          Pendentes
        </Chip>
      </View>

      {/* List */}
      {filteredExpenses.length === 0 ? (
        <EmptyState
          icon="cash-minus"
          title="Nenhuma despesa"
          description="Comece registrando sua primeira despesa para acompanhar suas saidas."
          actionLabel="Adicionar Despesa"
          onAction={() => navigation.navigate('AddLancamento', { flags: ['F', 'V'] })}
        />
      ) : (
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TransactionItem
              description={item.description}
              amount={item.amount}
              date={item.competenceDate}
              category={categoryLabels[item.category] || item.category}
              status={item.status}
              type="expense"
              onPress={() => navigation.navigate('AddExpense', { id: item.id })}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#ef476f' }]}
        onPress={() => navigation.navigate('AddLancamento', { flags: ['F', 'V'] })}
        color="#fff"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontWeight: 'bold',
  },
  totals: {
    flexDirection: 'row',
    marginTop: 12,
  },
  totalItem: {
    marginRight: 24,
  },
  searchbar: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
