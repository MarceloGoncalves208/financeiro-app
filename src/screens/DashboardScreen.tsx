import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { StatCard, Card } from '../components';
import { formatCurrency, getMonthName } from '../utils/helpers';
import { getDREMensal, getLancamentosMes, DREMensal, Lancamento } from '../services/lancamentos';

export default function DashboardScreen() {
  const theme = useTheme();
  const navigation = useNavigation();

  const now = new Date();
  const [ano] = useState(now.getFullYear());
  const [mes] = useState(now.getMonth() + 1);

  const [dre, setDre] = useState<DREMensal | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [dreData, lancsData] = await Promise.all([
        getDREMensal(ano, mes),
        getLancamentosMes(ano, mes),
      ]);
      setDre(dreData[0] ?? null);
      setLancamentos(lancsData);
    } catch (e: any) {
      setError('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const monthName = getMonthName(mes - 1);

  const grossMargin =
    dre && dre.receita_bruta > 0
      ? ((dre.lucro_bruto / dre.receita_bruta) * 100)
      : 0;

  const netMargin =
    dre && dre.receita_bruta > 0
      ? ((dre.resultado_liquido / dre.receita_bruta) * 100)
      : 0;

  // Ultimos 8 lancamentos de receita e despesa
  const recentLancs = lancamentos
    .filter((l) => l.flag === 'R' || l.flag === 'F')
    .sort((a, b) => b.dia - a.dia)
    .slice(0, 8);

  const flagLabel: Record<string, string> = {
    R: 'Receita',
    V: 'CMV',
    F: 'Despesa',
    AT: 'Atendimento',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.greeting}>
            Gula Grill
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {monthName} {ano}
          </Text>
        </View>

        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={{ color: '#ef476f', textAlign: 'center' }}>{error}</Text>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* Resultado Liquido */}
            <Card style={styles.balanceCard}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Resultado Liquido
              </Text>
              <Text
                variant="displaySmall"
                style={[
                  styles.balanceValue,
                  { color: (dre?.resultado_liquido ?? 0) >= 0 ? '#06d6a0' : '#ef476f' },
                ]}
              >
                {formatCurrency(dre?.resultado_liquido ?? 0)}
              </Text>
            </Card>

            {/* Stats: Receita Bruta e CMV */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Receita Bruta"
                value={dre?.receita_bruta ?? 0}
                type="income"
                icon="arrow-up-circle"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title="CMV Total"
                value={dre?.cmv_total ?? 0}
                type="expense"
                icon="package-variant"
              />
            </View>

            {/* Stats: Lucro Bruto e Despesas */}
            <View style={styles.statsGrid}>
              <StatCard
                title="Lucro Bruto"
                value={dre?.lucro_bruto ?? 0}
                type="balance"
                icon="trending-up"
              />
              <View style={styles.statSpacer} />
              <StatCard
                title="Desp. Total"
                value={dre?.desp_total ?? 0}
                type="expense"
                icon="arrow-down-circle"
              />
            </View>

            {/* Margens */}
            <Card title="Indicadores">
              <View style={styles.indicatorRow}>
                <View style={styles.indicator}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Margem Bruta
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={{ color: grossMargin >= 0 ? theme.colors.primary : '#ef476f' }}
                  >
                    {grossMargin.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.indicator}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Margem Liquida
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={{ color: netMargin >= 0 ? theme.colors.primary : '#ef476f' }}
                  >
                    {netMargin.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.indicator}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    CMV %
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={{ color: theme.colors.primary }}
                  >
                    {dre && dre.receita_bruta > 0
                      ? ((dre.cmv_total / dre.receita_bruta) * 100).toFixed(1)
                      : '0.0'}%
                  </Text>
                </View>
              </View>
            </Card>

            {/* Ultimos Lancamentos */}
            <Card title="Ultimos Lancamentos">
              {recentLancs.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: 16 }}>
                  Nenhum lancamento registrado
                </Text>
              ) : (
                recentLancs.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.lancItem, { borderBottomColor: theme.colors.outlineVariant }]}
                  >
                    <View style={styles.lancLeft}>
                      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                        {item.discriminacao}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {String(item.dia).padStart(2, '0')}/{String(mes).padStart(2, '0')} · {flagLabel[item.flag] ?? item.flag}
                      </Text>
                    </View>
                    <Text
                      variant="bodyMedium"
                      style={{
                        fontWeight: '700',
                        color: item.flag === 'R' ? '#06d6a0' : '#ef476f',
                      }}
                    >
                      {item.flag === 'R' ? '+' : '-'}{formatCurrency(item.valor)}
                    </Text>
                  </View>
                ))
              )}
            </Card>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  greeting: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  errorCard: {
    marginHorizontal: 20,
  },
  balanceCard: {
    marginHorizontal: 20,
    alignItems: 'center',
    paddingVertical: 24,
  },
  balanceValue: {
    fontWeight: 'bold',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  statSpacer: {
    width: 12,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  indicator: {
    alignItems: 'center',
  },
  lancItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lancLeft: {
    flex: 1,
    marginRight: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});
