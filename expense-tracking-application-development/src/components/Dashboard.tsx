import { useApp } from '../context/AppContext';
import { TrendingUp, TrendingDown, HardHat, Receipt, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { chantiers, depenses, getTotalDepenses, formatMontant, devise } = useApp();

  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDepenses = chantiers.reduce((s, c) => s + getTotalDepenses(c.id), 0);
  const soldeRestant = totalBudget - totalDepenses;
  const tauxConsommation = totalBudget > 0 ? (totalDepenses / totalBudget) * 100 : 0;

  const enCours = chantiers.filter(c => c.statut === 'En cours').length;
  const termines = chantiers.filter(c => c.statut === 'Terminé').length;
  const chantiersEnAlerte = chantiers.filter(c => getTotalDepenses(c.id) > c.budget * 0.85).length;

  const dernieresDepenses = [...depenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de tous les chantiers</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-base">{devise === 'USD' ? '🇺🇸' : '🇨🇩'}</span>
          <span className="text-xs font-semibold text-orange-700">{devise}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Budget Total"
          value={formatMontant(totalBudget)}
          icon={<TrendingUp size={20} />}
          color="blue"
          sub={`${chantiers.length} chantiers`}
        />
        <KPICard
          title="Total Dépensé"
          value={formatMontant(totalDepenses)}
          icon={<Receipt size={20} />}
          color="orange"
          sub={`${tauxConsommation.toFixed(1)}% consommé`}
        />
        <KPICard
          title="Solde Restant"
          value={formatMontant(soldeRestant)}
          icon={soldeRestant >= 0 ? <TrendingDown size={20} /> : <AlertTriangle size={20} />}
          color={soldeRestant >= 0 ? 'green' : 'red'}
          sub={soldeRestant >= 0 ? 'Budget disponible' : 'Dépassement!'}
        />
        <KPICard
          title="Chantiers Actifs"
          value={String(enCours)}
          icon={<HardHat size={20} />}
          color="purple"
          sub={`${termines} terminé(s)`}
        />
      </div>

      {/* Alert */}
      {chantiersEnAlerte > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-semibold">{chantiersEnAlerte} chantier(s)</span> ont consommé plus de 85% de leur budget — vérifiez les dépenses.
          </p>
        </div>
      )}

      {/* Avancement budgétaire + Dernières dépenses */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Avancement budgétaire */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-5">Avancement budgétaire</h2>
          <div className="space-y-5">
            {chantiers.map(c => {
              const dep = getTotalDepenses(c.id);
              const pct = Math.min((dep / c.budget) * 100, 100);
              const alerte = pct >= 85;
              return (
                <div key={c.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{c.nom}</span>
                    <div className="flex items-center gap-1">
                      {alerte && <AlertTriangle size={13} className="text-amber-500" />}
                      <span className={`text-xs font-semibold ${pct >= 100 ? 'text-red-600' : alerte ? 'text-amber-600' : 'text-slate-600'}`}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${pct >= 100 ? 'bg-red-500' : alerte ? 'bg-amber-400' : 'bg-orange-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Dépensé : {formatMontant(dep)}</span>
                    <span>Budget : {formatMontant(c.budget)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dernières dépenses */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-5">Dernières dépenses</h2>
          <div className="space-y-3">
            {dernieresDepenses.map(d => {
              const chantier = chantiers.find(c => c.id === d.chantierId);
              return (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ background: chantier?.couleur || '#888' }}
                    >
                      {chantier?.nom.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{d.titre}</div>
                      <div className="text-xs text-slate-400">{d.categorie} · {new Date(d.date).toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-orange-600 shrink-0">{formatMontant(d.montant)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Récapitulatif par chantier */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-base font-semibold text-slate-700 mb-4">Récapitulatif par chantier</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Chantier</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Superviseur</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget ({devise})</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Dépensé ({devise})</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Restant ({devise})</th>
              </tr>
            </thead>
            <tbody>
              {chantiers.map(c => {
                const dep = getTotalDepenses(c.id);
                const reste = c.budget - dep;
                const statutColors: Record<string, string> = {
                  'En cours': 'bg-blue-100 text-blue-700',
                  'Terminé': 'bg-emerald-100 text-emerald-700',
                  'En pause': 'bg-amber-100 text-amber-700',
                  'Planifié': 'bg-slate-100 text-slate-600',
                };
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.couleur }} />
                        <span className="font-medium text-slate-700">{c.nom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{c.superviseur}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                        {c.statut}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 font-medium">{formatMontant(c.budget)}</td>
                    <td className="py-3 px-3 text-right text-orange-600 font-semibold">{formatMontant(dep)}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${reste < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {reste >= 0 ? '+' : ''}{formatMontant(reste)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon, color, sub }: {
  title: string; value: string; icon: React.ReactNode; color: 'blue' | 'orange' | 'green' | 'red' | 'purple'; sub: string;
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    orange: 'from-orange-400 to-orange-600 shadow-orange-200',
    green: 'from-emerald-400 to-emerald-600 shadow-emerald-200',
    red: 'from-red-400 to-red-600 shadow-red-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium mb-1">{title}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
          <p className="text-xs text-slate-400 mt-1">{sub}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
