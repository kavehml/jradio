import React from 'react';

export const RadiologistDashboard: React.FC = () => {
  return (
    <section style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2>Radiologist schedule</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        This view will show your assigned requisitions for the current shift, RVU totals, and backlog.
      </p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Today&apos;s shifts</h3>
          <p>Placeholder: list of AM/PM/Night shifts and RVU totals.</p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Assigned cases</h3>
          <p>Placeholder: table of assigned requisitions with modality, RVU, and status.</p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Backlog</h3>
          <p>Placeholder: backlog indicators and cases approaching due date.</p>
        </div>
      </div>
    </section>
  );
};
