import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ehvqbrpccnejhnwnjbok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVodnFicnBjY25lamhud25qYm9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNzI4ODQsImV4cCI6MjA4OTg0ODg4NH0.RHRrXRVZrKGu8e9oqxZxLc21_Ziw5DBU3Tg6_1iNdAg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
