import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Depense, CategorieDepense } from '../types';
import { Plus, Edit2, Trash2, Search, Filter, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES: CategorieDepense[] = ["Matériaux", "Main d'œuvre", "Équipement", "Transport", "Sous-traitance", "Divers"];

const CATEGORIE_COLORS: Record<string, string> = {
  "Matériaux": "bg-blue-100 text-blue-700",
  "Main d'œuvre": "bg-purple-100 text-purple-700",
  "Équipement": "bg-emerald-100 text-emerald-700",
  "Transport": "bg-amber-100 text-amber-700",
  "Sous-traitance": "bg-red-100 text-red-700",
  "Divers": "bg-slate-100 text-slate-600",
};

const defaultForm = (chantierId = ''): Omit<Depense, 'id'> => ({
  chantierId,
  titre: '',
  categorie: 'Matériaux',
  montant: 0,
  date: new Date().toISOString().split('T')[0],
  description: '',
  fournisseur: '',
});

export default function Depenses() {
  const { chantiers, depenses, addDepense, updateDepense, deleteDepense, getTotalDepenses, formatMontant, devise } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [form, setForm] = useState<Omit<Depense, 'id'>>(defaultForm());
  const [search, setSearch] = useState('');
  const [filterChantier, setFilterChantier] = useState('Tous');
  const [filterCategorie, setFilterCategorie] = useState('Toutes');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => {
    const firstChantier = chantiers[0]?.id || '';
    setForm(defaultForm(firstChantier));
    setEditingDepense(null);
    setShowModal(true);
  };

  const openEdit = (d: Depense) => {
    setForm({ ...d });
    setEditingDepense(d);
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (!form.titre || !form.chantierId || !form.montant) return;
    if (editingDepense) {
      updateDepense({ ...form, id: editingDepense.id });
    } else {
      addDepense({ ...form, id: uuidv4() });
    }
    setShowModal(false);
  };

  const filtered = depenses
    .filter(d => filterChantier === 'Tous' || d.chantierId === filterChantier)
    .filter(d => filterCategorie === 'Toutes' || d.categorie === filterCategorie)
    .filter(d => d.titre.toLowerCase().includes(search.toLowerCase()) || d.fournisseur.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalFiltre = filtered.reduce((s, d) => s + d.montant, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dépenses</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} dépense(s) · Total : <span className="font-semibold text-orange-600">{formatMontant(totalFiltre)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
            <span className="text-base">{devise === 'USD' ? '🇺🇸' : '🇨🇩'}</span>
            <span className="text-xs font-semibold text-orange-700">{devise}</span>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-orange-200">
            <Plus size={18} />
            Nouvelle dépense
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une dépense ou un fournisseur..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select value={filterChantier} onChange={e => setFilterChantier(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300">
              <option value="Tous">Tous les chantiers</option>
              {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <select value={filterCategorie} onChange={e => setFilterCategorie(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-300">
            <option value="Toutes">Toutes les catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Résumé par chantier */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {chantiers.map(c => {
          const dep = getTotalDepenses(c.id);
          const pct = Math.min((dep / c.budget) * 100, 100);
          return (
            <button key={c.id} onClick={() => setFilterChantier(filterChantier === c.id ? 'Tous' : c.id)}
              className={`text-left p-3 rounded-xl border transition-all ${filterChantier === c.id ? 'border-orange-300 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ background: c.couleur }} />
                <span className="text-xs font-medium text-slate-700 truncate">{c.nom}</span>
              </div>
              <div className="text-sm font-bold text-slate-800">{formatMontant(dep)}</div>
              <div className="text-xs text-slate-400">{pct.toFixed(0)}% du budget</div>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Chantier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Fournisseur</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Montant ({devise})</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">Aucune dépense trouvée</td></tr>
              ) : filtered.map(d => {
                const chantier = chantiers.find(c => c.id === d.chantierId);
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{d.titre}</div>
                      {d.description && <div className="text-xs text-slate-400 truncate max-w-[160px]">{d.description}</div>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {chantier && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: chantier.couleur }} />
                          <span className="text-xs text-slate-600 truncate max-w-[120px]">{chantier.nom}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIE_COLORS[d.categorie] || 'bg-slate-100 text-slate-600'}`}>
                        {d.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{d.fournisseur || '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600 whitespace-nowrap">{formatMontant(d.montant)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => setConfirmDelete(d.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Titre *</label>
                  <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Ex: Achat ciment" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Chantier *</label>
                  <select value={form.chantierId} onChange={e => setForm({ ...form, chantierId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {chantiers.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Catégorie</label>
                  <select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value as CategorieDepense })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Montant ({devise}) *</label>
                  <input type="number" value={form.montant || ''} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Fournisseur</label>
                  <input value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Nom du fournisseur" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" placeholder="Détails supplémentaires..." />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
                {editingDepense ? 'Enregistrer' : 'Ajouter la dépense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 size={18} className="text-red-500" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Supprimer la dépense</h3>
                <p className="text-xs text-slate-500">Cette action est irréversible.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => { deleteDepense(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
