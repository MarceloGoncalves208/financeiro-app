import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { getLancamentosMes, Lancamento } from '../services/lancamentos';
import { formatCurrency } from '../utils/helpers';

const FLAG_LABEL: Record<string, string> = {
  F: 'Despesa',
  V: 'CMV',
};

export default function ExpensesScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const now = new Date();
  const [ano] = useState(now.getFullYear());
  const [mes] = useState(now.getMonth() + 1);

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getLancamentosMes(ano, mes);
      setLancamentos(
        data.filter((l) => l.flag === 'F' || l.flag === 'V').sort((a, b) => b.dia - a.dia)
      );
    } catch {
      setLancamentos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const total = lancamentos.reduce((sum, l) => sum + l.valor, 0);

  const renderItem = ({ item }: { item: Lancamento }) => (
    <View style={[styles.item, { borderBottomColor: theme.colors.outlineVariant }]}>
      <View style={styles.itemLeft}>
        <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
          {item.discriminacao}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {FLAG_LABEL[item.flag] ?? item.flag} · Dia {item.dia}/{String(mes).padStart(2, '0')}
        </Text>
      </View>
      <Text variant="titleMedium" style={{ color: '#ef476f', fontWeight: '700' }}>
        -{formatCurrency(item.valor)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Totalizador */}
      <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Total despesas — {String(mes).padStart(2,'0')}/{ano}
        </Text>
        <Text variant="headlineSmall" style={{ color: '#ef476f', fontWeight: 'bold', marginTop: 2 }}>
          {formatCurrency(total)}
        </Text>
      </View>

      <FlatList
        data={lancamentos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Nenhuma despesa registrada este mês.
              </Text>
            </View>
          )
        }
      />

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
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: { flex: 1, marginRight: 8 },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
