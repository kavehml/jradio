import type { AppLang } from '../context/AppUiContext';

export type UiRole =
  | 'admin'
  | 'clerical'
  | 'radiologist'
  | 'physician'
  | 'technologist';

const STRINGS: Record<
  AppLang,
  {
    menu: string;
    settings: string;
    logout: string;
    roles: Record<UiRole, string>;
    nav: Record<string, string>;
  }
> = {
  en: {
    menu: 'Menu',
    settings: 'Settings',
    logout: 'Logout',
    roles: {
      admin: 'Administration',
      clerical: 'Clerical staff',
      radiologist: 'Radiologist',
      physician: 'Physician',
      technologist: 'Technologist',
    },
    nav: {
      clericalIntake: 'Clerical intake',
      requisitions: 'Requisitions',
      workloadSeparation: 'Radiology workload separation',
      assigning: 'Assigning',
      serviceRules: 'Service rules',
      radSchedule: 'Radiologist schedule',
      radScheduleHub: 'Radiologist schedule',
      userAccess: 'User access management',
      rvuCredits: 'RVU credits',
      radRequisitions: 'Requisitions',
      radWeekly: 'Weekly schedule',
      radCalendar: 'Calendar',
      physNew: 'New requisition',
      physHistory: 'History',
      physFlagged: 'Flagged requisitions',
      techList: 'Requisition list',
    },
  },
  fr: {
    menu: 'Menu',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    roles: {
      admin: 'Administration',
      clerical: 'Personnel administratif',
      radiologist: 'Radiologiste',
      physician: 'Médecin',
      technologist: 'Technologiste',
    },
    nav: {
      clericalIntake: 'Réception des demandes',
      requisitions: 'Demandes',
      workloadSeparation: 'Répartition de la charge',
      assigning: 'Attribution',
      serviceRules: 'Règles de service',
      radSchedule: 'Horaire des radiologistes',
      radScheduleHub: 'Horaire des radiologistes',
      userAccess: 'Gestion des accès',
      rvuCredits: 'Crédits RVU',
      radRequisitions: 'Demandes',
      radWeekly: 'Horaire hebdomadaire',
      radCalendar: 'Calendrier',
      physNew: 'Nouvelle demande',
      physHistory: 'Historique',
      physFlagged: 'Demandes signalées',
      techList: 'Liste des demandes',
    },
  },
};

export function navT(lang: AppLang) {
  return STRINGS[lang];
}
