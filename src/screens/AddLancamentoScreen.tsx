import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  ActivityIndicator,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { getPlanoContas, inserirLancamento, PlanoConta } from '../services/lancamentos';
import { RootStackParamList } from '../navigation/types';

// Persiste a última data usada durante a sessão
let lastUsedDate: string | null = null;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type RouteParams = RouteProp<RootStackParamList, 'AddLancamento'>;

// Plano de contas completo do Gula Grill
const PLANO_CONTAS_PADRAO: PlanoConta[] = [
  // Receitas
  { cod: 1,    nome: 'Cartão',                  flag: 'R',  grupo_cod: null },
  { cod: 2,    nome: 'Voucher',                 flag: 'R',  grupo_cod: null },
  { cod: 3,    nome: 'Dinheiro',                flag: 'R',  grupo_cod: null },
  { cod: 4,    nome: 'Receita iFood',            flag: 'R',  grupo_cod: null },
  { cod: 5,    nome: 'Receita 99Food',          flag: 'R',  grupo_cod: null },
  { cod: 6,    nome: 'Receita Keeta',           flag: 'R',  grupo_cod: null },
  // Vendas / CMV
  { cod: 101,  nome: 'Buffet',                  flag: 'V',  grupo_cod: null },
  { cod: 102,  nome: 'Churrasqueira',           flag: 'V',  grupo_cod: null },
  { cod: 103,  nome: 'Lanchonete',              flag: 'V',  grupo_cod: null },
  { cod: 104,  nome: 'Bebidas',                 flag: 'V',  grupo_cod: null },
  { cod: 105,  nome: 'Frutas / Suco',           flag: 'V',  grupo_cod: null },
  { cod: 106,  nome: 'Sobremesas',              flag: 'V',  grupo_cod: null },
  // Administrativo
  { cod: 201,  nome: 'Salários',                flag: 'F',  grupo_cod: null },
  { cod: 202,  nome: 'Extra',                   flag: 'F',  grupo_cod: null },
  { cod: 203,  nome: 'Passagem',                flag: 'F',  grupo_cod: null },
  { cod: 204,  nome: 'FGTS',                    flag: 'F',  grupo_cod: null },
  { cod: 205,  nome: 'GPS',                     flag: 'F',  grupo_cod: null },
  { cod: 206,  nome: '13º',                     flag: 'F',  grupo_cod: null },
  { cod: 207,  nome: 'Férias',                  flag: 'F',  grupo_cod: null },
  { cod: 208,  nome: 'Rescisão',                flag: 'F',  grupo_cod: null },
  { cod: 209,  nome: 'Contador',                flag: 'F',  grupo_cod: null },
  { cod: 210,  nome: 'Simples',                 flag: 'F',  grupo_cod: null },
  { cod: 211,  nome: 'Aluguel',                 flag: 'F',  grupo_cod: null },
  { cod: 212,  nome: 'Cedae (Água)',            flag: 'F',  grupo_cod: null },
  { cod: 213,  nome: 'Telefone',                flag: 'F',  grupo_cod: null },
  { cod: 214,  nome: 'Dívidas',                 flag: 'F',  grupo_cod: null },
  { cod: 215,  nome: 'Ueslei',                  flag: 'F',  grupo_cod: null },
  { cod: 216,  nome: 'Marcelo',                 flag: 'F',  grupo_cod: null },
  // Operacional
  { cod: 301,  nome: 'Descartáveis',            flag: 'F',  grupo_cod: null },
  { cod: 302,  nome: 'Carvão / Gás / Óleo',    flag: 'F',  grupo_cod: null },
  { cod: 303,  nome: 'Gelo',                    flag: 'F',  grupo_cod: null },
  { cod: 304,  nome: 'Manutenção M.O.',         flag: 'F',  grupo_cod: null },
  { cod: 305,  nome: 'Manutenção Material',     flag: 'F',  grupo_cod: null },
  { cod: 306,  nome: 'Equipamentos',            flag: 'F',  grupo_cod: null },
  { cod: 307,  nome: 'Coleta',                  flag: 'F',  grupo_cod: null },
  { cod: 308,  nome: 'Exaustão',                flag: 'F',  grupo_cod: null },
  // Marketing
  { cod: 401,  nome: 'Divulgação',              flag: 'F',  grupo_cod: null },
  // Atendimentos
  { cod: 2000, nome: 'Buffet (Atend.)',         flag: 'AT', grupo_cod: null },
  { cod: 3000, nome: 'Prato Feito',             flag: 'AT', grupo_cod: null },
  { cod: 4000, nome: 'Churrasco',               flag: 'AT', grupo_cod: null },
  { cod: 5001, nome: 'Entrega iFood',           flag: 'AT', grupo_cod: null },
  { cod: 5002, nome: 'Entrega 99Food',          flag: 'AT', grupo_cod: null },
  { cod: 5003, nome: 'Entrega Keeta',           flag: 'AT', grupo_cod: null },
];

