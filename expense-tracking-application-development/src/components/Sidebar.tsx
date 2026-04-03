import { LayoutDashboard, HardHat, Receipt, BarChart3, Menu, X, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Devise } from '../types';

type Page = 'dashboard' | 'chantiers' | 'depenses' | 'rapports';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'chantiers' as Page, label: 'Chantiers', icon: HardHat },
  { id: 'depenses' as Page, label: 'Dépenses', icon: Receipt },
  { id: 'rapports' as Page, label: 'Rapports', icon: BarChart3 },
];

const DEVISES: { value: Devise; label: string; flag: string }[] = [
  { value: 'USD', label: 'Dollar (USD)', flag: '🇺🇸' },
  { value: 'CDF', label: 'Franc Congolais (CDF)', flag: '🇨🇩' },
];

export default function Sidebar({ currentPage, onNavigate, mobileOpen, onToggleMobile }: SidebarProps) {
  const { devise, setDevise } = useApp();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onToggleMobile} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-30 flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
              <HardHat size={20} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight">M.BUILD ChantierTrack</div>
              <div className="text-xs text-slate-400">Suivi des dépenses</div>
            </div>
          </div>
          <button onClick={onToggleMobile} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Superviseur */}
        <div className="px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold">
              JK
            </div>
            <div>
              <div className="text-sm font-semibold">Jean-Pierre Kabila</div>
              <div className="text-xs text-slate-400">Superviseur Principal</div>
            </div>
          </div>
        </div>

        {/* Sélecteur de devise */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Devise</span>
          </div>
          <div className="flex flex-col gap-2">
            {DEVISES.map(d => (
              <button
                key={d.value}
                onClick={() => setDevise(d.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  devise === d.value
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-base">{d.flag}</span>
                <span>{d.label}</span>
                {devise === d.value && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-white/70" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Taux : 1 USD = 2 800 CDF
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onToggleMobile(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                currentPage === id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-500 text-center">© 2025 M.BUILD ChantierTrack RDC v1.0</div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={onToggleMobile}
        className="fixed top-4 left-4 z-20 lg:hidden w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"
      >
        <Menu size={20} />
      </button>
    </>
  );
}
