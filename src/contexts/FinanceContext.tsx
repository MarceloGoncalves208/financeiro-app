import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  Income,
  Expense,
  Client,
  Supplier,
  CostCenter,
  CustomCategory,
  DashboardData,
  TransactionStatus
} from '../types';

// ============== STATE ==============

interface FinanceState {
  incomes: Income[];
  expenses: Expense[];
  clients: Client[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  categories: CustomCategory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  incomes: [],
  expenses: [],
  clients: [],
  suppliers: [],
  costCenters: [],
  categories: [],
  isLoading: false,
  error: null,
};

// ============== ACTIONS ==============

type FinanceAction =
  // Incomes
  | { type: 'ADD_INCOME'; payload: Income }
  | { type: 'UPDATE_INCOME'; payload: Income }
  | { type: 'DELETE_INCOME'; payload: string }
  | { type: 'SET_INCOMES'; payload: Income[] }
  // Expenses
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  // Clients
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_CLIENTS'; payload: Client[] }
  // Suppliers
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'UPDATE_SUPPLIER'; payload: Supplier }
  | { type: 'DELETE_SUPPLIER'; payload: string }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  // Cost Centers
  | { type: 'ADD_COST_CENTER'; payload: CostCenter }
  | { type: 'UPDATE_COST_CENTER'; payload: CostCenter }
  | { type: 'DELETE_COST_CENTER'; payload: string }
  | { type: 'SET_COST_CENTERS'; payload: CostCenter[] }
  // Categories
  | { type: 'ADD_CATEGORY'; payload: CustomCategory }
  | { type: 'UPDATE_CATEGORY'; payload: CustomCategory }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: CustomCategory[] }
  // Loading & Error
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ALL' };

// ============== REDUCER ==============

function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    // Incomes
    case 'ADD_INCOME':
      return { ...state, incomes: [...state.incomes, action.payload] };
    case 'UPDATE_INCOME':
      return {
        ...state,
        incomes: state.incomes.map((i) =>
          i.id === action.payload.id ? action.payload : i
        ),
      };
    case 'DELETE_INCOME':
      return {
        ...state,
        incomes: state.incomes.filter((i) => i.id !== action.payload),
      };
    case 'SET_INCOMES':
      return { ...state, incomes: action.payload };

    // Expenses
    case 'ADD_EXPENSE':
      return { ...state, expenses: [...state.expenses, action.payload] };
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter((e) => e.id !== action.payload),
      };
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };

    // Clients
    case 'ADD_CLIENT':
      return { ...state, clients: [...state.clients, action.payload] };
    case 'UPDATE_CLIENT':
      return {
        ...state,
        clients: state.clients.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CLIENT':
      return {
        ...state,
        clients: state.clients.filter((c) => c.id !== action.payload),
      };
    case 'SET_CLIENTS':
      return { ...state, clients: action.payload };

    // Suppliers
    case 'ADD_SUPPLIER':
      return { ...state, suppliers: [...state.suppliers, action.payload] };
    case 'UPDATE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'DELETE_SUPPLIER':
      return {
        ...state,
        suppliers: state.suppliers.filter((s) => s.id !== action.payload),
      };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };

    // Cost Centers
    case 'ADD_COST_CENTER':
      return { ...state, costCenters: [...state.costCenters, action.payload] };
    case 'UPDATE_COST_CENTER':
      return {
        ...state,
        costCenters: state.costCenters.map((cc) =>
          cc.id === action.payload.id ? action.payload : cc
        ),
      };
    case 'DELETE_COST_CENTER':
      return {
        ...state,
        costCenters: state.costCenters.filter((cc) => cc.id !== action.payload),
      };
    case 'SET_COST_CENTERS':
      return { ...state, costCenters: action.payload };

    // Categories
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((cat) =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((cat) => cat.id !== action.payload),
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    // Loading & Error
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ALL':
      return initialState;

    default:
      return state;
  }
}

// ============== CONTEXT ==============

interface FinanceContextType {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  // Helpers
  getDashboardData: () => DashboardData;
  getMonthIncomes: (year: number, month: number) => Income[];
  getMonthExpenses: (year: number, month: number) => Expense[];
  getPendingPayables: () => Expense[];
  getPendingReceivables: () => Income[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// ============== PROVIDER ==============

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  // Helper: Obter receitas do mes
  const getMonthIncomes = (year: number, month: number): Income[] => {
    return state.incomes.filter((income) => {
      const date = new Date(income.competenceDate);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  // Helper: Obter despesas do mes
  const getMonthExpenses = (year: number, month: number): Expense[] => {
    return state.expenses.filter((expense) => {
      const date = new Date(expense.competenceDate);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  // Helper: Contas a pagar pendentes
  const getPendingPayables = (): Expense[] => {
    return state.expenses.filter(
      (expense) => expense.status === TransactionStatus.PENDING
    );
  };

  // Helper: Contas a receber pendentes
  const getPendingReceivables = (): Income[] => {
    return state.incomes.filter(
      (income) => income.status === TransactionStatus.PENDING
    );
  };

  // Helper: Dados do Dashboard
  const getDashboardData = (): DashboardData => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const monthIncomes = getMonthIncomes(year, month);
    const monthExpenses = getMonthExpenses(year, month);

    const totalIncome = monthIncomes
      .filter((i) => i.status === TransactionStatus.COMPLETED)
      .reduce((sum, i) => sum + i.amount, 0);

    const totalExpense = monthExpenses
      .filter((e) => e.status === TransactionStatus.COMPLETED)
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingPayables = getPendingPayables();
    const pendingReceivables = getPendingReceivables();

    const accountsPayable = pendingPayables.reduce((sum, e) => sum + e.amount, 0);
    const accountsReceivable = pendingReceivables.reduce((sum, i) => sum + i.amount, 0);

    const profit = totalIncome - totalExpense;
    const grossMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

    return {
      currentBalance: totalIncome - totalExpense,
      monthIncome: totalIncome,
      monthExpenses: totalExpense,
      monthProfit: profit,
      accountsPayable,
      accountsReceivable,
      grossMargin,
      netMargin: grossMargin, // Simplificado por enquanto
      cashFlowChart: [], // Sera implementado
    };
  };

  const value: FinanceContextType = {
    state,
    dispatch,
    getDashboardData,
    getMonthIncomes,
    getMonthExpenses,
    getPendingPayables,
    getPendingReceivables,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

// ============== HOOK ==============

export function useFinance(): FinanceContextType {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

export default FinanceContext;
