import { supabase } from './supabase';

export interface Lancamento {
  id: string;
  data: string;
  cod: number;
  valor: number;
  discriminacao: string;
  flag: 'R' | 'V' | 'F' | 'AT';
  dia: number;
  mes: number;
  ano: number;
  observacao?: string;
}

export interface PlanoConta {
  cod: number;
  nome: string;
  flag: 'G' | 'R' | 'V' | 'F' | 'AT';
  grupo_cod: number | null;
}

// Plano de Contas
export async function getPlanoContas(): Promise<PlanoConta[]> {
  const { data, error } = await supabase
    .from('plano_contas')
    .select('*')
    .order('cod');
  if (error) throw error;
  return data || [];
}

// Lançamentos por intervalo de datas (YYYY-MM-DD)
// Usa ano/mes/dia para compatibilidade com registros antigos
export async function getLancamentosPeriodo(startDate: string, endDate: string): Promise<Lancamento[]> {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);

  // Coleta todos os pares ano/mes no intervalo
  const months: { ano: number; mes: number }[] = [];
  let cy = sy, cm = sm;
  while (cy < ey || (cy === ey && cm <= em)) {
    months.push({ ano: cy, mes: cm });
    cm++;
    if (cm > 12) { cm = 1; cy++; }
  }

  // Busca todos os meses em paralelo
  const results = await Promise.all(
    months.map(({ ano, mes }) =>
      supabase
        .from('lancamentos')
        .select('*')
        .eq('ano', ano)
        .eq('mes', mes)
        .order('dia')
        .then(({ data, error }) => {
          if (error) throw error;
          return (data || []) as Lancamento[];
        })
    )
  );

  // Filtra por dia nas bordas
  const all = results.flat();
  return all.filter(l => {
    if (l.ano === sy && l.mes === sm && l.dia < sd) return false;
    if (l.ano === ey && l.mes === em && l.dia > ed) return false;
    return true;
  });
}

