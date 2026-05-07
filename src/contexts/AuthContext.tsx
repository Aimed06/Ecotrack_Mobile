import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Utilisateur, Association } from '../types';
import { getProfil, getProfilAssociation } from '../services/api';
import { registerForPushNotifications } from '../services/notificationSetup';

interface AuthContextType {
  user: Utilisateur | null;
  token: string | null;
  assoc: Association | null;
  assocToken: string | null;
  isLoading: boolean;
  signIn: (token: string, user: Utilisateur) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  signInAssoc: (token: string, assoc: Association) => Promise<void>;
  signOutAssoc: () => Promise<void>;
  refreshAssoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]           = useState<Utilisateur | null>(null);
  const [token, setToken]         = useState<string | null>(null);
  const [assoc, setAssoc]         = useState<Association | null>(null);
  const [assocToken, setAssocToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser  = await SecureStore.getItemAsync('user');
      const storedAssocToken = await SecureStore.getItemAsync('assocToken');
      const storedAssoc      = await SecureStore.getItemAsync('assoc');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else if (storedAssocToken && storedAssoc) {
        setAssocToken(storedAssocToken);
        setAssoc(JSON.parse(storedAssoc));
      }
      setIsLoading(false);
    })();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await getProfil();
      const data = res.data.data;
      if (!data) return;
      setUser((prev) => {
        if (!prev) return prev;
        const merged = {
          ...prev,
          nom:            data.nom            ?? prev.nom,
          prenom:         data.prenom         ?? prev.prenom,
          email:          data.email          ?? prev.email,
          pending_email:  data.pending_email  ?? prev.pending_email,
          wilaya:         data.wilaya         ?? prev.wilaya,
          photo_profil:   data.photo_profil   ?? prev.photo_profil,
          points_total:   data.points_total   ?? prev.points_total,
          niveau:         data.niveau         ?? prev.niveau,
          points_semaine: data.points_semaine ?? prev.points_semaine,
        };
        SecureStore.setItemAsync('user', JSON.stringify(merged));
        return merged;
      });
    } catch {}
  };

  const refreshAssoc = async () => {
    try {
      const res = await getProfilAssociation();
      const data = res.data.data;
      if (!data) return;
      setAssoc((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...data };
        SecureStore.setItemAsync('assoc', JSON.stringify(merged));
        return merged;
      });
    } catch {}
  };

  const signIn = async (newToken: string, newUser: Utilisateur) => {
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    registerForPushNotifications().catch(() => {});
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  const signInAssoc = async (newToken: string, newAssoc: Association) => {
    await SecureStore.setItemAsync('assocToken', newToken);
    await SecureStore.setItemAsync('assoc', JSON.stringify(newAssoc));
    setAssocToken(newToken);
    setAssoc(newAssoc);
  };

  const signOutAssoc = async () => {
    await SecureStore.deleteItemAsync('assocToken');
    await SecureStore.deleteItemAsync('assoc');
    setAssocToken(null);
    setAssoc(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, assoc, assocToken, isLoading,
      signIn, signOut, refreshUser,
      signInAssoc, signOutAssoc, refreshAssoc,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
