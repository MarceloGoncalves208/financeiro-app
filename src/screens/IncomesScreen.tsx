import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, useTheme, FAB, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TransactionItem, EmptyState } from '../components';
import { useFinance } from '../contexts/FinanceContext';
import { TransactionStatus, IncomeCategory } from '../types';
import { formatCurrency } from '../utils/helpers';

const categoryLabels: Record<string, string> = {
  product_sales: 'Produtos',
  service_sales: 'Servicos',
  financial_income: 'Financeiro',
  other: 'Outros',
};

export default function IncomesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { state } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | 'all'>('all');

  // Filtrar receitas
  const filteredIncomes = state.incomes
    .filter((income) => {
      const matchesSearch = income.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || income.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.competenceDate).getTime() - new Date(a.competenceDate).getTime());

  // Totais
  const totalCompleted = state.incomes
    .filter((i) => i.status === TransactionStatus.COMPLETED)
    .reduce((sum, i) => sum + i.amount, 0);

  const totalPending = state.incomes
    .filter((i) => i.status === TransactionStatus.PENDING)
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Receitas
        </Text>
        <View style={styles.totals}>
          <View style={styles.totalItem}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Recebido
            </Text>
            <Text variant="titleMedium" style={{ color: '#06d6a0' }}>
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
        placeholder="Buscar receita..."
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
          Recebidas
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
      {filteredIncomes.length === 0 ? (
        <EmptyState
          icon="cash-plus"
          title="Nenhuma receita"
          description="Comece registrando sua primeira receita para acompanhar suas entradas."
          actionLabel="Adicionar Receita"
          onAction={() => navigation.navigate('AddLancamento', { flags: ['R'] })}
        />
      ) : (
        <FlatList
          data={filteredIncomes}
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
              type="income"
              onPress={() => navigation.navigate('AddIncome', { id: item.id })}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: '#06d6a0' }]}
        onPress={() => navigation.navigate('AddLancamento', { flags: ['R'] })}
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