// Inserir lançamento
export async function inserirLancamento(lancamento: Omit<Lancamento, 'id'>): Promise<Lancamento> {
  const { data, error } = await supabase
    .from('lancamentos')
    .insert(lancamento)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Atualizar lançamento
export async function atualizarLancamento(id: string, dados: Partial<Omit<Lancamento, 'id'>>): Promise<void> {
  const { error } = await supabase
    .from('lancamentos')
    .update(dados)
    .eq('id', id);
  if (error) throw error;
}

// Deletar lançamento
export async function deletarLancamento(id: string): Promise<void> {
  const { error } = await supabase
    .from('lancamentos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── DRE computada direto dos lançamentos ────────────────────────────────────

export interface DREComputada {
  ano: number;
  mes: number;
  // Receitas
  receita_cartao: number;
  receita_voucher: number;
  receita_dinheiro: number;
  receita_ifood: number;
  receita_99food: number;
  receita_keeta: number;
  receita_bruta: number;
  // CMV
  cmv_buffet: number;
  cmv_churrasqueira: number;
  cmv_lanchonete: number;
  cmv_bebidas: number;
  cmv_frutas_suco: number;
  cmv_sobremesas: number;
  cmv_total: number;
  lucro_bruto: number;
  // Despesas
  desp_pessoal: number;
  desp_impostos: number;
  desp_fixas: number;
  desp_operacional: number;
  desp_marketing: number;
  desp_total: number;
  resultado_liquido: number;
  // Atendimentos (flag=AT, valor = nº coberto/pedido)
  at_buffet: number;
  at_prato_feito: number;
  at_churrasco: number;
  at_ifood: number;
  at_99food: number;
  at_keeta: number;
  at_total: number;
  // Contagem de dias com movimento
  dias_operacao: number;
}

export async function computeDREMes(ano: number, mes: number): Promise<DREComputada> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('cod, valor, flag, dia')
    .eq('ano', ano)
    .eq('mes', mes);
  if (error) throw error;
  const rows = data || [];

  const sum = (cods: number[], flags: string[]) =>
    rows.filter(r => flags.includes(r.flag) && cods.includes(r.cod))
        .reduce((acc, r) => acc + Number(r.valor), 0);

  const receita_cartao    = sum([1],   ['R']);
  const receita_voucher   = sum([2],   ['R']);
  const receita_dinheiro  = sum([3],   ['R']);
  const receita_ifood     = sum([4],   ['R']);
  const receita_99food    = sum([5],   ['R']);
  const receita_keeta     = sum([6],   ['R']);
  const receita_bruta     = receita_cartao + receita_voucher + receita_dinheiro + receita_ifood + receita_99food + receita_keeta;

  const cmv_buffet        = sum([101], ['V']);
  const cmv_churrasqueira = sum([102], ['V']);
  const cmv_lanchonete    = sum([103], ['V']);
  const cmv_bebidas       = sum([104], ['V']);
  const cmv_frutas_suco   = sum([105], ['V']);
  const cmv_sobremesas    = sum([106], ['V']);
  const cmv_total         = cmv_buffet + cmv_churrasqueira + cmv_lanchonete + cmv_bebidas + cmv_frutas_suco + cmv_sobremesas;
  const lucro_bruto       = receita_bruta - cmv_total;

  const codRange = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const desp_pessoal    = sum(codRange(201, 209), ['F']);
  const desp_impostos   = sum([210],               ['F']);
  const desp_fixas      = sum(codRange(211, 216), ['F']);
  const desp_operacional= sum(codRange(301, 308), ['F']);
  const desp_marketing  = sum(codRange(401, 410), ['F']);
  const desp_total      = desp_pessoal + desp_impostos + desp_fixas + desp_operacional + desp_marketing;
  const resultado_liquido = lucro_bruto - desp_total;

  const at_buffet     = sum([2000], ['AT']);
  const at_prato_feito= sum([3000], ['AT']);
  const at_churrasco  = sum([4000], ['AT']);
  const at_ifood      = sum([5001], ['AT']);
  const at_99food     = sum([5002], ['AT']);
  const at_keeta      = sum([5003], ['AT']);
  const at_total      = at_buffet + at_prato_feito + at_churrasco + at_ifood + at_99food + at_keeta;

  const diasSet = new Set(rows.filter(r => r.flag === 'R').map(r => r.dia));
  const dias_operacao = diasSet.size;

  return {
    ano, mes,
    receita_cartao, receita_voucher, receita_dinheiro, receita_ifood, receita_99food, receita_keeta, receita_bruta,
    cmv_buffet, cmv_churrasqueira, cmv_lanchonete, cmv_bebidas, cmv_frutas_suco, cmv_sobremesas, cmv_total,
    lucro_bruto, desp_pessoal, desp_impostos, desp_fixas, desp_operacional, desp_marketing, desp_total,
    resultado_liquido,
    at_buffet, at_prato_feito, at_churrasco, at_ifood, at_99food, at_keeta, at_total,
    dias_operacao,
  };
}

// ─── Fluxo de caixa computado direto dos lançamentos ─────────────────────────

export interface FluxoDia {
  dia: number;
  entradas: number;
  saidas: number;
  saldo_acumulado: number;
}

export async function computeFluxoCaixaMes(ano: number, mes: number): Promise<FluxoDia[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('dia, valor, flag')
    .eq('ano', ano)
    .eq('mes', mes);
  if (error) throw error;
  const rows = data || [];

  const diasMap = new Map<number, { entradas: number; saidas: number }>();
  for (const r of rows) {
    if (r.flag === 'AT') continue;
    const entry = diasMap.get(r.dia) ?? { entradas: 0, saidas: 0 };
    if (r.flag === 'R') entry.entradas += Number(r.valor);
    else entry.saidas += Number(r.valor);
    diasMap.set(r.dia, entry);
  }

  const dias = Array.from(diasMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([dia, v]) => ({ dia, ...v }));

  let acumulado = 0;
  return dias.map(d => {
    acumulado += d.entradas - d.saidas;
    return { dia: d.dia, entradas: d.entradas, saidas: d.saidas, saldo_acumulado: acumulado };
  });
}
