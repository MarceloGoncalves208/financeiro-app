import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { computeFluxoCaixaMes, FluxoDia } from '../services/lancamentos';

export default function CashFlowReportScreen() {
  const theme = useTheme();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [fluxo, setFluxo] = useState<FluxoDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await computeFluxoCaixaMes(ano, mes);
      setFluxo(data);
    } catch {
      setError('Erro ao carregar fluxo de caixa.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  const prevMes = () => { if (mes === 1) { setMes(12); setAno(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 12) { setMes(1); setAno(a => a + 1); } else setMes(m => m + 1); };

  const totalEntradas  = fluxo.reduce((s, d) => s + d.entradas, 0);
  const totalSaidas    = fluxo.reduce((s, d) => s + d.saidas, 0);
  const saldoFinal     = fluxo.length > 0 ? fluxo[fluxo.length - 1].saldo_acumulado : 0;
  const diasPositivos  = fluxo.filter(d => d.entradas - d.saidas >= 0).length;
  const diasNegativos  = fluxo.filter(d => d.entradas - d.saidas < 0).length;
  const mediaEntradas  = fluxo.length > 0 ? totalEntradas / fluxo.length : 0;
  const mediaSaidas    = fluxo.length > 0 ? totalSaidas   / fluxo.length : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
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
          <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!loading && !error && fluxo.length === 0 && (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Sem lançamentos para {getMonthName(mes - 1)} {ano}
          </Text>
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
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Saídas</Text>
                <Text variant="titleMedium" style={{ color: '#ef476f', fontWeight: '700' }}>
                  {formatCurrency(totalSaidas)}
                </Text>
              </Surface>
              <Surface style={[styles.totaisCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Saldo Final</Text>
                <Text variant="titleMedium" style={{ color: saldoFinal >= 0 ? '#4361ee' : '#ef476f', fontWeight: '700' }}>
                  {formatCurrency(saldoFinal)}
                </Text>
              </Surface>
            </View>

            {/* Inteligência */}
            <View style={[styles.intelCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.secLabel, { color: theme.colors.primary }]}>MÉDIAS E INDICADORES</Text>
              <View style={styles.intelGrid}>
                <IntelItem label="Média entrada/dia" value={formatCurrency(mediaEntradas)}    color="#06d6a0" />
                <IntelItem label="Média saída/dia"   value={formatCurrency(mediaSaidas)}      color="#ef476f" />
                <IntelItem label="Dias positivos"    value={`${diasPositivos}`}               color="#06d6a0" sub={`de ${fluxo.length} dias`} />
                <IntelItem label="Dias negativos"    value={`${diasNegativos}`}               color={diasNegativos > 0 ? '#ef476f' : '#06d6a0'} sub={`de ${fluxo.length} dias`} />
              </View>
            </View>

            {/* Tabela */}
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="labelSmall" style={[styles.colDia, { color: theme.colors.onSurfaceVariant }]}>DIA</Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: '#06d6a0' }]}>ENTRADAS</Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: '#ef476f' }]}>SAÍDAS</Text>
                <Text variant="labelSmall" style={[styles.colValue, { color: theme.colors.onSurfaceVariant }]}>SALDO ACUM.</Text>
              </View>

              {fluxo.map((item) => {
                const diaSaldo = item.entradas - item.saidas;
                return (
                  <View key={item.dia} style={[styles.tableRow, { borderBottomColor: theme.colors.outlineVariant }]}>
                    <Text variant="bodySmall" style={[styles.colDia, { color: theme.colors.onSurfaceVariant }]}>
                      {String(item.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')}
                    </Text>
                    <Text variant="bodySmall" style={[styles.colValue, { color: '#06d6a0' }]}>
                      {formatCurrency(item.entradas)}
                    </Text>
                    <Text variant="bodySmall" style={[styles.colValue, { color: '#ef476f' }]}>
                      {formatCurrency(item.saidas)}
                    </Text>
                    <Text variant="bodySmall" style={[styles.colValue, {
                      color: item.saldo_acumulado >= 0 ? '#4361ee' : '#ef476f', fontWeight: '600',
                    }]}>
                      {formatCurrency(item.saldo_acumulado)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function IntelItem({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.intelItem, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text style={{ fontWeight: '700', fontSize: 18, color }}>{value}</Text>
      {sub && <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mesSelector: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  navBtn: { padding: 4 },
  center: { padding: 60, alignItems: 'center' },
  errorText: { color: '#ef476f', textAlign: 'center', padding: 20 },
  emptyText: { textAlign: 'center', padding: 40 },
  totaisRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  totaisCard: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  intelCard: { marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12 },
  intelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  intelItem: { borderRadius: 10, padding: 12, minWidth: '45%', flex: 1, gap: 2 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  tableContainer: { marginHorizontal: 16, borderRadius: 10, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12 },
  tableRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colDia:   { width: 52 },
  colValue: { flex: 1, textAlign: 'right' },
});
