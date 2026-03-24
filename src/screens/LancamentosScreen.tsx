import React, { useState, useCallback, Platform } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Text, useTheme, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfMonth } from 'date-fns';

import { getLancamentosPeriodo, Lancamento } from '../services/lancamentos';
import { formatCurrency } from '../utils/helpers';

const FLAG_COLOR: Record<string, string> = {
  R:  '#06d6a0',
  V:  '#ffd166',
  F:  '#ef476f',
  AT: '#4361ee',
};
const FLAG_LABEL: Record<string, string> = {
  R:  'Receita',
  V:  'CMV',
  F:  'Despesa',
  AT: 'Atend.',
};

function fmt(d: Date) { return format(d, 'yyyy-MM-dd'); }
function fmtBR(s: string) {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function DateField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  const theme = useTheme();
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{label}</Text>
        <input
          type="date"
          value={value}
          onChange={e => onChange((e.target as HTMLInputElement).value)}
          style={{
            border: `1.5px solid ${theme.colors.outline}`,
            borderRadius: 8,
            padding: '7px 10px',
            fontSize: 14,
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          } as any}
        />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{label}</Text>
      <View style={[styles.dateInput, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
        <Text style={{ color: theme.colors.onSurface, fontSize: 14 }}>{value}</Text>
      </View>
    </View>
  );
}

export default function LancamentosScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const today = new Date();

  const [startDate, setStartDate] = useState(fmt(startOfMonth(today)));
  const [endDate,   setEndDate]   = useState(fmt(today));
  const [applied,   setApplied]   = useState({ start: fmt(startOfMonth(today)), end: fmt(today) });

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const loadData = useCallback(async (start: string, end: string) => {
    try {
      const data = await getLancamentosPeriodo(start, end);
      setLancamentos(data.sort((a, b) => {
        if (a.ano !== b.ano) return b.ano - a.ano;
        if (a.mes !== b.mes) return b.mes - a.mes;
        return b.dia - a.dia;
      }));
    } catch {
      setLancamentos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadData(applied.start, applied.end);
  }, [applied, loadData]));

  const onApply = () => {
    if (startDate && endDate && startDate <= endDate) {
      setLoading(true);
      setApplied({ start: startDate, end: endDate });
    }
  };

  const onRefresh = () => { setRefreshing(true); loadData(applied.start, applied.end); };

  // Agrupa por dia
  type Group = { key: string; label: string; items: Lancamento[]; total: number };
  const groups: Group[] = [];
  for (const l of lancamentos) {
    const key = `${l.ano}-${String(l.mes).padStart(2,'0')}-${String(l.dia).padStart(2,'0')}`;
    let g = groups.find(g => g.key === key);
    if (!g) {
      g = { key, label: `${String(l.dia).padStart(2,'0')}/${String(l.mes).padStart(2,'0')}/${l.ano}`, items: [], total: 0 };
      groups.push(g);
    }
    g.items.push(l);
    g.total += l.flag === 'R' ? l.valor : l.flag === 'F' || l.flag === 'V' ? -l.valor : 0;
  }

  const renderItem = ({ item }: { item: Lancamento }) => {
    const isIncome = item.flag === 'R';
    const isExpense = item.flag === 'F' || item.flag === 'V';
    const color = FLAG_COLOR[item.flag] ?? theme.colors.onSurface;
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EditLancamento', { id: item.id })}
        activeOpacity={0.7}
        style={[styles.item, { borderBottomColor: theme.colors.outlineVariant }]}
      >
        <View style={[styles.flagDot, { backgroundColor: color }]} />
        <View style={styles.itemCenter}>
          <Text variant="bodyMedium" style={{ fontWeight: '600', color: theme.colors.onSurface }}>
            {item.discriminacao}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {FLAG_LABEL[item.flag] ?? item.flag} · cód {item.cod}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text variant="bodyMedium" style={{
            fontWeight: '700',
            color: isIncome ? '#06d6a0' : isExpense ? '#ef476f' : color,
          }}>
            {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(item.valor)}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.outlineVariant} />
        </View>
      </TouchableOpacity>
    );
  };

  const listData: (Group | Lancamento)[] = [];
  for (const g of groups) {
    listData.push(g);
    listData.push(...g.items);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Filtro de datas */}
      <View style={[styles.filterRow, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <DateField label="De" value={startDate} onChange={setStartDate} />
        <Text style={{ color: theme.colors.onSurfaceVariant, paddingTop: 20, paddingHorizontal: 4 }}>→</Text>
        <DateField label="Até" value={endDate} onChange={setEndDate} />
        <TouchableOpacity onPress={onApply} style={[styles.applyBtn, { backgroundColor: theme.colors.primary }]}>
          <MaterialCommunityIcons name="magnify" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Resumo */}
      {!loading && lancamentos.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {lancamentos.length} lançamento{lancamentos.length !== 1 ? 's' : ''} · {fmtBR(applied.start)} – {fmtBR(applied.end)}
          </Text>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => ('key' in item ? `group-${item.key}` : `lanc-${item.id}-${i}`)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            // Cabeçalho de dia
            if ('items' in item) {
              const g = item as Group;
              const totalColor = g.total >= 0 ? '#06d6a0' : '#ef476f';
              return (
                <View style={[styles.dayHeader, {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderBottomColor: theme.colors.outlineVariant,
                }]}>
                  <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '700' }}>
                    {g.label}
                  </Text>
                  {g.total !== 0 && (
                    <Text variant="labelMedium" style={{ color: totalColor, fontWeight: '700' }}>
                      {g.total >= 0 ? '+' : ''}{formatCurrency(g.total)}
                    </Text>
                  )}
                </View>
              );
            }
            return renderItem({ item: item as Lancamento });
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons name="text-box-outline" size={40} color={theme.colors.outlineVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
                Nenhum lançamento no período.
              </Text>
            </View>
          }
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddLancamento', { flags: ['R', 'V', 'F', 'AT'] })}
        color="#fff"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateInput: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  applyBtn: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summary: { paddingHorizontal: 16, paddingVertical: 8 },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  itemCenter: { flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  fab: { position: 'absolute', right: 20, bottom: 20 },
});
