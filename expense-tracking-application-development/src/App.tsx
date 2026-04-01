import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Chantiers from './components/Chantiers';
import Depenses from './components/Depenses';
import Rapports from './components/Rapports';

type Page = 'dashboard' | 'chantiers' | 'depenses' | 'rapports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'chantiers': return <Chantiers />;
      case 'depenses': return <Depenses />;
      case 'rapports': return <Rapports />;
      default: return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => setCurrentPage(p)}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(v => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8 pt-16 lg:pt-8">
            {renderPage()}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
