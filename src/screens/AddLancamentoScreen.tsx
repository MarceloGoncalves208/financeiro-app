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

// Plano de contas padrão do Gula Grill — usado como fallback se Supabase retornar vazio
const PLANO_CONTAS_PADRAO: PlanoConta[] = [
  // Receitas
  { cod: 1,   nome: 'Cartão',             flag: 'R', grupo_cod: null },
  { cod: 2,   nome: 'Voucher',            flag: 'R', grupo_cod: null },
  { cod: 3,   nome: 'Dinheiro',           flag: 'R', grupo_cod: null },
  // Vendas / CMV
  { cod: 101, nome: 'Buffet',             flag: 'V', grupo_cod: null },
  { cod: 102, nome: 'Churrasqueira',      flag: 'V', grupo_cod: null },
  { cod: 103, nome: 'Lanchonete',         flag: 'V', grupo_cod: null },
  { cod: 104, nome: 'Bebidas',            flag: 'V', grupo_cod: null },
  { cod: 105, nome: 'Frutas / Suco',      flag: 'V', grupo_cod: null },
  { cod: 106, nome: 'Sobremesas',         flag: 'V', grupo_cod: null },
  // Despesas
  { cod: 201, nome: 'Salários',           flag: 'F', grupo_cod: null },
  { cod: 202, nome: 'Extra',              flag: 'F', grupo_cod: null },
  { cod: 203, nome: 'Passagem',           flag: 'F', grupo_cod: null },
  { cod: 212, nome: 'Cedae (Água)',       flag: 'F', grupo_cod: null },
  { cod: 215, nome: 'Outros Pessoal',     flag: 'F', grupo_cod: null },
  { cod: 301, nome: 'Descartáveis',       flag: 'F', grupo_cod: null },
  { cod: 302, nome: 'Carvão / Gás / Óleo', flag: 'F', grupo_cod: null },
  { cod: 303, nome: 'Gelo',              flag: 'F', grupo_cod: null },
  { cod: 305, nome: 'Manutenção',         flag: 'F', grupo_cod: null },
  { cod: 307, nome: 'Coleta',             flag: 'F', grupo_cod: null },
  // Atendimentos
  { cod: 2000, nome: 'Buffet (Atend.)',   flag: 'AT', grupo_cod: null },
  { cod: 3000, nome: 'Prato Feito',       flag: 'AT', grupo_cod: null },
  { cod: 4000, nome: 'Churrasco',         flag: 'AT', grupo_cod: null },
];

const FLAG_LABELS: Record<string, string> = {
  R:  'Receitas',
  V:  'Vendas / CMV',
  F:  'Despesas',
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
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPlanoContas()
      .then((data) => {
        const filtered = data.filter(
          (c) => flagFilter.includes(c.flag) && c.flag !== 'G'
        );
        // Usa dados do Supabase se tiver; caso contrário usa o padrão
        if (filtered.length > 0) {
          setPlanoContas(filtered);
        } else {
          setPlanoContas(
            PLANO_CONTAS_PADRAO.filter((c) => flagFilter.includes(c.flag))
          );
        }
      })
      .catch(() => {
        // Falha na conexão: usa plano padrão silenciosamente
        setPlanoContas(
          PLANO_CONTAS_PADRAO.filter((c) => flagFilter.includes(c.flag))
        );
      })
      .finally(() => setLoadingContas(false));
  }, []);

  const handleSelectConta = (conta: PlanoConta) => {
    setSelectedConta(conta);
    if (!descricao) setDescricao(conta.nome);
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
        discriminacao: descricao.trim() || selectedConta.nome,
        flag: selectedConta.flag as any,
        dia: hoje.getDate(),
        mes: hoje.getMonth() + 1,
        ano: hoje.getFullYear(),
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o lançamento.');
    } finally {
      setSaving(false);
    }
  };

  const grupos = FLAG_ORDER
    .filter((f) => flagFilter.includes(f))
    .map((flag) => ({
      flag,
      label: FLAG_LABELS[flag] ?? flag,
      contas: planoContas.filter((c) => c.flag === flag),
    }))
    .filter((g) => g.contas.length > 0);

  if (loadingContas) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text variant="bodySmall" style={{ marginTop: 12 }}>
          Carregando contas...
        </Text>
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

        {/* Campo Valor — sempre habilitado */}
        <TextInput
          ref={valorRef}
          label="Valor (R$)"
          value={valor}
          onChangeText={setValor}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.inputValor}
          left={<TextInput.Affix text="R$" />}
          placeholder="0,00"
        />

        {/* Campo Descrição — sempre visível */}
        <TextInput
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          mode="outlined"
          style={styles.inputDescricao}
          placeholder="Ex: Buffet segunda-feira"
        />

        {/* Botão Salvar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
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
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16 },
  grupo: { marginBottom: 20 },
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
  },
  inputDescricao: {
    marginBottom: 20,
  },
  btnSalvar: {
    marginBottom: 32,
    borderRadius: 8,
  },
  btnSalvarContent: {
    paddingVertical: 6,
  },
});
