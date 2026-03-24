import React, { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  format, subDays, startOfMonth, endOfMonth, subYears,
  differenceInCalendarDays, parseISO,
} from 'date-fns';

import { formatCurrency } from '../utils/helpers';
import { getLancamentosPeriodo, computeDREMes, Lancamento, DREComputada } from '../services/lancamentos';
import { pctChange, formatPct } from '../utils/periods';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmt(d: Date) { return format(d, 'yyyy-MM-dd'); }
function fmtBR(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

interface PeriodRange { start: string; end: string }

function getPeriodAnterior(start: string, end: string): PeriodRange {
  const s = parseISO(start);
  const e = parseISO(end);
  const days = differenceInCalendarDays(e, s) + 1;
  return { start: fmt(subDays(s, days)), end: fmt(subDays(s, 1)) };
}
function getMesmoPeriodoAnoAnt(start: string, end: string): PeriodRange {
  return { start: fmt(subYears(parseISO(start), 1)), end: fmt(subYears(parseISO(end), 1)) };
}
function getMesmoMesAnoAnt(start: string): PeriodRange {
  const prev = subYears(parseISO(start), 1);
  return { start: fmt(startOfMonth(prev)), end: fmt(endOfMonth(prev)) };
}

interface Metrics {
  entradas: number;
  saidas: number;
  saldo: number;
  dre?: DREComputada;
}

function computeFromLancamentos(rows: Lancamento[]): Metrics {
  const entradas = rows.filter(l => l.flag === 'R').reduce((s, l) => s + l.valor, 0);
  const saidas   = rows.filter(l => l.flag === 'V' || l.flag === 'F').reduce((s, l) => s + l.valor, 0);
  return { entradas, saidas, saldo: entradas - saidas };
}

async function loadMetrics(start: string, end: string): Promise<Metrics> {
  const rows = await getLancamentosPeriodo(start, end);
  const base = computeFromLancamentos(rows);

  const s = parseISO(start);
  const e = parseISO(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    try {
      const dre = await computeDREMes(s.getFullYear(), s.getMonth() + 1);
      if (dre.receita_bruta > 0 || dre.desp_total > 0) return { ...base, dre };
    } catch { /* sem dados */ }
  }
  return base;
}

// ── subcomponentes ─────────────────────────────────────────────────────────────

function DeltaBadge({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) return <Text style={styles.deltaNeutral}>—</Text>;
  const good = inverse ? value <= 0 : value >= 0;
  const color = good ? '#06d6a0' : '#ef476f';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <MaterialCommunityIcons name={value >= 0 ? 'arrow-up' : 'arrow-down'} size={11} color={color} />
      <Text style={[styles.badgeText, { color }]}>{Math.abs(value).toFixed(1)}%</Text>
    </View>
  );
}

function KpiRow({ label, value, prev, color, inverse }: {
  label: string; value: number; prev?: number; color: string; inverse?: boolean;
}) {
  const theme = useTheme();
  const delta = prev !== undefined ? pctChange(value, prev) : null;
  return (
    <View style={[styles.kpiRow, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.kpiLabel, { color: theme.colors.onSurface }]}>{label}</Text>
      {prev !== undefined && (
        <Text style={[styles.kpiPrev, { color: theme.colors.onSurfaceVariant }]}>{formatCurrency(prev)}</Text>
      )}
      <Text style={[styles.kpiValue, { color }]}>{formatCurrency(value)}</Text>
      <DeltaBadge value={delta} inverse={inverse} />
    </View>
  );
}

function AtendRow({ label, value, prev }: { label: string; value: number; prev?: number }) {
  const theme = useTheme();
  const delta = prev !== undefined ? pctChange(value, prev) : null;
  const dColor = delta === null ? theme.colors.onSurfaceVariant : delta >= 0 ? '#06d6a0' : '#ef476f';
  return (
    <View style={[styles.kpiRow, { borderBottomColor: theme.colors.outlineVariant }]}>
      <Text style={[styles.kpiLabel, { color: theme.colors.onSurface }]}>{label}</Text>
      {prev !== undefined && (
        <Text style={[styles.kpiPrev, { color: theme.colors.onSurfaceVariant }]}>{prev.toLocaleString('pt-BR')}</Text>
      )}
      <Text style={[styles.kpiValue, { color: theme.colors.primary }]}>{value.toLocaleString('pt-BR')}</Text>
      <Text style={[styles.deltaCol, { color: dColor, fontWeight: '700' }]}>{formatPct(delta)}</Text>
    </View>
  );
}

