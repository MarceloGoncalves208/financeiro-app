import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  SegmentedButtons,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { useFinance } from '../contexts/FinanceContext';
import {
  Income,
  IncomeCategory,
  PaymentMethod,
  TransactionStatus,
  RecurrenceType,
} from '../types';
import { generateId } from '../utils/helpers';
import { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'AddIncome'>;

const categoryOptions = [
  { value: IncomeCategory.PRODUCT_SALES, label: 'Vendas de Produtos' },
  { value: IncomeCategory.SERVICE_SALES, label: 'Vendas de Servicos' },
  { value: IncomeCategory.FINANCIAL_INCOME, label: 'Receita Financeira' },
  { value: IncomeCategory.OTHER, label: 'Outras Receitas' },
];

const paymentOptions = [
  { value: PaymentMethod.PIX, label: 'PIX' },
  { value: PaymentMethod.BOLETO, label: 'Boleto' },
  { value: PaymentMethod.CREDIT_CARD, label: 'Cartao Credito' },
  { value: PaymentMethod.DEBIT_CARD, label: 'Cartao Debito' },
  { value: PaymentMethod.CASH, label: 'Dinheiro' },
  { value: PaymentMethod.TRANSFER, label: 'Transferencia' },
];

export default function AddIncomeScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { state, dispatch } = useFinance();

  const editingId = route.params?.id;
  const isEditing = !!editingId;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>(IncomeCategory.PRODUCT_SALES);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  const [status, setStatus] = useState<'pending' | 'completed'>('pending');
  const [notes, setNotes] = useState('');

  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [paymentMenuVisible, setPaymentMenuVisible] = useState(false);

  // Carregar dados se editando
  useEffect(() => {
    if (editingId) {
      const income = state.incomes.find((i) => i.id === editingId);
      if (income) {
        setDescription(income.description);
        setAmount(income.amount.toString());
        setCategory(income.category);
        setPaymentMethod(income.paymentMethod);
        setStatus(income.status === TransactionStatus.COMPLETED ? 'completed' : 'pending');
        setNotes(income.notes || '');
      }
    }
  }, [editingId]);

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
    const income: Income = {
      id: editingId || generateId(),
      description: description.trim(),
      amount: parsedAmount,
      competenceDate: now,
      receivedDate: status === 'completed' ? now : undefined,
      category,
      paymentMethod,
      status: status === 'completed' ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
      recurrence: RecurrenceType.NONE,
      notes: notes.trim() || undefined,
      createdAt: isEditing ? state.incomes.find((i) => i.id === editingId)!.createdAt : now,
      updatedAt: now,
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_INCOME', payload: income });
    } else {
      dispatch({ type: 'ADD_INCOME', payload: income });
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Confirmar', 'Deseja excluir esta receita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'DELETE_INCOME', payload: editingId! });
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
            { value: 'completed', label: 'Recebido' },
          ]}
          style={styles.segmented}
        />

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
            style={[styles.button, { backgroundColor: '#06d6a0' }]}
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
  buttons: {
    marginTop: 24,
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
});
