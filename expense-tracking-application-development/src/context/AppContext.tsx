import { createContext, useContext, useState, ReactNode } from 'react';
import { Chantier, Depense, Devise } from '../types';
import { chantiersInitiaux, depensesInitiales } from '../data/initialData';
import { formatMontant as fmt } from '../utils/currency';

interface AppContextType {
  chantiers: Chantier[];
  depenses: Depense[];
  devise: Devise;
  setDevise: (d: Devise) => void;
  formatMontant: (n: number) => string;
  addChantier: (c: Chantier) => void;
  updateChantier: (c: Chantier) => void;
  deleteChantier: (id: string) => void;
  addDepense: (d: Depense) => void;
  updateDepense: (d: Depense) => void;
  deleteDepense: (id: string) => void;
  getDepensesParChantier: (chantierId: string) => Depense[];
  getTotalDepenses: (chantierId: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [chantiers, setChantiers] = useState<Chantier[]>(chantiersInitiaux);
  const [depenses, setDepenses] = useState<Depense[]>(depensesInitiales);
  const [devise, setDevise] = useState<Devise>('USD');

  const formatMontant = (n: number) => fmt(n, devise);

  const addChantier = (c: Chantier) => setChantiers(prev => [...prev, c]);
  const updateChantier = (c: Chantier) => setChantiers(prev => prev.map(x => x.id === c.id ? c : x));
  const deleteChantier = (id: string) => {
    setChantiers(prev => prev.filter(x => x.id !== id));
    setDepenses(prev => prev.filter(x => x.chantierId !== id));
  };

  const addDepense = (d: Depense) => setDepenses(prev => [...prev, d]);
  const updateDepense = (d: Depense) => setDepenses(prev => prev.map(x => x.id === d.id ? d : x));
  const deleteDepense = (id: string) => setDepenses(prev => prev.filter(x => x.id !== id));

  const getDepensesParChantier = (chantierId: string) => depenses.filter(d => d.chantierId === chantierId);
  const getTotalDepenses = (chantierId: string) => getDepensesParChantier(chantierId).reduce((s, d) => s + d.montant, 0);

  return (
    <AppContext.Provider value={{
      chantiers, depenses, devise, setDevise, formatMontant,
      addChantier, updateChantier, deleteChantier,
      addDepense, updateDepense, deleteDepense,
      getDepensesParChantier, getTotalDepenses
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
