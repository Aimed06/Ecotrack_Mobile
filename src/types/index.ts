export interface Utilisateur {
  id: number;
  telephone: string;
  nom: string;
  prenom: string;
  email?: string;
  pending_email?: string | null;
  photo_profil?: string;
  points_total: number;
  niveau: number;
  role: 'citoyen' | 'admin';
  wilaya?: string;
  actif: boolean;
  created_at?: string;
  points_semaine?: number;
}

export interface Signalement {
  id: number;
  utilisateur_id: number;
  titre: string;
  description?: string;
  latitude: number;
  longitude: number;
  wilaya?: string;
  commune?: string;
  degre_pollution: number;
  photos: string[];
  statut: 'en_attente' | 'publie' | 'resolu' | 'rejete';
  created_at: string;
  citoyen?: Pick<Utilisateur, 'nom' | 'prenom'>;
  confirmations_count?: number;
  photos_resolution?: { url: string; nom?: string; prenom?: string; submitted_at?: string }[];
}

export interface Evenement {
  id: number;
  association_id: number;
  titre: string;
  description?: string;
  date_debut: string;
  date_fin: string;
  latitude?: number;
  longitude?: number;
  wilaya?: string;
  adresse?: string;
  nb_places_max?: number;
  valide_par_admin: boolean;
  statut: 'en_attente' | 'publie' | 'annule' | 'termine';
  points_participation: number;
  photo?: string;
  association?: { nom: string; logo?: string; email?: string; wilaya?: string; telephone?: string; adresse?: string; description?: string; photos?: string[]; facebook?: string };
  participations?: { statut: string }[];
}

export interface PointCollecte {
  id: number;
  nom: string;
  description?: string;
  latitude: number;
  longitude: number;
  wilaya?: string;
  adresse?: string;
  type_dechet: string[];
  statut: 'en_attente' | 'actif' | 'inactif';
  horaires?: string;
}

export interface Badge {
  id: number;
  nom: string;
  description?: string;
  icone?: string;
  seuil_points: number;
  UtilisateurBadge?: { date_obtenu: string };
}

export interface Association {
  id: number;
  nom: string;
  email: string;
  description?: string;
  logo?: string;
  wilaya?: string;
  telephone?: string;
  adresse?: string;
  photos?: string[];
  facebook?: string;
  statut: 'en_attente' | 'validee' | 'rejetee';
  motif_rejet?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Assoc: undefined;
};

export type AssocStackParamList = {
  AssocProfil: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  Signalement: undefined;
  QRScanner: { evenementId?: number; titre?: string };
  EditProfil: undefined;
  AssocRegister: undefined;
};

export type AuthStackParamList = {
  PhoneInput: undefined;
  OTPVerification: { telephone: string };
  AssocLogin: undefined;
};

export type MainTabParamList = {
  Accueil: undefined;
  Carte: undefined;
  Evenements: undefined;
  Classement: undefined;
  Profil: undefined;
};

export type EvenementsStackParamList = {
  EvenementsList: { openId?: number } | undefined;
  EvenementDetail: { id: number };
  QRScanner: { evenementId: number; titre: string };
};
