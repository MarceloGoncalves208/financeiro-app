const Database = require('better-sqlite3');
const path = require('path');

// Em produção (Railway), usa o volume persistente em /app/data
const DB_PATH = process.env.RAILWAY_ENVIRONMENT
  ? '/app/data/financeiro.db'
  : path.join(__dirname, 'financeiro.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS plano_contas (
      cod INTEGER PRIMARY KEY,
      discriminacao TEXT NOT NULL,
      flag TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lancamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      cod INTEGER NOT NULL,
      valor REAL NOT NULL,
      discriminacao TEXT NOT NULL,
      flag TEXT NOT NULL,
      dia INTEGER NOT NULL,
      mes INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  seedPlanoCounts();
}

function seedPlanoCounts() {
  const count = db.prepare('SELECT COUNT(*) as c FROM plano_contas').get();
  if (count.c > 0) return;

  const insert = db.prepare('INSERT INTO plano_contas (cod, discriminacao, flag) VALUES (?, ?, ?)');

  const seed = [
    [1,  'Luz',               'F'],
    [2,  'Água',              'F'],
    [3,  'Net',               'F'],
    [4,  'Apoio',             'F'],
    [5,  'Passagem/Almoço',   'F'],
    [6,  'Salários',          'F'],
    [7,  'IPTU',              'F'],
    [8,  'Simples',           'V'],
    [9,  'FGTS',              'F'],
    [10, 'GPS',               'F'],
    [11, 'Diversos',          'F'],
    [12, 'Acordo 1',          'F'],
    [13, 'Acordo 2',          'F'],
    [14, 'Contador',          'F'],
    [15, 'Fornecedor',        'V'],
    [16, 'Normando',          'F'],
    [17, 'Marcelo',           'F'],
    [18, 'Rescisão',          'F'],
    [19, 'Funcionários',      'V'],
    [20, 'Dinheiro',          'R'],
    [21, 'Crédito',           'R'],
    [22, 'Débito',            'R'],
    [23, 'Parcelado',         'R'],
    [24, 'Cheque',            'R'],
    [25, 'Pag For Banco',     'B'],
    [33, 'Vendedor 3',        'VE'],
    [43, 'Vendedor 3 Atend',  'AT'],
    [53, 'Vendedor 3 Produto','PR'],
    [63, 'Guenta 3',          'MT'],
    [65, 'Pag. Guenta',       'V'],
  ];

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(...item);
    }
  });

  insertMany(seed);
  console.log('Plano de contas inicializado com', seed.length, 'registros.');
}

module.exports = { getDb };
