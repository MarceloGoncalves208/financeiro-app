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

export interface DREMensal {
  ano: number;
  mes: number;
  receita_bruta: number;
  receita_cartao: number;
  receita_voucher: number;
  receita_dinheiro: number;
  receita_entrega: number;
  cmv_total: number;
  cmv_buffet: number;
  cmv_churrasqueira: number;
  cmv_lanchonete: number;
  cmv_bebidas: number;
  cmv_frutas_suco: number;
  cmv_sobremesas: number;
  lucro_bruto: number;
  desp_administrativo: number;
  desp_operacional: number;
  desp_marketing: number;
  desp_total: number;
  resultado_liquido: number;
}

export interface FluxoCaixaDiario {
  data: string;
  dia: number;
  mes: number;
  ano: number;
  entradas: number;
  saidas: number;
  saldo_dia: number;
}

export interface AtendimentoMensal {
  ano: number;
  mes: number;
  buffet: number;
  prato_feito: number;
  churrasco: number;
  total: number;
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

// Lançamentos por mês
export async function getLancamentosMes(ano: number, mes: number): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .eq('ano', ano)
    .eq('mes', mes)
    .order('data');
  if (error) throw error;
  return data || [];
}

// DRE mensal
export async function getDREMensal(ano?: number, mes?: number): Promise<DREMensal[]> {
  let query = supabase.from('dre_mensal').select('*');
  if (ano) query = query.eq('ano', ano);
  if (mes) query = query.eq('mes', mes);
  const { data, error } = await query.order('ano').order('mes');
  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    receita_bruta: Number(row.receita_bruta),
    receita_cartao: Number(row.receita_cartao),
    receita_voucher: Number(row.receita_voucher),
    receita_dinheiro: Number(row.receita_dinheiro),
    receita_entrega: Number(row.receita_entrega),
    cmv_total: Number(row.cmv_total),
    cmv_buffet: Number(row.cmv_buffet),
    cmv_churrasqueira: Number(row.cmv_churrasqueira),
    cmv_lanchonete: Number(row.cmv_lanchonete),
    cmv_bebidas: Number(row.cmv_bebidas),
    cmv_frutas_suco: Number(row.cmv_frutas_suco),
    cmv_sobremesas: Number(row.cmv_sobremesas),
    lucro_bruto: Number(row.lucro_bruto),
    desp_administrativo: Number(row.desp_administrativo),
    desp_operacional: Number(row.desp_operacional),
    desp_marketing: Number(row.desp_marketing),
    desp_total: Number(row.desp_total),
    resultado_liquido: Number(row.resultado_liquido),
  }));
}

// Fluxo de caixa diário
export async function getFluxoCaixaDiario(ano: number, mes: number): Promise<FluxoCaixaDiario[]> {
  const { data, error } = await supabase
    .from('fluxo_caixa_diario')
    .select('*')
    .eq('ano', ano)
    .eq('mes', mes)
    .order('data');
  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    entradas: Number(row.entradas),
    saidas: Number(row.saidas),
    saldo_dia: Number(row.saldo_dia),
  }));
}

// Atendimentos mensais
export async function getAtendimentosMensais(ano?: number): Promise<AtendimentoMensal[]> {
  let query = supabase.from('atendimentos_mensais').select('*');
  if (ano) query = query.eq('ano', ano);
  const { data, error } = await query.order('ano').order('mes');
  if (error) throw error;
  return (data || []).map(row => ({
    ...row,
    buffet: Number(row.buffet),
    prato_feito: Number(row.prato_feito),
    churrasco: Number(row.churrasco),
    total: Number(row.total),
  }));
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

// Deletar lançamento
export async function deletarLancamento(id: string): Promise<void> {
  const { error } = await supabase
    .from('lancamentos')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
