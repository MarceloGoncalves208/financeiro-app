import { format, subDays, startOfMonth, endOfMonth, subMonths, subYears, startOfDay, endOfDay } from 'date-fns';

export type PeriodId =
  | 'hoje'
  | 'ontem'
  | '7dias'
  | '14dias'
  | '21dias'
  | 'este_mes'
  | 'mes_passado'
  | 'mesmo_periodo_mes_ant'
  | 'mesmo_periodo_ano_ant'
  | 'mesmo_mes_ano_ant';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface Period {
  id: PeriodId;
  label: string;
  shortLabel: string;
}

export const PERIODS: Period[] = [
  { id: 'hoje',                  label: 'Hoje',                        shortLabel: 'Hoje'     },
  { id: 'ontem',                 label: 'Ontem',                       shortLabel: 'Ontem'    },
  { id: '7dias',                 label: 'Últimos 7 dias',              shortLabel: '7 dias'   },
  { id: '14dias',                label: 'Últimos 14 dias',             shortLabel: '14 dias'  },
  { id: '21dias',                label: 'Últimos 21 dias',             shortLabel: '21 dias'  },
  { id: 'este_mes',              label: 'Este mês',                    shortLabel: 'Este mês' },
  { id: 'mes_passado',           label: 'Mês passado',                 shortLabel: 'Mês ant.' },
  { id: 'mesmo_periodo_mes_ant', label: 'Mesmo período mês passado',   shortLabel: 'Per. mês ant.' },
  { id: 'mesmo_periodo_ano_ant', label: 'Mesmo período ano passado',   shortLabel: 'Per. ano ant.' },
  { id: 'mesmo_mes_ano_ant',     label: 'Mesmo mês ano passado',       shortLabel: 'Mês ano ant.' },
];

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export function getDateRange(periodId: PeriodId, ref: Date = new Date()): DateRange {
  const today = startOfDay(ref);
  const todayEnd = endOfDay(ref);

  switch (periodId) {
    case 'hoje':
      return { start: today, end: todayEnd, label: `Hoje — ${fmt(today)}` };

    case 'ontem': {
      const d = subDays(today, 1);
      return { start: d, end: endOfDay(d), label: `Ontem — ${fmt(d)}` };
    }

    case '7dias': {
      const s = subDays(today, 6);
      return { start: s, end: todayEnd, label: `${fmt(s)} a ${fmt(today)}` };
    }

    case '14dias': {
      const s = subDays(today, 13);
      return { start: s, end: todayEnd, label: `${fmt(s)} a ${fmt(today)}` };
    }

    case '21dias': {
      const s = subDays(today, 20);
      return { start: s, end: todayEnd, label: `${fmt(s)} a ${fmt(today)}` };
    }

    case 'este_mes': {
      const s = startOfMonth(today);
      return { start: s, end: todayEnd, label: `${fmt(s)} a ${fmt(today)}` };
    }

    case 'mes_passado': {
      const prev = subMonths(today, 1);
      const s = startOfMonth(prev);
      const e = endOfMonth(prev);
      return { start: s, end: e, label: `${fmt(s)} a ${fmt(e)}` };
    }

    case 'mesmo_periodo_mes_ant': {
      const daysElapsed = today.getDate() - 1; // 0-based days passed this month
      const prevMonth = subMonths(today, 1);
      const s = startOfMonth(prevMonth);
      const e = endOfDay(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), today.getDate()));
      return { start: s, end: e, label: `${fmt(s)} a ${fmt(e)}` };
    }

    case 'mesmo_periodo_ano_ant': {
      const s = subYears(startOfMonth(today), 1);
      const e = subYears(today, 1);
      return { start: s, end: e, label: `${fmt(s)} a ${fmt(e)}` };
    }

    case 'mesmo_mes_ano_ant': {
      const prevYear = subYears(today, 1);
      const s = startOfMonth(prevYear);
      const e = endOfMonth(prevYear);
      return { start: s, end: e, label: `${fmt(s)} a ${fmt(e)}` };
    }
  }
}

/** Para cada período principal, qual é o período de comparação automático */
export function getComparisonPeriod(periodId: PeriodId): PeriodId | null {
  const map: Partial<Record<PeriodId, PeriodId>> = {
    hoje:                  'ontem',
    ontem:                 'mesmo_periodo_mes_ant',
    '7dias':               '7dias',   // handled specially: previous 7 days
    '14dias':              '14dias',
    '21dias':              '21dias',
    este_mes:              'mesmo_periodo_mes_ant',
    mes_passado:           'mesmo_mes_ano_ant',
    mesmo_periodo_mes_ant: 'mesmo_periodo_ano_ant',
    mesmo_periodo_ano_ant: null,
    mesmo_mes_ano_ant:     null,
  };
  return map[periodId] ?? null;
}

/** Período anterior (offset) para 7/14/21 dias */
export function getPreviousRangeDays(days: number, ref: Date = new Date()): DateRange {
  const today = startOfDay(ref);
  const e = subDays(today, days);
  const s = subDays(today, days * 2 - 1);
  return { start: s, end: endOfDay(e), label: `${fmt(s)} a ${fmt(e)}` };
}

export interface PeriodMetrics {
  receitas: number;
  cmv: number;
  despesas: number;
  resultado: number;
  margem_bruta: number;  // %
  margem_liquida: number; // %
  cmv_pct: number; // %
}

export function calcMetrics(lancamentos: { flag: string; valor: number }[]): PeriodMetrics {
  const receitas  = lancamentos.filter(l => l.flag === 'R').reduce((s, l) => s + l.valor, 0);
  const cmv       = lancamentos.filter(l => l.flag === 'V').reduce((s, l) => s + l.valor, 0);
  const despesas  = lancamentos.filter(l => l.flag === 'F').reduce((s, l) => s + l.valor, 0);
  const lucro_bruto = receitas - cmv;
  const resultado = lucro_bruto - despesas;

  return {
    receitas,
    cmv,
    despesas,
    resultado,
    margem_bruta:   receitas > 0 ? (lucro_bruto / receitas) * 100 : 0,
    margem_liquida: receitas > 0 ? (resultado / receitas) * 100 : 0,
    cmv_pct:        receitas > 0 ? (cmv / receitas) * 100 : 0,
  };
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function formatPct(value: number | null): string {
  if (value === null) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
