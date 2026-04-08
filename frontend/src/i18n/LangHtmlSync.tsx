import { useEffect } from 'react';
import { useAppUi } from '../context/AppUiContext';

/** Keeps `<html lang>` in sync with the app language toggle. */
export function LangHtmlSync() {
  const { lang } = useAppUi();
  useEffect(() => {
    document.documentElement.lang = lang === 'fr' ? 'fr' : 'en';
  }, [lang]);
  return null;
}
