import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  exporterRapportGlobalPDF,
  exporterRapportChantierPDF,
  exporterRapportSuperviseurPDF,
} from '../utils/exportPDF';
import { Chantier, Depense, Devise } from '../types';

const COULEURS_CATEGORIE = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

type OngletType = 'global' | 'chantier' | 'superviseur';

// ─── Utilitaires CSV ───────────────────────────────────────────────────────────
const TAUX = 2800;

function fm(montant: number, devise: Devise): string {
  const val = devise === 'CDF' ? montant * TAUX : montant;
  return devise === 'USD' ? `$ ${val.toFixed(2)}` : `${val.toFixed(0)} FC`;
}

function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${((a / b) * 100).toFixed(1)}%`;
}

function cel(val: string | number): string {
  const s = String(val ?? '');
  if (s.includes(';') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function row(...cols: (string | number)[]): string {
  return cols.map(cel).join(';') + '\n';
}

function downloadCSV(content: string, filename: string) {
  try {
    const BOM = '\uFEFF';
    const full = BOM + content;
    const blob = new Blob([full], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch (e) {
    console.error('Erreur téléchargement CSV:', e);
    alert('Erreur lors du téléchargement. Veuillez réessayer.');
  }
}

// ─── Export Global CSV ────────────────────────────────────────────────────────
function exportGlobalCSV(chantiers: Chantier[], depenses: Depense[], devise: Devise) {
  const date = new Date().toLocaleDateString('fr-FR');
  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDepense = depenses.reduce((s, d) => s + d.montant, 0);
  let csv = '';

  csv += row('RAPPORT GLOBAL - SUIVI DES DEPENSES DE CHANTIERS');
  csv += row('Date edition:', date, 'Devise:', devise === 'USD' ? 'Dollar (USD)' : 'Franc Congolais (CDF)');
  csv += row('Taux:', '1 USD = 2800 CDF');
  csv += '\n';

  csv += row('=== RESUME FINANCIER ===');
  csv += row('Budget Total', fm(totalBudget, devise));
  csv += row('Total Depense', fm(totalDepense, devise));
  csv += row('Solde Restant', fm(totalBudget - totalDepense, devise));
  csv += row('Pct Consomme', pct(totalDepense, totalBudget));
  csv += row('Nb Chantiers', chantiers.length);
  csv += row('Nb Depenses', depenses.length);
  csv += '\n';

  csv += row('=== DETAIL PAR CHANTIER ===');
  csv += row('Chantier', 'Lieu', 'Superviseur', 'Statut', 'Budget', 'Depense', 'Solde', 'Pct');
  chantiers.forEach(c => {
    const dep = depenses.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
    csv += row(c.nom, c.lieu, c.superviseur, c.statut, fm(c.budget, devise), fm(dep, devise), fm(c.budget - dep, devise), pct(dep, c.budget));
  });
  csv += '\n';

  csv += row('=== TOUTES LES DEPENSES ===');
  csv += row('Date', 'Chantier', 'Titre', 'Categorie', 'Fournisseur', 'Montant', 'Description');
  [...depenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
    const ch = chantiers.find(c => c.id === d.chantierId);
    csv += row(d.date, ch?.nom || '', d.titre, d.categorie, d.fournisseur, fm(d.montant, devise), d.description);
  });
  csv += row('', '', '', '', 'TOTAL', fm(totalDepense, devise));
  csv += '\n';

  const catMap: Record<string, number> = {};
  depenses.forEach(d => { catMap[d.categorie] = (catMap[d.categorie] || 0) + d.montant; });
  csv += row('=== PAR CATEGORIE ===');
  csv += row('Categorie', 'Montant', 'Pct');
  Object.entries(catMap).sort(([, a], [, b]) => b - a).forEach(([nom, val]) => {
    csv += row(nom, fm(val, devise), pct(val, totalDepense));
  });
  csv += '\n';

  const supMap: Record<string, { budget: number; dep: number; nb: number }> = {};
  chantiers.forEach(c => {
    if (!supMap[c.superviseur]) supMap[c.superviseur] = { budget: 0, dep: 0, nb: 0 };
    const dep = depenses.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
    supMap[c.superviseur].budget += c.budget;
    supMap[c.superviseur].dep += dep;
    supMap[c.superviseur].nb += 1;
  });
  csv += row('=== PAR SUPERVISEUR ===');
  csv += row('Superviseur', 'Nb Chantiers', 'Budget', 'Depense', 'Solde');
  Object.entries(supMap).forEach(([sup, d]) => {
    csv += row(sup, d.nb, fm(d.budget, devise), fm(d.dep, devise), fm(d.budget - d.dep, devise));
  });

  downloadCSV(csv, `Rapport_Global_${date.replace(/\//g, '-')}`);
}

// ─── Export Chantier CSV ──────────────────────────────────────────────────────
function exportChantierCSV(chantier: Chantier, depenses: Depense[], devise: Devise) {
  const date = new Date().toLocaleDateString('fr-FR');
  const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
  let csv = '';

  csv += row('RAPPORT DE CHANTIER - ' + chantier.nom.toUpperCase());
  csv += row('Date edition:', date, 'Devise:', devise === 'USD' ? 'Dollar (USD)' : 'Franc Congolais (CDF)');
  csv += '\n';

  csv += row('=== FICHE DU CHANTIER ===');
  csv += row('Nom', chantier.nom);
  csv += row('Lieu', chantier.lieu);
  csv += row('Superviseur', chantier.superviseur);
  csv += row('Statut', chantier.statut);
  csv += row('Date debut', chantier.dateDebut);
  csv += row('Date fin', chantier.dateFin);
  csv += row('Description', chantier.description);
  csv += '\n';

  csv += row('=== RESUME FINANCIER ===');
  csv += row('Budget alloue', fm(chantier.budget, devise));
  csv += row('Total depense', fm(totalDep, devise));
  csv += row('Solde restant', fm(chantier.budget - totalDep, devise));
  csv += row('Pct consomme', pct(totalDep, chantier.budget));
  csv += row('Nb depenses', depenses.length);
  csv += '\n';

  csv += row('=== LISTE DES DEPENSES ===');
  csv += row('Date', 'Titre', 'Categorie', 'Fournisseur', 'Montant', 'Description');
  [...depenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
    csv += row(d.date, d.titre, d.categorie, d.fournisseur, fm(d.montant, devise), d.description);
  });
  csv += row('', '', '', 'TOTAL', fm(totalDep, devise));
  csv += '\n';

  const catMap: Record<string, number> = {};
  depenses.forEach(d => { catMap[d.categorie] = (catMap[d.categorie] || 0) + d.montant; });
  csv += row('=== PAR CATEGORIE ===');
  csv += row('Categorie', 'Montant', 'Pct');
  Object.entries(catMap).sort(([, a], [, b]) => b - a).forEach(([nom, val]) => {
    csv += row(nom, fm(val, devise), pct(val, totalDep));
  });

  downloadCSV(csv, `Rapport_Chantier_${chantier.nom.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}`);
}

