import React from 'react';

export const AdminDashboard: React.FC = () => {
  return (
    <section style={{ maxWidth: 1024, margin: '0 auto' }}>
      <h2>Admin portal</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        From here admins will manage users, radiologists, shifts, requisitions, and distribution settings.
      </p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Radiologists & users</h3>
          <p>Placeholder: table of users with roles and an add-user button.</p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Shifts</h3>
          <p>Placeholder: list of AM/PM/Night shifts for a selected day.</p>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: 8, boxShadow: '0 1px 3px rgba(15,23,42,0.1)' }}>
          <h3>Requisition backlog</h3>
          <p>Placeholder: backlog summary and manual redistribute button.</p>
        </div>
      </div>
    </section>
  );
};
