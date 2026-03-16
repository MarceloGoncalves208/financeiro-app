const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.RAILWAY_ENVIRONMENT ? '/app/data' : __dirname;
const DB_PATH = path.join(DB_DIR, 'financeiro.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'import_data.json'), 'utf-8'));

const insert = db.prepare(`
  INSERT OR IGNORE INTO lancamentos (data, cod, valor, discriminacao, flag, dia, mes)
  VALUES (@data, @cod, @valor, @discriminacao, @flag, @dia, @mes)
`);

// Verifica se a tabela existe
const tabela = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='lancamentos'").get();
if (!tabela) {
  console.error('Tabela lancamentos não encontrada. Inicie o servidor uma vez primeiro.');
  process.exit(1);
}

const importMany = db.transaction((rows) => {
  let count = 0;
  for (const row of rows) {
    insert.run(row);
    count++;
  }
  return count;
});

console.log(`Importando ${data.length} lançamentos...`);
const total = importMany(data);
console.log(`✅ ${total} lançamentos importados com sucesso!`);

const check = db.prepare('SELECT COUNT(*) as c FROM lancamentos').get();
console.log(`Total no banco: ${check.c} lançamentos`);

db.close();
