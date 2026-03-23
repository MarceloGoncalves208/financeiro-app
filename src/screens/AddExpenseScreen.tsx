import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  SegmentedButtons,
  Menu,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useFinance } from '../contexts/FinanceContext';
import {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  TransactionStatus,
  RecurrenceType,
} from '../types';
import { generateId } from '../utils/helpers';
import { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'AddExpense'>;

const categoryOptions = [
  { value: ExpenseCategory.RAW_MATERIAL, label: 'Materia-prima', isCMV: true },
  { value: ExpenseCategory.DIRECT_LABOR, label: 'Mao de Obra Direta', isCMV: true },
  { value: ExpenseCategory.PRODUCTION_COSTS, label: 'Custos de Producao', isCMV: true },
  { value: ExpenseCategory.ADMINISTRATIVE, label: 'Administrativo', isCMV: false },
  { value: ExpenseCategory.COMMERCIAL, label: 'Comercial', isCMV: false },
  { value: ExpenseCategory.FINANCIAL, label: 'Financeiro', isCMV: false },
  { value: ExpenseCategory.INVESTMENT, label: 'Investimento', isCMV: false },
  { value: ExpenseCategory.OTHER, label: 'Outros', isCMV: false },
];

const paymentOptions = [
  { value: PaymentMethod.PIX, label: 'PIX' },
  { value: PaymentMethod.BOLETO, label: 'Boleto' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Cartao Credito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Cartao Debito' },
  { value: PaymentMethod.CASH, label: 'Dinheiro' },
  { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
];

export default function AddExpenseScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { state, dispatch } = useFinance();

  const editingId = route.params?.id;
  const isEditing = !!editingId;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>(ExpenseCategory.ADMINISTRATIVE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [isCMV, setIsCMV] = useState(false);
  const [notes, setNotes] = useState('');

  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);

  // Carregar dados se editando
  useEffect(() => {
    if (editingId) {
      const expense = state.expenses.find((e) => e.id === editingId);
      if (expense) {
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setCategory(expense.category);
        setPaymentMethod(expense.paymentMethod);
        setStatus(expense.status === TransactionStatus.COMPLETED ? 'completed' : 'pending');
        setIsCMV(expense.isCMV);
        setNotes(expense.notes || '');
      }
    }
  }, [editingId]);

  // Auto-set isCMV baseado na categoria
  useEffect(() => {
    const catOption = categoryOptions.find((c) => c.value === category);
    if (catOption) {
      setIsCMV(catOption.isCMV);
    }
  }, [category]);

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Informe a descricao');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Erro', 'Informe um valor valido');
      return;
    }

    const now = new Date();
    const expense: Expense = {
      id: editingId || generateId(),
      description: description.trim(),
      amount: parsedAmount,
      competenceDate: now,
      paymentDate: status === 'completed' ? now : undefined,
      category,
      paymentMethod,
      status: status === 'completed' ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
      recurrence: RecurrenceType.NONE,
      isCMV,
      notes: notes.trim() || undefined,
      createdAt: isEditing ? state.expenses.find((e) => e.id === editingId)!.createdAt : now,
      updatedAt: now,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_EXPENSE', payload: expense });
    } else {
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Deseja excluir esta despesa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'DELETE_EXPENSE', payload: editingId! });
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <TextInput
          label="Descricao"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Valor (R$)"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          left={<TextInput.Affix text="R$" />}
        />

        {/* Categoria */}
        <Text variant="bodyMedium" style={styles.label}>
          Categoria
        </Text>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCategoryMenuVisible(true)}
              style={styles.menuButton}
              contentStyle={styles.menuButtonContent}
            >
              {categoryOptions.find((c) => c.value === category)?.label}
            </Button>
          }
        >
          {categoryOptions.map((opt) => (
            <Menu.Item
              key={opt.value}
              onPress={() => {
                setCategory(opt.value);
                setCategoryMenuVisible(false);
              }}
              title={opt.label}
            />
          ))}
        </Menu>

        {/* Forma de Pagamento */}
        <Text variant="bodyMedium" style={styles.label}>
          Forma de Pagamento
        </Text>
        <Menu
          visible={paymentMenuVisible}
          onDismiss={() => setPaymentMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setPaymentMenuVisible(true)}
              style={styles.menuButton}
              contentStyle={styles.menuButtonContent}
            >
              {paymentOptions.find((p) => p.value === paymentMethod)?.label}
            </Button>
          }
        >
          {paymentOptions.map((opt) => (
            <Menu.Item
              key={opt.value}
              onPress={() => {
                setPaymentMethod(opt.value);
                setPaymentMenuVisible(false);
              }}
              title={opt.label}
            />
          ))}
        </Menu>

        {/* Status */}
        <Text variant="bodyMedium" style={styles.label}>
          Status
        </Text>
        <SegmentedButtons
          value={status}
          onValueChange={(v) => setStatus(v as 'pending' | 'completed')}
          buttons={[
            { value: 'pending', label: 'Pendente' },
            { value: 'completed', label: 'Pago' },
          ]}
          style={styles.segmented}
        />

        {/* CMV Toggle */}
        <View style={styles.switchRow}>
          <View>
            <Text variant="bodyMedium">Compoe CMV</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Custo das Mercadorias Vendidas
            </Text>
          </View>
          <Switch value={isCMV} onValueChange={setIsCMV} />
        </View>

        <TextInput
          label="Observacoes (opcional)"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <View style={styles.buttons}>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, { backgroundColor: '#ef476f' }]}
          >
            {isEditing ? 'Atualizar' : 'Salvar'}
          </Button>

          {isEditing && (
            <Button
              mode="outlined"
              onPress={handleDelete}
              style={styles.button}
              textColor="#ef476f"
            >
              Excluir
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  menuButton: {
    marginBottom: 16,
  },
  menuButtonContent: {
    justifyContent: 'flex-start',
  },
  segmented: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
});
