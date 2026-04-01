import { Chantier, Depense, Devise } from '../types';

const TAUX = 2800;

function fm(montant: number, devise: Devise): string {
  const val = devise === 'CDF' ? montant * TAUX : montant;
  if (devise === 'USD') return '$ ' + val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' CDF';
}

function pct(a: number, b: number): string {
  if (!b) return '0%';
  return ((a / b) * 100).toFixed(1) + '%';
}

function ouvrirFenetrePDF(html: string, _titre: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Veuillez autoriser les popups pour télécharger le PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 800);
}

function styleCommun(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
      .header { background: #1e40af; color: white; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; }
      .header h1 { font-size: 20px; font-weight: bold; }
      .header .sub { font-size: 10px; opacity: 0.85; margin-top: 3px; }
      .header .right { text-align: right; font-size: 10px; }
      .titre-rapport { background: #f1f5f9; border-left: 4px solid #ea580c; padding: 10px 24px; font-size: 14px; font-weight: bold; color: #1e40af; }
      .section { padding: 16px 24px 8px; }
      .section-title { font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 10px; }
      .kpis { display: flex; gap: 12px; margin: 12px 24px; }
      .kpi { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
      .kpi .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
      .kpi .value { font-size: 15px; font-weight: bold; color: #1e40af; margin-top: 3px; }
      .kpi .value.green { color: #059669; }
      .kpi .value.red { color: #dc2626; }
      .kpi .value.orange { color: #ea580c; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      thead tr { background: #1e40af; color: white; }
      thead th { padding: 7px 10px; text-align: left; font-weight: 600; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      tbody tr { border-bottom: 1px solid #e2e8f0; }
      tbody td { padding: 6px 10px; }
      tfoot tr { background: #1e40af; color: white; font-weight: bold; }
      tfoot td { padding: 7px 10px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: bold; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .badge-green { background: #d1fae5; color: #065f46; }
      .badge-orange { background: #fed7aa; color: #c2410c; }
      .badge-gray { background: #f1f5f9; color: #475569; }
      .footer { background: #f1f5f9; border-top: 2px solid #e2e8f0; padding: 8px 24px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b; margin-top: 20px; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 0 24px 12px; }
      .info-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e2e8f0; }
      .info-row:last-child { border-bottom: none; }
      .info-label { color: #64748b; }
      .info-value { font-weight: bold; color: #1e293b; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        @page { margin: 0.5cm; size: A4; }
      }
    </style>
  `;
}

function dateAujourdhui(): string {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ═══════════════════════════════════════════════
// RAPPORT GLOBAL PDF
// ═══════════════════════════════════════════════
export function exporterRapportGlobalPDF(chantiers: Chantier[], depenses: Depense[], devise: Devise): void {
  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
  const totalReste = totalBudget - totalDep;

  const catData: Record<string, number> = {};
  depenses.forEach(d => { catData[d.categorie] = (catData[d.categorie] || 0) + d.montant; });

  const rowsChantiers = chantiers.map(c => {
    const dep = depenses.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
    const reste = c.budget - dep;
    const p = pct(dep, c.budget);
    return `
      <tr>
        <td><strong>${c.nom}</strong></td>
        <td>${c.lieu}</td>
        <td>${c.superviseur}</td>
        <td>${c.statut}</td>
        <td style="text-align:right">${fm(c.budget, devise)}</td>
        <td style="text-align:right">${fm(dep, devise)}</td>
        <td style="text-align:right;color:${reste < 0 ? '#dc2626' : '#059669'}">${fm(reste, devise)}</td>
        <td style="text-align:center">${p}</td>
      </tr>`;
  }).join('');

  const rowsDepenses = [...depenses].sort((a, b) => b.date.localeCompare(a.date)).map(d => {
    const ch = chantiers.find(c => c.id === d.chantierId);
    return `
      <tr>
        <td>${d.date}</td>
        <td><strong>${d.titre}</strong></td>
        <td>${ch?.nom || '-'}</td>
        <td>${d.categorie}</td>
        <td>${d.fournisseur || '-'}</td>
        <td style="text-align:right;font-weight:bold">${fm(d.montant, devise)}</td>
      </tr>`;
  }).join('');

  const rowsCat = Object.entries(catData).sort(([, a], [, b]) => b - a).map(([cat, val]) => `
    <tr>
      <td>${cat}</td>
      <td style="text-align:right">${fm(val, devise)}</td>
      <td style="text-align:center">${pct(val, totalDep)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Global - ChantierTrack</title>${styleCommun()}</head><body>
    <div class="header">
      <div><h1>🏗️ ChantierTrack</h1><div class="sub">Système de Suivi des Dépenses de Chantiers</div></div>
      <div class="right"><div><strong>RAPPORT GLOBAL</strong></div><div>Édité le ${dateAujourdhui()}</div><div>Devise : ${devise === 'USD' ? 'Dollar américain (USD)' : 'Franc Congolais (CDF)'}</div></div>
    </div>
    <div class="titre-rapport">📊 Rapport Global — Tous les Chantiers</div>

    <div class="kpis">
      <div class="kpi"><div class="label">Budget Total</div><div class="value">${fm(totalBudget, devise)}</div></div>
      <div class="kpi"><div class="label">Total Dépensé</div><div class="value red">${fm(totalDep, devise)}</div></div>
      <div class="kpi"><div class="label">Solde Restant</div><div class="value ${totalReste < 0 ? 'red' : 'green'}">${fm(totalReste, devise)}</div></div>
      <div class="kpi"><div class="label">Consommé</div><div class="value orange">${pct(totalDep, totalBudget)}</div></div>
      <div class="kpi"><div class="label">Nb. Chantiers</div><div class="value">${chantiers.length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">📋 Récapitulatif des Chantiers</div>
      <table>
        <thead><tr><th>Chantier</th><th>Lieu</th><th>Superviseur</th><th>Statut</th><th>Budget</th><th>Dépensé</th><th>Restant</th><th>%</th></tr></thead>
        <tbody>${rowsChantiers}</tbody>
        <tfoot><tr><td colspan="4">TOTAL</td><td style="text-align:right">${fm(totalBudget, devise)}</td><td style="text-align:right">${fm(totalDep, devise)}</td><td style="text-align:right">${fm(totalReste, devise)}</td><td style="text-align:center">${pct(totalDep, totalBudget)}</td></tr></tfoot>
      </table>
    </div>

    <div class="section">
      <div class="section-title">💰 Détail de Toutes les Dépenses (${depenses.length})</div>
      <table>
        <thead><tr><th>Date</th><th>Titre</th><th>Chantier</th><th>Catégorie</th><th>Fournisseur</th><th>Montant</th></tr></thead>
        <tbody>${rowsDepenses}</tbody>
        <tfoot><tr><td colspan="5">TOTAL</td><td style="text-align:right">${fm(totalDep, devise)}</td></tr></tfoot>
      </table>
    </div>

    <div class="section">
      <div class="section-title">📂 Répartition par Catégorie</div>
      <table>
        <thead><tr><th>Catégorie</th><th>Montant Total</th><th>% des Dépenses</th></tr></thead>
        <tbody>${rowsCat}</tbody>
        <tfoot><tr><td>TOTAL</td><td style="text-align:right">${fm(totalDep, devise)}</td><td style="text-align:center">100%</td></tr></tfoot>
      </table>
    </div>

    <div class="footer">
      <span>ChantierTrack — Rapport généré automatiquement</span>
      <span>Date : ${dateAujourdhui()} | Devise : ${devise}</span>
    </div>
  </body></html>`;

  ouvrirFenetrePDF(html, 'rapport-global');
}

// ═══════════════════════════════════════════════
// RAPPORT PAR CHANTIER PDF
// ═══════════════════════════════════════════════
export function exporterRapportChantierPDF(chantier: Chantier, depenses: Depense[], devise: Devise): void {
  const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
  const reste = chantier.budget - totalDep;
  const pourcentage = pct(totalDep, chantier.budget);

  const catData: Record<string, number> = {};
  depenses.forEach(d => { catData[d.categorie] = (catData[d.categorie] || 0) + d.montant; });

  const rowsDep = [...depenses].sort((a, b) => b.date.localeCompare(a.date)).map(d => `
    <tr>
      <td>${d.date}</td>
      <td><strong>${d.titre}</strong></td>
      <td>${d.categorie}</td>
      <td>${d.fournisseur || '-'}</td>
      <td>${d.description || '-'}</td>
      <td style="text-align:right;font-weight:bold">${fm(d.montant, devise)}</td>
    </tr>`).join('');

  const rowsCat = Object.entries(catData).sort(([, a], [, b]) => b - a).map(([cat, val]) => `
    <tr>
      <td>${cat}</td>
      <td style="text-align:right">${fm(val, devise)}</td>
      <td style="text-align:center">${pct(val, totalDep)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Chantier - ${chantier.nom}</title>${styleCommun()}</head><body>
    <div class="header">
      <div><h1>🏗️ ChantierTrack</h1><div class="sub">Système de Suivi des Dépenses de Chantiers</div></div>
      <div class="right"><div><strong>RAPPORT PAR CHANTIER</strong></div><div>Édité le ${dateAujourdhui()}</div><div>Devise : ${devise}</div></div>
    </div>
    <div class="titre-rapport">🏗️ ${chantier.nom}</div>

    <div class="kpis">
      <div class="kpi"><div class="label">Budget Alloué</div><div class="value">${fm(chantier.budget, devise)}</div></div>
      <div class="kpi"><div class="label">Total Dépensé</div><div class="value red">${fm(totalDep, devise)}</div></div>
      <div class="kpi"><div class="label">Solde Restant</div><div class="value ${reste < 0 ? 'red' : 'green'}">${fm(reste, devise)}</div></div>
      <div class="kpi"><div class="label">% Consommé</div><div class="value orange">${pourcentage}</div></div>
      <div class="kpi"><div class="label">Nb. Dépenses</div><div class="value">${depenses.length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">📋 Informations du Chantier</div>
      <div class="info-box">
        <div class="info-row"><span class="info-label">Chantier</span><span class="info-value">${chantier.nom}</span></div>
        <div class="info-row"><span class="info-label">Lieu</span><span class="info-value">${chantier.lieu}</span></div>
        <div class="info-row"><span class="info-label">Superviseur</span><span class="info-value">${chantier.superviseur}</span></div>
        <div class="info-row"><span class="info-label">Statut</span><span class="info-value">${chantier.statut}</span></div>
        <div class="info-row"><span class="info-label">Date Début</span><span class="info-value">${chantier.dateDebut}</span></div>
        <div class="info-row"><span class="info-label">Date Fin</span><span class="info-value">${chantier.dateFin}</span></div>
        <div class="info-row"><span class="info-label">Description</span><span class="info-value">${chantier.description || '-'}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">💰 Dépenses du Chantier (${depenses.length})</div>
      <table>
        <thead><tr><th>Date</th><th>Titre</th><th>Catégorie</th><th>Fournisseur</th><th>Description</th><th>Montant</th></tr></thead>
        <tbody>${rowsDep}</tbody>
        <tfoot><tr><td colspan="5">TOTAL</td><td style="text-align:right">${fm(totalDep, devise)}</td></tr></tfoot>
      </table>
    </div>

    <div class="section">
      <div class="section-title">📂 Répartition par Catégorie</div>
      <table>
        <thead><tr><th>Catégorie</th><th>Montant</th><th>%</th></tr></thead>
        <tbody>${rowsCat}</tbody>
        <tfoot><tr><td>TOTAL</td><td style="text-align:right">${fm(totalDep, devise)}</td><td style="text-align:center">100%</td></tr></tfoot>
      </table>
    </div>

    <div class="footer">
      <span>ChantierTrack — ${chantier.nom}</span>
      <span>Date : ${dateAujourdhui()} | Devise : ${devise}</span>
    </div>
  </body></html>`;

  ouvrirFenetrePDF(html, `rapport-chantier-${chantier.nom}`);
}

// ═══════════════════════════════════════════════
// RAPPORT PAR SUPERVISEUR PDF
// ═══════════════════════════════════════════════
export function exporterRapportSuperviseurPDF(superviseur: string, chantiers: Chantier[], depenses: Depense[], devise: Devise): void {
  const totalBudget = chantiers.reduce((s, c) => s + c.budget, 0);
  const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
  const reste = totalBudget - totalDep;

  const rowsChantiers = chantiers.map(c => {
    const dep = depenses.filter(d => d.chantierId === c.id).reduce((s, d) => s + d.montant, 0);
    const r = c.budget - dep;
    return `
      <tr>
        <td><strong>${c.nom}</strong></td>
        <td>${c.lieu}</td>
        <td>${c.statut}</td>
        <td style="text-align:right">${fm(c.budget, devise)}</td>
        <td style="text-align:right">${fm(dep, devise)}</td>
        <td style="text-align:right;color:${r < 0 ? '#dc2626' : '#059669'}">${fm(r, devise)}</td>
        <td style="text-align:center">${pct(dep, c.budget)}</td>
      </tr>`;
  }).join('');

  const rowsDep = [...depenses].sort((a, b) => b.date.localeCompare(a.date)).map(d => {
    const ch = chantiers.find(c => c.id === d.chantierId);
    return `
      <tr>
        <td>${d.date}</td>
        <td><strong>${d.titre}</strong></td>
        <td>${ch?.nom || '-'}</td>
        <td>${d.categorie}</td>
        <td>${d.fournisseur || '-'}</td>
        <td style="text-align:right;font-weight:bold">${fm(d.montant, devise)}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Superviseur - ${superviseur}</title>${styleCommun()}</head><body>
    <div class="header">
      <div><h1>🏗️ ChantierTrack</h1><div class="sub">Système de Suivi des Dépenses de Chantiers</div></div>
      <div class="right"><div><strong>RAPPORT PAR SUPERVISEUR</strong></div><div>Édité le ${dateAujourdhui()}</div><div>Devise : ${devise}</div></div>
    </div>
    <div class="titre-rapport">👷 Superviseur : ${superviseur}</div>

    <div class="kpis">
      <div class="kpi"><div class="label">Budget Total</div><div class="value">${fm(totalBudget, devise)}</div></div>
      <div class="kpi"><div class="label">Total Dépensé</div><div class="value red">${fm(totalDep, devise)}</div></div>
      <div class="kpi"><div class="label">Solde Restant</div><div class="value ${reste < 0 ? 'red' : 'green'}">${fm(reste, devise)}</div></div>
      <div class="kpi"><div class="label">% Consommé</div><div class="value orange">${pct(totalDep, totalBudget)}</div></div>
      <div class="kpi"><div class="label">Nb. Chantiers</div><div class="value">${chantiers.length}</div></div>
    </div>

    <div class="section">
      <div class="section-title">🏗️ Chantiers Supervisés (${chantiers.length})</div>
      <table>
        <thead><tr><th>Chantier</th><th>Lieu</th><th>Statut</th><th>Budget</th><th>Dépensé</th><th>Restant</th><th>%</th></tr></thead>
        <tbody>${rowsChantiers}</tbody>
        <tfoot><tr><td colspan="3">TOTAL</td><td style="text-align:right">${fm(totalBudget, devise)}</td><td style="text-align:right">${fm(totalDep, devise)}</td><td style="text-align:right">${fm(reste, devise)}</td><td style="text-align:center">${pct(totalDep, totalBudget)}</td></tr></tfoot>
      </table>
    </div>

    <div class="section">
      <div class="section-title">💰 Toutes les Dépenses (${depenses.length})</div>
      <table>
        <thead><tr><th>Date</th><th>Titre</th><th>Chantier</th><th>Catégorie</th><th>Fournisseur</th><th>Montant</th></tr></thead>
        <tbody>${rowsDep}</tbody>
        <tfoot><tr><td colspan="5">TOTAL</td><td style="text-align:right">${fm(totalDep, devise)}</td></tr></tfoot>
      </table>
    </div>

    <div class="footer">
      <span>ChantierTrack — Superviseur : ${superviseur}</span>
      <span>Date : ${dateAujourdhui()} | Devise : ${devise}</span>
    </div>
  </body></html>`;

  ouvrirFenetrePDF(html, `rapport-superviseur-${superviseur}`);
}
