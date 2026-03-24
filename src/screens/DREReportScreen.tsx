import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, useTheme, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatCurrency, getMonthName } from '../utils/helpers';
import { computeDREMes, DREComputada } from '../services/lancamentos';

export default function DREReportScreen() {
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
      setDre(data.receita_bruta > 0 || data.desp_total > 0 ? data : null);
    } catch {
      setError('Erro ao carregar DRE.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ano, mes]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);

  const prevMes = () => { if (mes === 1) { setMes(12); setAno(a => a - 1); } else setMes(m => m - 1); };
  const nextMes = () => { if (mes === 12) { setMes(1); setAno(a => a + 1); } else setMes(m => m + 1); };

  const pct = (val: number) =>
    !dre || dre.receita_bruta === 0 ? '—' : `${((val / dre.receita_bruta) * 100).toFixed(1)}%`;

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
            Sem lançamentos para {getMonthName(mes - 1)} {ano}
          </Text>
        )}

        {!loading && !error && dre && (
          <View style={styles.content}>

            {/* ── PAINEL DE INTELIGÊNCIA ───────────────────────────── */}
            <View style={[styles.intelCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.secLabel, { color: theme.colors.primary }]}>INTELIGÊNCIA FINANCEIRA</Text>
              <View style={styles.intelGrid}>
                <IntelItem
                  label="Mg. Bruta"
                  value={`${dre.receita_bruta > 0 ? ((dre.lucro_bruto / dre.receita_bruta) * 100).toFixed(1) : '0'}%`}
                  color="#4361ee"
                />
                <IntelItem
                  label="Mg. Líquida"
                  value={`${dre.receita_bruta > 0 ? ((dre.resultado_liquido / dre.receita_bruta) * 100).toFixed(1) : '0'}%`}
                  color={dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f'}
                />
                <IntelItem
                  label="CMV %"
                  value={`${dre.receita_bruta > 0 ? ((dre.cmv_total / dre.receita_bruta) * 100).toFixed(1) : '0'}%`}
                  color={dre.receita_bruta > 0 && dre.cmv_total / dre.receita_bruta <= 0.35 ? '#06d6a0' : '#ffd166'}
                  sub="meta < 35%"
                />
                <IntelItem
                  label="Desp. Fixas %"
                  value={`${dre.receita_bruta > 0 ? ((dre.desp_total / dre.receita_bruta) * 100).toFixed(1) : '0'}%`}
                  color="#ef476f"
                />
                {dre.at_total > 0 && (
                  <IntelItem
                    label="Ticket Médio"
                    value={formatCurrency(dre.receita_bruta / dre.at_total)}
                    color="#7c3aed"
                  />
                )}
                {dre.dias_operacao > 0 && (
                  <IntelItem
                    label="Rec. média/dia"
                    value={formatCurrency(dre.receita_bruta / dre.dias_operacao)}
                    color="#06d6a0"
                    sub={`${dre.dias_operacao} dias`}
                  />
                )}
              </View>
            </View>

            {/* ── RECEITAS ─────────────────────────────────────────── */}
            <DRESection title="RECEITAS" color="#06d6a0">
              {dre.receita_cartao   > 0 && <DRERow label="Cartão"       value={dre.receita_cartao}   pct={pct(dre.receita_cartao)}   theme={theme} />}
              {dre.receita_voucher  > 0 && <DRERow label="Voucher"      value={dre.receita_voucher}  pct={pct(dre.receita_voucher)}  theme={theme} />}
              {dre.receita_dinheiro > 0 && <DRERow label="Dinheiro"     value={dre.receita_dinheiro} pct={pct(dre.receita_dinheiro)} theme={theme} />}
              {dre.receita_ifood    > 0 && <DRERow label="iFood"        value={dre.receita_ifood}    pct={pct(dre.receita_ifood)}    theme={theme} />}
              {dre.receita_99food   > 0 && <DRERow label="99Food"       value={dre.receita_99food}   pct={pct(dre.receita_99food)}   theme={theme} />}
              {dre.receita_keeta    > 0 && <DRERow label="Keeta"        value={dre.receita_keeta}    pct={pct(dre.receita_keeta)}    theme={theme} />}
              <DRETotalRow label="Receita Bruta" value={dre.receita_bruta} pct="100.0%" color="#06d6a0" theme={theme} />
            </DRESection>

            {/* ── CMV ──────────────────────────────────────────────── */}
            {dre.cmv_total > 0 && (
              <DRESection title="CMV — CUSTO DAS MERCADORIAS" color="#f4a261">
                {dre.cmv_buffet        > 0 && <DRERow label="Buffet"       value={dre.cmv_buffet}        pct={pct(dre.cmv_buffet)}        theme={theme} />}
                {dre.cmv_churrasqueira > 0 && <DRERow label="Churrasqueira"value={dre.cmv_churrasqueira} pct={pct(dre.cmv_churrasqueira)} theme={theme} />}
                {dre.cmv_lanchonete    > 0 && <DRERow label="Lanchonete"   value={dre.cmv_lanchonete}    pct={pct(dre.cmv_lanchonete)}    theme={theme} />}
                {dre.cmv_bebidas       > 0 && <DRERow label="Bebidas"      value={dre.cmv_bebidas}       pct={pct(dre.cmv_bebidas)}       theme={theme} />}
                {dre.cmv_frutas_suco   > 0 && <DRERow label="Frutas/Suco"  value={dre.cmv_frutas_suco}   pct={pct(dre.cmv_frutas_suco)}   theme={theme} />}
                {dre.cmv_sobremesas    > 0 && <DRERow label="Sobremesas"   value={dre.cmv_sobremesas}    pct={pct(dre.cmv_sobremesas)}    theme={theme} />}
                <DRETotalRow label="Total CMV" value={dre.cmv_total} pct={pct(dre.cmv_total)} color="#f4a261" theme={theme} />
              </DRESection>
            )}

            {/* ── LUCRO BRUTO ───────────────────────────────────────── */}
            <View style={[styles.resultRow, { backgroundColor: '#4361ee15' }]}>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4361ee' }}>Lucro Bruto</Text>
              <View style={styles.valueGroup}>
                <Text variant="bodySmall" style={{ color: '#4361ee', marginRight: 10 }}>{pct(dre.lucro_bruto)}</Text>
                <Text variant="titleMedium" style={{ fontWeight: '700', color: '#4361ee' }}>{formatCurrency(dre.lucro_bruto)}</Text>
              </View>
            </View>

            {/* ── DESPESAS ─────────────────────────────────────────── */}
            {dre.desp_total > 0 && (
              <DRESection title="DESPESAS" color="#ef476f">
                {dre.desp_pessoal     > 0 && <DRERow label="Pessoal"      value={dre.desp_pessoal}     pct={pct(dre.desp_pessoal)}     theme={theme} />}
                {dre.desp_impostos    > 0 && <DRERow label="Impostos"     value={dre.desp_impostos}    pct={pct(dre.desp_impostos)}    theme={theme} />}
                {dre.desp_fixas       > 0 && <DRERow label="Fixas"        value={dre.desp_fixas}       pct={pct(dre.desp_fixas)}       theme={theme} />}
                {dre.desp_operacional > 0 && <DRERow label="Operacional"  value={dre.desp_operacional} pct={pct(dre.desp_operacional)} theme={theme} />}
                {dre.desp_marketing   > 0 && <DRERow label="Marketing"    value={dre.desp_marketing}   pct={pct(dre.desp_marketing)}   theme={theme} />}
                <DRETotalRow label="Total Despesas" value={dre.desp_total} pct={pct(dre.desp_total)} color="#ef476f" theme={theme} />
              </DRESection>
            )}

            {/* ── RESULTADO LÍQUIDO ─────────────────────────────────── */}
            <View style={[styles.resultRow, {
              backgroundColor: dre.resultado_liquido >= 0 ? '#06d6a015' : '#ef476f15',
            }]}>
              <Text variant="titleLarge" style={{
                fontWeight: '700',
                color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f',
              }}>
                {dre.resultado_liquido >= 0 ? 'Lucro Líquido' : 'Prejuízo'}
              </Text>
              <View style={styles.valueGroup}>
                <Text variant="bodySmall" style={{
                  color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f', marginRight: 10,
                }}>
                  {pct(dre.resultado_liquido)}
                </Text>
                <Text variant="titleLarge" style={{
                  fontWeight: '700',
                  color: dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f',
                }}>
                  {formatCurrency(dre.resultado_liquido)}
                </Text>
              </View>
            </View>

            {/* ── ATENDIMENTOS ─────────────────────────────────────── */}
            {dre.at_total > 0 && (
              <View style={[styles.atendCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.secLabel, { color: theme.colors.primary }]}>ATENDIMENTOS</Text>
                {dre.at_buffet     > 0 && <AtendRow label="Buffet"        value={dre.at_buffet}      theme={theme} />}
                {dre.at_prato_feito> 0 && <AtendRow label="Prato Feito"   value={dre.at_prato_feito} theme={theme} />}
                {dre.at_churrasco  > 0 && <AtendRow label="Churrasco"     value={dre.at_churrasco}   theme={theme} />}
                {dre.at_ifood      > 0 && <AtendRow label="Entrega iFood" value={dre.at_ifood}       theme={theme} />}
                {dre.at_99food     > 0 && <AtendRow label="Entrega 99Food"value={dre.at_99food}      theme={theme} />}
                {dre.at_keeta      > 0 && <AtendRow label="Entrega Keeta" value={dre.at_keeta}       theme={theme} />}
                <Divider style={{ marginVertical: 6 }} />
                <View style={styles.atendTotal}>
                  <Text style={{ fontWeight: '700', color: theme.colors.primary }}>Total</Text>
                  <Text style={{ fontWeight: '700', color: theme.colors.primary, fontSize: 18 }}>
                    {dre.at_total.toLocaleString('pt-BR')}
                  </Text>
                </View>
                {dre.receita_bruta > 0 && (
                  <View style={[styles.ticketCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Ticket médio por atendimento</Text>
                    <Text style={{ fontWeight: '700', color: '#7c3aed', fontSize: 20 }}>
                      {formatCurrency(dre.receita_bruta / dre.at_total)}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      CMV por atend: {formatCurrency(dre.cmv_total / dre.at_total)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── subcomponentes ────────────────────────────────────────────────────────────

function IntelItem({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.intelItem, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text style={{ fontWeight: '700', fontSize: 20, color }}>{value}</Text>
      {sub && <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{sub}</Text>}
    </View>
  );
}

function DRESection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
        <Text variant="labelLarge" style={{ color, fontWeight: '700', letterSpacing: 1 }}>{title}</Text>
      </View>
      {children}
      <Divider style={{ marginTop: 4 }} />
    </View>
  );
}

function DRERow({ label, value, pct, theme }: { label: string; value: number; pct: string; theme: any }) {
  return (
    <View style={styles.dreRow}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>{label}</Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, width: 52, textAlign: 'right' }}>{pct}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, width: 110, textAlign: 'right' }}>{formatCurrency(value)}</Text>
    </View>
  );
}

function DRETotalRow({ label, value, pct, color, theme }: { label: string; value: number; pct: string; color: string; theme: any }) {
  return (
    <View style={[styles.dreRow, styles.totalRow]}>
      <Text variant="bodyMedium" style={{ color, fontWeight: '700', flex: 1 }}>{label}</Text>
      <Text variant="bodySmall" style={{ color, fontWeight: '700', width: 52, textAlign: 'right' }}>{pct}</Text>
      <Text variant="bodyMedium" style={{ color, fontWeight: '700', width: 110, textAlign: 'right' }}>{formatCurrency(value)}</Text>
    </View>
  );
}

function AtendRow({ label, value, theme }: { label: string; value: number; theme: any }) {
  return (
    <View style={styles.dreRow}>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: '600', width: 80, textAlign: 'right' }}>
        {value.toLocaleString('pt-BR')}
      </Text>
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
  content: { paddingHorizontal: 16 },
  intelCard: { borderRadius: 14, padding: 16, marginBottom: 14 },
  intelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  intelItem: { borderRadius: 10, padding: 12, minWidth: '45%', flex: 1, gap: 2 },
  section: { marginBottom: 8 },
  sectionHeader: { borderLeftWidth: 3, paddingLeft: 8, marginBottom: 8, marginTop: 8 },
  dreRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  totalRow: {
    marginTop: 4, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ccc',
  },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, marginVertical: 8,
  },
  valueGroup: { flexDirection: 'row', alignItems: 'center' },
  atendCard: { borderRadius: 14, padding: 16, marginTop: 8, marginBottom: 8 },
  atendTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  ticketCard: { borderRadius: 10, padding: 12, marginTop: 10, alignItems: 'center', gap: 4 },
  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
});