function DateField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const theme = useTheme();
  if (Platform.OS === 'web') {
    return (
      <View style={styles.dateFieldWrap}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{label}</Text>
        <input
          type="date"
          value={value}
          onChange={e => onChange((e.target as HTMLInputElement).value)}
          style={{
            border: `1.5px solid ${theme.colors.outline}`,
            borderRadius: 8, padding: '8px 10px', fontSize: 14,
            backgroundColor: theme.colors.surface, color: theme.colors.onSurface,
            outline: 'none', width: '100%', boxSizing: 'border-box',
          } as any}
        />
      </View>
    );
  }
  return (
    <View style={styles.dateFieldWrap}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{label}</Text>
      <View style={[styles.dateInput, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.onSurface }}>{value || 'AAAA-MM-DD'}</Text>
      </View>
    </View>
  );
}

// ── tela ──────────────────────────────────────────────────────────────────────

const TABS = ['Período ant.', 'Mesmo per. ano ant.', 'Mesmo mês ano ant.'];

export default function DashboardScreen() {
  const theme = useTheme();
  const today = new Date();

  const [startDate, setStartDate] = useState(fmt(startOfMonth(today)));
  const [endDate,   setEndDate]   = useState(fmt(today));
  const [applied,   setApplied]   = useState({ start: fmt(startOfMonth(today)), end: fmt(today) });

  const [main,       setMain]       = useState<Metrics | null>(null);
  const [compList,   setCompList]   = useState<{ metrics: Metrics; label: string; range: string }[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,  setActiveTab]  = useState(0);

  const loadData = useCallback(async (start: string, end: string) => {
    try {
      const ant = getPeriodAnterior(start, end);
      const ano = getMesmoPeriodoAnoAnt(start, end);
      const mes = getMesmoMesAnoAnt(start);

      const [mMain, mAnt, mAno, mMes] = await Promise.all([
        loadMetrics(start, end),
        loadMetrics(ant.start, ant.end),
        loadMetrics(ano.start, ano.end),
        loadMetrics(mes.start, mes.end),
      ]);

      setMain(mMain);
      setCompList([
        { metrics: mAnt, label: 'Período anterior',            range: `${fmtBR(ant.start)} – ${fmtBR(ant.end)}` },
        { metrics: mAno, label: 'Mesmo período — ano passado', range: `${fmtBR(ano.start)} – ${fmtBR(ano.end)}` },
        { metrics: mMes, label: 'Mesmo mês — ano passado',     range: `${fmtBR(mes.start)} – ${fmtBR(mes.end)}` },
      ]);
    } catch {
      setMain(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(applied.start, applied.end); }, [applied]);

  const onApply = () => {
    if (startDate && endDate && startDate <= endDate) {
      setLoading(true);
      setApplied({ start: startDate, end: endDate });
    }
  };
  const onRefresh = () => { setRefreshing(true); loadData(applied.start, applied.end); };

  const dre = main?.dre;
  const comp = compList[activeTab];
  const mainResult = dre ? dre.resultado_liquido : (main?.saldo ?? 0);
  const compResult = comp ? (comp.metrics.dre?.resultado_liquido ?? comp.metrics.saldo) : undefined;
  const deltaResult = compResult !== undefined ? pctChange(mainResult, compResult) : null;
  const duration = differenceInCalendarDays(parseISO(applied.end), parseISO(applied.start)) + 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Gula Grill</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {fmtBR(applied.start)} – {fmtBR(applied.end)} · {duration} dia{duration !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Seletor de datas */}
        <View style={[styles.dateRow, { backgroundColor: theme.colors.surface }]}>
          <DateField label="Data inicial" value={startDate} onChange={setStartDate} />
          <Text style={{ color: theme.colors.onSurfaceVariant, paddingTop: 20 }}>→</Text>
          <DateField label="Data final"   value={endDate}   onChange={setEndDate}   />
          <TouchableOpacity onPress={onApply} style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
        ) : main ? (
          <>
            {/* Resultado em destaque */}
            <View style={[styles.resultCard, {
              backgroundColor: mainResult >= 0 ? '#06d6a022' : '#ef476f22',
              borderColor:     mainResult >= 0 ? '#06d6a0'   : '#ef476f',
            }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {dre
                  ? (mainResult >= 0 ? 'Lucro Líquido' : 'Prejuízo Líquido')
                  : (mainResult >= 0 ? 'Saldo Positivo' : 'Saldo Negativo')}
              </Text>
              <Text variant="displaySmall" style={{
                fontWeight: 'bold',
                color: mainResult >= 0 ? '#06d6a0' : '#ef476f',
                marginVertical: 4,
              }}>
                {formatCurrency(mainResult)}
              </Text>
              <DeltaBadge value={deltaResult} />
            </View>

            {/* Tabs de comparação */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 4, paddingBottom: 8 }}>
              {TABS.map((tab, i) => (
                <TouchableOpacity key={i} onPress={() => setActiveTab(i)}
                  style={[styles.tab, activeTab === i
                    ? { backgroundColor: theme.colors.primary }
                    : { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 12, fontWeight: activeTab === i ? '700' : '400',
                    color: activeTab === i ? '#fff' : theme.colors.onSurfaceVariant }}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tabela principal com comparativo */}
            <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                {dre ? 'DRE DO PERÍODO' : 'FLUXO DO PERÍODO'}
              </Text>
              {comp && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, marginTop: -6 }}>
                  vs {comp.label} ({comp.range})
                </Text>
              )}
              <View style={[styles.tableHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
                <Text style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}> </Text>
                <Text style={[styles.kpiPrev, { color: theme.colors.onSurfaceVariant }]}>{comp ? 'Anterior' : ''}</Text>
                <Text style={[styles.kpiValue, { color: theme.colors.onSurface, fontWeight: '700' }]}>Atual</Text>
                <Text style={[styles.deltaCol, { color: theme.colors.onSurfaceVariant }]}>Δ%</Text>
              </View>

              {dre ? (
                <>
                  <KpiRow label="Receita Bruta" value={dre.receita_bruta}       prev={comp?.metrics.dre?.receita_bruta}       color="#06d6a0" />
                  <KpiRow label="CMV"           value={dre.cmv_total}           prev={comp?.metrics.dre?.cmv_total}           color="#ffd166" inverse />
                  <KpiRow label="Lucro Bruto"   value={dre.lucro_bruto}         prev={comp?.metrics.dre?.lucro_bruto}         color={dre.lucro_bruto >= 0 ? '#06d6a0' : '#ef476f'} />
                  <KpiRow label="Despesas"      value={dre.desp_total}          prev={comp?.metrics.dre?.desp_total}          color="#ef476f" inverse />
                  <KpiRow label="Resultado"     value={dre.resultado_liquido}   prev={comp?.metrics.dre?.resultado_liquido}   color={dre.resultado_liquido >= 0 ? '#06d6a0' : '#ef476f'} />
                </>
              ) : (
                <>
                  <KpiRow label="Entradas" value={main.entradas} prev={comp?.metrics.entradas} color="#06d6a0" />
                  <KpiRow label="Saídas"   value={main.saidas}   prev={comp?.metrics.saidas}   color="#ef476f" inverse />
                  <KpiRow label="Saldo"    value={main.saldo}    prev={comp?.metrics.saldo}    color={main.saldo >= 0 ? '#06d6a0' : '#ef476f'} />
                </>
              )}

              {/* Margens */}
              {dre && (
                <View style={styles.marginRow}>
                  {[
                    { label: 'Mg. Bruta',   val: dre.receita_bruta > 0 ? (dre.lucro_bruto       / dre.receita_bruta) * 100 : 0 },
                    { label: 'Mg. Líquida', val: dre.receita_bruta > 0 ? (dre.resultado_liquido  / dre.receita_bruta) * 100 : 0 },
                    { label: 'CMV %',       val: dre.receita_bruta > 0 ? (dre.cmv_total          / dre.receita_bruta) * 100 : 0 },
                  ].map(item => (
                    <View key={item.label} style={styles.marginItem}>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{item.label}</Text>
                      <Text style={{ fontWeight: '700', fontSize: 20, color: theme.colors.primary }}>
                        {item.val.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Atendimentos (vindo dos lançamentos flag=AT) */}
            {dre && dre.at_total > 0 && (
              <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>ATENDIMENTOS</Text>
                <View style={[styles.tableHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
                  <Text style={[styles.kpiLabel, { color: theme.colors.onSurfaceVariant }]}> </Text>
                  <Text style={[styles.kpiPrev, { color: theme.colors.onSurfaceVariant }]}>{comp ? 'Anterior' : ''}</Text>
                  <Text style={[styles.kpiValue, { color: theme.colors.onSurface, fontWeight: '700' }]}>Atual</Text>
                  <Text style={[styles.deltaCol, { color: theme.colors.onSurfaceVariant }]}>Δ%</Text>
                </View>
                {dre.at_buffet > 0      && <AtendRow label="Buffet"        value={dre.at_buffet}      prev={comp?.metrics.dre?.at_buffet} />}
                {dre.at_prato_feito > 0 && <AtendRow label="Prato Feito"   value={dre.at_prato_feito} prev={comp?.metrics.dre?.at_prato_feito} />}
                {dre.at_churrasco > 0   && <AtendRow label="Churrasco"     value={dre.at_churrasco}   prev={comp?.metrics.dre?.at_churrasco} />}
                {dre.at_ifood > 0       && <AtendRow label="Entrega iFood" value={dre.at_ifood}       prev={comp?.metrics.dre?.at_ifood} />}
                {dre.at_99food > 0      && <AtendRow label="Entrega 99Food"value={dre.at_99food}      prev={comp?.metrics.dre?.at_99food} />}
                {dre.at_keeta > 0       && <AtendRow label="Entrega Keeta" value={dre.at_keeta}       prev={comp?.metrics.dre?.at_keeta} />}
                <AtendRow label="Total" value={dre.at_total} prev={comp?.metrics.dre?.at_total} />

                {/* Ticket médio */}
                {dre.at_total > 0 && dre.receita_bruta > 0 && (
                  <View style={[styles.ticketRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Ticket médio</Text>
                    <Text style={{ fontWeight: '700', color: theme.colors.primary, fontSize: 16 }}>
                      {formatCurrency(dre.receita_bruta / dre.at_total)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View style={styles.center}>
            <MaterialCommunityIcons name="database-off-outline" size={40} color={theme.colors.onSurfaceVariant} />
            <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
              Nenhum dado para o período selecionado.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10 },
  dateRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8, marginBottom: 8,
  },
  dateFieldWrap: { flex: 1 },
  dateInput: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  applyBtn: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  center: { padding: 60, alignItems: 'center' },
  resultCard: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center',
  },
  kpiCard: { marginHorizontal: 16, borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  tableHeader: {
    flexDirection: 'row', paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 2,
  },
  kpiRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  kpiLabel: { flex: 1, fontSize: 14 },
  kpiPrev:  { width: 86, textAlign: 'right', fontSize: 13 },
  kpiValue: { width: 88, textAlign: 'right', fontSize: 13 },
  deltaCol: { width: 52, textAlign: 'right', fontSize: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 8, gap: 2, marginLeft: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  deltaNeutral: { fontSize: 11, color: '#888', marginLeft: 4 },
  marginRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  marginItem: { alignItems: 'center', gap: 2 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  ticketRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, borderRadius: 8, padding: 12,
  },
});
