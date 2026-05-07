import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';

export type Lang = 'fr' | 'en' | 'ar';

const LANG_KEY = 'app_lang';
const translations: Record<Lang, any> = { fr, en, ar };
const LANGS: Lang[] = ['fr', 'en', 'ar'];

function lookup(obj: any, key: string): string {
  const parts = key.split('.');
  let cur = obj;
  for (const part of parts) {
    if (cur == null) return key;
    cur = cur[part];
  }
  return typeof cur === 'string' ? cur : key;
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
}

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  cycleLang: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nCtx>({
  lang: 'fr',
  setLang: () => {},
  cycleLang: () => {},
  t: (key) => key,
  isRTL: false,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => { if (v === 'en' || v === 'ar' || v === 'fr') setLangState(v); })
      .catch(() => {});
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    AsyncStorage.setItem(LANG_KEY, newLang).catch(() => {});
    const shouldRTL = newLang === 'ar';
    if (I18nManager.isRTL !== shouldRTL) {
      I18nManager.allowRTL(shouldRTL);
      I18nManager.forceRTL(shouldRTL);
    }
  }, []);

  const cycleLang = useCallback(() => {
    setLangState((prev) => {
      const next = LANGS[(LANGS.indexOf(prev) + 1) % LANGS.length];
      AsyncStorage.setItem(LANG_KEY, next).catch(() => {});
      const shouldRTL = next === 'ar';
      if (I18nManager.isRTL !== shouldRTL) {
        I18nManager.allowRTL(shouldRTL);
        I18nManager.forceRTL(shouldRTL);
      }
      return next;
    });
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const str = lookup(translations[lang], key) || lookup(translations.fr, key);
    return interpolate(str, vars);
  }, [lang]);

  const isRTL = lang === 'ar';

  const value = useMemo(() => ({ lang, setLang, cycleLang, t, isRTL }), [lang, setLang, cycleLang, t, isRTL]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
