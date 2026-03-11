import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import {
  createImagingSubCategory,
  getImagingCategories,
  getImagingSubCategories,
  getSpecialtyRules,
  saveSpecialtyRule,
  SpecialtyRuleDto,
} from '../api';

interface Category {
  id: number;
  name: string;
  modality: string;
  bodyPart: string;
  imagePath: string | null;
}

const SPECIALTIES = [
  { id: 'general', label: 'General' },
  { id: 'neuroradiology', label: 'Neuroradiology' },
  { id: 'musculoskeletal_radiology', label: 'Musculoskeletal Radiology' },
  { id: 'body_imaging_abdominal_radiology', label: 'Body Imaging / Abdominal Radiology' },
  { id: 'breast_imaging', label: 'Breast Imaging' },
  { id: 'cardiothoracic_radiology', label: 'Cardiothoracic Radiology' },
  { id: 'pediatric_radiology', label: 'Pediatric Radiology' },
  { id: 'interventional_radiology', label: 'Interventional Radiology' },
  { id: 'nuclear_medicine', label: 'Nuclear Medicine' },
  { id: 'emergency_radiology', label: 'Emergency Radiology' },
  { id: 'genitourinary_radiology', label: 'Genitourinary Radiology' },
  { id: 'gastrointestinal_radiology', label: 'Gastrointestinal Radiology' },
  { id: 'vascular_radiology', label: 'Vascular Radiology' },
] as const;

const keyOf = (modality: string, categoryName: string, subCategory: string | null) =>
  `${modality}||${categoryName}||${subCategory ?? ''}`;

