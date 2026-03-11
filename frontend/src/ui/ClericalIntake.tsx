import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getImagingCategories, createRequisition } from '../api';

interface Category {
  id: number;
  name: string;
  modality: string;
  bodyPart: string;
  imagePath: string | null;
}

export const ClericalIntake: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState('');
  const [isNewExternal, setIsNewExternal] = useState(false);
  const [orderingDoctor, setOrderingDoctor] = useState('');
  const [orderingClinic, setOrderingClinic] = useState('');
  const [site, setSite] = useState('');
  const [dateOfRequest, setDateOfRequest] = useState('');
  const [timeDelayPreset, setTimeDelayPreset] = useState('');
  const [hasImagingWithin24h, setHasImagingWithin24h] = useState(false);
  const [withContrast, setWithContrast] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!token) return;
    getImagingCategories(token)
      .then(setCategories)
      .catch(() => setMessage({ type: 'err', text: 'Failed to load imaging categories' }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCategory) {
      setMessage({ type: 'err', text: 'Please select an imaging category.' });
      return;
    }
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await createRequisition(token, {
        patientIdOrTempLabel: patientId,
        isNewExternalPatient: isNewExternal,
        orderingDoctorName: orderingDoctor,
        orderingClinic,
        site,
        dateOfRequest: dateOfRequest || undefined,
        timeDelayPreset: timeDelayPreset || undefined,
        hasImagingWithin24h,
        categoryId: selectedCategory.id,
        modality: selectedCategory.modality,
        bodyParts: [selectedCategory.bodyPart],
        withContrast,
        notes: notes || undefined,
      });
      setMessage({ type: 'ok', text: `Requisition created. Visit #${(result as { visitNumber?: string }).visitNumber}.` });
      setPatientId('');
      setOrderingDoctor('');
      setOrderingClinic('');
      setSite('');
      setDateOfRequest('');
      setTimeDelayPreset('');
      setNotes('');
      setSelectedCategory(null);
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create requisition' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2>Clerical requisition intake</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
        Select an imaging category, then fill the form. Due date is set automatically from time delay or prior imaging.
      </p>

      {loading ? (
        <p>Loading categories…</p>
      ) : (
        <>
          <h3 style={{ marginBottom: '0.5rem' }}>Imaging category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem',
                  border: '2px solid ' + (selectedCategory?.id === cat.id ? '#3b82f6' : '#e2e8f0'),
                  borderRadius: 8,
                  background: selectedCategory?.id === cat.id ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {cat.imagePath && (
                  <img
                    src={`/categories/${cat.imagePath}`}
                    alt=""
                    style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, display: 'block', marginBottom: 4 }}
                  />
                )}
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{cat.name}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{cat.modality}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(15,23,42,0.1)',
          display: 'grid',
          gap: '0.75rem',
        }}
      >
        {message && (
          <div
            style={{
              padding: '0.75rem',
              background: message.type === 'ok' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'ok' ? '#166534' : '#b91c1c',
              borderRadius: 8,
              fontSize: '0.9rem',
            }}
          >
            {message.text}
          </div>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>MRN / Patient ID or temp label</span>
          <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={isNewExternal} onChange={(e) => setIsNewExternal(e.target.checked)} />
          <span>New external patient</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Ordering doctor</span>
          <input type="text" value={orderingDoctor} onChange={(e) => setOrderingDoctor(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Clinic</span>
          <input type="text" value={orderingClinic} onChange={(e) => setOrderingClinic(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Site / location</span>
          <input type="text" value={site} onChange={(e) => setSite(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Date of request</span>
          <input type="date" value={dateOfRequest} onChange={(e) => setDateOfRequest(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Time delay allowed</span>
          <select value={timeDelayPreset} onChange={(e) => setTimeDelayPreset(e.target.value)}>
            <option value="">Not specified</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="3m">3 months</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={hasImagingWithin24h} onChange={(e) => setHasImagingWithin24h(e.target.checked)} />
          <span>Patient has relevant imaging within last 24 hours</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={withContrast} onChange={(e) => setWithContrast(e.target.checked)} />
          <span>With contrast</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Additional notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <button type="submit" disabled={submitting || !selectedCategory} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
          {submitting ? 'Saving…' : 'Save requisition'}
        </button>
      </form>
    </section>
  );
};
