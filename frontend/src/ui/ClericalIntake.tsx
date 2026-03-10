import React from 'react';

export const ClericalIntake: React.FC = () => {
  return (
    <section style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2>Clerical requisition intake</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        Use this form to enter outpatient imaging requisitions. Later this will calculate due dates and RVUs automatically.
      </p>
      <form
        style={{
          background: 'white',
          padding: '1rem',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Date of request</span>
          <input type="date" name="dateOfRequest" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Time delay allowed</span>
          <select name="timeDelayAllowed">
            <option value="">Not specified</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="3m">3 months</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>MRN / Patient ID or temp label</span>
          <input type="text" name="patientIdOrTempLabel" />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="isNewExternalPatient" />
          <span>New external patient (notify clerical for other systems)</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Ordering doctor</span>
          <input type="text" name="orderingDoctorName" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Clinic</span>
          <input type="text" name="orderingClinic" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Site / location</span>
          <input type="text" name="site" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Imaging type and body part(s)</span>
          <textarea name="imagingDescription" rows={3} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="hasImagingWithin24h" />
          <span>Patient has relevant imaging within last 24 hours</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Additional notes</span>
          <textarea name="notes" rows={3} />
        </label>
        <button type="submit" style={{ marginTop: '0.5rem' }}>
          Save requisition (placeholder)
        </button>
      </form>
    </section>
  );
};
