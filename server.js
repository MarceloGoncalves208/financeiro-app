require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Plano de Contas ────────────────────────────────────────────────────────

app.get('/api/plano-contas', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM plano_contas ORDER BY cod').all();
    res.json(rows);
  } catch (err) {
    console.error('Erro em GET /api/plano-contas:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Lançamentos ────────────────────────────────────────────────────────────

app.get('/api/lancamentos', (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: 'Parâmetro data obrigatório' });

    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM lancamentos WHERE data = ? ORDER BY created_at DESC'
    ).all(data);
    res.json(rows);
  } catch (err) {
    console.error('Erro em GET /api/lancamentos:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lancamentos/resumo', (req, res) => {
  try {
    const { mes, ano } = req.query;
    if (!mes || !ano) return res.status(400).json({ error: 'Parâmetros mes e ano obrigatórios' });

    const db = getDb();
    const rows = db.prepare(`
      SELECT
        dia,
        data,
        SUM(CASE WHEN flag = 'R' THEN valor ELSE 0 END) AS total_receita,
        SUM(CASE WHEN flag IN ('F','V','B') THEN valor ELSE 0 END) AS total_despesa,
        COUNT(*) AS qtd_lancamentos
      FROM lancamentos
      WHERE mes = ? AND CAST(strftime('%Y', data) AS INTEGER) = ?
      GROUP BY dia, data
      ORDER BY dia
    `).all(parseInt(mes), parseInt(ano));
    res.json(rows);
  } catch (err) {
    console.error('Erro em GET /api/lancamentos/resumo:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lancamentos', (req, res) => {
  try {
    const { data, cod, valor } = req.body;

    if (!data || !cod || valor === undefined) {
      return res.status(400).json({ error: 'Campos data, cod e valor são obrigatórios' });
    }

    const db = getDb();
    const conta = db.prepare('SELECT * FROM plano_contas WHERE cod = ?').get(cod);
    if (!conta) return res.status(404).json({ error: 'Código de conta não encontrado' });

    const dateObj = new Date(data + 'T00:00:00');
    const dia = dateObj.getDate();
    const mes = dateObj.getMonth() + 1;

    const result = db.prepare(`
      INSERT INTO lancamentos (data, cod, valor, discriminacao, flag, dia, mes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data, cod, valor, conta.discriminacao, conta.flag, dia, mes);

    const novo = db.prepare('SELECT * FROM lancamentos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(novo);
  } catch (err) {
    console.error('Erro em POST /api/lancamentos:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/lancamentos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const result = db.prepare('DELETE FROM lancamentos WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.json({ success: true, id: parseInt(id) });
  } catch (err) {
    console.error('Erro em DELETE /api/lancamentos/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Resumo do Dia ───────────────────────────────────────────────────────────

app.get('/api/resumo-dia', (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.status(400).json({ error: 'Parâmetro data obrigatório' });

    const db = getDb();
    const rows = db.prepare(`
      SELECT
        flag,
        SUM(valor) AS total,
        COUNT(*) AS qtd
      FROM lancamentos
      WHERE data = ?
      GROUP BY flag
    `).all(data);

    const receita = rows.filter(r => r.flag === 'R').reduce((s, r) => s + r.total, 0);
    const despesa = rows.filter(r => ['F','V','B'].includes(r.flag)).reduce((s, r) => s + r.total, 0);
    const saldo = receita - despesa;

    res.json({ data, receita, despesa, saldo, detalhes: rows });
  } catch (err) {
    console.error('Erro em GET /api/resumo-dia:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fallback SPA ────────────────────────────────────────────────────────────

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor Comfort Shoes Financeiro rodando em http://localhost:${PORT}`);
  getDb(); // inicializa o banco
});
