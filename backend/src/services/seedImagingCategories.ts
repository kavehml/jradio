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
  { name: 'MRI BRAIN', modality: 'MRI', bodyPart: 'head', isSubspecialtyRestricted: false },
  { name: 'MRI SPINE', modality: 'MRI', bodyPart: 'spine', isSubspecialtyRestricted: false },
  { name: 'US ABDOMEN', modality: 'US', bodyPart: 'abdomen', isSubspecialtyRestricted: false },
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
