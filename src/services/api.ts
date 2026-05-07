import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.1.36:5000/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  let token = await SecureStore.getItemAsync('token');
  if (!token) token = await SecureStore.getItemAsync('assocToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const requestOTP = (telephone: string) =>
  api.post('/auth/citoyen/otp', { telephone });

export const registerCitoyen = (data: {
  telephone: string;
  nom: string;
  prenom: string;
  otp: string;
  wilaya?: string;
}) => api.post('/auth/citoyen/register', data);

export const loginCitoyen = (telephone: string, otp: string) =>
  api.post('/auth/citoyen/login', { telephone, otp });

export const loginWithGoogle = (access_token: string) =>
  api.post('/auth/citoyen/google', { access_token });

export const registerAssociation = (data: {
  nom: string;
  email: string;
  mot_de_passe: string;
  adresse: string;
  description?: string;
  wilaya?: string;
  telephone?: string;
}) => api.post('/auth/association/register', data);

export const initierInscriptionAssociation = (data: {
  nom: string; email: string; mot_de_passe: string;
  adresse: string; wilaya: string; telephone: string; description?: string;
}) => api.post('/auth/association/register/initier', data);

export const confirmerInscriptionAssociation = (email: string, email_otp: string, phone_otp: string) =>
  api.post('/auth/association/register/confirmer', { email, email_otp, phone_otp });

// Signalements
export const getSignalements = (page = 1, limit = 20, statut?: string) =>
  api.get('/signalements', { params: { page, limit, ...(statut ? { statut } : {}) } });

export const getSignalement = (id: number) =>
  api.get(`/signalements/${id}`);

export const creerSignalement = (data: FormData) =>
  api.post('/signalements', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });

// Événements
export const getEvenements = (page = 1, limit = 20) =>
  api.get('/evenements', { params: { page, limit } });

export const getEvenement = (id: number) =>
  api.get(`/evenements/${id}`);

export const getQRCode = (id: number) =>
  api.get(`/evenements/${id}/qrcode`);

export const inscrireEvenement = (evenement_id: number) =>
  api.post('/participations/inscrire', { evenement_id });

export const scannerQR = (qr_code_token: string) =>
  api.post('/participations/scan', { qr_code_token });

// Points de collecte
export const getPointsCollecte = (page = 1, limit = 20) =>
  api.get('/points-collecte', { params: { page, limit } });

export const proposePointCollecte = (data: {
  nom: string;
  description?: string;
  adresse?: string;
  wilaya?: string;
  horaires?: string;
  type_dechet: string[];
  latitude: number;
  longitude: number;
}) => api.post('/points-collecte', data);

export const confirmerSignalement = (id: number) =>
  api.post(`/signalements/${id}/confirmer`);

export const ajouterPhotoResolution = (id: number, data: FormData) =>
  api.post(`/signalements/${id}/photo-resolution`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });

// Association (mobile)
export const loginAssociation = (email: string, mot_de_passe: string) =>
  api.post('/auth/association/login', { email, mot_de_passe });

export const getProfilAssociation = () => api.get('/associations/profil');

export const updateProfilAssociation = (data: FormData) =>
  api.patch('/associations/profil', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });

export const changerMotDePasseAssociation = (mot_de_passe_actuel: string, nouveau_mot_de_passe: string) =>
  api.patch('/associations/mot-de-passe', { mot_de_passe_actuel, nouveau_mot_de_passe });

// Utilisateurs
export const getProfil = () => api.get('/utilisateurs/profil');

export const initierChangementEmail = (email: string) =>
  api.post('/utilisateurs/email-change', { email });

export const confirmerChangementEmail = (otp: string) =>
  api.post('/utilisateurs/email-verify', { otp });

export const modifierProfil = (data: FormData) =>
  api.patch('/utilisateurs/profil', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
  });

export const getClassement = (wilaya?: string, period = 'global', page = 1) =>
  api.get('/utilisateurs/classement', { params: { wilaya, period, page, limit: 20 } });

export const savePushToken = (push_token: string) =>
  api.post('/utilisateurs/push-token', { push_token });

export default api;
