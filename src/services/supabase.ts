import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sjpfcezkfwyvffwuxwkq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqcGZjZXprZnd5dmZmd3V4d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDc2NjcsImV4cCI6MjA4NDY4MzY2N30.iONrKHNWJ7d_FI64S4edh_rjUM175A50wtMgtt1WtrU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
