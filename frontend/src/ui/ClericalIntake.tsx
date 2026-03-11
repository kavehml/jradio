import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getImagingCategories, createRequisition, getClinics, getSites } from '../api';

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
  const [clinicOptions, setClinicOptions] = useState<{ id: number; name: string }[]>([]);
  const [siteOptions, setSiteOptions] = useState<{ id: number; name: string }[]>([]);
  const [modality, setModality] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');

  useEffect(() => {
    if (!token) return;
    Promise.all([getImagingCategories(token), getClinics(token), getSites(token)])
      .then(([cats, clinics, sites]) => {
        setCategories(cats);
        setClinicOptions(clinics);
        setSiteOptions(sites);
      })
      .catch(() => setMessage({ type: 'err', text: 'Failed to load imaging categories/clinics/sites' }))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredCategories = modality
    ? categories.filter((c) => c.modality.toLowerCase() === modality.toLowerCase())
    : categories;

  function getSubCategoryOptions(cat: Category | null): string[] {
    if (!cat) return [];
    const name = cat.name.toLowerCase();
    if (name.includes('extremit')) {
      return [
        'CT Elbow C-',
        'CT Elbow C+',
        'CT Forearm C-',
        'CT Forearm C+',
        'CT Hand C-',
        'CT Hand C+',
        'CT Humerus C-',
        'CT Humerus C+',
        'CT Shoulder C-',
        'CT Shoulder C+',
        'CT Sternoclavicular joint C-',
        'CT Sternoclavicular joint C+',
        'CT Wrist C-',
        'CT Wrist C+',
        'CT Ankle C-',
        'CT Ankle C+',
        'CT Femur C-',
        'CT Femur C+',
        'CT Foot C-',
        'CT Foot C+',
        'CT Knee C-',
        'CT Knee C+',
        'CT TibFib C-',
        'CT TibFib C+',
        'CTA Lower Extremities',
        'CTA Upper Extremities',
      ];
    }
    if (name.includes('head')) {
      return ['CT Head C-', 'CT Head C+', 'CT Code Stroke C-/CTA H/N', 'CTA Head and Neck'];
    }
    if (name.includes('neck')) {
      return ['CT Neck C-', 'CT Neck C+', 'CT Neck C+ with Barium Paste', 'CTA Carotids'];
    }
    if (name.includes('chest')) {
      return ['CT Chest C-', 'CT Chest C+', 'CTA Chest', 'CTA C/A/P (bleed)'];
    }
    if (name.includes('abdo') || name.includes('abdomen') || name.includes('pelvis')) {
      return ['CT Abdo C-', 'CT Abdo C+', 'CT Pelvis C-', 'CT Pelvis C+', 'CT Virtual Colonoscopy', 'CTA Abdo/Pelvis'];
    }
    if (name.includes('spine')) {
      return ['CT C Spine', 'CT T Spine', 'CT L Spine', 'CT Total Spine', 'CT Myelogram'];
    }
    return [];
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCategory || !modality) {
      setMessage({ type: 'err', text: 'Please select modality and imaging category.' });
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
        modality,
        bodyParts: [selectedCategory.bodyPart],
        withContrast,
        notes: subCategory ? `${subCategory}${notes ? ' — ' + notes : ''}` : notes || undefined,
      });
      setMessage({ type: 'ok', text: `Requisition created. Visit #${(result as { visitNumber?: string }).visitNumber}.` });
      setPatientId('');
      setOrderingDoctor('');
      setOrderingClinic('');
      setSite('');
      setDateOfRequest('');
      setTimeDelayPreset('');
      setModality('');
      setSubCategory('');
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
        Choose modality, then category and exam type. Due date is set automatically from time delay or prior imaging.
      </p>

      {loading ? (
        <p>Loading categories…</p>
      ) : (
        <>
          <h3 style={{ marginBottom: '0.5rem' }}>Modality</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {['X-ray', 'CT', 'MRI', 'US', 'PET'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setModality(m);
                  setSelectedCategory(null);
                  setSubCategory('');
                }}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: 999,
                  border: modality === m ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: modality === m ? '#eff6ff' : 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                {m}
              </button>
            ))}
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>Imaging category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.5rem',
                  border: '2px solid ' + (selectedCategory?.id === cat.id ? '#3b82f6' : '#e2e8f0'),
                  borderRadius: 8,
                  background: selectedCategory?.id === cat.id ? '#0f172a' : '#0b1120',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: 'white',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: 72,
                    borderRadius: 6,
                    marginBottom: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background:
                      cat.bodyPart === 'head'
                        ? 'linear-gradient(135deg, #38bdf8, #0ea5e9)'
                        : cat.bodyPart === 'chest'
                        ? 'linear-gradient(135deg, #f97316, #ea580c)'
                        : cat.bodyPart === 'abdomen'
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                        : cat.bodyPart === 'spine'
                        ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                        : cat.bodyPart === 'vascular'
                        ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
                        : 'linear-gradient(135deg, #64748b, #334155)',
                    fontSize: '1.6rem',
                    fontWeight: 700,
                  }}
                >
                  {cat.modality}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.8 }}>{cat.bodyPart}</span>
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
          <select
            value={orderingClinic}
            onChange={(e) => setOrderingClinic(e.target.value)}
            style={{ marginBottom: 4 }}
          >
            <option value="">Select saved clinic (optional)</option>
            {clinicOptions.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={orderingClinic}
            onChange={(e) => setOrderingClinic(e.target.value)}
            required
            placeholder="Or type clinic name…"
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Site / location</span>
          <select value={site} onChange={(e) => setSite(e.target.value)} style={{ marginBottom: 4 }}>
            <option value="">Select saved site (optional)</option>
            {siteOptions.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            required
            placeholder="Or type site/location…"
          />
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
        {selectedCategory && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span>Exam type within this category</span>
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
              <option value="">Select exam type (optional)</option>
              {getSubCategoryOptions(selectedCategory).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
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
