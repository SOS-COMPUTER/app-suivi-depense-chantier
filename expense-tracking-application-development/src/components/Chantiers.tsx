import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Chantier, StatutChantier } from '../types';
import { Plus, Edit2, Trash2, MapPin, Calendar, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const COULEURS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
const STATUTS: StatutChantier[] = ['En cours', 'Terminé', 'En pause', 'Planifié'];

const statutConfig: Record<StatutChantier, { color: string; icon: React.ReactNode }> = {
  'En cours': { color: 'bg-blue-100 text-blue-700', icon: <Clock size={12} /> },
  'Terminé': { color: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> },
  'En pause': { color: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={12} /> },
  'Planifié': { color: 'bg-slate-100 text-slate-600', icon: <Calendar size={12} /> },
};

const defaultForm = (): Omit<Chantier, 'id'> => ({
  nom: '', lieu: '', superviseur: 'Jean-Pierre Kabila', dateDebut: '', dateFin: '',
  budget: 0, statut: 'En cours', description: '', couleur: COULEURS[0],
});

export default function Chantiers() {
  const { chantiers, addChantier, updateChantier, deleteChantier, getTotalDepenses, formatMontant, devise } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [filterStatut, setFilterStatut] = useState<string>('Tous');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const openAdd = () => { setForm(defaultForm()); setEditingChantier(null); setShowModal(true); };
  const openEdit = (c: Chantier) => { setForm({ ...c }); setEditingChantier(c); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.nom || !form.lieu || !form.dateDebut || !form.budget) return;
    if (editingChantier) {
      updateChantier({ ...form, id: editingChantier.id });
    } else {
      addChantier({ ...form, id: uuidv4() });
    }
    setShowModal(false);
  };

  const filtres = ['Tous', ...STATUTS];
  const chantiersFiltres = filterStatut === 'Tous' ? chantiers : chantiers.filter(c => c.statut === filterStatut);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chantiers</h1>
          <p className="text-slate-500 text-sm mt-1">{chantiers.length} chantier(s) enregistré(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
            <span className="text-base">{devise === 'USD' ? '🇺🇸' : '🇨🇩'}</span>
            <span className="text-xs font-semibold text-orange-700">{devise}</span>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-orange-200">
            <Plus size={18} />
            Nouveau chantier
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {filtres.map(f => (
          <button
            key={f}
            onClick={() => setFilterStatut(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterStatut === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {chantiersFiltres.map(c => {
          const dep = getTotalDepenses(c.id);
          const pct = Math.min((dep / c.budget) * 100, 100);
          const alerte = pct >= 85;
          const cfg = statutConfig[c.statut];
          return (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header coloré */}
              <div className="h-2" style={{ background: c.couleur }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-base truncate">{c.nom}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                      <MapPin size={11} />
                      <span>{c.lieu}</span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ml-2 ${cfg.color}`}>
                    {cfg.icon}
                    {c.statut}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>

                <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                  <Calendar size={11} />
                  <span>{new Date(c.dateDebut).toLocaleDateString('fr-FR')} → {new Date(c.dateFin).toLocaleDateString('fr-FR')}</span>
                </div>

                {/* Budget progress */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Consommation</span>
                    <span className={`font-semibold ${pct >= 100 ? 'text-red-600' : alerte ? 'text-amber-600' : 'text-slate-600'}`}>
                      {alerte && <AlertTriangle size={11} className="inline mr-0.5" />}
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${pct >= 100 ? 'bg-red-500' : alerte ? 'bg-amber-400' : 'bg-orange-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{formatMontant(dep)}</span>
                    <span>{formatMontant(c.budget)}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  <span className="font-medium text-slate-600">Superviseur :</span> {c.superviseur}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <Edit2 size={13} />
                    Modifier
                  </button>
                  <button onClick={() => setConfirmDelete(c.id)} className="flex items-center justify-center gap-1.5 px-3 py-2 border border-red-100 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal ajout/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">{editingChantier ? 'Modifier le chantier' : 'Nouveau chantier'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nom du chantier *</label>
                  <input value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Ex: Résidence Gombe Tower" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Lieu *</label>
                  <input value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Ville / Quartier" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Superviseur</label>
                  <input value={form.superviseur} onChange={e => setForm({ ...form, superviseur: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date début *</label>
                  <input type="date" value={form.dateDebut} onChange={e => setForm({ ...form, dateDebut: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date fin prévue</label>
                  <input type="date" value={form.dateFin} onChange={e => setForm({ ...form, dateFin: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Budget ({devise}) *</label>
                  <input type="number" value={form.budget || ''} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Statut</label>
                  <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value as StatutChantier })} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300">
                    {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" placeholder="Description du chantier..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {COULEURS.map(col => (
                      <button key={col} onClick={() => setForm({ ...form, couleur: col })} className={`w-8 h-8 rounded-full transition-transform ${form.couleur === col ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'}`} style={{ background: col }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors">
                {editingChantier ? 'Enregistrer' : 'Créer le chantier'}
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
                <h3 className="font-bold text-slate-800">Supprimer le chantier</h3>
                <p className="text-xs text-slate-500">Cette action supprimera aussi toutes les dépenses associées.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button onClick={() => { deleteChantier(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
