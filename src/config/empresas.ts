export interface Empresa {
  id: string;
  nome: string;
  segmento: string;
  cor: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export const EMPRESAS: Empresa[] = [
  {
    id: 'gula-grill',
    nome: 'Gula Grill',
    segmento: 'Restaurante',
    cor: '#ef476f',
    supabaseUrl: 'https://ehvqbrpccnejhnwnjbok.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodnFicnBjY25lamhud25qYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzI4ODQsImV4cCI6MjA4OTg0ODg4NH0.RHRrXRVZrKGu8e9oqxZxLc21_Ziw5DBU3Tg6_1iNdAg',
  },
  {
    id: 'comfort-shoes',
    nome: 'Comfort Shoes',
    segmento: 'Calçados',
    cor: '#4361ee',
    supabaseUrl: 'https://sjpfcezkfwyvffwuxwkq.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcGZjZXprZnd5dmZmd3V4d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDc2NjcsImV4cCI6MjA4NDY4MzY2N30.iONrKHNWJ7d_FI64S4edh_rjUM175A50wtMgtt1WtrU',
  },
];
