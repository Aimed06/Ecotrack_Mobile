import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Utilisateur } from '../types';
import { getProfil } from '../services/api';

interface AuthContextType {
  user: Utilisateur | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, user: Utilisateur) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await getProfil();
      const data = res.data.data;
      if (!data) return;
      setUser((prev) => {
        if (!prev) return prev;
        const merged = {
          ...prev,
          nom:          data.nom          ?? prev.nom,
          prenom:       data.prenom       ?? prev.prenom,
          email:        data.email        ?? prev.email,
          wilaya:       data.wilaya       ?? prev.wilaya,
          photo_profil: data.photo_profil ?? prev.photo_profil,
          points_total: data.points_total ?? prev.points_total,
          niveau:       data.niveau       ?? prev.niveau,
          points_semaine: data.points_semaine ?? prev.points_semaine,
        };
        SecureStore.setItemAsync('user', JSON.stringify(merged));
        return merged;
      });
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = async (newToken: string, newUser: Utilisateur) => {
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
