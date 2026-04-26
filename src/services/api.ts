import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://10.253.167.234:5000/api'; // remplacer par l'IP locale du backend

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
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

// Signalements
export const getSignalements = (page = 1, limit = 20, statut?: string) =>
  api.get('/signalements', { params: { page, limit, ...(statut ? { statut } : {}) } });

export const getSignalement = (id: number) =>
  api.get(`/signalements/${id}`);

export const creerSignalement = (data: FormData) =>
  api.post('/signalements', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
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
  });

// Utilisateurs
export const getProfil = () => api.get('/utilisateurs/profil');

export const modifierProfil = (data: FormData) =>
  api.patch('/utilisateurs/profil', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getClassement = (wilaya?: string, period = 'global', page = 1) =>
  api.get('/utilisateurs/classement', { params: { wilaya, period, page, limit: 20 } });

export default api;