function getSubCategoryOptions(cat: Category): string[] {
  const name = cat.name.toUpperCase();
  if (cat.modality === 'CT') {
    switch (name) {
      case 'MISCELLANEOUS CT':
        return ['CT Head C-', 'CT Head C+', 'CT C1A1', 'CT A1 C+ with Oral', 'CT C1 C+', 'CT C3 C- Low Dose', 'CT R3 Low Dose', 'CT Neck C+', 'CT Sinuses C-'];
      case 'CT ABDO':
        return ['CT A1 C+ with Oral', 'CT A1 C+ without Oral', 'CT A2 C- with Oral', 'CT Abdo Venogram', 'CT Adrenals C-/C+', 'CT Cystogram', 'CT Enterography', 'CT Fistulogram', 'CT L1 Triphasic', 'CT Mesenteric Ischemia CTA/PV', 'CT P1', 'CT R1', 'CT R2 Adrenals C-', 'CT R3 Low Dose', 'CT RH (Hematuria)', 'CT Virtual Colonoscopy', 'CTA Abdo/Pelvis (Bleed protocol)', 'CTA Abdo/Pelvis', 'CTA Abdo/Pelvis Runoff'];
      case 'CT CHEST':
        return ['CT Apollo', 'CT C1 C+', 'CT C1A (Chest + upper Abdo C+)', 'CT C1A1', 'CT C1L1 (Chest + Abdo C-/C+)', 'CT C1R1 (Chest + Abdo C-/C+)', 'CT C2 C-', 'CT C2A (Chest + upper Abdo C-)', 'CT C2A2', 'CT C3 C- Low Dose', 'CT Calcium Score', 'CT Cardiac Prospective', 'CT Cardiac Retrospective', 'CT Chest C- Low dose PODCP', 'CT PE', 'CT LA Appendage', 'CT PE + Abdo', 'CT Venogram Chest', 'CTA C/A/P (Bleed protocol)', 'CTA C/A/P', 'CTA Chest (Bleed protocol)', 'CTA Chest', 'CTA Chest Gated', 'CTA Chest / upper ext. Runoff', 'CTA Dissection Gated', 'CTA Mitral Valve', 'CTA TAVI'];
      case 'CT EXTREMITIES':
        return ['CT Elbow', 'CT Forearm', 'CT Hand', 'CT Humerus', 'CT Shoulder', 'CT Sternoclavicular joint', 'CT Wrist', 'CT Ankle', 'CT Femur', 'CT Foot', 'CT Knee', 'CT Prophecy', 'CT Sternum', 'CT TibFib', 'CTA Lower Extremities', 'CTA Upper Extremities'];
      case 'CT HEAD':
        return ['CT Code Stroke C-/CTA H/N', 'CT Facial Bones', 'CT Head', 'CT Head Neuronavigation', 'CT Orbits', 'CT Sella', 'CT Sinuses', 'CT Temporal Bones', 'CT Venogram of the Head', 'CTA Head and Neck C-/CTA', 'CTA Head C-/CTA'];
      case 'CT NECK':
        return ['CT add Phonation', 'CT add Puffed Cheeks', 'CT add Skin Marker', 'CT add Tongue Depressor', 'CT add Tongue Out', 'CT Neck', 'CT Neck GSI', 'CT Neck with Barium Paste', 'CT Neck Parotids', 'CT Neck Parotids GSI', 'CT Parathyroid Perfusion', 'CTA Carotids'];
      case 'CT PELVIS':
        return ['CT Hip', 'CT Pelvis', 'CT Sacrum/Coccyx'];
      case 'CT SPINE':
        return ['CT C Spine', 'CT L Spine', 'CT T Spine', 'CT Myelogram', 'CT Spine Neuronavigation', 'CT Total Spine'];
      default:
        return [];
    }
  }
  if (cat.modality === 'MRI') {
    if (name.includes('BRAIN') || name.includes('HEAD')) return ['MRI Brain Routine', 'MRI Brain With Contrast', 'MRI Brain Tumor Protocol', 'MRI Stroke Protocol', 'MRI Pituitary', 'MRI Orbits', 'MRI Internal Auditory Canal (IAC)', 'MR Angiography Brain', 'MR Venography Brain'];
    if (name.includes('SPINE')) return ['MRI Cervical Spine', 'MRI Thoracic Spine', 'MRI Lumbar Spine', 'MRI Whole Spine', 'MRI Spine Tumor / Infection'];
    if (name.includes('ABDOMEN')) return ['MRI Liver', 'MRCP', 'MRI Pancreas', 'MRI Kidneys', 'MRI Adrenal'];
    if (name.includes('PELVIS')) return ['MRI Prostate', 'MRI Female Pelvis', 'MRI Rectal Cancer', 'MRI Pelvic Mass'];
    if (name.includes('MUSCULOSKELETAL')) return ['MRI Shoulder', 'MRI Elbow', 'MRI Wrist', 'MRI Hip', 'MRI Knee', 'MRI Ankle', 'MRI Foot'];
    if (name.includes('VASCULAR')) return ['MRA Brain', 'MRA Neck', 'MRA Aorta', 'MRA Extremities'];
    return [];
  }
  if (cat.modality === 'US') {
    if (name === 'US ABDOMEN') return ['US Abdomen Complete', 'US Liver', 'US Gallbladder / Biliary', 'US Pancreas', 'US Spleen', 'US Kidneys', 'US Aorta'];
    if (name === 'US PELVIS') return ['US Pelvis Transabdominal', 'US Pelvis Transvaginal', 'US Prostate (TRUS)', 'US Bladder'];
    if (name === 'US OBSTETRICS') return ['Early Pregnancy', 'First Trimester', 'Second Trimester Anatomy Scan', 'Third Trimester Growth Scan', 'Biophysical Profile'];
    if (name.includes('VASCULAR') || name.includes('DOPPLER')) return ['Carotid Doppler', 'Renal Doppler', 'Lower Extremity Venous Doppler', 'Lower Extremity Arterial Doppler', 'Upper Extremity Doppler', 'Portal Venous Doppler'];
    if (name.includes('MUSCULOSKELETAL')) return ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle / Foot', 'Soft Tissue Mass'];
    if (name.includes('HEAD') || name.includes('NECK')) return ['Thyroid', 'Parathyroid', 'Neck Mass', 'Salivary Glands'];
    if (name.includes('BREAST')) return ['Breast Ultrasound', 'Breast Mass Evaluation'];
    if (name.includes('PEDIATRIC')) return ['Neonatal Brain', 'Pyloric Stenosis', 'Developmental Hip'];
    if (name.includes('PROCEDURES')) return ['Ultrasound Guided Biopsy', 'Ultrasound Guided Drainage', 'Ultrasound Guided Aspiration'];
    return [];
  }
  if (cat.modality === 'Other' && name.startsWith('PET ')) {
    if (name === 'PET ONCOLOGY') return ['Whole Body PET-CT (FDG)', 'PET Tumor Staging', 'PET Treatment Response', 'PET Recurrence Evaluation'];
    if (name === 'PET NEUROLOGY') return ['Brain PET (FDG)', 'Dementia PET', 'Epilepsy PET', 'Brain Tumor PET'];
    if (name === 'PET CARDIAC') return ['Myocardial Perfusion PET', 'Cardiac Viability PET'];
    if (name.includes('SPECIALIZED TRACERS')) return ['PSMA PET (Prostate cancer)', 'DOTATATE PET (Neuroendocrine tumors)', 'Amyloid PET (Alzheimer disease)'];
    if (name.includes('INFECTION') || name.includes('INFLAMMATION')) return ['PET Fever of Unknown Origin', 'PET Vasculitis', 'PET Osteomyelitis'];
    return [];
  }
  if (cat.modality === 'Other' && name.startsWith('XR ')) {
    if (name === 'XR CHEST') return ['Chest PA', 'Chest AP', 'Chest Lateral', 'Portable Chest'];
    if (name === 'XR ABDOMEN') return ['Abdomen (KUB)', 'Acute Abdomen Series'];
    if (name.includes('SKULL') || name.includes('HEAD')) return ['Skull', 'Sinuses', 'Facial Bones'];
    if (name === 'XR SPINE') return ['Cervical Spine', 'Thoracic Spine', 'Lumbar Spine', 'Sacrum / Coccyx', 'Scoliosis Series'];
    if (name.includes('UPPER EXTREMITIES')) return ['Shoulder', 'Clavicle', 'Humerus', 'Elbow', 'Forearm', 'Wrist', 'Hand', 'Fingers'];
    if (name.includes('LOWER EXTREMITIES')) return ['Pelvis', 'Hip', 'Femur', 'Knee', 'Tibia / Fibula', 'Ankle', 'Foot', 'Toes'];
    if (name.includes('SPECIAL STUDIES')) return ['Bone Age', 'Skeletal Survey', 'Foreign Body'];
    if (name.includes('FLUOROSCOPY')) return ['Barium Swallow', 'Barium Meal', 'Barium Enema', 'Upper GI Series'];
    return [];
  }
  if (cat.modality === 'Angio') return ['CT Angiography – Aorta', 'CT Angiography – Carotids', 'CT Angiography – Peripheral'];
  return [];
}

