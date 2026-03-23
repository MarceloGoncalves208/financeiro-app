// Tipos principais do App Financeiro

// ============== ENUMS ==============

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export enum PaymentMethod {
  PIX = 'pix',
  BOLETO = 'boleto',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  TRANSFER = 'transfer'
}

export enum ExpenseCategory {
  // Custos (CMV)
  RAW_MATERIAL = 'raw_material',
  DIRECT_LABOR = 'direct_labor',
  PRODUCTION_COSTS = 'production_costs',
  // Despesas Operacionais
  ADMINISTRATIVE = 'administrative',
  COMMERCIAL = 'commercial',
  FINANCIAL = 'financial',
  // Outros
  INVESTMENT = 'investment',
  OTHER = 'other'
}

export enum IncomeCategory {
  PRODUCT_SALES = 'product_sales',
  SERVICE_SALES = 'service_sales',
  FINANCIAL_INCOME = 'financial_income',
  OTHER = 'other'
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// ============== INTERFACES ==============

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Receita
export interface Income extends BaseEntity {
  description: string;
  amount: number;
  competenceDate: Date;      // Data de competencia
  receivedDate?: Date;       // Data de recebimento
  category: IncomeCategory;
  customCategoryId?: string;
  clientId?: string;
  costCenterId?: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  recurrence: RecurrenceType;
  notes?: string;
}

// Despesa
export interface Expense extends BaseEntity {
  description: string;
  amount: number;
  competenceDate: Date;      // Data de competencia
  paymentDate?: Date;        // Data de pagamento
  category: ExpenseCategory;
  customCategoryId?: string;
  supplierId?: string;
  costCenterId?: string;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  recurrence: RecurrenceType;
  isCMV: boolean;            // Se faz parte do CMV
  notes?: string;
}

// Cliente
export interface Client extends BaseEntity {
  name: string;
  document?: string;         // CPF ou CNPJ
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// Fornecedor
export interface Supplier extends BaseEntity {
  name: string;
  document?: string;         // CPF ou CNPJ
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

// Categoria personalizada
export interface CustomCategory extends BaseEntity {
  name: string;
  type: TransactionType;
  parentCategory?: ExpenseCategory | IncomeCategory;
  color?: string;
  icon?: string;
}

// Centro de Custo
export interface CostCenter extends BaseEntity {
  name: string;
  description?: string;
  isActive: boolean;
}

// Estoque (para CMV)
export interface Inventory extends BaseEntity {
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: Date;
  type: 'initial' | 'purchase' | 'final' | 'adjustment';
  notes?: string;
}

// ============== RELATORIOS ==============

// DRE
export interface DREReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  grossRevenue: number;           // Receita Bruta
  deductions: {
    taxes: number;                // Impostos
    returns: number;              // Devolucoes
    discounts: number;            // Descontos
    total: number;
  };
  netRevenue: number;             // Receita Liquida
  cmv: number;                    // CMV
  grossProfit: number;            // Lucro Bruto
  operatingExpenses: {
    administrative: number;
    commercial: number;
    financial: number;
    total: number;
  };
  operatingProfit: number;        // Lucro Operacional (EBIT)
  financialResult: {
    income: number;
    expenses: number;
    total: number;
  };
  profitBeforeTaxes: number;      // LAIR
  taxes: number;                  // IR/CSLL
  netProfit: number;              // Lucro Liquido
  margins: {
    gross: number;                // Margem Bruta %
    operating: number;            // Margem Operacional %
    net: number;                  // Margem Liquida %
  };
}

// CMV
export interface CMVReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  initialInventory: number;       // Estoque Inicial
  purchases: number;              // Compras
  purchaseReturns: number;        // Devolucoes de compras
  freight: number;                // Frete sobre compras
  availableGoods: number;         // Mercadorias disponiveis
  finalInventory: number;         // Estoque Final
  cmv: number;                    // CMV calculado
}

// Fluxo de Caixa
export interface CashFlowReport {
  period: {
    startDate: Date;
    endDate: Date;
  };
  initialBalance: number;
  operatingActivities: {
    inflows: number;              // Entradas operacionais
    outflows: number;             // Saidas operacionais
    net: number;
  };
  investingActivities: {
    inflows: number;
    outflows: number;
    net: number;
  };
  financingActivities: {
    inflows: number;
    outflows: number;
    net: number;
  };
  netCashFlow: number;            // Variacao do caixa
  finalBalance: number;
}

// Dashboard
export interface DashboardData {
  currentBalance: number;
  monthIncome: number;
  monthExpenses: number;
  monthProfit: number;
  accountsPayable: number;
  accountsReceivable: number;
  grossMargin: number;
  netMargin: number;
  cashFlowChart: {
    date: string;
    income: number;
    expense: number;
    balance: number;
  }[];
}

// ============== CONFIGURACOES ==============

export interface CompanySettings {
  name: string;
  document?: string;
  taxRates: {
    icms: number;
    iss: number;
    pis: number;
    cofins: number;
    irpj: number;
    csll: number;
  };
  currency: string;
  fiscalYearStart: number;        // Mes de inicio do ano fiscal (1-12)
}
