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
  const [notes, setNotes] = useState('');
  const [clinicOptions, setClinicOptions] = useState<{ id: number; name: string }[]>([]);
  const [siteOptions, setSiteOptions] = useState<{ id: number; name: string }[]>([]);
  const [modality, setModality] = useState<string>('');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [mriTechnique, setMriTechnique] = useState<string>('');

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

  function getSubCategoryOptions(cat: Category | null): string[] {
    if (!cat) return [];
    const name = cat.name.toUpperCase();
    if (cat.modality === 'CT') {
      switch (name) {
        case 'MISCELLANEOUS CT':
          return [
            'CT Head C-',
            'CT Head C+',
            'CT C1A1',
            'CT A1 C+ with Oral',
            'CT C1 C+',
            'CT C3 C- Low Dose',
            'CT R3 Low Dose',
            'CT Neck C+',
            'CT Sinuses C-',
          ];
        case 'CT ABDO':
          return [
            'CT A1 C+ with Oral',
            'CT A1 C+ without Oral',
            'CT A2 C- with Oral',
            'CT Abdo Venogram',
            'CT Adrenals C-/C+',
            'CT Cystogram',
            'CT Enterography',
            'CT Fistulogram',
            'CT L1 Triphasic',
            'CT Mesenteric Ischemia CTA/PV',
            'CT P1',
            'CT R1',
            'CT R2 Adrenals C-',
            'CT R3 Low Dose',
            'CT RH (Hematuria)',
            'CT Virtual Colonoscopy',
            'CTA Abdo/Pelvis (Bleed protocol)',
            'CTA Abdo/Pelvis',
            'CTA Abdo/Pelvis Runoff',
          ];
        case 'CT CHEST':
          return [
            'CT Apollo',
            'CT C1 C+',
            'CT C1A (Chest + upper Abdo C+)',
            'CT C1A1',
            'CT C1L1 (Chest + Abdo C-/C+)',
            'CT C1R1 (Chest + Abdo C-/C+)',
            'CT C2 C-',
            'CT C2A (Chest + upper Abdo C-)',
            'CT C2A2',
            'CT C3 C- Low Dose',
            'CT Calcium Score',
            'CT Cardiac Prospective',
            'CT Cardiac Retrospective',
            'CT Chest C- Low dose PODCP',
            'CT PE',
            'CT LA Appendage',
            'CT PE + Abdo',
            'CT Venogram Chest',
            'CTA C/A/P (Bleed protocol)',
            'CTA C/A/P',
            'CTA Chest (Bleed protocol)',
            'CTA Chest',
            'CTA Chest Gated',
            'CTA Chest / upper ext. Runoff',
            'CTA Dissection Gated',
            'CTA Mitral Valve',
            'CTA TAVI',
          ];
        case 'CT EXTREMITIES':
          return [
            'CT Elbow',
            'CT Forearm',
            'CT Hand',
            'CT Humerus',
            'CT Shoulder',
            'CT Sternoclavicular joint',
            'CT Wrist',
            'CT Ankle',
            'CT Femur',
            'CT Foot',
            'CT Knee',
            'CT Prophecy',
            'CT Sternum',
            'CT TibFib',
            'CTA Lower Extremities',
            'CTA Upper Extremities',
          ];
        case 'CT HEAD':
          return [
            'CT Code Stroke C-/CTA H/N',
            'CT Facial Bones',
            'CT Head',
            'CT Head Neuronavigation',
            'CT Orbits',
            'CT Sella',
            'CT Sinuses',
            'CT Temporal Bones',
            'CT Venogram of the Head',
            'CTA Head and Neck C-/CTA',
            'CTA Head C-/CTA',
          ];
        case 'CT NECK':
          return [
            'CT add Phonation',
            'CT add Puffed Cheeks',
            'CT add Skin Marker',
            'CT add Tongue Depressor',
            'CT add Tongue Out',
            'CT Neck',
            'CT Neck GSI',
            'CT Neck with Barium Paste',
            'CT Neck Parotids',
            'CT Neck Parotids GSI',
            'CT Parathyroid Perfusion',
            'CTA Carotids',
          ];
        case 'CT PELVIS':
          return [
            'CT Hip',
            'CT Pelvis',
            'CT Sacrum/Coccyx',
          ];
        case 'CT SPINE':
          return [
            'CT C Spine',
            'CT L Spine',
            'CT T Spine',
            'CT Myelogram',
            'CT Spine Neuronavigation',
            'CT Total Spine',
          ];
        default:
          return [];
      }
    }
    if (cat.modality === 'MRI') {
      const n = name;
      if (n.includes('HEAD') || n.includes('BRAIN')) {
        return ['MRI Brain', 'MRI Pituitary', 'MRI IACs'];
      }
      if (n.includes('SPINE')) {
        return ['MRI Cervical Spine', 'MRI Thoracic Spine', 'MRI Lumbar Spine', 'MRI Whole Spine'];
      }
      if (n.includes('ABDO') || n.includes('PELVIS')) {
        return ['MRI Abdomen', 'MRI Pelvis', 'MRI Abdomen + Pelvis'];
      }
      if (n.includes('CHEST')) {
        return ['MRI Chest', 'MRI Cardiac'];
      }
      if (n.includes('EXTREM')) {
        return ['MRI Upper Extremity', 'MRI Lower Extremity'];
      }
      if (n.includes('MISC')) {
        return ['MRI Other'];
      }
      return [];
    }
    if (cat.modality === 'US') {
      return ['US Abdomen', 'US Abdomen + Pelvis', 'US Pelvis', 'US Abdominal Doppler'];
    }
    if (cat.modality === 'Angio') {
      return ['CT Angiography – Aorta', 'CT Angiography – Carotids', 'CT Angiography – Peripheral'];
    }
    return [];
  }

  const CT_CATEGORY_ORDER = [
    'MISCELLANEOUS CT',
    'CT ABDO',
    'CT CHEST',
    'CT EXTREMITIES',
    'CT HEAD',
    'CT NECK',
    'CT PELVIS',
    'CT SPINE',
  ] as const;

  const filteredCategories = modality
    ? modality.toUpperCase() === 'CT'
      ? CT_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality.toUpperCase() === 'CT' && c.name === name)
        ).filter((c): c is Category => c != null)
      : categories.filter((c) => c.modality.toLowerCase() === modality.toLowerCase())
    : [];

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
        withContrast: false,
        notes:
          (subCategories.length || mriTechnique
            ? [
                subCategories.length ? `Exams: ${subCategories.join(', ')}` : '',
                modality === 'MRI' && mriTechnique ? `MRI technique: ${mriTechnique}` : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined) || notes || undefined,
      });
      setMessage({ type: 'ok', text: `Requisition created. Visit #${(result as { visitNumber?: string }).visitNumber}.` });
      setPatientId('');
      setOrderingDoctor('');
      setOrderingClinic('');
      setSite('');
      setDateOfRequest('');
      setTimeDelayPreset('');
      setModality('');
      setSubCategories([]);
      setMriTechnique('');
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
                  setSubCategories([]);
                  setMriTechnique('');
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
          {modality && (
            <>
              <h3 style={{ marginBottom: '0.5rem' }}>Imaging category</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSubCategories([]);
                      setMriTechnique('');
                    }}
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: '2px solid ' + (selectedCategory?.id === cat.id ? '#3b82f6' : '#e2e8f0'),
                      borderRadius: 8,
                      background: selectedCategory?.id === cat.id ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cat.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {cat.modality} · {cat.bodyPart}
                    </div>
                  </button>
                ))}
                {filteredCategories.length === 0 && (
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>No categories configured for this modality yet.</div>
                )}
              </div>
              {selectedCategory && (
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span>Exam type within this category</span>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: '0.35rem 1.5rem',
                        columnGap: '1.5rem',
                        rowGap: '0.35rem',
                        alignItems: 'center',
                      }}
                    >
                      {getSubCategoryOptions(selectedCategory).map((opt) => {
                        const checked = subCategories.includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '0.35rem 0',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              borderBottom: '1px solid #f1f5f9',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSubCategories((prev) =>
                                  checked ? prev.filter((s) => s !== opt) : [...prev, opt]
                                )
                              }
                              style={{ margin: 0, flexShrink: 0 }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </label>
                  {modality === 'MRI' && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>MRI technique (optional)</span>
                      <select value={mriTechnique} onChange={(e) => setMriTechnique(e.target.value)}>
                        <option value="">Select technique</option>
                        <option value="T1">T1</option>
                        <option value="T2">T2</option>
                        <option value="FLAIR">FLAIR</option>
                        <option value="DWI">DWI</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  )}
                </div>
              )}
            </>
          )}
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
