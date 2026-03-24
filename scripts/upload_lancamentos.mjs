import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ehvqbrpccnejhnwnjbok.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodnFicnBjY25lamhud25qYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzI4ODQsImV4cCI6MjA4OTg0ODg4NH0.RHRrXRVZrKGu8e9oqxZxLc21_Ziw5DBU3Tg6_1iNdAg';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sql = readFileSync('./lancamentos_final.sql', 'utf-8');

// Extrai todas as linhas de VALUES
const rowRegex = /\('([^']+)',\s*(\d+),\s*([\d.]+),\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(\d+)\)/g;

const lancamentos = [];
let match;
while ((match = rowRegex.exec(sql)) !== null) {
  lancamentos.push({
    data:          match[1],
    cod:           parseInt(match[2]),
    valor:         parseFloat(match[3]),
    discriminacao: match[4],
    flag:          match[5],
    dia:           parseInt(match[6]),
    mes:           parseInt(match[7]),
    ano:           parseInt(match[8]),
  });
}

console.log(`Total de lançamentos parseados: ${lancamentos.length}`);

// Envia em lotes de 50
const BATCH = 50;
let inserted = 0;
let errors = 0;

for (let i = 0; i < lancamentos.length; i += BATCH) {
  const batch = lancamentos.slice(i, i + BATCH);
  const { data, error } = await supabase.from('lancamentos').insert(batch);
  if (error) {
    console.error(`Erro no lote ${i}-${i+BATCH}:`, error.message);
    errors += batch.length;
  } else {
    inserted += batch.length;
    process.stdout.write(`\rEnviados: ${inserted}/${lancamentos.length}`);
  }
}

console.log(`\n\nConcluído! ${inserted} inseridos, ${errors} erros.`);
