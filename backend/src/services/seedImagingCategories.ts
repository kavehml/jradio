import { ImagingCategory } from '../db/models/ImagingCategory';

const DEFAULT_CATEGORIES: { name: string; modality: 'CT' | 'MRI' | 'Angio' | 'US' | 'Other'; bodyPart: string; isSubspecialtyRestricted: boolean; imagePath: string }[] = [
  { name: 'CT Head', modality: 'CT', bodyPart: 'head', isSubspecialtyRestricted: false, imagePath: '24B2B3B8-E25A-4556-B387-E2804BFF91BC_1_105_c.jpeg' },
  { name: 'CT Chest', modality: 'CT', bodyPart: 'chest', isSubspecialtyRestricted: false, imagePath: '42143849-1ACC-4E9E-8C46-1943912A1F38_1_105_c.jpeg' },
  { name: 'CT Abdomen/Pelvis', modality: 'CT', bodyPart: 'abdomen', isSubspecialtyRestricted: false, imagePath: '5B35BC2C-F127-453E-874F-37618087FC0B_1_105_c.jpeg' },
  { name: 'MRI Brain', modality: 'MRI', bodyPart: 'head', isSubspecialtyRestricted: false, imagePath: '5B9F5934-D73F-4C06-AC4E-BF470317927D_1_105_c.jpeg' },
  { name: 'MRI Spine', modality: 'MRI', bodyPart: 'spine', isSubspecialtyRestricted: false, imagePath: '785237BD-2346-4C30-AD55-F4E1C49C6E5E_1_105_c.jpeg' },
  { name: 'Angio', modality: 'Angio', bodyPart: 'vascular', isSubspecialtyRestricted: true, imagePath: 'AB28726E-67A4-4B03-8941-1A03EEC8630B_1_105_c.jpeg' },
  { name: 'US Abdomen', modality: 'US', bodyPart: 'abdomen', isSubspecialtyRestricted: false, imagePath: 'AC1D4E91-7151-4D2B-BABB-B7365064ABF3_1_105_c.jpeg' },
];

export async function seedImagingCategoriesIfEmpty() {
  const count = await ImagingCategory.count();
  if (count > 0) return;
  for (const cat of DEFAULT_CATEGORIES) {
    await ImagingCategory.create(cat);
  }
}
