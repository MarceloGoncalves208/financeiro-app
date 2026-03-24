import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text, TextInput, Button, useTheme,
  ActivityIndicator, Menu, Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import {
  getLancamentosPeriodo, atualizarLancamento, deletarLancamento,
  getPlanoContas, PlanoConta, Lancamento,
} from '../services/lancamentos';
import { RootStackParamList } from '../navigation/types';

type RouteParams = RouteProp<RootStackParamList, 'EditLancamento'>;

const PLANO_CONTAS_PADRAO: PlanoConta[] = [
  { cod: 1,    nome: 'Cartão',               flag: 'R',  grupo_cod: null },
  { cod: 2,    nome: 'Voucher',              flag: 'R',  grupo_cod: null },
  { cod: 3,    nome: 'Dinheiro',             flag: 'R',  grupo_cod: null },
  { cod: 4,    nome: 'Receita iFood',        flag: 'R',  grupo_cod: null },
  { cod: 5,    nome: 'Receita 99Food',       flag: 'R',  grupo_cod: null },
  { cod: 6,    nome: 'Receita Keeta',        flag: 'R',  grupo_cod: null },
  { cod: 101,  nome: 'Buffet',               flag: 'V',  grupo_cod: null },
  { cod: 102,  nome: 'Churrasqueira',        flag: 'V',  grupo_cod: null },
  { cod: 103,  nome: 'Lanchonete',           flag: 'V',  grupo_cod: null },
  { cod: 104,  nome: 'Bebidas',              flag: 'V',  grupo_cod: null },
  { cod: 105,  nome: 'Frutas / Suco',        flag: 'V',  grupo_cod: null },
  { cod: 106,  nome: 'Sobremesas',           flag: 'V',  grupo_cod: null },
  { cod: 201,  nome: 'Salários',             flag: 'F',  grupo_cod: null },
  { cod: 202,  nome: 'Extra',                flag: 'F',  grupo_cod: null },
  { cod: 203,  nome: 'Passagem',             flag: 'F',  grupo_cod: null },
  { cod: 204,  nome: 'FGTS',                 flag: 'F',  grupo_cod: null },
  { cod: 205,  nome: 'GPS',                  flag: 'F',  grupo_cod: null },
  { cod: 206,  nome: '13º',                  flag: 'F',  grupo_cod: null },
  { cod: 207,  nome: 'Férias',               flag: 'F',  grupo_cod: null },
  { cod: 208,  nome: 'Rescisão',             flag: 'F',  grupo_cod: null },
  { cod: 209,  nome: 'Contador',             flag: 'F',  grupo_cod: null },
  { cod: 210,  nome: 'Simples',              flag: 'F',  grupo_cod: null },
  { cod: 211,  nome: 'Aluguel',              flag: 'F',  grupo_cod: null },
  { cod: 212,  nome: 'Cedae (Água)',         flag: 'F',  grupo_cod: null },
  { cod: 213,  nome: 'Telefone',             flag: 'F',  grupo_cod: null },
  { cod: 214,  nome: 'Dívidas',              flag: 'F',  grupo_cod: null },
  { cod: 215,  nome: 'Ueslei',               flag: 'F',  grupo_cod: null },
  { cod: 216,  nome: 'Marcelo',              flag: 'F',  grupo_cod: null },
  { cod: 301,  nome: 'Descartáveis',         flag: 'F',  grupo_cod: null },
  { cod: 302,  nome: 'Carvão / Gás / Óleo', flag: 'F',  grupo_cod: null },
  { cod: 303,  nome: 'Gelo',                 flag: 'F',  grupo_cod: null },
  { cod: 304,  nome: 'Manutenção M.O.',      flag: 'F',  grupo_cod: null },
  { cod: 305,  nome: 'Manutenção Material',  flag: 'F',  grupo_cod: null },
  { cod: 306,  nome: 'Equipamentos',         flag: 'F',  grupo_cod: null },
  { cod: 307,  nome: 'Coleta',               flag: 'F',  grupo_cod: null },
  { cod: 308,  nome: 'Exaustão',             flag: 'F',  grupo_cod: null },
  { cod: 401,  nome: 'Divulgação',           flag: 'F',  grupo_cod: null },
  { cod: 2000, nome: 'Buffet (Atend.)',      flag: 'AT', grupo_cod: null },
  { cod: 3000, nome: 'Prato Feito',          flag: 'AT', grupo_cod: null },
  { cod: 4000, nome: 'Churrasco',            flag: 'AT', grupo_cod: null },
  { cod: 5001, nome: 'Entrega iFood',        flag: 'AT', grupo_cod: null },
  { cod: 5002, nome: 'Entrega 99Food',       flag: 'AT', grupo_cod: null },
  { cod: 5003, nome: 'Entrega Keeta',        flag: 'AT', grupo_cod: null },
];

