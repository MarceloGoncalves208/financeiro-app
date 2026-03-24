import React, { createContext, useContext, useState, useEffect } from 'react';
import { EMPRESAS, Empresa } from '../config/empresas';
import { initSupabase } from '../services/supabase';

const STORAGE_KEY = 'empresa_selecionada';

function saveEmpresa(id: string) {
  try { localStorage.setItem(STORAGE_KEY, id); } catch {}
}
function loadEmpresaId(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

interface EmpresaContextValue {
  empresa: Empresa | null;
  selectEmpresa: (id: string) => void;
  clearEmpresa: () => void;
}

const EmpresaContext = createContext<EmpresaContextValue>({
  empresa: null,
  selectEmpresa: () => {},
  clearEmpresa: () => {},
});

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedId = loadEmpresaId();
    if (savedId) {
      const found = EMPRESAS.find(e => e.id === savedId);
      if (found) {
        initSupabase(found.supabaseUrl, found.supabaseKey);
        setEmpresa(found);
      }
    }
    setReady(true);
  }, []);

  const selectEmpresa = (id: string) => {
    const found = EMPRESAS.find(e => e.id === id);
    if (!found) return;
    initSupabase(found.supabaseUrl, found.supabaseKey);
    saveEmpresa(id);
    setEmpresa(found);
  };

  const clearEmpresa = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setEmpresa(null);
  };

  if (!ready) return null;

  return (
    <EmpresaContext.Provider value={{ empresa, selectEmpresa, clearEmpresa }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  return useContext(EmpresaContext);
}
