import { ImagingCategory } from '../db/models/ImagingCategory';

// CT: only these 8 main categories (no others)
const CT_CATEGORIES: { name: string; bodyPart: string }[] = [
  { name: 'MISCELLANEOUS CT', bodyPart: 'misc' },
  { name: 'CT ABDO', bodyPart: 'abdomen' },
  { name: 'CT CHEST', bodyPart: 'chest' },
  { name: 'CT EXTREMITIES', bodyPart: 'extremities' },
  { name: 'CT HEAD', bodyPart: 'head' },
  { name: 'CT NECK', bodyPart: 'neck' },
  { name: 'CT PELVIS', bodyPart: 'pelvis' },
  { name: 'CT SPINE', bodyPart: 'spine' },
];

const OTHER_MODALITY_CATEGORIES: { name: string; modality: 'MRI' | 'Angio' | 'US' | 'Other'; bodyPart: string; isSubspecialtyRestricted: boolean }[] = [
  { name: 'MRI BRAIN / HEAD', modality: 'MRI', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'MRI SPINE', modality: 'MRI', bodyPart: 'spine', isSubspecialtyRestricted: false },
  { name: 'MRI ABDOMEN', modality: 'MRI', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
  { name: 'MRI PELVIS', modality: 'MRI', bodyPart: 'pelvis', isSubspecialtyRestricted: false },
  { name: 'MRI MUSCULOSKELETAL', modality: 'MRI', bodyPart: 'extremities', isSubspecialtyRestricted: false },
  { name: 'MRI VASCULAR', modality: 'MRI', bodyPart: 'vascular', isSubspecialtyRestricted: false },
  // US – 9 main categories
  { name: 'US ABDOMEN', modality: 'US', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
  { name: 'US PELVIS', modality: 'US', bodyPart: 'pelvis', isSubspecialtyRestricted: false },
  { name: 'US OBSTETRICS', modality: 'US', bodyPart: 'pelvis', isSubspecialtyRestricted: false },
  { name: 'US VASCULAR / DOPPLER', modality: 'US', bodyPart: 'vascular', isSubspecialtyRestricted: false },
  { name: 'US MUSCULOSKELETAL', modality: 'US', bodyPart: 'extremities', isSubspecialtyRestricted: false },
  { name: 'US HEAD / NECK', modality: 'US', bodyPart: 'neck', isSubspecialtyRestricted: false },
  { name: 'US BREAST', modality: 'US', bodyPart: 'breast', isSubspecialtyRestricted: false },
  { name: 'US PEDIATRIC', modality: 'US', bodyPart: 'other', isSubspecialtyRestricted: false },
  { name: 'US PROCEDURES', modality: 'US', bodyPart: 'other', isSubspecialtyRestricted: false },
  // PET – 5 main categories (stored as Other so no enum change)
  { name: 'PET ONCOLOGY', modality: 'Other', bodyPart: 'other', isSubspecialtyRestricted: false },
  { name: 'PET NEUROLOGY', modality: 'Other', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'PET CARDIAC', modality: 'Other', bodyPart: 'chest', isSubspecialtyRestricted: false },
  { name: 'PET SPECIALIZED TRACERS', modality: 'Other', bodyPart: 'other', isSubspecialtyRestricted: false },
  { name: 'PET INFECTION / INFLAMMATION', modality: 'Other', bodyPart: 'other', isSubspecialtyRestricted: false },
  // X-ray – 8 main categories (stored as Other)
  { name: 'XR CHEST', modality: 'Other', bodyPart: 'chest', isSubspecialtyRestricted: false },
  { name: 'XR ABDOMEN', modality: 'Other', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
  { name: 'XR SKULL / HEAD', modality: 'Other', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'XR SPINE', modality: 'Other', bodyPart: 'spine', isSubspecialtyRestricted: false },
  { name: 'XR UPPER EXTREMITIES', modality: 'Other', bodyPart: 'extremities', isSubspecialtyRestricted: false },
  { name: 'XR LOWER EXTREMITIES', modality: 'Other', bodyPart: 'extremities', isSubspecialtyRestricted: false },
  { name: 'XR SPECIAL STUDIES', modality: 'Other', bodyPart: 'other', isSubspecialtyRestricted: false },
  { name: 'XR FLUOROSCOPY', modality: 'Other', bodyPart: 'other', isSubspecialtyRestricted: false },
  { name: 'ANGIO', modality: 'Angio', bodyPart: 'vascular', isSubspecialtyRestricted: true },
];

export async function seedImagingCategoriesIfEmpty() {
  for (const cat of CT_CATEGORIES) {
    await ImagingCategory.findOrCreate({
      where: { name: cat.name, modality: 'CT' },
      defaults: {
        name: cat.name,
        modality: 'CT',
        bodyPart: cat.bodyPart,
        isSubspecialtyRestricted: false,
        imagePath: null,
      },
    });
  }
  for (const cat of OTHER_MODALITY_CATEGORIES) {
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
