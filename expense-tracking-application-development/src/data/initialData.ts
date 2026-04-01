import { Chantier, Depense, Superviseur } from '../types';

export const superviseurs: Superviseur[] = [
  { id: 's1', nom: 'Jean-Pierre Kabila', email: 'jp.kabila@constructcongo.cd', telephone: '+243 81 234 56 78' },
  { id: 's2', nom: 'Marie Mukeba', email: 'm.mukeba@constructcongo.cd', telephone: '+243 99 876 54 32' },
];

export const chantiersInitiaux: Chantier[] = [
  {
    id: 'c1',
    nom: 'Résidence Gombe Tower',
    lieu: 'Kinshasa - Gombe',
    superviseur: 'Jean-Pierre Kabila',
    dateDebut: '2024-01-15',
    dateFin: '2024-08-30',
    budget: 250000,
    statut: 'En cours',
    description: 'Construction d\'un immeuble résidentiel de 20 appartements à Gombe.',
    couleur: '#3B82F6',
  },
  {
    id: 'c2',
    nom: 'Centre Commercial Matonge',
    lieu: 'Kinshasa - Kalamu',
    superviseur: 'Marie Mukeba',
    dateDebut: '2024-03-01',
    dateFin: '2025-02-28',
    budget: 800000,
    statut: 'En cours',
    description: 'Construction d\'un centre commercial sur 3 niveaux à Matonge.',
    couleur: '#8B5CF6',
  },
  {
    id: 'c3',
    nom: 'Route Nationale RN1',
    lieu: 'Lubumbashi',
    superviseur: 'Jean-Pierre Kabila',
    dateDebut: '2023-09-01',
    dateFin: '2024-03-31',
    budget: 500000,
    statut: 'Terminé',
    description: 'Réhabilitation de 10 km de route nationale à Lubumbashi.',
    couleur: '#10B981',
  },
  {
    id: 'c4',
    nom: 'École Primaire Ngaliema',
    lieu: 'Kinshasa - Ngaliema',
    superviseur: 'Marie Mukeba',
    dateDebut: '2024-06-01',
    dateFin: '2024-12-31',
    budget: 120000,
    statut: 'Planifié',
    description: 'Construction d\'une école primaire de 18 classes à Ngaliema.',
    couleur: '#F59E0B',
  },
];

export const depensesInitiales: Depense[] = [
  // Chantier 1 - Résidence Gombe Tower
  { id: 'd1', chantierId: 'c1', titre: 'Ciment Portland', categorie: 'Matériaux', montant: 8500, date: '2024-01-20', description: '500 sacs de ciment', fournisseur: 'CimentCongo SARL' },
  { id: 'd2', chantierId: 'c1', titre: 'Équipe maçonnerie', categorie: 'Main d\'œuvre', montant: 12000, date: '2024-02-01', description: 'Main d\'œuvre janvier-février', fournisseur: 'Auto' },
  { id: 'd3', chantierId: 'c1', titre: 'Grue mobile', categorie: 'Équipement', montant: 4500, date: '2024-02-10', description: 'Location grue 1 mois', fournisseur: 'EquipLoc Congo' },
  { id: 'd4', chantierId: 'c1', titre: 'Fer à béton', categorie: 'Matériaux', montant: 23000, date: '2024-02-15', description: '20 tonnes de fer HA', fournisseur: 'SiderCongo' },
  { id: 'd5', chantierId: 'c1', titre: 'Transport matériaux', categorie: 'Transport', montant: 1800, date: '2024-03-01', description: 'Livraison depuis Kinshasa', fournisseur: 'TransLog RDC' },
  { id: 'd6', chantierId: 'c1', titre: 'Électricité travaux', categorie: 'Divers', montant: 1200, date: '2024-03-10', description: 'Consommation électrique chantier', fournisseur: 'SNEL' },
  { id: 'd7', chantierId: 'c1', titre: 'Carrelage', categorie: 'Matériaux', montant: 9500, date: '2024-04-05', description: 'Carrelage tous appartements', fournisseur: 'CéramiquePlus Kin' },
  { id: 'd8', chantierId: 'c1', titre: 'Plomberie', categorie: 'Sous-traitance', montant: 18000, date: '2024-04-20', description: 'Installation plomberie complète', fournisseur: 'PlombPro Congo' },

  // Chantier 2 - Centre Commercial Matonge
  { id: 'd9', chantierId: 'c2', titre: 'Béton armé structure', categorie: 'Matériaux', montant: 65000, date: '2024-03-10', description: 'Béton pour dalle et colonnes', fournisseur: 'BétonExpress Congo' },
  { id: 'd10', chantierId: 'c2', titre: 'Équipe génie civil', categorie: 'Main d\'œuvre', montant: 28000, date: '2024-03-15', description: 'Équipe de 25 ouvriers', fournisseur: 'Auto' },
  { id: 'd11', chantierId: 'c2', titre: 'Coffrage métallique', categorie: 'Équipement', montant: 12000, date: '2024-04-01', description: 'Achat coffrage réutilisable', fournisseur: 'MetalForm RDC' },
  { id: 'd12', chantierId: 'c2', titre: 'Sous-traitant électricité', categorie: 'Sous-traitance', montant: 35000, date: '2024-04-15', description: 'Installation électrique complète', fournisseur: 'ElecPro Kinshasa' },
  { id: 'd13', chantierId: 'c2', titre: 'Vitrage façade', categorie: 'Matériaux', montant: 42000, date: '2024-05-01', description: 'Vitrage double vitrage façade', fournisseur: 'VerreMag Congo' },

  // Chantier 3 - Route Nationale RN1 (Terminé)
  { id: 'd14', chantierId: 'c3', titre: 'Bitume', categorie: 'Matériaux', montant: 92000, date: '2023-09-15', description: 'Bitume pour revêtement 10 km', fournisseur: 'BitumeCo Lushi' },
  { id: 'd15', chantierId: 'c3', titre: 'Compacteurs', categorie: 'Équipement', montant: 18000, date: '2023-09-20', description: 'Location 3 compacteurs', fournisseur: 'EquipLoc Congo' },
  { id: 'd16', chantierId: 'c3', titre: 'Main d\'œuvre route', categorie: 'Main d\'œuvre', montant: 65000, date: '2023-10-01', description: 'Équipe de terrassement', fournisseur: 'Auto' },
  { id: 'd17', chantierId: 'c3', titre: 'Signalisation', categorie: 'Matériaux', montant: 8500, date: '2024-02-01', description: 'Panneaux et marquage routier', fournisseur: 'SignalRoute RDC' },
  { id: 'd18', chantierId: 'c3', titre: 'Transport bitume', categorie: 'Transport', montant: 9500, date: '2023-11-01', description: 'Transport depuis usine', fournisseur: 'TransLog RDC' },
];
