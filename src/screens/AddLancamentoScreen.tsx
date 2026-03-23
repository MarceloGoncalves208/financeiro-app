import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { getPlanoContas, inserirLancamento, PlanoConta } from '../services/lancamentos';
import { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'AddLancamento'>;

const PLANO_CONTAS_PADRAO: PlanoConta[] = [
  { cod: 1,    nome: 'Cartão',              flag: 'R',  grupo_cod: null },
  { cod: 2,    nome: 'Voucher',             flag: 'R',  grupo_cod: null },
  { cod: 3,    nome: 'Dinheiro',            flag: 'R',  grupo_cod: null },
  { cod: 101,  nome: 'Buffet',              flag: 'V',  grupo_cod: null },
  { cod: 102,  nome: 'Churrasqueira',       flag: 'V',  grupo_cod: null },
  { cod: 103,  nome: 'Lanchonete',          flag: 'V',  grupo_cod: null },
  { cod: 104,  nome: 'Bebidas',             flag: 'V',  grupo_cod: null },
  { cod: 105,  nome: 'Frutas / Suco',       flag: 'V',  grupo_cod: null },
  { cod: 106,  nome: 'Sobremesas',          flag: 'V',  grupo_cod: null },
  { cod: 201,  nome: 'Salários',            flag: 'F',  grupo_cod: null },
  { cod: 202,  nome: 'Extra',               flag: 'F',  grupo_cod: null },
  { cod: 203,  nome: 'Passagem',            flag: 'F',  grupo_cod: null },
  { cod: 212,  nome: 'Cedae (Água)',        flag: 'F',  grupo_cod: null },
  { cod: 215,  nome: 'Outros Pessoal',      flag: 'F',  grupo_cod: null },
  { cod: 301,  nome: 'Descartáveis',        flag: 'F',  grupo_cod: null },
  { cod: 302,  nome: 'Carvão / Gás / Óleo', flag: 'F', grupo_cod: null },
  { cod: 303,  nome: 'Gelo',                flag: 'F',  grupo_cod: null },
  { cod: 305,  nome: 'Manutenção',          flag: 'F',  grupo_cod: null },
  { cod: 307,  nome: 'Coleta',              flag: 'F',  grupo_cod: null },
  { cod: 2000, nome: 'Buffet (Atend.)',     flag: 'AT', grupo_cod: null },
  { cod: 3000, nome: 'Prato Feito',         flag: 'AT', grupo_cod: null },
  { cod: 4000, nome: 'Churrasco',           flag: 'AT', grupo_cod: null },
];

const FLAG_LABELS: Record<string, string> = {
  R: 'Receitas', V: 'Vendas / CMV', F: 'Despesas', AT: 'Atendimentos',
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
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedConta, setSelectedConta] = useState<PlanoConta | null>(null);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  // Carrega plano de contas
  useEffect(() => {
    getPlanoContas()
      .then((data) => {
        const filtered = data.filter((c) => flagFilter.includes(c.flag) && c.flag !== 'G');
        setPlanoContas(
          filtered.length > 0
            ? filtered
            : PLANO_CONTAS_PADRAO.filter((c) => flagFilter.includes(c.flag))
        );
      })
      .catch(() =>
        setPlanoContas(PLANO_CONTAS_PADRAO.filter((c) => flagFilter.includes(c.flag)))
      )
      .finally(() => setLoadingContas(false));
  }, []);

  // Botão dropdown no header direito
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.headerBtn}
              disabled={loadingContas}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={24}
                color={theme.colors.onSurface}
              />
              <Text variant="labelMedium" style={{ marginLeft: 4, color: theme.colors.onSurface }}>
                {selectedConta?.nome ?? 'Conta'}
              </Text>
            </TouchableOpacity>
          }
        >
          {FLAG_ORDER.filter((f) => flagFilter.includes(f)).map((flag) => {
            const contas = planoContas.filter((c) => c.flag === flag);
            if (!contas.length) return null;
            return (
              <React.Fragment key={flag}>
                <Menu.Item
                  title={FLAG_LABELS[flag]}
                  disabled
                  titleStyle={{ fontWeight: '700', fontSize: 11, opacity: 0.5 }}
                />
                {contas.map((conta) => (
                  <Menu.Item
                    key={conta.cod}
                    title={conta.nome}
                    onPress={() => {
                      setSelectedConta(conta);
                      if (!descricao) setDescricao(conta.nome);
                      setMenuVisible(false);
                      setTimeout(() => valorRef.current?.focus(), 150);
                    }}
                    leadingIcon={selectedConta?.cod === conta.cod ? 'check' : undefined}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </Menu>
      ),
    });
  }, [navigation, menuVisible, planoContas, selectedConta, loadingContas, descricao]);

  const handleSave = async () => {
    if (!selectedConta) {
      Alert.alert('Atenção', 'Selecione uma conta pelo menu no topo direito.');
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

  if (loadingContas) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text variant="bodySmall" style={{ marginTop: 12, color: '#888' }}>
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
        {/* Indicador da conta selecionada */}
        <TouchableOpacity
          style={[styles.contaSelecionada, {
            backgroundColor: selectedConta ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
            borderColor: selectedConta ? theme.colors.primary : theme.colors.outline,
          }]}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={selectedConta ? 'check-circle' : 'format-list-bulleted'}
            size={20}
            color={selectedConta ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text
            variant="bodyLarge"
            style={{
              marginLeft: 10,
              flex: 1,
              color: selectedConta ? theme.colors.primary : theme.colors.onSurfaceVariant,
              fontWeight: selectedConta ? '600' : '400',
            }}
          >
            {selectedConta ? selectedConta.nome : 'Toque para selecionar a conta ▾'}
          </Text>
        </TouchableOpacity>

        {/* Valor */}
        <TextInput
          ref={valorRef}
          label="Valor (R$)"
          value={valor}
          onChangeText={setValor}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          left={<TextInput.Affix text="R$" />}
          placeholder="0,00"
          autoFocus={!selectedConta}
        />

        {/* Descrição */}
        <TextInput
          label="Descrição"
          value={descricao}
          onChangeText={setDescricao}
          mode="outlined"
          style={styles.input}
          placeholder="Ex: Buffet segunda-feira"
        />

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contaSelecionada: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  input: { marginBottom: 16 },
  btnSalvar: { marginTop: 8, marginBottom: 32, borderRadius: 8 },
  btnSalvarContent: { paddingVertical: 6 },
});