// ─── Export Superviseur CSV ───────────────────────────────────────────────────
function exportSuperviseurCSV(superviseur: string, chantiers: Chantier[], depenses: Depense[], devise: Devise) {
  const date = new Date().toLocaleDateString('fr-FR');
  const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);
  let csv = '';

  csv += row('RAPPORT SUPERVISEUR - ' + superviseur.toUpperCase());
  csv += row('Date edition:', date, 'Devise:', devise === 'USD' ? 'Dollar (USD)' : 'Franc Congolais (CDF)');
  csv += '\n';

  csv += row('=== RESUME ===');
  csv += row('Superviseur', superviseur);
  csv += row('Nb chantiers', chantiers.length);
  csv += row('Budget total', fm(totalBudget, devise));
  csv += row('Total depense', fm(totalDep, devise));
  csv += row('Solde', fm(totalBudget - totalDep, devise));
  csv += row('Pct consomme', pct(totalDep, totalBudget));
  csv += '\n';

  csv += row('=== SES CHANTIERS ===');
  csv += row('Chantier', 'Lieu', 'Statut', 'Budget', 'Depense', 'Solde', 'Pct');
  chantiers.forEach(c => {
    const dep = depenses.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
    csv += row(c.nom, c.lieu, c.statut, fm(c.budget, devise), fm(dep, devise), fm(c.budget - dep, devise), pct(dep, c.budget));
  });
  csv += '\n';

  csv += row('=== TOUTES LES DEPENSES ===');
  csv += row('Date', 'Chantier', 'Titre', 'Categorie', 'Fournisseur', 'Montant');
  [...depenses].sort((a, b) => b.date.localeCompare(a.date)).forEach(d => {
    const ch = chantiers.find(c => c.id === d.chantierId);
    csv += row(d.date, ch?.nom || '', d.titre, d.categorie, d.fournisseur, fm(d.montant, devise));
  });
  csv += row('', '', '', '', 'TOTAL', fm(totalDep, devise));

  downloadCSV(csv, `Rapport_Superviseur_${superviseur.replace(/\s+/g, '_')}_${date.replace(/\//g, '-')}`);
}

