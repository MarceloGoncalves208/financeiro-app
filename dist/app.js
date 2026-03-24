/* ─────────────────────────────────────────────────────────────────────────────
   Comfort Shoes Financeiro — app.js
   Vanilla JS, mobile-first PWA
───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function nomeMes(mes, ano) {
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

function nomeMesCapitalized(mes, ano) {
  const s = nomeMes(mes, ano);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 2500);
}

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  planoContas: [],
  selectedCod: null,
  selectedFlag: null,
  selectedName: null,
  digits: '',
  lancamentoData: todayISO(),
  hojeData: todayISO(),
  mesAtual: new Date().getMonth() + 1,
  anoAtual: new Date().getFullYear(),
};

// ─── Category Cards ───────────────────────────────────────────────────────────

function flagToClass(flag) {
  if (flag === 'R')  return 'receita';
  if (flag === 'F')  return 'despesa-f';
  if (flag === 'V')  return 'despesa-v';
  if (flag === 'B')  return 'banco';
  return 'outros';
}

function renderCategoryGrids(plano) {
  const groups = {
    R:  document.getElementById('grid-receitas'),
    F:  document.getElementById('grid-despesas-f'),
    V:  document.getElementById('grid-despesas-v'),
    B:  document.getElementById('grid-banco'),
    outros: document.getElementById('grid-outros'),
  };

  // Clear
  Object.values(groups).forEach(g => { if (g) g.innerHTML = ''; });

  const outrosFlags = ['VE', 'AT', 'PR', 'MT'];

  plano.forEach(conta => {
    const cls = flagToClass(conta.flag);
    const btn = document.createElement('button');
    btn.className = `cat-card ${cls}`;
    btn.textContent = conta.discriminacao;
    btn.dataset.cod = conta.cod;
    btn.dataset.flag = conta.flag;
    btn.dataset.name = conta.discriminacao;
    btn.addEventListener('click', () => selectCategory(conta.cod, conta.flag, conta.discriminacao, btn));

    let target;
    if (conta.flag === 'R') target = groups.R;
    else if (conta.flag === 'F') target = groups.F;
    else if (conta.flag === 'V') target = groups.V;
    else if (conta.flag === 'B') target = groups.B;
    else target = groups.outros;

    if (target) target.appendChild(btn);
  });

  // Show/hide "Outros" section
  const outrosSection = document.getElementById('section-outros');
  const outrosGrid = groups.outros;
  if (outrosGrid && outrosGrid.children.length > 0) {
    outrosSection.style.display = '';
  }
}

function clearSelectedCards() {
  document.querySelectorAll('.cat-card.selected').forEach(c => c.classList.remove('selected'));
}

function selectCategory(cod, flag, name, btnEl) {
  clearSelectedCards();
  btnEl.classList.add('selected');

  state.selectedCod = cod;
  state.selectedFlag = flag;
  state.selectedName = name;
  state.digits = '';

  // Update panel
  document.getElementById('panel-category-name').textContent = name;
  document.getElementById('panel-category-name').style.color =
    flag === 'R' ? 'var(--receita)' : flag === 'F' ? 'var(--despesa)' : flag === 'V' ? '#e65100' : '#b8860b';

  const confirmBtn = document.getElementById('btn-confirm');
  confirmBtn.className = `btn btn-confirm ${flag === 'R' ? 'receita' : 'despesa'}`;

  updateValueDisplay();
  openValuePanel();
}

// ─── Value Panel ──────────────────────────────────────────────────────────────

function openValuePanel() {
  document.getElementById('value-panel').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}

function closeValuePanel() {
  document.getElementById('value-panel').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
  clearSelectedCards();
  state.selectedCod = null;
  state.digits = '';
  updateValueDisplay();
}

function updateValueDisplay() {
  const display = document.getElementById('value-display');
  const confirmBtn = document.getElementById('btn-confirm');

  if (!state.digits || state.digits === '0') {
    display.innerHTML = '<span class="placeholder">R$ 0,00</span>';
    confirmBtn.disabled = true;
    return;
  }

  const cents = parseInt(state.digits, 10);
  const value = cents / 100;
  display.textContent = fmtBRL(value);
  confirmBtn.disabled = false;
}

function handleDigit(d) {
  if (state.digits.length >= 10) return;
  if (state.digits === '' && d === '0') return;
  state.digits += d;
  updateValueDisplay();
}

function handleDel() {
  state.digits = state.digits.slice(0, -1);
  updateValueDisplay();
}

// ─── Save Lançamento ──────────────────────────────────────────────────────────

async function saveLancamento() {
  const confirmBtn = document.getElementById('btn-confirm');
  if (confirmBtn.disabled) return;

  const cents = parseInt(state.digits || '0', 10);
  const valor = cents / 100;

  if (valor <= 0) {
    showToast('Informe um valor válido', 'error');
    return;
  }

  confirmBtn.disabled = true;
  confirmBtn.textContent = '...';

  try {
    await apiFetch('/api/lancamentos', {
      method: 'POST',
      body: JSON.stringify({
        data: state.lancamentoData,
        cod: state.selectedCod,
        valor,
      }),
    });

    showToast(`${state.selectedName} — ${fmtBRL(valor)} salvo!`, 'success');
    closeValuePanel();

    // Refresh "Hoje" if on the same date
    if (state.hojeData === state.lancamentoData) {
      loadHoje();
    }
  } catch (err) {
    showToast(`Erro: ${err.message}`, 'error');
    confirmBtn.disabled = false;
  } finally {
    confirmBtn.textContent = 'Confirmar';
  }
}

// ─── Tab: Hoje ────────────────────────────────────────────────────────────────

async function loadHoje() {
  const container = document.getElementById('hoje-list-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando...</div>';

  try {
    const [lancamentos, resumo] = await Promise.all([
      apiFetch(`/api/lancamentos?data=${state.hojeData}`),
      apiFetch(`/api/resumo-dia?data=${state.hojeData}`),
    ]);

    document.getElementById('hoje-receita').textContent = fmtBRL(resumo.receita);
    document.getElementById('hoje-despesa').textContent = fmtBRL(resumo.despesa);

    const saldoEl = document.getElementById('hoje-saldo');
    saldoEl.textContent = fmtBRL(resumo.saldo);
    saldoEl.style.color = resumo.saldo >= 0 ? '#e8f5e9' : '#ffcdd2';

    if (lancamentos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-text">Nenhum lançamento em ${fmtDisplayDate(state.hojeData)}</div>
        </div>`;
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'entry-list';

    lancamentos.forEach(l => {
      const li = document.createElement('li');
      li.className = 'entry-item';
      li.innerHTML = `
        <span class="entry-dot ${l.flag}"></span>
        <div class="entry-info">
          <div class="entry-name">${l.discriminacao}</div>
          <div class="entry-meta">${fmtDisplayDate(l.data)} &bull; Cód. ${l.cod}</div>
        </div>
        <span class="entry-valor ${l.flag}">${fmtBRL(l.valor)}</span>
        <button class="entry-del-btn" data-id="${l.id}" title="Excluir">✕</button>
      `;
      li.querySelector('.entry-del-btn').addEventListener('click', () => deleteLancamento(l.id));
      ul.appendChild(li);
    });

    container.innerHTML = '';
    container.appendChild(ul);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-text">Erro: ${err.message}</div></div>`;
  }
}

async function deleteLancamento(id) {
  if (!confirm('Excluir este lançamento?')) return;
  try {
    await apiFetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
    showToast('Lançamento excluído', '');
    loadHoje();
    loadMes();
  } catch (err) {
    showToast(`Erro ao excluir: ${err.message}`, 'error');
  }
}

// ─── Tab: Mês ─────────────────────────────────────────────────────────────────

async function loadMes() {
  const container = document.getElementById('mes-list-container');
  container.innerHTML = '<div class="loading"><div class="spinner"></div>Carregando...</div>';

  document.getElementById('mes-titulo').textContent =
    nomeMesCapitalized(state.mesAtual, state.anoAtual);

  try {
    const dias = await apiFetch(
      `/api/lancamentos/resumo?mes=${state.mesAtual}&ano=${state.anoAtual}`
    );

    const totalRec = dias.reduce((s, d) => s + d.total_receita, 0);
    const totalDes = dias.reduce((s, d) => s + d.total_despesa, 0);
    const totalSaldo = totalRec - totalDes;

    document.getElementById('mes-receita').textContent = fmtBRL(totalRec);
    document.getElementById('mes-despesa').textContent = fmtBRL(totalDes);
    document.getElementById('mes-saldo').textContent = fmtBRL(totalSaldo);

    if (dias.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-text">Nenhum lançamento neste mês</div>
        </div>`;
      return;
    }

    const maxRec = Math.max(...dias.map(d => d.total_receita), 1);
    const maxDes = Math.max(...dias.map(d => d.total_despesa), 1);

    const list = document.createElement('div');

    dias.forEach(d => {
      const pRec = Math.min(100, (d.total_receita / maxRec) * 100);
      const pDes = Math.min(100, (d.total_despesa / maxDes) * 100);

      const row = document.createElement('div');
      row.className = 'day-row';
      row.innerHTML = `
        <div class="day-num">${d.dia}</div>
        <div class="day-bars">
          <div class="day-bar-row">
            <span class="day-bar-label">Rec</span>
            <div class="day-bar-track">
              <div class="day-bar-fill receita" style="width:${pRec}%"></div>
            </div>
          </div>
          <div class="day-bar-row">
            <span class="day-bar-label">Des</span>
            <div class="day-bar-track">
              <div class="day-bar-fill despesa" style="width:${pDes}%"></div>
            </div>
          </div>
        </div>
        <div class="day-values">
          <div class="day-rec">${fmtBRL(d.total_receita)}</div>
          <div class="day-des">${fmtBRL(d.total_despesa)}</div>
        </div>
      `;

      // Click to jump to "Hoje" tab for that date
      row.addEventListener('click', () => {
        state.hojeData = d.data;
        document.getElementById('input-data').value = d.data;
        activateTab('hoje');
        loadHoje();
      });

      list.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-text">Erro: ${err.message}</div></div>`;
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function activateTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${name}`);
  });

  if (name === 'hoje') loadHoje();
  if (name === 'mes')  loadMes();
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Header date
  const headerDate = document.getElementById('header-date');
  const today = new Date();
  headerDate.textContent = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Date input default
  const dataInput = document.getElementById('input-data');
  dataInput.value = todayISO();
  dataInput.addEventListener('change', () => {
    state.lancamentoData = dataInput.value;
    state.hojeData = dataInput.value;
  });

  // Load plano de contas
  try {
    state.planoContas = await apiFetch('/api/plano-contas');
    renderCategoryGrids(state.planoContas);
  } catch (err) {
    showToast('Erro ao carregar contas: ' + err.message, 'error');
  }

  // Tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });

  // Numpad
  document.querySelectorAll('.numpad-btn[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => handleDigit(btn.dataset.digit));
  });
  document.getElementById('btn-del').addEventListener('click', handleDel);

  // Confirm / Cancel
  document.getElementById('btn-confirm').addEventListener('click', saveLancamento);
  document.getElementById('btn-cancel').addEventListener('click', closeValuePanel);
  document.getElementById('overlay').addEventListener('click', closeValuePanel);

  // Month navigation
  document.getElementById('mes-prev').addEventListener('click', () => {
    state.mesAtual--;
    if (state.mesAtual < 1) { state.mesAtual = 12; state.anoAtual--; }
    loadMes();
  });
  document.getElementById('mes-next').addEventListener('click', () => {
    state.mesAtual++;
    if (state.mesAtual > 12) { state.mesAtual = 1; state.anoAtual++; }
    loadMes();
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('[SW] Registrado com sucesso');
    }).catch(err => {
      console.warn('[SW] Erro ao registrar:', err);
    });
  }
}

document.addEventListener('DOMContentLoaded', init);
