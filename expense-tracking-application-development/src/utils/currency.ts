import { Devise } from '../types';

// Taux de conversion approximatif : 1 USD = 2800 CDF
export const TAUX_USD_CDF = 2800;

export function formatMontant(montant: number, devise: Devise): string {
  if (devise === 'USD') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(montant);
  } else {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'CDF',
      maximumFractionDigits: 0,
    }).format(montant);
  }
}

export function convertirMontant(montant: number, deviseSource: Devise, deviseCible: Devise): number {
  if (deviseSource === deviseCible) return montant;
  if (deviseSource === 'USD' && deviseCible === 'CDF') return montant * TAUX_USD_CDF;
  if (deviseSource === 'CDF' && deviseCible === 'USD') return montant / TAUX_USD_CDF;
  return montant;
}
