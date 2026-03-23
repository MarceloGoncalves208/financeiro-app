import { NavigatorScreenParams } from '@react-navigation/native';

// Tab Navigator
export type TabParamList = {
  Dashboard: undefined;
  Receitas: undefined;
  Despesas: undefined;
  Relatorios: undefined;
  Mais: undefined;
};

// Stack Navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  AddLancamento: { flags?: string[] };
  AddIncome: { id?: string };
  AddExpense: { id?: string };
  DREReport: undefined;
  CashFlowReport: undefined;
  CMVReport: undefined;
  Clients: undefined;
  Suppliers: undefined;
  Categories: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
