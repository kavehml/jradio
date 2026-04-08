import React from 'react';
import { Link } from 'react-router-dom';
import { PublicRequisitionForm } from './PublicRequisitionForm';
import { useAppStrings } from '../i18n/useAppStrings';

export const PhysicianNewRequisition: React.FC = () => {
  const s = useAppStrings();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{s.physician.newTitle}</h1>
      <p className="v3-page-lead">{s.physician.newLead}</p>
      <PublicRequisitionForm embedded />
    </div>
  );
};

export const PhysicianHistory: React.FC = () => {
  const s = useAppStrings();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{s.physician.historyTitle}</h1>
      <div className="v3-card">
        <div className="v3-card__body v3-empty-state">
          <p>{s.physician.historyEmpty}</p>
        </div>
      </div>
    </div>
  );
};

export const PhysicianFlagged: React.FC = () => {
  const s = useAppStrings();
  return (
    <div className="v3-page">
      <h1 className="v3-page-title">{s.physician.flaggedTitle}</h1>
      <div className="v3-card">
        <div className="v3-card__body v3-empty-state">
          <p>{s.physician.flaggedEmpty}</p>
          <Link to="/physician/new" className="v3-link">
            {s.physician.newReqLink}
          </Link>
        </div>
      </div>
    </div>
  );
};

export const SignUpPage: React.FC = () => {
  const s = useAppStrings();
  return (
    <div className="v3-login-bg">
      <div className="v3-login-card">
        <h1 className="v3-login-app-title">{s.signup.title}</h1>
        <p className="v3-login-sub">{s.signup.lead}</p>
        <Link to="/external-requisition" className="v3-btn v3-btn--primary v3-btn--block">
          {s.signup.publicFormBtn}
        </Link>
        <p className="v3-login-footer">
          <Link to="/login" className="v3-link">
            {s.signup.backSignIn}
          </Link>
        </p>
      </div>
    </div>
  );
};
