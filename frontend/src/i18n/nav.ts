import type { AppLang } from '../context/AppUiContext';
import { appT as appTFn } from './locales';

export type { UiRole, AppStrings } from './locales';
export { appT } from './locales';

/** Same as `appT` — kept for existing sidebar/menu imports */
export function navT(lang: AppLang) {
  return appTFn(lang);
}
