import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { getDREMensal, DREMensal } from '../services/lancamentos';

export default function CMVReportScreen() {
  const theme = useTheme();

  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dre, setDre] = useState<DREMensal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await getDREMensal(ano, mes);
      setDre(data[0] ?? null);
    } catch (e: any) {
      setError('Erro ao carregar dados de CMV.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAno((a) => a - 1); }
    else { setMes((m) => m - 1); }
  };

  const nextMes = () => {
    if (mes === 12) { setMes(1); setAno((a) => a + 1); }
    else { setMes((m) => m + 1); }
  };

  const pct = (val: number) => {
    if (!dre || dre.receita_bruta === 0) return '0.0%';
    return `${((val / dre.receita_bruta) * 100).toFixed(1)}%`;
  };

  const items = dre
    ? [
        { label: 'Buffet', value: dre.cmv_buffet },
        { label: 'Churrasqueira', value: dre.cmv_churrasqueira },
        { label: 'Lanchonete', value: dre.cmv_lanchonete },
        { label: 'Bebidas', value: dre.cmv_bebidas },
        { label: 'Frutas/Suco', value: dre.cmv_frutas_suco },
        { label: 'Sobremesas', value: dre.cmv_sobremesas },
      ].filter((i) => i.value > 0)
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Seletor de mês */}
        <View style={[styles.mesSelector, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={prevMes} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text variant="titleMedium" style={{ fontWeight: '700' }}>
            {getMonthName(mes - 1)} {ano}
          </Text>
          <TouchableOpacity onPress={nextMes} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {error && (
          <View style={{ padding: 20 }}>
            <Text style={{ color: '#ef476f', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {!loading && !error && !dre && (
          <View style={{ padding: 40 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Sem dados para {getMonthName(mes - 1)} {ano}
            </Text>
          </View>
        )}

        {!loading && !error && dre && (
          <View style={styles.content}>
            {/* Total CMV */}
            <View style={[styles.totalCard, { backgroundColor: '#ef476f15' }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                CMV Total
              </Text>
              <Text variant="displaySmall" style={{ color: '#ef476f', fontWeight: 'bold', marginTop: 4 }}>
                {formatCurrency(dre.cmv_total)}
              </Text>
              <Text variant="bodyMedium" style={{ color: '#ef476f', marginTop: 4 }}>
                {pct(dre.cmv_total)} da Receita Bruta
              </Text>
            </View>

            {/* Receita de referência */}
            <View style={[styles.refCard, { backgroundColor: theme.colors.surface }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Receita Bruta (referencia)
              </Text>
              <Text variant="titleMedium" style={{ color: '#06d6a0', fontWeight: '600' }}>
                {formatCurrency(dre.receita_bruta)}
              </Text>
            </View>

            {/* Breakdown por seção */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Breakdown por Secao
            </Text>

            {items.map((item) => {
              const itemPct = dre.cmv_total > 0 ? (item.value / dre.cmv_total) * 100 : 0;
              return (
                <View key={item.label} style={[styles.barRow, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.barHeader}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                      {item.label}
                    </Text>
                    <View style={styles.barValues}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
                        {pct(item.value)}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: '#ef476f', fontWeight: '600' }}>
                        {formatCurrency(item.value)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${Math.min(itemPct, 100)}%`, backgroundColor: '#ef476f' },
                      ]}
                    />
                  </View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    {itemPct.toFixed(1)}% do CMV total
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mesSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  navBtn: { padding: 4 },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  refCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  barRow: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  barValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
});
