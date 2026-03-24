import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { computeDREMes, DREComputada } from '../services/lancamentos';

const CMV_META = 0.35; // 35% de receita bruta

export default function CMVReportScreen() {
  const theme = useTheme();
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [dre, setDre] = useState<DREComputada | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await computeDREMes(ano, mes);
      setDre(data.receita_bruta > 0 || data.cmv_total > 0 ? data : null);
    } catch {
      setError('Erro ao carregar dados de CMV.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  const prevMes = () => { if (mes === 1) { setMes(12); setAno(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 12) { setMes(1); setAno(a => a + 1); } else setMes(m => m + 1); };

  const cmvPct   = dre && dre.receita_bruta > 0 ? dre.cmv_total / dre.receita_bruta : 0;
  const dentroMeta = cmvPct <= CMV_META;

  const items = dre ? [
    { label: 'Buffet',        value: dre.cmv_buffet        },
    { label: 'Churrasqueira', value: dre.cmv_churrasqueira },
    { label: 'Lanchonete',    value: dre.cmv_lanchonete    },
    { label: 'Bebidas',       value: dre.cmv_bebidas       },
    { label: 'Frutas/Suco',   value: dre.cmv_frutas_suco   },
    { label: 'Sobremesas',    value: dre.cmv_sobremesas     },
  ].filter(i => i.value > 0) : [];

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
        {!loading && !error && !dre && (
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Sem dados para {getMonthName(mes - 1)} {ano}
          </Text>
        )}

        {!loading && !error && dre && (
          <View style={styles.content}>

            {/* CMV Total */}
            <View style={[styles.totalCard, { backgroundColor: dentroMeta ? '#06d6a015' : '#ef476f15' }]}>
              <View style={styles.totalHeader}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>CMV Total</Text>
                <View style={[styles.metaBadge, { backgroundColor: dentroMeta ? '#06d6a0' : '#ef476f' }]}>
                  <MaterialCommunityIcons
                    name={dentroMeta ? 'check-circle' : 'alert-circle'}
                    size={14} color="#fff"
                  />
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 4 }}>
                    {dentroMeta ? 'Dentro da meta' : 'Acima da meta'}
                  </Text>
                </View>
              </View>
              <Text variant="displaySmall" style={{
                color: dentroMeta ? '#06d6a0' : '#ef476f', fontWeight: 'bold', marginTop: 4,
              }}>
                {formatCurrency(dre.cmv_total)}
              </Text>
              <Text variant="bodyMedium" style={{ color: dentroMeta ? '#06d6a0' : '#ef476f', marginTop: 4 }}>
                {(cmvPct * 100).toFixed(1)}% da receita  ·  meta: {(CMV_META * 100).toFixed(0)}%
              </Text>
            </View>

            {/* Barra meta vs real */}
            <View style={[styles.metaCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.metaRow}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Real</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Meta máx.</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                <View style={[styles.barFill, {
                  width: `${Math.min(cmvPct * 100, 100)}%`,
                  backgroundColor: dentroMeta ? '#06d6a0' : '#ef476f',
                }]} />
                {/* Linha de meta */}
                <View style={[styles.metaLine, { left: `${CMV_META * 100}%` }]} />
              </View>
              <View style={styles.metaRow}>
                <Text style={{ color: dentroMeta ? '#06d6a0' : '#ef476f', fontWeight: '700' }}>
                  {(cmvPct * 100).toFixed(1)}%
                </Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
                  {(CMV_META * 100).toFixed(0)}%
                </Text>
              </View>

              {/* CMV ideal vs real em valor */}
              {dre.receita_bruta > 0 && (
                <View style={[styles.idealRow, { borderTopColor: theme.colors.outlineVariant }]}>
                  <View style={styles.idealItem}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>CMV ideal (35%)</Text>
                    <Text style={{ color: '#06d6a0', fontWeight: '700', fontSize: 16 }}>
                      {formatCurrency(dre.receita_bruta * CMV_META)}
                    </Text>
                  </View>
                  <View style={styles.idealItem}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Diferença</Text>
                    <Text style={{
                      color: dentroMeta ? '#06d6a0' : '#ef476f',
                      fontWeight: '700', fontSize: 16,
                    }}>
                      {formatCurrency(Math.abs(dre.cmv_total - dre.receita_bruta * CMV_META))}
                      {dentroMeta ? ' abaixo' : ' acima'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Receita de referência */}
            <View style={[styles.refCard, { backgroundColor: theme.colors.surface }]}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Receita Bruta</Text>
              <Text variant="titleMedium" style={{ color: '#06d6a0', fontWeight: '600' }}>
                {formatCurrency(dre.receita_bruta)}
              </Text>
            </View>

            {/* Indicadores por atendimento */}
            {dre.at_total > 0 && (
              <View style={[styles.refCard, { backgroundColor: theme.colors.surface }]}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>CMV por atendimento</Text>
                <Text variant="titleMedium" style={{ color: '#f4a261', fontWeight: '600' }}>
                  {formatCurrency(dre.cmv_total / dre.at_total)}
                </Text>
              </View>
            )}

            {/* Breakdown por seção */}
            {items.length > 0 && (
              <>
                <Text variant="titleMedium" style={styles.sectionTitle}>Breakdown por Seção</Text>
                {items.map(item => {
                  const itemPct = dre.cmv_total > 0 ? (item.value / dre.cmv_total) * 100 : 0;
                  const recPct  = dre.receita_bruta > 0 ? (item.value / dre.receita_bruta) * 100 : 0;
                  return (
                    <View key={item.label} style={[styles.barRow, { backgroundColor: theme.colors.surface }]}>
                      <View style={styles.barHeader}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{item.label}</Text>
                        <View style={styles.barValues}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginRight: 8 }}>
                            {recPct.toFixed(1)}% receita
                          </Text>
                          <Text variant="bodyMedium" style={{ color: '#ef476f', fontWeight: '600' }}>
                            {formatCurrency(item.value)}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={[styles.barFill, {
                          width: `${Math.min(itemPct, 100)}%`, backgroundColor: '#ef476f',
                        }]} />
                      </View>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {itemPct.toFixed(1)}% do CMV total
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12, marginBottom: 8,
  },
  navBtn: { padding: 4 },
  center: { padding: 60, alignItems: 'center' },
  errorText: { color: '#ef476f', textAlign: 'center', padding: 20 },
  emptyText: { textAlign: 'center', padding: 40 },
  content: { paddingHorizontal: 16 },
  totalCard: { borderRadius: 16, padding: 20, marginBottom: 12 },
  totalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  metaCard: { borderRadius: 14, padding: 16, marginBottom: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barTrack: { height: 12, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  barFill: { height: 12, borderRadius: 6 },
  metaLine: {
    position: 'absolute', top: 0, width: 2, height: 12, backgroundColor: '#333',
  },
  idealRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth,
  },
  idealItem: { alignItems: 'center', gap: 4 },
  refCard: {
    borderRadius: 12, padding: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontWeight: '700', marginBottom: 12, marginTop: 4 },
  barRow: { borderRadius: 12, padding: 14, marginBottom: 10 },
  barHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  barValues: { flexDirection: 'row', alignItems: 'center' },
});