const FLAG_LABELS: Record<string, string> = {
  R: 'Receitas', V: 'Vendas / CMV', F: 'Despesas', AT: 'Atendimentos',
};
const FLAG_ORDER = ['R', 'V', 'F', 'AT'];

export default function EditLancamentoScreen() {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteParams>();
  const valorRef = useRef<any>(null);

  const { id } = route.params;

  const [lancamento, setLancamento] = useState<Lancamento | null>(null);
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>(PLANO_CONTAS_PADRAO);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedConta, setSelectedConta] = useState<PlanoConta | null>(null);
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Carrega o lançamento pelo id — busca o mês atual e adjacentes
    const fetchLancamento = async () => {
      try {
        const now = new Date();
        // Busca últimos 3 meses para encontrar o lançamento
        const start = `${now.getFullYear() - 1}-01-01`;
        const end   = `${now.getFullYear()}-12-31`;
        const data = await getLancamentosPeriodo(start, end);
        const found = data.find(l => l.id === id);
        if (found) {
          setLancamento(found);
          const conta = PLANO_CONTAS_PADRAO.find(c => c.cod === found.cod) ?? null;
          setSelectedConta(conta);
          setValor(String(found.valor).replace('.', ','));
          setDescricao(found.discriminacao);
        }

        // Tenta plano de contas do Supabase
        getPlanoContas()
          .then(d => { if (d.filter(c => c.flag !== 'G').length > 0) setPlanoContas(d.filter(c => c.flag !== 'G')); })
          .catch(() => {});
      } finally {
        setLoading(false);
      }
    };
    fetchLancamento();
  }, [id]);

  const handleSelectConta = (conta: PlanoConta) => {
    setSelectedConta(conta);
    setDescricao(d => d || conta.nome);
    setMenuVisible(false);
    setTimeout(() => valorRef.current?.focus(), 150);
  };

  const handleSave = async () => {
    if (!selectedConta) { Alert.alert('Atenção', 'Selecione uma conta.'); return; }
    const parsedValor = parseFloat(valor.replace(',', '.'));
    if (isNaN(parsedValor) || parsedValor <= 0) { Alert.alert('Atenção', 'Informe um valor válido.'); return; }
    setSaving(true);
    try {
      await atualizarLancamento(id, {
        cod: selectedConta.cod,
        valor: parsedValor,
        discriminacao: descricao.trim() || selectedConta.nome,
        flag: selectedConta.flag as any,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir lançamento',
      `Confirma exclusão de "${lancamento?.discriminacao}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deletarLancamento(id);
              navigation.goBack();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!lancamento) {
    return (
      <View style={styles.center}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Lançamento não encontrado.</Text>
      </View>
    );
  }

  const grupos = FLAG_ORDER.map(flag => ({
    flag, label: FLAG_LABELS[flag],
    contas: planoContas.filter(c => c.flag === flag),
  })).filter(g => g.contas.length > 0);

  const dataLabel = `${String(lancamento.dia).padStart(2,'0')}/${String(lancamento.mes).padStart(2,'0')}/${lancamento.ano}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Info do lançamento */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Data do lançamento: <Text style={{ fontWeight: '700' }}>{dataLabel}</Text>
          </Text>
        </View>

        {/* Seletor de conta */}
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
                style={[styles.selectorBtn, {
                  borderColor: selectedConta ? theme.colors.primary : theme.colors.outline,
                  backgroundColor: selectedConta ? theme.colors.primaryContainer : theme.colors.surface,
                }]}
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
                  <Menu.Item title={grupo.label} disabled titleStyle={styles.grupoHeader} />
                  {grupo.contas.map(conta => (
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
        />

        {/* Salvar */}
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || deleting}
          style={styles.btnSalvar}
          contentStyle={styles.btnContent}
        >
          Salvar Alterações
        </Button>

        {/* Excluir */}
        <Button
          mode="outlined"
          onPress={handleDelete}
          loading={deleting}
          disabled={saving || deleting}
          style={styles.btnExcluir}
          contentStyle={styles.btnContent}
          textColor="#ef476f"
          theme={{ colors: { outline: '#ef476f' } }}
          icon="trash-can-outline"
        >
          Excluir Lançamento
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  infoCard: { borderRadius: 8, padding: 12, marginBottom: 20 },
  menuWrapper: { marginBottom: 20 },
  selectorBtn: { borderRadius: 10, borderWidth: 1.5, height: 52 },
  selectorContent: { flexDirection: 'row-reverse', justifyContent: 'space-between', height: 52 },
  menuContent: { marginTop: 4, borderRadius: 10 },
  menuScroll: { maxHeight: 380 },
  grupoHeader: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, opacity: 0.5, textTransform: 'uppercase' },
  input: { marginBottom: 16 },
  btnSalvar: { marginTop: 8, marginBottom: 12, borderRadius: 8 },
  btnExcluir: { marginBottom: 32, borderRadius: 8 },
  btnContent: { paddingVertical: 6 },
});
