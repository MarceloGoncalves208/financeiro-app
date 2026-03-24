# PRD - App de Controle Financeiro Empresarial

## Visao Geral
Aplicativo mobile-first para controle financeiro empresarial, permitindo gestao de receitas, despesas, geracao de DRE, CMV e fluxo de caixa.

## Objetivo
Fornecer uma ferramenta simples e eficiente para pequenas e medias empresas controlarem suas financas de forma profissional.

## Publico-Alvo
- Pequenas e medias empresas
- Empreendedores individuais
- Gestores financeiros

---

## Funcionalidades

### 1. Gestao de Receitas
- Cadastro de receitas com descricao, valor, data, categoria
- Categorias: Vendas de Produtos, Vendas de Servicos, Outras Receitas
- Status: Pendente, Recebido
- Vinculo com cliente (opcional)
- Centro de custo
- Forma de pagamento: PIX, Boleto, Cartao, Dinheiro, Transferencia
- Suporte a receitas recorrentes

### 2. Gestao de Despesas
- Cadastro de despesas com descricao, valor, data, categoria
- Categorias hierarquicas:
  - Custos (CMV): Materia-prima, Mao de obra direta, Custos de producao
  - Despesas Operacionais: Administrativas, Comerciais, Financeiras
  - Investimentos
- Status: Pendente, Pago
- Vinculo com fornecedor (opcional)
- Centro de custo

### 3. DRE - Demonstracao do Resultado do Exercicio
- Geracao automatica baseada nas receitas e despesas cadastradas
- Periodos: Mensal, Trimestral, Semestral, Anual
- Estrutura:
  - Receita Bruta
  - (-) Deducoes (impostos, devolucoes, descontos)
  - (=) Receita Liquida
  - (-) CMV/CSV
  - (=) Lucro Bruto
  - (-) Despesas Operacionais
  - (=) Lucro Operacional
  - (+/-) Resultado Financeiro
  - (=) Lucro Antes do IR
  - (-) IR/CSLL
  - (=) Lucro Liquido
- Exportacao em PDF

### 4. CMV - Custo das Mercadorias Vendidas
- Controle de estoque inicial e final
- Registro de compras
- Calculo automatico: Estoque Inicial + Compras - Estoque Final = CMV
- Integracao com despesas de categoria "Custos"

### 5. Fluxo de Caixa
- Metodo direto
- Visualizacao diaria, semanal, mensal
- Categorias:
  - Fluxo Operacional
  - Fluxo de Investimentos
  - Fluxo de Financiamentos
- Projecao futura baseada em contas a pagar/receber
- Grafico de evolucao
- Exportacao em PDF

### 6. Dashboard Principal
- Saldo atual
- Resumo de receitas e despesas do mes
- Lucro do periodo
- Contas a pagar (proximos 7/30 dias)
- Contas a receber (proximos 7/30 dias)
- Grafico de fluxo de caixa (ultimos 30 dias)
- Indicadores: Margem bruta, Margem liquida

### 7. Cadastros Auxiliares
- Clientes: Nome, CNPJ/CPF, Email, Telefone
- Fornecedores: Nome, CNPJ/CPF, Email, Telefone
- Categorias personalizadas
- Centros de custo
- Formas de pagamento

### 8. Configuracoes
- Dados da empresa
- Aliquotas de impostos
- Moeda
- Backup de dados
- Exportacao de dados

---

## Requisitos Tecnicos

### Stack
- **Frontend**: React Native com Expo
- **Estado**: Context API + useReducer ou Zustand
- **Navegacao**: React Navigation
- **UI**: React Native Paper ou NativeBase
- **Graficos**: react-native-chart-kit ou Victory Native
- **Armazenamento Local**: AsyncStorage + SQLite (expo-sqlite)
- **Backend (futuro)**: Node.js + Express ou Supabase
- **Autenticacao (futuro)**: Firebase Auth ou Supabase Auth

### Requisitos Nao-Funcionais
- Funcionar offline (local-first)
- Sincronizacao quando online (futuro)
- Performance: carregamento < 2s
- Suporte a modo escuro
- Acessibilidade basica

---

## Telas

1. **Splash Screen** - Logo e carregamento
2. **Home/Dashboard** - Visao geral financeira
3. **Receitas** - Lista e cadastro
4. **Despesas** - Lista e cadastro
5. **Relatorios**
   - DRE
   - CMV
   - Fluxo de Caixa
6. **Cadastros** - Clientes, Fornecedores, Categorias
7. **Configuracoes**

---

## MVP (Fase 1)
1. Dashboard basico
2. CRUD de Receitas
3. CRUD de Despesas
4. DRE simples
5. Fluxo de caixa basico

## Fase 2
1. CMV completo
2. Cadastro de clientes/fornecedores
3. Graficos avancados
4. Exportacao PDF

## Fase 3
1. Backend e sincronizacao
2. Multi-empresa
3. Relatorios avancados
4. Integracao bancaria
