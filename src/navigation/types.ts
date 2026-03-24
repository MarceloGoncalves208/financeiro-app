import { NavigatorScreenParams } from '@react-navigation/native';

// Drawer Navigator
export type DrawerParamList = {
  Dashboard: undefined;
  Receitas: undefined;
  Despesas: undefined;
  Relatorios: undefined;
  Configuracoes: undefined;
};

// Tab Navigator (mantido para compatibilidade)
export type TabParamList = DrawerParamList & { Mais: undefined };

// Stack Navigator
export type RootStackParamList = {
  Main: NavigatorScreenParams<DrawerParamList>;
  AddLancamento: { flags?: string[] };
  AddIncome: { id?: string };
  AddExpense: { id?: string };
  Lancamentos: undefined;
  EditLancamento: { id: string };
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
