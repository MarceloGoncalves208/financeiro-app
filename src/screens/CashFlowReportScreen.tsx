import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { getFluxoCaixaDiario, FluxoCaixaDiario } from '../services/lancamentos';

export default function CashFlowReportScreen() {
  const theme = useTheme();

  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [fluxo, setFluxo] = useState<FluxoCaixaDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await getFluxoCaixaDiario(ano, mes);
      setFluxo(data);
    } catch (e: any) {
      setError('Erro ao carregar fluxo de caixa.');
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

  const totalEntradas = fluxo.reduce((sum, d) => sum + d.entradas, 0);
  const totalSaidas = fluxo.reduce((sum, d) => sum + d.saidas, 0);
  const saldoFinal = fluxo.length > 0 ? fluxo[fluxo.length - 1].saldo_dia : 0;

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

        {!loading && !error && fluxo.length === 0 && (
          <View style={{ padding: 40 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Sem dados para {getMonthName(mes - 1)} {ano}
            </Text>
          </View>
        )}

        {!loading && !error && fluxo.length > 0 && (
          <>
            {/* Totais */}
            <View style={styles.totaisRow}>
              <Surface style={[styles.totaisCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Entradas</Text>
                <Text variant="titleMedium" style={{ color: '#06d6a0', fontWeight: '700' }}>
                  {formatCurrency(totalEntradas)}
                </Text>
              </Surface>
              <Surface style={[styles.totaisCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Saidas</Text>
                <Text variant="titleMedium" style={{ color: '#ef476f', fontWeight: '700' }}>
                  {formatCurrency(totalSaidas)}
                </Text>
              </Surface>
              <Surface style={[styles.totaisCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Saldo Final</Text>
                <Text
                  variant="titleMedium"
                  style={{ color: saldoFinal >= 0 ? '#4361ee' : '#ef476f', fontWeight: '700' }}
                >
                  {formatCurrency(saldoFinal)}
                </Text>
              </Surface>
            </View>

            {/* Tabela */}
            <View style={styles.tableContainer}>
              {/* Header da tabela */}
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={[styles.colDia, { color: theme.colors.onSurfaceVariant }]}>
                  DIA
                </Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: '#06d6a0' }]}>
                  ENTRADAS
                </Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: '#ef476f' }]}>
                  SAIDAS
                </Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: theme.colors.onSurfaceVariant }]}>
                  SALDO
                </Text>
              </View>

              {fluxo.map((item) => (
                <View
                  key={item.data}
                  style={[
                    styles.tableRow,
                    { borderBottomColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text variant="bodySmall" style={[styles.colDia, { color: theme.colors.onSurfaceVariant }]}>
                    {String(item.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                  </Text>
                  <Text variant="bodySmall" style={[styles.colValue, { color: '#06d6a0' }]}>
                    {formatCurrency(item.entradas)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.colValue, { color: '#ef476f' }]}>
                    {formatCurrency(item.saidas)}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.colValue,
                      { color: item.saldo_dia >= 0 ? '#4361ee' : '#ef476f', fontWeight: '600' },
                    ]}
                  >
                    {formatCurrency(item.saldo_dia)}
                  </Text>
                </View>
              ))}
            </View>
          </>
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
  totaisRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  totaisCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tableContainer: {
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colDia: {
    width: 52,
  },
  colValue: {
    flex: 1,
    textAlign: 'right',
  },
});