export const SpecialtyRulesAdmin: React.FC = () => {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [rulesMap, setRulesMap] = useState<Record<string, string[]>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [subCategoryMap, setSubCategoryMap] = useState<Record<number, string[]>>({});
  const [newSubByCategory, setNewSubByCategory] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!token) return;
    Promise.all([getImagingCategories(token), getSpecialtyRules(token), getImagingSubCategories(token)])
      .then(([cats, rules, subCategories]) => {
        setCategories(cats);
        const map: Record<string, string[]> = {};
        rules.forEach((r: SpecialtyRuleDto) => {
          map[keyOf(r.modality, r.categoryName, r.subCategory)] = r.requiredSubspecialties.length
            ? r.requiredSubspecialties
            : ['general'];
        });
        setRulesMap(map);
        const subMap: Record<number, string[]> = {};
        subCategories.forEach((s) => {
          if (!subMap[s.categoryId]) subMap[s.categoryId] = [];
          subMap[s.categoryId].push(s.name);
        });
        setSubCategoryMap(subMap);
      })
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load data'));
  }, [token]);

  const grouped = useMemo(() => {
    const m: Record<string, Category[]> = {};
    categories.forEach((c) => {
      const mod = c.modality;
      if (!m[mod]) m[mod] = [];
      m[mod].push(c);
    });
    return m;
  }, [categories]);

  const toggle = (modality: string, categoryName: string, subCategory: string | null, id: string) => {
    const k = keyOf(modality, categoryName, subCategory);
    const prev = rulesMap[k] || ['general'];
    const exists = prev.includes(id);
    const next = exists ? prev.filter((s) => s !== id) : [...prev, id];
    setRulesMap((m) => ({ ...m, [k]: next.length ? next : ['general'] }));
  };

  const saveRow = async (modality: string, categoryName: string, subCategory: string | null) => {
    if (!token) return;
    const k = keyOf(modality, categoryName, subCategory);
    setSavingKey(k);
    setMessage(null);
    try {
      await saveSpecialtyRule(token, {
        modality,
        categoryName,
        subCategory,
        requiredSubspecialties: rulesMap[k] || ['general'],
      });
      setMessage('Saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setSavingKey(null);
    }
  };

  const handleAddSubCategory = async (category: Category) => {
    if (!token) return;
    const value = (newSubByCategory[category.id] || '').trim();
    if (!value) return;
    try {
      await createImagingSubCategory(token, category.id, value);
      setSubCategoryMap((prev) => ({
        ...prev,
        [category.id]: Array.from(new Set([...(prev[category.id] || []), value])),
      }));
      setNewSubByCategory((prev) => ({ ...prev, [category.id]: '' }));
      setMessage('Saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to add subcategory');
    }
  };

  return (
    <section style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2>Service to subspecialty mapping</h2>
      <p style={{ color: '#4b5563' }}>
        Default is General. Update one or more subspecialties for any modality/category/subcategory.
      </p>
      {message && <p style={{ color: message === 'Saved.' ? '#166534' : '#b91c1c' }}>{message}</p>}
      {Object.entries(grouped).map(([modality, cats]) => (
        <div key={modality} style={{ background: 'white', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
          <h3 style={{ marginTop: 0 }}>{modality}</h3>
          {cats.map((cat) => {
            const catKey = keyOf(cat.modality, cat.name, null);
            const catSubs = rulesMap[catKey] || ['general'];
            const subOptions = Array.from(
              new Set([...(getSubCategoryOptions(cat) || []), ...(subCategoryMap[cat.id] || [])])
            );
            return (
              <details key={cat.id} style={{ marginBottom: '0.75rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{cat.name}</summary>
                <div style={{ padding: '0.5rem 0 0.75rem' }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Category rule:</strong>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    {SPECIALTIES.map((s) => (
                      <label key={s.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={catSubs.includes(s.id)}
                          onChange={() => toggle(cat.modality, cat.name, null, s.id)}
                        />
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>
                  <button type="button" onClick={() => void saveRow(cat.modality, cat.name, null)} disabled={savingKey === catKey}>
                    {savingKey === catKey ? 'Saving…' : 'Save category rule'}
                  </button>

                  <div style={{ marginTop: 10, marginBottom: 10, display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={newSubByCategory[cat.id] || ''}
                      onChange={(e) =>
                        setNewSubByCategory((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      placeholder="Add subcategory..."
                      style={{ minWidth: 280 }}
                    />
                    <button type="button" onClick={() => void handleAddSubCategory(cat)}>
                      Add subcategory
                    </button>
                  </div>

                  {subOptions.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <strong>Subcategories</strong>
                      {subOptions.map((sub) => {
                        const subKey = keyOf(cat.modality, cat.name, sub);
                        const subSubs = rulesMap[subKey] || ['general'];
                        return (
                          <div key={sub} style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8, marginTop: 8 }}>
                            <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>{sub}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                              {SPECIALTIES.map((s) => (
                                <label key={s.id} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={subSubs.includes(s.id)}
                                    onChange={() => toggle(cat.modality, cat.name, sub, s.id)}
                                  />
                                  <span>{s.label}</span>
                                </label>
                              ))}
                            </div>
                            <button type="button" onClick={() => void saveRow(cat.modality, cat.name, sub)} disabled={savingKey === subKey}>
                              {savingKey === subKey ? 'Saving…' : 'Save subcategory rule'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      ))}
    </section>
  );
};