// ─── Composant Principal ──────────────────────────────────────────────────────
export default function Rapports() {
  const { chantiers, depenses, getTotalDepenses, formatMontant, devise } = useApp();
  const [onglet, setOnglet] = useState<OngletType>('global');
  const [chantierSelId, setChantierSelId] = useState<string>(chantiers[0]?.id || '');
  const [superviseurSel, setSuperviseurSel] = useState<string>('');

  // ── Données globales ──
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);

  const catData: Record<string, number> = {};
  depenses.forEach(d => { catData[d.categorie] = (catData[d.categorie] || 0) + d.montant; });
  const categories = Object.entries(catData).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }));

  const topDepenses = [...depenses].sort((a, b) => b.montant - a.montant).slice(0, 10);

  const superviseurData: Record<string, { total: number; nbChantiers: number }> = {};
  chantiers.forEach(c => {
    if (!superviseurData[c.superviseur]) superviseurData[c.superviseur] = { total: 0, nbChantiers: 0 };
    superviseurData[c.superviseur].total += getTotalDepenses(c.id);
    superviseurData[c.superviseur].nbChantiers += 1;
  });
  const superviseurs = Object.keys(superviseurData);
  if (!superviseurSel && superviseurs.length > 0) setSuperviseurSel(superviseurs[0]);

  const depenseParMois: Record<string, number> = {};
  depenses.forEach(d => {
    const mois = d.date.substring(0, 7);
    depenseParMois[mois] = (depenseParMois[mois] || 0) + d.montant;
  });
  const moisData = Object.entries(depenseParMois)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mois, total]) => ({
      label: new Date(mois + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      total,
    }));

  // ── Données chantier sélectionné ──
  const chantierSel = chantiers.find(c => c.id === chantierSelId);
  const depensesChantierSel = depenses.filter(d => d.chantierId === chantierSelId);
  const totalDepChantierSel = depensesChantierSel.reduce((s, d) => s + d.montant, 0);

  // ── Données superviseur sélectionné ──
  const chantiersSupSel = chantiers.filter(c => c.superviseur === superviseurSel);
  const depensesSupSel = depenses.filter(d => chantiersSupSel.find(c => c.id === d.chantierId));
  const totalDepSupSel = depensesSupSel.reduce((s, d) => s + d.montant, 0);
  const totalBudgetSupSel = chantiersSupSel.reduce((s, c) => s + c.budget, 0);

  const statutColors: Record<string, string> = {
    'En cours': 'bg-blue-100 text-blue-700',
    'Terminé': 'bg-emerald-100 text-emerald-700',
    'En pause': 'bg-amber-100 text-amber-700',
    'Planifié': 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-6">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rapports & Exports</h1>
          <p className="text-slate-500 text-sm mt-1">Générez des rapports détaillés en PDF ou Excel pour l'administration</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
          <span className="text-base">{devise === 'USD' ? '🇺🇸' : '🇨🇩'}</span>
          <span className="text-xs font-semibold text-orange-700">{devise}</span>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          { key: 'global', label: '🌍 Rapport Global' },
          { key: 'chantier', label: '🏗️ Par Chantier' },
          { key: 'superviseur', label: '👷 Par Superviseur' },
        ] as { key: OngletType; label: string }[]).map(o => (
          <button
            key={o.key}
            onClick={() => setOnglet(o.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              onglet === o.key
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* ══════════════ ONGLET GLOBAL ══════════════ */}
      {onglet === 'global' && (
        <div className="space-y-6">
          {/* Boutons d'export */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-1">📊 Rapport Global — Tous les chantiers</h2>
            <p className="text-blue-200 text-sm mb-5">
              Export complet : résumé des chantiers, toutes les dépenses, par catégorie, par superviseur, par mois.
            </p>
            <div className="flex flex-wrap gap-3">
              <BtnExport
                label="Télécharger PDF"
                icon="📄"
                couleur="bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => exporterRapportGlobalPDF(chantiers, depenses, devise)}
              />
              <BtnExport
                label="Télécharger Excel (CSV)"
                icon="📊"
                couleur="bg-emerald-500 text-white hover:bg-emerald-400"
                onClick={() => exportGlobalCSV(chantiers, depenses, devise)}
              />
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total budgets" value={formatMontant(totalBudget)} color="text-blue-600" bg="bg-blue-50" />
            <StatCard label="Total dépensé" value={formatMontant(totalDepenses)} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Économies réalisées" value={formatMontant(totalBudget - totalDepenses)} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard label="Nb de dépenses" value={String(depenses.length)} color="text-purple-600" bg="bg-purple-50" />
          </div>

          {/* Tableau récapitulatif */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-700 mb-4">
              Récapitulatif Budget / Dépenses par chantier
              <span className="ml-2 text-xs text-slate-400 font-normal">({devise})</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Chantier', 'Lieu', 'Superviseur', 'Statut', 'Budget', 'Dépensé', 'Restant', '% Conso.'].map(h => (
                      <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${['Chantier', 'Lieu', 'Superviseur', 'Statut'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chantiers.map(c => {
                    const dep = getTotalDepenses(c.id);
                    const reste = c.budget - dep;
                    const p = c.budget > 0 ? (dep / c.budget) * 100 : 0;
                    return (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.couleur }} />
                            <span className="font-medium text-slate-700">{c.nom}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{c.lieu}</td>
                        <td className="py-3 px-3 text-slate-500">{c.superviseur}</td>
                        <td className="py-3 px-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[c.statut] || 'bg-slate-100 text-slate-600'}`}>{c.statut}</span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-medium">{formatMontant(c.budget)}</td>
                        <td className="py-3 px-3 text-right text-orange-600 font-semibold">{formatMontant(dep)}</td>
                        <td className={`py-3 px-3 text-right font-semibold ${reste < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {reste >= 0 ? '+' : ''}{formatMontant(reste)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${p >= 100 ? 'bg-red-100 text-red-600' : p >= 85 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                            {p.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="py-3 px-3 text-sm font-bold text-slate-700">TOTAL</td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-slate-700">{formatMontant(totalBudget)}</td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-orange-600">{formatMontant(totalDepenses)}</td>
                    <td className={`py-3 px-3 text-right text-sm font-bold ${totalBudget - totalDepenses < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                      {totalBudget - totalDepenses >= 0 ? '+' : ''}{formatMontant(totalBudget - totalDepenses)}
                    </td>
                    <td className="py-3 px-3 text-right text-sm font-bold text-slate-600">
                      {totalBudget > 0 ? ((totalDepenses / totalBudget) * 100).toFixed(1) : '0'}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Catégorie + Superviseur */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Dépenses par catégorie</h2>
              <div className="space-y-3">
                {categories.map((item, i) => {
                  const p = totalDepenses > 0 ? (item.value / totalDepenses) * 100 : 0;
                  return (
                    <div key={item.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length] }} />
                          <span className="text-sm text-slate-700 font-medium">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-800">{formatMontant(item.value)}</span>
                          <span className="text-xs text-slate-400 w-10 text-right">{p.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ width: `${p}%`, background: COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-base font-semibold text-slate-700 mb-4">Dépenses par superviseur</h2>
              <div className="space-y-4">
                {Object.entries(superviseurData).map(([sup, data]) => {
                  const p = totalDepenses > 0 ? (data.total / totalDepenses) * 100 : 0;
                  return (
                    <div key={sup}>
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{sup}</div>
                          <div className="text-xs text-slate-400">{data.nbChantiers} chantier(s)</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-800">{formatMontant(data.total)}</div>
                          <div className="text-xs text-slate-400">{p.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${p}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dépenses par mois */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-700 mb-4">Dépenses par mois</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mois</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total ({devise})</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">% du total</th>
                  </tr>
                </thead>
                <tbody>
                  {moisData.map(({ label, total }) => {
                    const p = totalDepenses > 0 ? (total / totalDepenses) * 100 : 0;
                    return (
                      <tr key={label} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-slate-700 capitalize">{label}</td>
                        <td className="py-3 px-3 text-right text-orange-600 font-semibold">{formatMontant(total)}</td>
                        <td className="py-3 px-3 text-right text-slate-500">{p.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-semibold text-slate-700 mb-4">Top 10 des plus grosses dépenses</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['#', 'Date', 'Description', 'Chantier', 'Catégorie', 'Fournisseur', `Montant (${devise})`].map((h, i) => (
                      <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topDepenses.map((d, i) => {
                    const chantier = chantiers.find(c => c.id === d.chantierId);
                    return (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-xs font-bold text-slate-400">{i + 1}</td>
                        <td className="py-3 px-3 text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-3 px-3 font-medium text-slate-700">{d.titre}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: chantier?.couleur || '#888' }} />
                            <span className="text-slate-500">{chantier?.nom || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-medium">{d.categorie}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{d.fournisseur || '—'}</td>
                        <td className="py-3 px-3 text-right font-bold text-orange-600">{formatMontant(d.montant)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ ONGLET PAR CHANTIER ══════════════ */}
      {onglet === 'chantier' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-1">🏗️ Rapport Détaillé par Chantier</h2>
            <p className="text-purple-200 text-sm mb-4">
              Fiche complète du chantier, toutes ses dépenses, répartition par catégorie.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                value={chantierSelId}
                onChange={e => setChantierSelId(e.target.value)}
                className="px-4 py-2 rounded-lg text-slate-800 font-medium text-sm bg-white border-0 outline-none min-w-[220px]"
              >
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
              <div className="flex gap-3 flex-wrap">
                <BtnExport
                  label="Télécharger PDF"
                  icon="📄"
                  couleur="bg-white text-purple-700 hover:bg-purple-50"
                  onClick={() => chantierSel && exporterRapportChantierPDF(chantierSel, depensesChantierSel, devise)}
                />
                <BtnExport
                  label="Télécharger Excel (CSV)"
                  icon="📊"
                  couleur="bg-emerald-500 text-white hover:bg-emerald-400"
                  onClick={() => chantierSel && exportChantierCSV(chantierSel, depensesChantierSel, devise)}
                />
              </div>
            </div>
          </div>

          {chantierSel && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-5 h-5 rounded-full" style={{ background: chantierSel.couleur }} />
                  <h2 className="text-base font-bold text-slate-800">{chantierSel.nom}</h2>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[chantierSel.statut] || 'bg-slate-100 text-slate-600'}`}>{chantierSel.statut}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Lieu', val: chantierSel.lieu },
                    { label: 'Superviseur', val: chantierSel.superviseur },
                    { label: 'Date début', val: new Date(chantierSel.dateDebut).toLocaleDateString('fr-FR') },
                    { label: 'Date fin', val: new Date(chantierSel.dateFin).toLocaleDateString('fr-FR') },
                    { label: 'Nb dépenses', val: String(depensesChantierSel.length) },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 font-medium">{label}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
                {chantierSel.description && (
                  <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3">{chantierSel.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(() => {
                  const reste = chantierSel.budget - totalDepChantierSel;
                  const p = chantierSel.budget > 0 ? (totalDepChantierSel / chantierSel.budget) * 100 : 0;
                  return [
                    { label: 'Budget alloué', value: formatMontant(chantierSel.budget), color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total dépensé', value: formatMontant(totalDepChantierSel), color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Solde restant', value: formatMontant(reste), color: reste >= 0 ? 'text-emerald-600' : 'text-red-500', bg: reste >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
                    { label: '% Consommé', value: `${p.toFixed(1)}%`, color: p >= 100 ? 'text-red-600' : p >= 85 ? 'text-amber-600' : 'text-purple-600', bg: 'bg-purple-50' },
                  ].map(s => <StatCard key={s.label} {...s} />);
                })()}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4">
                  Détail des dépenses
                  <span className="ml-2 text-xs text-slate-400 font-normal">({devise})</span>
                </h3>
                {depensesChantierSel.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">Aucune dépense enregistrée pour ce chantier.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['#', 'Date', 'Description', 'Catégorie', 'Fournisseur', 'Remarque', 'Montant'].map((h, i) => (
                            <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...depensesChantierSel]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((d, i) => (
                            <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3 text-xs text-slate-400 font-bold">{i + 1}</td>
                              <td className="py-3 px-3 text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                              <td className="py-3 px-3 font-medium text-slate-700">{d.titre}</td>
                              <td className="py-3 px-3">
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{d.categorie}</span>
                              </td>
                              <td className="py-3 px-3 text-slate-500">{d.fournisseur || '—'}</td>
                              <td className="py-3 px-3 text-slate-400 text-xs">{d.description || '—'}</td>
                              <td className="py-3 px-3 text-right font-bold text-orange-600">{formatMontant(d.montant)}</td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="py-3 px-3 text-sm font-bold text-slate-700">TOTAL</td>
                          <td className="py-3 px-3 text-right text-sm font-bold text-orange-600">{formatMontant(totalDepChantierSel)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {depensesChantierSel.length > 0 && (() => {
                const catCh: Record<string, number> = {};
                depensesChantierSel.forEach(d => { catCh[d.categorie] = (catCh[d.categorie] || 0) + d.montant; });
                const catsCh = Object.entries(catCh).sort(([, a], [, b]) => b - a);
                return (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-base font-semibold text-slate-700 mb-4">Répartition par catégorie</h3>
                    <div className="space-y-3">
                      {catsCh.map(([cat, total], i) => {
                        const p = totalDepChantierSel > 0 ? (total / totalDepChantierSel) * 100 : 0;
                        return (
                          <div key={cat}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ background: COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length] }} />
                                <span className="text-sm font-medium text-slate-700">{cat}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-800">{formatMontant(total)}</span>
                                <span className="text-xs text-slate-400 w-10 text-right">{p.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${p}%`, background: COULEURS_CATEGORIE[i % COULEURS_CATEGORIE.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* ══════════════ ONGLET PAR SUPERVISEUR ══════════════ */}
      {onglet === 'superviseur' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-700 rounded-2xl p-6 text-white">
            <h2 className="text-lg font-bold mb-1">👷 Rapport Détaillé par Superviseur</h2>
            <p className="text-orange-100 text-sm mb-4">
              Tous les chantiers et dépenses d'un superviseur, avec synthèse financière complète.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                value={superviseurSel}
                onChange={e => setSuperviseurSel(e.target.value)}
                className="px-4 py-2 rounded-lg text-slate-800 font-medium text-sm bg-white border-0 outline-none min-w-[220px]"
              >
                {superviseurs.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="flex gap-3 flex-wrap">
                <BtnExport
                  label="Télécharger PDF"
                  icon="📄"
                  couleur="bg-white text-orange-700 hover:bg-orange-50"
                  onClick={() => exporterRapportSuperviseurPDF(superviseurSel, chantiersSupSel, depensesSupSel, devise)}
                />
                <BtnExport
                  label="Télécharger Excel (CSV)"
                  icon="📊"
                  couleur="bg-emerald-500 text-white hover:bg-emerald-400"
                  onClick={() => exportSuperviseurCSV(superviseurSel, chantiersSupSel, depensesSupSel, devise)}
                />
              </div>
            </div>
          </div>

          {superviseurSel && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Budget total', value: formatMontant(totalBudgetSupSel), color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total dépensé', value: formatMontant(totalDepSupSel), color: 'text-orange-600', bg: 'bg-orange-50' },
                  { label: 'Solde restant', value: formatMontant(totalBudgetSupSel - totalDepSupSel), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Chantiers supervisés', value: String(chantiersSupSel.length), color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map(s => <StatCard key={s.label} {...s} />)}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4">
                  Chantiers supervisés par <span className="text-blue-700">{superviseurSel}</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Chantier', 'Lieu', 'Statut', 'Début', 'Fin', 'Budget', 'Dépensé', 'Restant', '% Conso.'].map((h, i) => (
                          <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i < 5 ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chantiersSupSel.map(c => {
                        const dep = depensesSupSel.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
                        const reste = c.budget - dep;
                        const p = c.budget > 0 ? (dep / c.budget) * 100 : 0;
                        return (
                          <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.couleur }} />
                                <span className="font-medium text-slate-700">{c.nom}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{c.lieu}</td>
                            <td className="py-3 px-3">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutColors[c.statut] || 'bg-slate-100 text-slate-600'}`}>{c.statut}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">{new Date(c.dateDebut).toLocaleDateString('fr-FR')}</td>
                            <td className="py-3 px-3 text-slate-500">{new Date(c.dateFin).toLocaleDateString('fr-FR')}</td>
                            <td className="py-3 px-3 text-right text-slate-700 font-medium">{formatMontant(c.budget)}</td>
                            <td className="py-3 px-3 text-right text-orange-600 font-semibold">{formatMontant(dep)}</td>
                            <td className={`py-3 px-3 text-right font-semibold ${reste < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                              {reste >= 0 ? '+' : ''}{formatMontant(reste)}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${p >= 100 ? 'bg-red-100 text-red-600' : p >= 85 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                {p.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-base font-semibold text-slate-700 mb-4">
                  Toutes les dépenses
                  <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">{depensesSupSel.length} dépense(s)</span>
                </h3>
                {depensesSupSel.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">Aucune dépense pour ce superviseur.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {['#', 'Date', 'Description', 'Chantier', 'Catégorie', 'Fournisseur', 'Montant'].map((h, i) => (
                            <th key={h} className={`py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...depensesSupSel]
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((d, i) => {
                            const chantier = chantiers.find(c => c.id === d.chantierId);
                            return (
                              <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-3 text-xs font-bold text-slate-400">{i + 1}</td>
                                <td className="py-3 px-3 text-slate-500">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                                <td className="py-3 px-3 font-medium text-slate-700">{d.titre}</td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: chantier?.couleur || '#888' }} />
                                    <span className="text-slate-500">{chantier?.nom || '—'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{d.categorie}</span>
                                </td>
                                <td className="py-3 px-3 text-slate-500">{d.fournisseur || '—'}</td>
                                <td className="py-3 px-3 text-right font-bold text-orange-600">{formatMontant(d.montant)}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan={6} className="py-3 px-3 text-sm font-bold text-slate-700">TOTAL</td>
                          <td className="py-3 px-3 text-right text-sm font-bold text-orange-600">{formatMontant(totalDepSupSel)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composants utilitaires ──────────────────────────────────────────────────
function StatCard({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-4`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function BtnExport({ label, icon, couleur, onClick }: { label: string; icon: string; couleur: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 cursor-pointer ${couleur}`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
