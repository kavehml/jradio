import { ImagingCategory } from '../db/models/ImagingCategory';

const DEFAULT_CATEGORIES: { name: string; modality: 'CT' | 'MRI' | 'Angio' | 'US' | 'Other'; bodyPart: string; isSubspecialtyRestricted: boolean }[] = [
  // CT – use the eight main protocol groups you described
  { name: 'MISCELLANEOUS CT', modality: 'CT', bodyPart: 'misc', isSubspecialtyRestricted: false },
  { name: 'CT ABDO', modality: 'CT', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
  { name: 'CT CHEST', modality: 'CT', bodyPart: 'chest', isSubspecialtyRestricted: false },
  { name: 'CT EXTREMITIES', modality: 'CT', bodyPart: 'extremities', isSubspecialtyRestricted: false },
  { name: 'CT HEAD', modality: 'CT', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'CT NECK', modality: 'CT', bodyPart: 'neck', isSubspecialtyRestricted: false },
  { name: 'CT PELVIS', modality: 'CT', bodyPart: 'pelvis', isSubspecialtyRestricted: false },
  { name: 'CT SPINE', modality: 'CT', bodyPart: 'spine', isSubspecialtyRestricted: false },
  // A couple of non‑CT examples to keep other modalities available
  { name: 'MRI BRAIN', modality: 'MRI', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'MRI SPINE', modality: 'MRI', bodyPart: 'spine', isSubspecialtyRestricted: false },
  { name: 'US ABDOMEN', modality: 'US', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
  { name: 'ANGIO', modality: 'Angio', bodyPart: 'vascular', isSubspecialtyRestricted: true },
];

export async function seedImagingCategoriesIfEmpty() {
  for (const cat of DEFAULT_CATEGORIES) {
    // Ensure each named category exists; do not duplicate across restarts
    await ImagingCategory.findOrCreate({
      where: { name: cat.name, modality: cat.modality },
      defaults: {
        name: cat.name,
        modality: cat.modality,
        bodyPart: cat.bodyPart,
        isSubspecialtyRestricted: cat.isSubspecialtyRestricted,
        imagePath: null,
      },
    });
  }
}
