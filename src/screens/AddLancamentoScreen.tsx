import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { getPlanoContas, inserirLancamento, PlanoConta } from '../services/lancamentos';
import { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'AddLancamento'>;

const FLAG_LABELS: Record<string, string> = {
  R: 'Receitas',
  V: 'Vendas / CMV',
  F: 'Despesas',
  AT: 'Atendimentos',
};

const FLAG_ORDER = ['R', 'V', 'F', 'AT'];

export default function AddLancamentoScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const valorRef = useRef<any>(null);

  const flagFilter = route.params?.flags ?? ['R', 'V', 'F'];

  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([]);
  const [loadingContas, setLoadingContas] = useState(true);
  const [selectedConta, setSelectedConta] = useState<PlanoConta | null>(null);
  const [valor, setValor] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPlanoContas()
      .then((data) => {
        const filtered = data.filter(
          (c) => flagFilter.includes(c.flag) && c.flag !== 'G'
        );
        setPlanoContas(filtered);
      })
      .catch(() => Alert.alert('Erro', 'Não foi possível carregar o plano de contas.'))
      .finally(() => setLoadingContas(false));
  }, []);

  const handleSelectConta = (conta: PlanoConta) => {
    setSelectedConta(conta);
    // Foca no campo valor após selecionar a conta
    setTimeout(() => valorRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    if (!selectedConta) {
      Alert.alert('Atenção', 'Selecione uma conta.');
      return;
    }
    const parsedValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(parsedValor) || parsedValor <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }

    setSaving(true);
    try {
      const hoje = new Date();
      await inserirLancamento({
        data: hoje.toISOString().split('T')[0],
        cod: selectedConta.cod,
        valor: parsedValor,
        discriminacao: selectedConta.nome,
        flag: selectedConta.flag as any,
        dia: hoje.getDate(),
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
        observacao: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  // Agrupa contas por flag na ordem definida
  const grupos = FLAG_ORDER.filter((f) => flagFilter.includes(f)).map((flag) => ({
    flag,
    label: FLAG_LABELS[flag] ?? flag,
    contas: planoContas.filter((c) => c.flag === flag),
  })).filter((g) => g.contas.length > 0);

  if (loadingContas) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Grupos de contas */}
        {grupos.map((grupo) => (
          <View key={grupo.flag} style={styles.grupo}>
            <Text
              variant="labelMedium"
              style={[styles.grupoLabel, { color: theme.colors.onSurfaceVariant }]}
            >
              {grupo.label.toUpperCase()}
            </Text>
            <View style={styles.botoes}>
              {grupo.contas.map((conta) => {
                const isSelected = selectedConta?.cod === conta.cod;
                return (
                  <TouchableOpacity
                    key={conta.cod}
                    onPress={() => handleSelectConta(conta)}
                    style={[
                      styles.botaoConta,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outline,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      variant="bodyMedium"
                      style={{
                        color: isSelected
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {conta.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Campo Valor */}
        <TextInput
          ref={valorRef}
          label={selectedConta ? `Valor — ${selectedConta.nome}` : 'Valor (R$)'}
          value={valor}
          onChangeText={setValor}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.inputValor}
          left={<TextInput.Affix text="R$" />}
          disabled={!selectedConta}
        />

        {/* Observação colapsável */}
        {!showNotes ? (
          <TouchableOpacity onPress={() => setShowNotes(true)} style={styles.notesLink}>
            <Text variant="bodySmall" style={{ color: theme.colors.primary }}>
              + Adicionar observação
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            label="Observação (opcional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={2}
            style={styles.inputNotes}
            autoFocus
          />
        )}

        {/* Botão Salvar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || !selectedConta || !valor}
          style={styles.btnSalvar}
          contentStyle={styles.btnSalvarContent}
        >
          Salvar Lançamento
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
  },
  grupo: {
    marginBottom: 20,
  },
  grupoLabel: {
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  botoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  botaoConta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
  },
  inputValor: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 20,
  },
  notesLink: {
    marginBottom: 16,
    paddingVertical: 4,
  },
  inputNotes: {
    marginBottom: 16,
  },
  btnSalvar: {
    marginTop: 8,
    marginBottom: 32,
    borderRadius: 8,
  },
  btnSalvarContent: {
    paddingVertical: 6,
  },
});
