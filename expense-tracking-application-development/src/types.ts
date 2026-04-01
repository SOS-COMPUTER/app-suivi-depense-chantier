export type CategorieDepense =
  | 'Matériaux'
  | 'Main d\'œuvre'
  | 'Équipement'
  | 'Transport'
  | 'Sous-traitance'
  | 'Divers';

export type StatutChantier = 'En cours' | 'Terminé' | 'En pause' | 'Planifié';

export type Devise = 'USD' | 'CDF';

export interface Chantier {
  id: string;
  nom: string;
  lieu: string;
  superviseur: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  statut: StatutChantier;
  description: string;
  couleur: string;
}

export interface Depense {
  id: string;
  chantierId: string;
  titre: string;
  categorie: CategorieDepense;
  montant: number;
  date: string;
  description: string;
  fournisseur: string;
}

export interface Superviseur {
  id: string;
  nom: string;
  email: string;
  telephone: string;
}
