import {
  Income,
  Expense,
  Inventory,
  DREReport,
  CMVReport,
  CashFlowReport,
  TransactionStatus,
  IncomeCategory,
  ExpenseCategory,
  CompanySettings
} from '../types';

// ============== HELPERS ==============

export function filterByPeriod<T extends { competenceDate: Date }>(
  items: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return items.filter((item) => {
    const date = new Date(item.competenceDate);
    return date >= startDate && date <= endDate;
  });
}

export function sumAmounts<T extends { amount: number }>(items: T[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ============== DRE ==============

export function calculateDRE(
  incomes: Income[],
  expenses: Expense[],
  startDate: Date,
  endDate: Date,
  settings?: CompanySettings
): DREReport {
  // Filtrar por periodo e status completado
  const periodIncomes = filterByPeriod(incomes, startDate, endDate)
    .filter((i) => i.status === TransactionStatus.COMPLETED);

  const periodExpenses = filterByPeriod(expenses, startDate, endDate)
    .filter((e) => e.status === TransactionStatus.COMPLETED);

  // Receita Bruta
  const grossRevenue = sumAmounts(periodIncomes);

  // Deducoes (simplificado - pode ser expandido)
  const taxRate = settings?.taxRates
    ? (settings.taxRates.pis + settings.taxRates.cofins + settings.taxRates.icms) / 100
    : 0.0925; // Taxa padrao simplificada

  const deductions = {
    taxes: grossRevenue * taxRate,
    returns: 0, // Implementar quando houver controle de devolucoes
    discounts: 0, // Implementar quando houver controle de descontos
    total: grossRevenue * taxRate,
  };

  // Receita Liquida
  const netRevenue = grossRevenue - deductions.total;

  // CMV - Custos das Mercadorias Vendidas
  const cmvExpenses = periodExpenses.filter((e) => e.isCMV);
  const cmv = sumAmounts(cmvExpenses);

  // Lucro Bruto
  const grossProfit = netRevenue - cmv;

  // Despesas Operacionais
  const administrativeExpenses = periodExpenses
    .filter((e) => e.category === ExpenseCategory.ADMINISTRATIVE && !e.isCMV);
  const commercialExpenses = periodExpenses
    .filter((e) => e.category === ExpenseCategory.COMMERCIAL && !e.isCMV);
  const financialExpenses = periodExpenses
    .filter((e) => e.category === ExpenseCategory.FINANCIAL && !e.isCMV);

  const operatingExpenses = {
    administrative: sumAmounts(administrativeExpenses),
    commercial: sumAmounts(commercialExpenses),
    financial: sumAmounts(financialExpenses),
    total: sumAmounts(administrativeExpenses) +
           sumAmounts(commercialExpenses) +
           sumAmounts(financialExpenses),
  };

  // Lucro Operacional (EBIT)
  const operatingProfit = grossProfit - operatingExpenses.total;

  // Resultado Financeiro
  const financialIncomes = periodIncomes
    .filter((i) => i.category === IncomeCategory.FINANCIAL_INCOME);

  const financialResult = {
    income: sumAmounts(financialIncomes),
    expenses: operatingExpenses.financial,
    total: sumAmounts(financialIncomes) - operatingExpenses.financial,
  };

  // Lucro Antes do IR (LAIR)
  const profitBeforeTaxes = operatingProfit + financialResult.total;

  // IR e CSLL (simplificado)
  const ircsllRate = settings?.taxRates
    ? (settings.taxRates.irpj + settings.taxRates.csll) / 100
    : 0.34; // 25% IRPJ + 9% CSLL

  const taxes = profitBeforeTaxes > 0 ? profitBeforeTaxes * ircsllRate : 0;

  // Lucro Liquido
  const netProfit = profitBeforeTaxes - taxes;

  // Margens
  const margins = {
    gross: netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0,
    operating: netRevenue > 0 ? (operatingProfit / netRevenue) * 100 : 0,
    net: netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0,
  };

  return {
    period: { startDate, endDate },
    grossRevenue,
    deductions,
    netRevenue,
    cmv,
    grossProfit,
    operatingExpenses,
    operatingProfit,
    financialResult,
    profitBeforeTaxes,
    taxes,
    netProfit,
    margins,
  };
}

// ============== CMV ==============

export function calculateCMV(
  inventoryRecords: Inventory[],
  startDate: Date,
  endDate: Date
): CMVReport {
  // Filtrar registros do periodo
  const periodRecords = inventoryRecords.filter((record) => {
    const date = new Date(record.date);
    return date >= startDate && date <= endDate;
  });

  // Estoque Inicial (primeiro registro do tipo 'initial' ou do periodo anterior)
  const initialInventoryRecord = periodRecords.find((r) => r.type === 'initial');
  const initialInventory = initialInventoryRecord?.totalCost || 0;

  // Compras do periodo
  const purchases = periodRecords
    .filter((r) => r.type === 'purchase')
    .reduce((sum, r) => sum + r.totalCost, 0);

  // Devolucoes de compras (se houver ajustes negativos)
  const purchaseReturns = periodRecords
    .filter((r) => r.type === 'adjustment' && r.totalCost < 0)
    .reduce((sum, r) => sum + Math.abs(r.totalCost), 0);

  // Frete sobre compras (poderia ser uma categoria separada)
  const freight = 0; // Implementar se necessario

  // Mercadorias disponiveis
  const availableGoods = initialInventory + purchases - purchaseReturns + freight;

  // Estoque Final
  const finalInventoryRecord = periodRecords.find((r) => r.type === 'final');
  const finalInventory = finalInventoryRecord?.totalCost || 0;

  // CMV = Estoque Inicial + Compras - Devolucoes + Frete - Estoque Final
  const cmv = availableGoods - finalInventory;

  return {
    period: { startDate, endDate },
    initialInventory,
    purchases,
    purchaseReturns,
    freight,
    availableGoods,
    finalInventory,
    cmv: Math.max(0, cmv), // CMV nao pode ser negativo
  };
}

// ============== FLUXO DE CAIXA ==============

export function calculateCashFlow(
  incomes: Income[],
  expenses: Expense[],
  startDate: Date,
  endDate: Date,
  initialBalance: number = 0
): CashFlowReport {
  // Filtrar por periodo (usar data de recebimento/pagamento para fluxo de caixa)
  const periodIncomes = incomes.filter((i) => {
    if (i.status !== TransactionStatus.COMPLETED) return false;
    const date = i.receivedDate ? new Date(i.receivedDate) : new Date(i.competenceDate);
    return date >= startDate && date <= endDate;
  });

  const periodExpenses = expenses.filter((e) => {
    if (e.status !== TransactionStatus.COMPLETED) return false;
    const date = e.paymentDate ? new Date(e.paymentDate) : new Date(e.competenceDate);
    return date >= startDate && date <= endDate;
  });

  // Atividades Operacionais
  const operationalIncomes = periodIncomes.filter(
    (i) => i.category !== IncomeCategory.FINANCIAL_INCOME
  );
  const operationalExpenses = periodExpenses.filter(
    (e) => e.category !== ExpenseCategory.INVESTMENT &&
           e.category !== ExpenseCategory.FINANCIAL
  );

  const operatingActivities = {
    inflows: sumAmounts(operationalIncomes),
    outflows: sumAmounts(operationalExpenses),
    net: sumAmounts(operationalIncomes) - sumAmounts(operationalExpenses),
  };

  // Atividades de Investimento
  const investmentExpenses = periodExpenses.filter(
    (e) => e.category === ExpenseCategory.INVESTMENT
  );

  const investingActivities = {
    inflows: 0, // Venda de ativos - implementar se necessario
    outflows: sumAmounts(investmentExpenses),
    net: -sumAmounts(investmentExpenses),
  };

  // Atividades de Financiamento
  const financialIncomes = periodIncomes.filter(
    (i) => i.category === IncomeCategory.FINANCIAL_INCOME
  );
  const financialExpenses = periodExpenses.filter(
    (e) => e.category === ExpenseCategory.FINANCIAL
  );

  const financingActivities = {
    inflows: sumAmounts(financialIncomes),
    outflows: sumAmounts(financialExpenses),
    net: sumAmounts(financialIncomes) - sumAmounts(financialExpenses),
  };

  // Variacao do Caixa
  const netCashFlow =
    operatingActivities.net +
    investingActivities.net +
    financingActivities.net;

  // Saldo Final
  const finalBalance = initialBalance + netCashFlow;

  return {
    period: { startDate, endDate },
    initialBalance,
    operatingActivities,
    investingActivities,
    financingActivities,
    netCashFlow,
    finalBalance,
  };
}

// ============== GRAFICOS ==============

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
  balance: number;
}

export function generateCashFlowChart(
  incomes: Income[],
  expenses: Expense[],
  days: number = 30
): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  const today = new Date();
  let runningBalance = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Receitas do dia
    const dayIncomes = incomes.filter((inc) => {
      if (inc.status !== TransactionStatus.COMPLETED) return false;
      const incDate = inc.receivedDate || inc.competenceDate;
      return new Date(incDate).toISOString().split('T')[0] === dateStr;
    });

    // Despesas do dia
    const dayExpenses = expenses.filter((exp) => {
      if (exp.status !== TransactionStatus.COMPLETED) return false;
      const expDate = exp.paymentDate || exp.competenceDate;
      return new Date(expDate).toISOString().split('T')[0] === dateStr;
    });

    const dayIncome = sumAmounts(dayIncomes);
    const dayExpense = sumAmounts(dayExpenses);
    runningBalance += dayIncome - dayExpense;

    result.push({
      date: dateStr,
      income: dayIncome,
      expense: dayExpense,
      balance: runningBalance,
    });
  }

  return result;
}
