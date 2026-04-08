import { useMemo } from 'react';
import { useAppUi } from '../context/AppUiContext';
import { appT } from './locales';

export function useAppStrings() {
  const { lang } = useAppUi();
  return useMemo(() => appT(lang), [lang]);
}
