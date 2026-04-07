import React from 'react';
import { Link } from 'react-router-dom';
import { PublicRequisitionForm } from './PublicRequisitionForm';
import { useAppUi } from '../context/AppUiContext';

export const PhysicianNewRequisition: React.FC = () => {
  const { lang } = useAppUi();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{lang === 'fr' ? 'Nouvelle demande' : 'New requisition'}</h1>
      <p className="v3-page-lead">
        {lang === 'fr'
          ? 'Soumettre une demande d’examen (formulaire externe intégré).'
          : 'Submit an imaging requisition using the integrated public form.'}
      </p>
      <PublicRequisitionForm embedded />
    </div>
  );
};

export const PhysicianHistory: React.FC = () => {
  const { lang } = useAppUi();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{lang === 'fr' ? 'Historique' : 'History'}</h1>
      <div className="v3-card">
        <div className="v3-card__body v3-empty-state">
          <p>
            {lang === 'fr'
              ? 'Aucun historique pour le moment. Cette section sera reliée aux demandes du médecin connecté.'
              : 'No history yet. This section will list requisitions for the signed-in physician.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const PhysicianFlagged: React.FC = () => {
  const { lang } = useAppUi();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{lang === 'fr' ? 'Demandes signalées' : 'Flagged requisitions'}</h1>
      <div className="v3-card">
        <div className="v3-card__body v3-empty-state">
          <p>
            {lang === 'fr'
              ? 'Aucune demande signalée. Les filtres et alertes seront ajoutés ici.'
              : 'No flagged items yet. Filters and alerts will appear here.'}
          </p>
          <Link to="/physician/new" className="v3-link">
            {lang === 'fr' ? 'Nouvelle demande' : 'New requisition'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const SignUpPage: React.FC = () => {
  const { lang } = useAppUi();
  return (
    <div className="v3-login-bg">
      <div className="v3-login-card">
        <h1 className="v3-login-app-title">{lang === 'fr' ? 'Demander un accès' : 'Request access'}</h1>
        <p className="v3-login-sub">
          {lang === 'fr'
            ? 'Les comptes médecins sont créés par l’administration. Utilisez le formulaire public ou contactez le service de radiologie.'
            : 'Physician accounts are issued by your site administrator. Use the public requisition form or contact radiology IT.'}
        </p>
        <Link to="/external-requisition" className="v3-btn v3-btn--primary v3-btn--block">
          {lang === 'fr' ? 'Formulaire public (sans compte)' : 'Public requisition form'}
        </Link>
        <p className="v3-login-footer">
          <Link to="/login" className="v3-link">
            {lang === 'fr' ? 'Retour à la connexion' : 'Back to sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
};
