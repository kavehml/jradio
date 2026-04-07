import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type AppLang = 'en' | 'fr';

const LANG_KEY = 'radiology_app_lang';

interface AppUiValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
}

const AppUiContext = createContext<AppUiValue | null>(null);

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => {
    try {
      const s = localStorage.getItem(LANG_KEY);
      if (s === 'fr' || s === 'en') return s;
    } catch {
      /* ignore */
    }
    return 'en';
  });

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return <AppUiContext.Provider value={value}>{children}</AppUiContext.Provider>;
}

export function useAppUi(): AppUiValue {
  const ctx = useContext(AppUiContext);
  if (!ctx) throw new Error('useAppUi must be used within AppUiProvider');
  return ctx;
}
