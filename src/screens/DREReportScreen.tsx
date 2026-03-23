import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { getDREMensal, DREMensal } from '../services/lancamentos';

export default function DREReportScreen() {
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
      setError('Erro ao carregar DRE.');
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
    if (mes === 1) {
      setMes(12);
      setAno((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
  };

  const nextMes = () => {
    if (mes === 12) {
      setMes(1);
      setAno((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
  };

  const pct = (val: number) => {
    if (!dre || dre.receita_bruta === 0) return '0.0%';
    return `${((val / dre.receita_bruta) * 100).toFixed(1)}%`;
  };

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
          <View style={styles.section}>
            <Text style={{ color: '#ef476f', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {!loading && !error && !dre && (
          <View style={styles.section}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Sem dados para {getMonthName(mes - 1)} {ano}
            </Text>
          </View>
        )}

        {!loading && !error && dre && (
          <View style={styles.dreContainer}>
            {/* RECEITAS */}
            <DRESection title="RECEITAS" color="#06d6a0">
              <DRERow label="Cartao" value={dre.receita_cartao} pct={pct(dre.receita_cartao)} theme={theme} />
              <DRERow label="Voucher" value={dre.receita_voucher} pct={pct(dre.receita_voucher)} theme={theme} />
              <DRERow label="Dinheiro" value={dre.receita_dinheiro} pct={pct(dre.receita_dinheiro)} theme={theme} />
              {dre.receita_entrega > 0 && (
                <DRERow label="Entrega" value={dre.receita_entrega} pct={pct(dre.receita_entrega)} theme={theme} />
              )}
              <DRETotalRow label="Receita Bruta" value={dre.receita_bruta} pct="100.0%" color="#06d6a0" theme={theme} />
            </DRESection>

            {/* CMV */}
            <DRESection title="CMV" color="#f4a261">
              {dre.cmv_buffet > 0 && (
                <DRERow label="Buffet" value={dre.cmv_buffet} pct={pct(dre.cmv_buffet)} theme={theme} />
              )}
              {dre.cmv_churrasqueira > 0 && (
                <DRERow label="Churrasqueira" value={dre.cmv_churrasqueira} pct={pct(dre.cmv_churrasqueira)} theme={theme} />
              )}
              {dre.cmv_lanchonete > 0 && (
                <DRERow label="Lanchonete" value={dre.cmv_lanchonete} pct={pct(dre.cmv_lanchonete)} theme={theme} />
              )}
              {dre.cmv_bebidas > 0 && (
                <DRERow label="Bebidas" value={dre.cmv_bebidas} pct={pct(dre.cmv_bebidas)} theme={theme} />
              )}
              {dre.cmv_frutas_suco > 0 && (
                <DRERow label="Frutas/Suco" value={dre.cmv_frutas_suco} pct={pct(dre.cmv_frutas_suco)} theme={theme} />
              )}
              {dre.cmv_sobremesas > 0 && (
                <DRERow label="Sobremesas" value={dre.cmv_sobremesas} pct={pct(dre.cmv_sobremesas)} theme={theme} />
              )}
              <DRETotalRow label="Total CMV" value={dre.cmv_total} pct={pct(dre.cmv_total)} color="#f4a261" theme={theme} />
            </DRESection>

            {/* LUCRO BRUTO */}
            <View style={[styles.resultRow, { backgroundColor: '#4361ee15' }]}>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4361ee' }}>
                Lucro Bruto
              </Text>
              <View style={styles.valueGroup}>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4361ee', marginRight: 12 }}>
                  {pct(dre.lucro_bruto)}
                </Text>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4361ee' }}>
                  {formatCurrency(dre.lucro_bruto)}
                </Text>
              </View>
            </View>

            {/* DESPESAS */}
            <DRESection title="DESPESAS" color="#ef476f">
              {dre.desp_administrativo > 0 && (
                <DRERow label="Administrativo" value={dre.desp_administrativo} pct={pct(dre.desp_administrativo)} theme={theme} />
              )}
              {dre.desp_operacional > 0 && (
                <DRERow label="Operacional" value={dre.desp_operacional} pct={pct(dre.desp_operacional)} theme={theme} />
              )}
              {dre.desp_marketing > 0 && (
                <DRERow label="Marketing" value={dre.desp_marketing} pct={pct(dre.desp_marketing)} theme={theme} />
              )}
              <DRETotalRow label="Total Despesas" value={dre.desp_total} pct={pct(dre.desp_total)} color="#ef476f" theme={theme} />
            </DRESection>

            {/* RESULTADO LIQUIDO */}
            <View
              style={[
                styles.resultRow,
                { backgroundColor: dre.resultado_liquido >= 0 ? '#06d6a015' : '#ef476f15' },
              ]}
            >
              <Text
                variant="titleLarge"
                style={{ fontWeight: '700', color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f' }}
              >
                Resultado Liquido
              </Text>
              <View style={styles.valueGroup}>
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: '700',
                    color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f',
                    marginRight: 12,
                  }}
                >
                  {pct(dre.resultado_liquido)}
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ fontWeight: '700', color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f' }}
                >
                  {formatCurrency(dre.resultado_liquido)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DRESection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
        <Text variant="labelLarge" style={{ color, fontWeight: '700', letterSpacing: 1 }}>
          {title}
        </Text>
      </View>
      {children}
      <Divider style={{ marginTop: 4 }} />
    </View>
  );
}

function DRERow({ label, value, pct, theme }: { label: string; value: number; pct: string; theme: any }) {
  return (
    <View style={styles.dreRow}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, width: 56, textAlign: 'right' }}>
        {pct}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, width: 110, textAlign: 'right' }}>
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function DRETotalRow({
  label, value, pct, color, theme,
}: {
  label: string; value: number; pct: string; color: string; theme: any;
}) {
  return (
    <View style={[styles.dreRow, styles.totalRow]}>
      <Text variant="bodyMedium" style={{ color, fontWeight: '700', flex: 1 }}>
        {label}
      </Text>
      <Text variant="bodySmall" style={{ color, fontWeight: '700', width: 56, textAlign: 'right' }}>
        {pct}
      </Text>
      <Text variant="bodyMedium" style={{ color, fontWeight: '700', width: 110, textAlign: 'right' }}>
        {formatCurrency(value)}
      </Text>
    </View>
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
  navBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  dreContainer: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  dreRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