const FLAG_LABELS: Record<string, string> = {
  R: 'Receitas', V: 'Vendas / CMV', F: 'Despesas', AT: 'Atendimentos',
};
const FLAG_ORDER = ['R', 'V', 'F', 'AT'];

// Sub-grupos dentro de Despesas (F) para exibição no menu
const SUBGRUPO_LABELS: Record<number, string> = {
  201: 'Administrativo', 202: 'Administrativo', 203: 'Administrativo',
  204: 'Administrativo', 205: 'Administrativo', 206: 'Administrativo',
  207: 'Administrativo', 208: 'Administrativo', 209: 'Administrativo',
  210: 'Administrativo', 211: 'Administrativo', 212: 'Administrativo',
  213: 'Administrativo', 214: 'Administrativo', 215: 'Administrativo',
  216: 'Administrativo',
  301: 'Operacional',    302: 'Operacional',    303: 'Operacional',
  304: 'Operacional',    305: 'Operacional',    306: 'Operacional',
  307: 'Operacional',    308: 'Operacional',
  401: 'Marketing',
};

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
  const [data, setData] = useState(lastUsedDate ?? todayStr());
  const [saving, setSaving] = useState(false);

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

  const handleSelectConta = (conta: PlanoConta) => {
    setSelectedConta(conta);
    if (!descricao) setDescricao(conta.nome);
    setMenuVisible(false);
    setTimeout(() => valorRef.current?.focus(), 150);
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
      const [ano, mes, dia] = data.split('-').map(Number);
      await inserirLancamento({
        data,
        cod: selectedConta.cod,
        valor: parsedValor,
        discriminacao: descricao.trim() || selectedConta.nome,
        flag: selectedConta.flag as any,
        dia,
        mes,
        ano,
      });
      lastUsedDate = data; // guarda para o próximo lançamento
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

  // Grupos de contas para o menu
  const grupos = FLAG_ORDER
    .filter((f) => flagFilter.includes(f))
    .map((flag) => ({
      flag,
      label: FLAG_LABELS[flag],
      contas: planoContas.filter((c) => c.flag === flag),
    }))
    .filter((g) => g.contas.length > 0);

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
        {/* Seletor de Conta com Menu dropdown */}
        <View style={styles.menuWrapper}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            contentStyle={styles.menuContent}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                icon={selectedConta ? 'check-circle' : 'menu-down'}
                contentStyle={styles.selectorContent}
                style={[
                  styles.selectorBtn,
                  {
                    borderColor: selectedConta ? theme.colors.primary : theme.colors.outline,
                    backgroundColor: selectedConta
                      ? theme.colors.primaryContainer
                      : theme.colors.surface,
                  },
                ]}
                textColor={selectedConta ? theme.colors.primary : theme.colors.onSurface}
                labelStyle={{ fontSize: 15, fontWeight: selectedConta ? '600' : '400' }}
              >
                {selectedConta ? selectedConta.nome : 'Selecionar conta  ▾'}
              </Button>
            }
          >
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              {grupos.map((grupo, gi) => (
                <React.Fragment key={grupo.flag}>
                  {gi > 0 && <Divider style={{ marginVertical: 4 }} />}
                  <Menu.Item
                    title={grupo.label}
                    disabled
                    titleStyle={styles.grupoHeader}
                  />
                  {grupo.contas.map((conta) => (
                    <Menu.Item
                      key={conta.cod}
                      title={conta.nome}
                      onPress={() => handleSelectConta(conta)}
                      leadingIcon={selectedConta?.cod === conta.cod ? 'check' : 'circle-small'}
                    />
                  ))}
                </React.Fragment>
              ))}
            </ScrollView>
          </Menu>
        </View>

        {/* Data */}
        <View style={styles.dateWrapper}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 6 }}>
            Data do lançamento
          </Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={data}
              onChange={e => setData((e.target as HTMLInputElement).value)}
              style={{
                border: `1.5px solid ${theme.colors.outline}`,
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 15,
                backgroundColor: theme.colors.surface,
                color: theme.colors.onSurface,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              } as any}
            />
          ) : (
            <TextInput
              value={data}
              onChangeText={setData}
              mode="outlined"
              keyboardType="numeric"
              placeholder="AAAA-MM-DD"
              left={<TextInput.Icon icon="calendar" />}
              style={{ backgroundColor: theme.colors.surface }}
            />
          )}
        </View>

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
  menuWrapper: {
    marginBottom: 20,
  },
  selectorBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    height: 52,
  },
  selectorContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    height: 52,
  },
  menuContent: {
    marginTop: 4,
    borderRadius: 10,
  },
  menuScroll: {
    maxHeight: 380,
  },
  grupoHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  dateWrapper: { marginBottom: 16 },
  input: { marginBottom: 16 },
  btnSalvar: { marginTop: 8, marginBottom: 32, borderRadius: 8 },
  btnSalvarContent: { paddingVertical: 6 },
});
