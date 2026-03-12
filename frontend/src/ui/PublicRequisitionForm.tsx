import React, { useEffect, useState } from 'react';
import {
  getPublicImagingCategories,
  createPublicRequisition,
  getPublicClinics,
  getPublicSites,
  getPublicImagingSubCategories,
  getPublicTimeDelayOptions,
  TimeDelayOptionDto,
} from '../api';

interface Category {
  id: number;
  name: string;
  modality: string;
  bodyPart: string;
  imagePath: string | null;
}

export const PublicRequisitionForm: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [isNewExternal, setIsNewExternal] = useState(true);
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
  const [mriSequences, setMriSequences] = useState<string[]>([]);
  const [subCategoryMap, setSubCategoryMap] = useState<Record<number, string[]>>({});
  const [timeDelayOptions, setTimeDelayOptions] = useState<TimeDelayOptionDto[]>([]);

  useEffect(() => {
    Promise.all([
      getPublicImagingCategories(),
      getPublicClinics(),
      getPublicSites(),
      getPublicImagingSubCategories(),
      getPublicTimeDelayOptions(),
    ])
      .then(([cats, clinics, sites, subCategories, delayOptions]) => {
        setCategories(cats);
        setClinicOptions(clinics);
        setSiteOptions(sites);
        const map: Record<number, string[]> = {};
        subCategories.forEach((s) => {
          if (!map[s.categoryId]) map[s.categoryId] = [];
          map[s.categoryId].push(s.name);
        });
        setSubCategoryMap(map);
        setTimeDelayOptions(delayOptions);
      })
      .catch(() => setMessage({ type: 'err', text: 'Failed to load imaging categories/clinics/sites' }))
      .finally(() => setLoading(false));
  }, []);

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
          return ['CT Hip', 'CT Pelvis', 'CT Sacrum/Coccyx'];
        case 'CT SPINE':
          return ['CT C Spine', 'CT L Spine', 'CT T Spine', 'CT Myelogram', 'CT Spine Neuronavigation', 'CT Total Spine'];
        default:
          return [];
      }
    }
    if (cat.modality === 'MRI') {
      const n = name;
      if (n.includes('BRAIN') || n.includes('HEAD')) {
        return [
          'MRI Brain Routine',
          'MRI Brain With Contrast',
          'MRI Brain Tumor Protocol',
          'MRI Stroke Protocol',
          'MRI Pituitary',
          'MRI Orbits',
          'MRI Internal Auditory Canal (IAC)',
          'MR Angiography Brain',
          'MR Venography Brain',
        ];
      }
      if (n.includes('SPINE')) {
        return ['MRI Cervical Spine', 'MRI Thoracic Spine', 'MRI Lumbar Spine', 'MRI Whole Spine', 'MRI Spine Tumor / Infection'];
      }
      if (n.includes('ABDOMEN')) {
        return ['MRI Liver', 'MRCP', 'MRI Pancreas', 'MRI Kidneys', 'MRI Adrenal'];
      }
      if (n.includes('PELVIS')) {
        return ['MRI Prostate', 'MRI Female Pelvis', 'MRI Rectal Cancer', 'MRI Pelvic Mass'];
      }
      if (n.includes('MUSCULOSKELETAL')) {
        return ['MRI Shoulder', 'MRI Elbow', 'MRI Wrist', 'MRI Hip', 'MRI Knee', 'MRI Ankle', 'MRI Foot'];
      }
      if (n.includes('VASCULAR')) {
        return ['MRA Brain', 'MRA Neck', 'MRA Aorta', 'MRA Extremities'];
      }
      return [];
    }
    if (cat.modality === 'US') {
      if (name === 'US ABDOMEN') {
        return ['US Abdomen Complete', 'US Liver', 'US Gallbladder / Biliary', 'US Pancreas', 'US Spleen', 'US Kidneys', 'US Aorta'];
      }
      if (name === 'US PELVIS') {
        return ['US Pelvis Transabdominal', 'US Pelvis Transvaginal', 'US Prostate (TRUS)', 'US Bladder'];
      }
      if (name === 'US OBSTETRICS') {
        return ['Early Pregnancy', 'First Trimester', 'Second Trimester Anatomy Scan', 'Third Trimester Growth Scan', 'Biophysical Profile'];
      }
      if (name.includes('VASCULAR') || name.includes('DOPPLER')) {
        return ['Carotid Doppler', 'Renal Doppler', 'Lower Extremity Venous Doppler', 'Lower Extremity Arterial Doppler', 'Upper Extremity Doppler', 'Portal Venous Doppler'];
      }
      if (name.includes('MUSCULOSKELETAL')) {
        return ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle / Foot', 'Soft Tissue Mass'];
      }
      if (name.includes('HEAD') || name.includes('NECK')) {
        return ['Thyroid', 'Parathyroid', 'Neck Mass', 'Salivary Glands'];
      }
      if (name.includes('BREAST')) {
        return ['Breast Ultrasound', 'Breast Mass Evaluation'];
      }
      if (name.includes('PEDIATRIC')) {
        return ['Neonatal Brain', 'Pyloric Stenosis', 'Developmental Hip'];
      }
      if (name.includes('PROCEDURES')) {
        return ['Ultrasound Guided Biopsy', 'Ultrasound Guided Drainage', 'Ultrasound Guided Aspiration'];
      }
      return [];
    }
    if (cat.modality === 'Other' && name.startsWith('PET ')) {
      if (name === 'PET ONCOLOGY') {
        return ['Whole Body PET-CT (FDG)', 'PET Tumor Staging', 'PET Treatment Response', 'PET Recurrence Evaluation'];
      }
      if (name === 'PET NEUROLOGY') {
        return ['Brain PET (FDG)', 'Dementia PET', 'Epilepsy PET', 'Brain Tumor PET'];
      }
      if (name === 'PET CARDIAC') {
        return ['Myocardial Perfusion PET', 'Cardiac Viability PET'];
      }
      if (name.includes('SPECIALIZED TRACERS')) {
        return ['PSMA PET (Prostate cancer)', 'DOTATATE PET (Neuroendocrine tumors)', 'Amyloid PET (Alzheimer disease)'];
      }
      if (name.includes('INFECTION') || name.includes('INFLAMMATION')) {
        return ['PET Fever of Unknown Origin', 'PET Vasculitis', 'PET Osteomyelitis'];
      }
      return [];
    }
    if (cat.modality === 'Other' && name.startsWith('XR ')) {
      if (name === 'XR CHEST') {
        return ['Chest PA', 'Chest AP', 'Chest Lateral', 'Portable Chest'];
      }
      if (name === 'XR ABDOMEN') {
        return ['Abdomen (KUB)', 'Acute Abdomen Series'];
      }
      if (name.includes('SKULL') || name.includes('HEAD')) {
        return ['Skull', 'Sinuses', 'Facial Bones'];
      }
      if (name === 'XR SPINE') {
        return ['Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacrum / Coccyx', 'Scoliosis Series'];
      }
      if (name.includes('UPPER EXTREMITIES')) {
        return ['Shoulder', 'Clavicle', 'Humerus', 'Elbow', 'Forearm', 'Wrist', 'Hand', 'Fingers'];
      }
      if (name.includes('LOWER EXTREMITIES')) {
        return ['Pelvis', 'Hip', 'Femur', 'Knee', 'Tibia / Fibula', 'Ankle', 'Foot', 'Toes'];
      }
      if (name.includes('SPECIAL STUDIES')) {
        return ['Bone Age', 'Skeletal Survey', 'Foreign Body'];
      }
      if (name.includes('FLUOROSCOPY')) {
        return ['Barium Swallow', 'Barium Meal', 'Barium Enema', 'Upper GI Series'];
      }
      return [];
    }
    if (cat.modality === 'Angio') {
      return ['CT Angiography – Aorta', 'CT Angiography – Carotids', 'CT Angiography – Peripheral'];
    }
    return [];
  }

  function getMriSequenceOptions(cat: Category | null): string[] {
    if (!cat || cat.modality !== 'MRI') return [];
    const name = cat.name.toUpperCase();
    if (name.includes('BRAIN') || name.includes('HEAD')) {
      return ['T1', 'T1 Post-Contrast', 'T2', 'FLAIR', 'DWI / ADC', 'SWI / GRE', 'Perfusion', 'Spectroscopy'];
    }
    if (name.includes('SPINE')) {
      return ['T1 Sagittal', 'T2 Sagittal', 'T2 Axial', 'STIR', 'T1 Post Contrast'];
    }
    if (name.includes('ABDOMEN')) {
      return ['T1 In-phase / Out-of-phase', 'T2', 'DWI', 'Dynamic Contrast (arterial, portal, delayed)', 'MRCP sequence'];
    }
    if (name.includes('PELVIS')) {
      return ['T1', 'T2 High Resolution', 'DWI', 'Dynamic Contrast'];
    }
    if (name.includes('MUSCULOSKELETAL')) {
      return ['T1', 'T2', 'Proton Density (PD)', 'PD Fat Sat', 'STIR', 'T1 Post Contrast'];
    }
    if (name.includes('VASCULAR')) {
      return ['Time of Flight (TOF)', 'Phase Contrast', 'Contrast MRA'];
    }
    return [];
  }

  function getMergedSubCategoryOptions(cat: Category | null): string[] {
    if (!cat) return [];
    const defaults = getSubCategoryOptions(cat);
    const dynamic = subCategoryMap[cat.id] || [];
    return Array.from(new Set([...defaults, ...dynamic]));
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

  const MRI_CATEGORY_ORDER = [
    'MRI BRAIN / HEAD',
    'MRI SPINE',
    'MRI ABDOMEN',
    'MRI PELVIS',
    'MRI MUSCULOSKELETAL',
    'MRI VASCULAR',
  ] as const;

  const US_CATEGORY_ORDER = [
    'US ABDOMEN',
    'US PELVIS',
    'US OBSTETRICS',
    'US VASCULAR / DOPPLER',
    'US MUSCULOSKELETAL',
    'US HEAD / NECK',
    'US BREAST',
    'US PEDIATRIC',
    'US PROCEDURES',
  ] as const;

  const PET_CATEGORY_ORDER = [
    'PET ONCOLOGY',
    'PET NEUROLOGY',
    'PET CARDIAC',
    'PET SPECIALIZED TRACERS',
    'PET INFECTION / INFLAMMATION',
  ] as const;

  const XR_CATEGORY_ORDER = [
    'XR CHEST',
    'XR ABDOMEN',
    'XR SKULL / HEAD',
    'XR SPINE',
    'XR UPPER EXTREMITIES',
    'XR LOWER EXTREMITIES',
    'XR SPECIAL STUDIES',
    'XR FLUOROSCOPY',
  ] as const;

  const filteredCategories = modality
    ? modality.toUpperCase() === 'CT'
      ? CT_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality.toUpperCase() === 'CT' && c.name === name)
        ).filter((c): c is Category => c != null)
      : modality.toUpperCase() === 'MRI'
      ? MRI_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality.toUpperCase() === 'MRI' && c.name === name)
        ).filter((c): c is Category => c != null)
      : modality === 'US'
      ? US_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality === 'US' && c.name === name)
        ).filter((c): c is Category => c != null)
      : modality.toUpperCase() === 'PET'
      ? PET_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality === 'Other' && c.name === name)
        ).filter((c): c is Category => c != null)
      : modality === 'X-ray'
      ? XR_CATEGORY_ORDER.map((name) =>
          categories.find((c) => c.modality === 'Other' && c.name === name)
        ).filter((c): c is Category => c != null)
      : categories.filter((c) => c.modality.toLowerCase() === modality.toLowerCase())
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !modality) {
      setMessage({ type: 'err', text: 'Please select modality and imaging category.' });
      return;
    }
    setMessage(null);
    setSubmitting(true);
    try {
      const result = await createPublicRequisition({
        patientIdOrTempLabel: patientId,
        patientName: patientName || undefined,
        patientDateOfBirth: patientDob || undefined,
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
        selectedSubCategories: subCategories,
        withContrast: false,
        notes:
          [
            subCategories.length ? `Exams:\n${subCategories.map((s) => `- ${s}`).join('\n')}` : '',
            modality === 'MRI' && mriSequences.length ? `Sequences: ${mriSequences.join(', ')}` : '',
            notes.trim() ? `Notes: ${notes.trim()}` : '',
          ]
            .filter(Boolean)
            .join('\n') || undefined,
      });
      setMessage({ type: 'ok', text: `Requisition submitted. Visit #${(result as { visitNumber?: string }).visitNumber}.` });
      setPatientId('');
      setPatientName('');
      setPatientDob('');
      setOrderingDoctor('');
      setOrderingClinic('');
      setSite('');
      setDateOfRequest('');
      setTimeDelayPreset('');
      setModality('');
      setSubCategories([]);
      setMriSequences([]);
      setNotes('');
      setSelectedCategory(null);
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to create requisition' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h2>External requisition form</h2>
      <p style={{ color: '#4b5563', marginBottom: '1rem', maxWidth: 720 }}>
        This form is for clinics outside the radiology department to request imaging. Please complete all required fields as accurately as possible.
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
                  setMriSequences([]);
                }}
                style={{
                  padding: '0.35rem 0.9rem',
                  borderRadius: 999,
                  border: modality === m ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  background: modality === m ? 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)' : '#f8fbff',
                  color: modality === m ? '#1d4ed8' : '#334155',
                  fontWeight: 600,
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
                      setMriSequences([]);
                    }}
                    style={{
                      padding: '0.75rem 0.5rem',
                      border: '2px solid ' + (selectedCategory?.id === cat.id ? '#3b82f6' : '#e2e8f0'),
                      borderRadius: 8,
                      background: selectedCategory?.id === cat.id ? '#eff6ff' : 'white',
                      color: '#0f172a',
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
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                        gap: '0.35rem 1rem',
                        alignItems: 'start',
                      }}
                    >
                      {getMergedSubCategoryOptions(selectedCategory).map((opt) => {
                        const checked = subCategories.includes(opt);
                        return (
                          <label
                            key={opt}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 8,
                              padding: '0.4rem 0.25rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              lineHeight: 1.25,
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
                              style={{ margin: '2px 0 0', flexShrink: 0 }}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </label>
                  {modality === 'MRI' && getMriSequenceOptions(selectedCategory).length > 0 && (
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span>Typical sequences</span>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                          gap: '0.35rem 1rem',
                          alignItems: 'start',
                        }}
                      >
                        {getMriSequenceOptions(selectedCategory).map((seq) => {
                          const checked = mriSequences.includes(seq);
                          return (
                            <label
                              key={seq}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 8,
                                padding: '0.4rem 0.25rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                lineHeight: 1.25,
                                borderBottom: '1px solid #f1f5f9',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setMriSequences((prev) =>
                                    checked ? prev.filter((s) => s !== seq) : [...prev, seq]
                                  )
                                }
                                style={{ margin: '2px 0 0', flexShrink: 0 }}
                              />
                              <span>{seq}</span>
                            </label>
                          );
                        })}
                      </div>
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
          marginTop: '1rem',
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
          <span>Patient identifier (MRN or temp label)</span>
          <input type="text" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Patient name</span>
          <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Patient DOB</span>
          <input type="date" value={patientDob} onChange={(e) => setPatientDob(e.target.value)} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={isNewExternal}
            onChange={(e) => setIsNewExternal(e.target.checked)}
          />
          <span>New external patient</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Ordering doctor</span>
          <input
            type="text"
            value={orderingDoctor}
            onChange={(e) => setOrderingDoctor(e.target.value)}
            required
          />
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
            {timeDelayOptions.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={hasImagingWithin24h}
            onChange={(e) => setHasImagingWithin24h(e.target.checked)}
          />
          <span>Patient has relevant imaging within last 24 hours</span>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Additional notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </label>
        <button
          type="submit"
          disabled={submitting || !selectedCategory}
          style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? 'Submitting…' : 'Submit requisition'}
        </button>
      </form>
    </section>
  );
};

